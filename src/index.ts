import './reset.css'
import './fonts.css'
import './style.css'

import { Component } from '$components/internal/Component.ts'
import { Animated } from '$components/internal/Animated.ts'
import { open as openIndexedDB } from '$util/indexedDB/index.ts'
import schema from '$db/schema.ts'
import { assertNonNull } from '$util/assert.ts'
import { Modal } from '$components/Modal.ts'
import { Game } from '$game/index.ts'
import { DOMGrid } from '$game/grid/dom.ts'
import { insertAttempt, retrieveAttempts, type InsertedAttempt } from '$db/attempt.ts'
import { Redirect } from '$components/Redirect.ts'
import { defaultGamemode, gamemodes } from './gamemode.ts'
import { clearSharedRecord, getSharedRecord } from '$share/record.ts'
import MenuAccess from './menu/MenuAccess.svelte'
import { getRecordDelta } from './menu/record.ts'
import { getTheme, setTheme, defaultTheme, themes } from './theme.ts'
import { contextKey, createContext, configureTitle, type Context } from './menu/context.ts'
import { getName, listenToNameChanges } from '$share/name.ts'
import { isDefined, wait } from '$util/index.ts'
import { get, type Writable } from 'svelte/store'
import { pause, reset, resume } from '$game/ops.ts'
import { parse } from 'cookie'
import type { Animation } from '$game/grid/index.ts'
import { mount } from "svelte";

const record = getSharedRecord()
const theme = record?.theme || getTheme() || defaultTheme
setTheme(theme)

const componentFrom = <T extends HTMLElement>(elem: T | null, name: string): Component<T> => {
  assertNonNull(elem, `${name} doesn't exist in the HTML document!`)
  return Component.from(elem)
}

const title = document.querySelector('#title')
assertNonNull(title)

const objective = componentFrom(document.querySelector<HTMLParagraphElement>('#objective'), 'Objective')
const gridParent = componentFrom(document.querySelector<HTMLElement>('.grid__parent'), 'Grid parent')

const footer = document.querySelector('footer')
assertNonNull(footer)

let context: Context | undefined

const gamemode = record?.gamemode || defaultGamemode
const game = new Game({
  gamemode: gamemodes[gamemode].create(),
  grid: new DOMGrid({
    numTotalSquares: 48,
    colors: themes[theme].colors.squares.map((_, i) => `var(--color-square-${i + 1})`),
    domParent: gridParent,
  }),
  onError(err) {
    console.error(err)
  },
  onGameInit({ gamemode, when }) {
    if (when === 'after') {
      context?.gamemode.set(gamemode)
    }
  },
  onGameReady({ gamemode, from, when }) {
    if (when === 'before' && (from === 'win' || from === 'lose')) {
      context!.gamemode.set(gamemode)
    }
  },
  onGameStart({ attempt, when }) {
    if (when === 'before') {
      context!.attempts.updateOngoing(attempt)
    }
  },
  onGameEnd({ attempt, when }) {
    if (when === 'before') {
      insertAttempt(db, attempt).then((attempt) => {
        context!.attempts.update(attempt)
        context!.attempts.updateOngoing(undefined)
        attemptsChan.postMessage(attempt)
      })
    } else if (when === 'after') {
      let animation: Animation
      if (record) {
        const [delta] = getRecordDelta(get(context!.attempts), record) || []
        animation = isDefined(delta) ? (delta < 0 ? 'long' : 'short') : 'short'
      } else {
        animation = attempt.isWin ? 'long' : 'short'
      }

      game.prepare(animation)
    }
  },
})

const attemptsChan = new BroadcastChannel('attempts')
attemptsChan.addEventListener('message', (ev: MessageEvent<InsertedAttempt>) => {
  context?.attempts.update(ev.data)
})

const getVersionChangeModalContent = () => {
  const root = document.createElement('div')
  root.classList.add('updates__root', 'center')
  const title = document.createElement('h2')
  title.append('Game update!')
  title.style.marginBottom = '0.2em'
  root.append(title)
  const content = document.createElement('p')
  content.append('The game was updated! Please refresh the page.')
  root.append(content)
  return Animated.from(root)
}

const getVersionChangeModal = () => {
  return new Modal({
    content: getVersionChangeModalContent(),
    allowClose: false,
  })
}

