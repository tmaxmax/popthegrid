import './reset.css'
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
import { getTheme, setTheme, defaultTheme, themes } from './theme'
import { contextKey, createContext, configureTitle, type Context } from './menu/context'
import { getName, listenToNameChanges } from '$share/name'
import { wait } from '$util'
import type { Writable } from 'svelte/store'
import { pause, resume } from '$game/pause'

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
      game.prepare()
    }
  },
})

const attemptsChan = new BroadcastChannel('attempts')
attemptsChan.addEventListener('message', (ev: MessageEvent<InsertedAttempt>) => {
  context?.attempts.update(ev.data)
})

const getVersionChangeModalContent = () => {
  const root = document.createElement('div')
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

const getRecordClearRedirect = () => {
  const element = document.createElement('span')
  element.append('Done')
  element.style.paddingLeft = '0.4rem'

  return new Redirect({
    href: '/',
    title: 'This will reload the page and end the current game.',
    content: Animated.from(element),
    async on() {
      clearSharedRecord()
      await game.forceEnd()
    },
  })
}

let db: IDBDatabase

const handleURLAndTitle = async (name: Writable<string | undefined>) => {
  const params = new URLSearchParams(location.search)

  let text: string
  if (params.has('error')) {
    text = "The link couldn't be opened, try again later."
  } else if (params.has('notFound')) {
    text = 'The link was not found: is it correct?'
  } else {
    configureTitle(name, title, !!record)
    return
  }

  history.replaceState({}, '', '/')

  const originalText = title.textContent
  title.textContent = text
  title.classList.add('error')
  await wait(4500)
  title.classList.remove('error')
  title.textContent = originalText

  configureTitle(name, title, !!record)
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

  if (record) {
    await getRecordClearRedirect().create(objective, false)
  }

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

  const titleDone = handleURLAndTitle(context.name)

  new MenuAccess({
    target: footer,
    context: new Map([[contextKey, context]]),
  })

  document.body.style.transition = 'background-color 0.4s ease-out'
  // prevents double-tap zoom
  document.querySelector('.grid__parent')!.addEventListener('touchend', (e) => e.preventDefault())

  await Promise.all([game.prepare(), titleDone])

  let token: string | undefined

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      token = pause(game)
    } else {
      resume(game, token)
      token = undefined
    }
  })
}

main()
