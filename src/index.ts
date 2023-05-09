import './reset.css'
import './fonts.css'
import './style.css'

import { Component } from '$components/internal/Component'
import { Animated } from '$components/internal/Animated'
import { open as openIndexedDB } from '$util/indexedDB'
import schema from '$db/schema'
import { assertNonNull } from '$util/assert'
import { Modal } from '$components/Modal'
import { Game } from '$game'
import { DOMGrid } from '$game/grid/dom'
import { insertAttempt, retrieveAttempts, type InsertedAttempt } from '$db/attempt'
import { Redirect } from '$components/Redirect'
import { defaultGamemode, gamemodes } from './gamemode'
import { clearSharedRecord, getSharedRecord } from '$share/record'
import MenuAccess from './menu/MenuAccess.svelte'
import { getRecordDelta } from './menu/record'
import { getTheme, setTheme, defaultTheme, themes } from './theme'
import { contextKey, createContext, configureTitle, type Context } from './menu/context'
import { getName, listenToNameChanges } from '$share/name'
import { isDefined, wait } from '$util'
import { get, type Writable } from 'svelte/store'
import { pause, reset, resume } from '$game/ops'
import { parse } from 'cookie'
import type { Animation } from '$game/grid'

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
  root.style.margin = '0 auto'
  root.style.height = '100%'
  root.style.display = 'flex'
  root.style.alignItems = 'center'
  root.style.justifyContent = 'center'
  root.style.flexDirection = 'column'
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
  const content = `
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
  root.style.height = '100%'
  root.style.display = 'flex'
  root.style.flexDirection = 'column'
  root.style.margin = '0 auto'
  root.style.padding = '3rem 0'
  root.style.width = '100%'
  root.style.maxWidth = '600px'

  const html = new DOMParser().parseFromString(content, 'text/html')
  root.append(...Array.from(html.body.children))

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

  new MenuAccess({
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