const showNewUpdateModal = (onClose?: (wasShown: boolean) => unknown): void | Promise<void> => {
  const KEY = 'update-viewed'
  const VERSION = '0.7.3'

  const lastVersion = localStorage.getItem(KEY)
  if (lastVersion === VERSION) {
    onClose?.(false)
    return
  }

  const isIOS = ['iPad', 'iPhone', 'iPod'].includes(navigator.platform)
  const content = /*html*/ `
  <h2>Hello, ${getName() || 'friend'}!</h2>
  <p class="updates">We've changed some things around!</p>
  <ul class="updates">
    <li><em>Shorter animations</em> between attempts, so you can grind faster 😎</li>
    <li><em>Reset the game:</em> if you feel it's not the one, click or long tap outside the window!</li>
    <li><em>Play offline:</em> just write the address in the browser, even without internet! ${
      isIOS
        ? 'You can also add Pop the grid to home screen by tapping the Share button, then "Add to Home screen" option, if in Safari.'
        : 'Some browsers should even prompt you to add the app to your home screen!'
    }</li>
  </ul>
  <p class="updates">That's it for now. Close this window and happy playing – see you in the next update!</p>
`
  const root = document.createElement('div')
  root.classList.add('updates__root')
  root.innerHTML = content

  const modal = new Modal({
    content: Animated.from(root),
    allowClose: true,
    animateClose: true,
    afterClose() {
      localStorage.setItem(KEY, VERSION)
      onClose?.(true)
    },
  })

  return modal.create(Component.body, true)
}

const getRecordClearRedirect = () => {
  const element = document.createElement('span')
  element.append('Done')
  element.style.paddingLeft = '0.4rem'

  return new Redirect({
    href: '/',
    title: 'This will reload the page and end the current game.',
    content: Animated.from(element),
    on() {
      clearSharedRecord()
    },
  })
}

let db: IDBDatabase

const handleURLAndTitle = async (name: Writable<string | undefined>, duration: number) => {
  const { status } = parse(document.cookie)

  let text: string
  if (!status) {
    configureTitle(name, title, !!record)
    return
  } else if (status === '404') {
    text = 'The link was not found: is it correct?'
  } else {
    text = "The link couldn't be opened, try again later."
  }

  const originalText = title.textContent
  title.textContent = text
  title.classList.add('error')
  await wait(duration)
  title.classList.remove('error')
  title.textContent = originalText

  configureTitle(name, title, !!record)
}

const configureGameReset = () => {
  let downAt: number | undefined
  let resetting = false

  const doReset = async () => {
    resetting = true
    await reset(game)
    resetting = false
  }

  document.body.addEventListener('pointerdown', (event) => {
    if (event.target !== document.body || resetting || !event.isPrimary) {
      return
    }

    const { top, bottom } = gridParent.element.getBoundingClientRect()
    const deltaY = Math.min(event.clientY - top, bottom - event.clientY)

    if (deltaY > -20) {
      return
    }

    if (event.pointerType === 'touch') {
      downAt = event.timeStamp
    } else if (event.buttons === 1) {
      doReset()
    }
  })

  document.body.addEventListener('pointerup', (event) => {
    if (event.target !== document.body || resetting || !event.isPrimary || !isDefined(downAt)) {
      return
    }

    if (event.timeStamp - downAt > 300) {
      doReset()
    }

    downAt = undefined
  })
}

const main = async () => {
  if (navigator.storage && navigator.storage.persist) {
    await navigator.storage.persist()
  }

  db = await openIndexedDB(window.indexedDB, {
    schema,
    onVersionChange() {
      game.forceEnd()
      getVersionChangeModal().create(Component.body, true)
    },
  })

  context = createContext({
    name: getName(),
    game,
    record,
    gamemode,
    theme,
    database: db,
    attemptsLoader() {
      return retrieveAttempts(db)
    },
  })

  listenToNameChanges(({ newValue }) => {
    context!.name.set(newValue)
  })

  mount(MenuAccess, {
        target: footer,
        context: new Map([[contextKey, context]]),
      })

  const gamePrepare = game.prepare('long')

  let titleDone: Promise<void>
  await showNewUpdateModal((wasShown) => {
    titleDone = handleURLAndTitle(context!.name, wasShown ? 3000 : 4200)
  })

  document.body.style.transition = 'background-color 0.4s ease-out'
  // prevents double-tap zoom
  gridParent.element.addEventListener('touchend', (e) => e.preventDefault())

  await Promise.all([gamePrepare, titleDone!, record && getRecordClearRedirect().create(objective, false)])

  let token: string | undefined

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      token = pause(game)
    } else {
      resume(game, token)
      token = undefined
    }
  })

  configureGameReset()
}

main()
