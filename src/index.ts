import './reset.css'
import './fonts.css'
import './style.css'

import { Component } from '$components/internal/Component.ts'
import { Animated } from '$components/internal/Animated.ts'
import { open as openIndexedDB } from '$util/indexedDB/index.ts'
import schema from '$db/schema.ts'
import { assertNonNull } from '$util/assert.ts'
import { Game } from '$game/index.ts'
import { DOMGrid } from '$game/grid/dom.ts'
import { insertAttempt, retrieveAttempts } from '$db/attempt.ts'
import { Redirect } from '$components/Redirect.ts'
import { defaultGamemode, gamemodes } from './gamemode.ts'
import { clearSharedRecord, getSharedRecord } from '$share/record.ts'
import MenuAccess from './menu/MenuAccess.svelte'
import { getRecordDelta } from './menu/record.ts'
import { getTheme, setTheme, defaultTheme, themes } from './theme.ts'
import { contextKey, createContext, configureTitle, type Context } from './menu/context.ts'
import { getName, listenToNameChanges } from '$share/name.ts'
import { isDefined, trusted, wait } from '$util/index.ts'
import { get, type Unsubscriber, type Writable } from 'svelte/store'
import { pause, reset, resume } from '$game/ops.ts'
import { parse } from 'cookie'
import type { Animation } from '$game/grid/index.ts'
import { mount } from 'svelte'
import { fetchSession, initRand } from './session.ts'
import { findCachedLink } from '$db/link.ts'
import { Grid, type GridResizeData } from '$components/Grid.ts'
import { Tracer, type PointerEvents, type Trace } from '$game/trace.ts'
import type { Attempt } from '$game/attempt.ts'

const givenRand = initRand()

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

const grid = new Grid({
  colors: themes[theme].colors.squares.map((_, i) => `var(--color-square-${i + 1})`),
})

const tracer = new Tracer()

const metadataMatchMedia = {
  primaryHover: window.matchMedia('(hover: hover)'),
  primaryCoarse: window.matchMedia('(pointer: coarse)'),
  hover: window.matchMedia('(any-hover: hover)'),
  coarse: window.matchMedia('(any-pointer: coarse)'),
}

const viewport = window.visualViewport!
const viewportHandler = trusted(() => tracer.viewport(viewport))
const gridPointerMoveListener = trusted((ev: PointerEvent) => tracer.pointerMove(ev))
const gridResizeListener = (ev: GridResizeData) => tracer.gridResize(ev, window)
const screenOrientationListener = trusted(() => tracer.orientationChange(screen.orientation))

let themeUnsubscriber: Unsubscriber | undefined

const gamemode = record?.gamemode || defaultGamemode
const game = new Game({
  gamemode: gamemodes[gamemode].create(),
  grid: new DOMGrid(gridParent, grid),
  tracer,
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

    if (when === 'after') {
      tracer.enabled = true

      tracer.metadata(navigator, metadataMatchMedia)

      themeUnsubscriber = context!.theme.subscribe((name) => tracer.theme(name))

      grid.onResize(gridResizeListener)

      tracer.orientationChange(screen.orientation)
      screen.orientation.addEventListener('change', screenOrientationListener)

      tracer.viewport(viewport)
      viewport.addEventListener('resize', viewportHandler)
      viewport.addEventListener('scroll', viewportHandler)
    }
  },
  onGameStart({ attempt, when }) {
    if (when === 'before') {
      context!.attempts.updateOngoing(attempt)

      grid.addGridEventListener('pointermove', gridPointerMoveListener)
    }
  },
  onGameEnd({ attempt, when }) {
    if (when === 'before') {
      tracer.enabled = false

      themeUnsubscriber?.()

      grid.removeGridEventListener('pointermove', gridPointerMoveListener)
      grid.onResize(null)
      screen.orientation.removeEventListener('change', screenOrientationListener)
      viewport.removeEventListener('resize', viewportHandler)
      viewport.removeEventListener('scroll', viewportHandler)

      const { trace, pointerEvents } = tracer.flush()

      handleAttempt(attempt, trace, pointerEvents)
    } else if (when === 'after') {
      let animation: Animation
      if (record) {
        const [delta] = getRecordDelta(get(context!.attempts), record) || []
        animation = isDefined(delta) ? (delta < 0 ? 'long' : 'short') : 'short'
      } else {
        animation = attempt.isWin ? 'long' : 'short'
      }

      game.prepare(animation)
      configureSession(context!.sessionStatus)
    }
  },
})

const attemptsChan = new BroadcastChannel('attempts')
attemptsChan.addEventListener('message', (ev: MessageEvent<Attempt>) => {
  context?.attempts.update(ev.data)
})

const submitAttempt = async (attempt: Attempt, trace: Trace, pointerEvents: PointerEvents): Promise<string> => {
  const body = new FormData()
  body.set('attempt', JSON.stringify(attempt))
  body.set('trace', JSON.stringify(trace))
  body.set('pointer-events', new Blob([pointerEvents]))

  const resp = await fetch('/submit', {
    method: 'POST',
    body,
    credentials: 'same-origin',
  })
  if (!resp.ok) {
    throw new Error(resp.statusText, { cause: await resp.text() })
  }

  const { id }: { id: string } = await resp.json()

  return id
}

const handleAttempt = async (attempt: Attempt, trace: Trace, pointerEvents: PointerEvents) => {
  try {
    attempt.serverID = await submitAttempt(attempt, trace, pointerEvents)
  } finally {
    context!.attempts.update(attempt)
    context!.attempts.updateOngoing(undefined)
    attemptsChan.postMessage(attempt)
    insertAttempt(db, attempt).catch(console.error)
  }
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
    if (record && (await findCachedLink(db, record))) {
      const old = objective.element.firstChild!.nodeValue!
      objective.element.firstChild!.nodeValue = old.replace(/You're in (?:.*) world/, 'Against yourself').replaceAll('They', 'You')
    }

    return configureTitle(name, title, !!record)
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

  return configureTitle(name, title, !!record)
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

let sessionBackoffTimeoutID: number | undefined
let sessionBackoffDuration = 2000
const maxSessionBackoffDuration = 16000

const configureSession = async (store: Context['sessionStatus'], isTimeout: boolean = false) => {
  const backoff = () => {
    if (sessionBackoffDuration > maxSessionBackoffDuration) {
      store.update(() => 'error')
      return
    }

    store.update(() => 'pending')
    sessionBackoffTimeoutID = window.setTimeout(() => configureSession(store, true), sessionBackoffDuration)
    sessionBackoffDuration *= 2
  }

  try {
    if (get(store) !== 'error' && sessionBackoffTimeoutID == null) {
      return
    }

    clearTimeout(sessionBackoffTimeoutID)
    if (!isTimeout) {
      sessionBackoffDuration = 2000
    }

    store.update(() => 'pending')
    await fetchSession(givenRand)
    store.update(() => 'valid')

    let intervalID = setInterval(async () => {
      try {
        await fetchSession(givenRand)
      } catch (err) {
        console.error(err)
        clearInterval(intervalID)
        backoff()
      }
    }, import.meta.env.VITE_SESSION_EXPIRY * 50 * 1000)
  } catch (err) {
    console.error(err)
    backoff()
  }
}

const main = async () => {
  if (navigator.storage && navigator.storage.persist) {
    await navigator.storage.persist()
  }

  db = await openIndexedDB(window.indexedDB, {
    schema,
    onVersionChange() {
      game.forceEnd()
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
    props: {
      onMenuOpen: () => configureSession(context!.sessionStatus),
    },
  })

  configureSession(context.sessionStatus)

  const gamePrepare = game.prepare('long')
  const titleDone = handleURLAndTitle(context!.name, 4200)

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
