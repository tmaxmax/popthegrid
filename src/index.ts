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
import { insertAttempt, retrieveAttempts } from '$db/attempt'
import { Redirect } from '$components/Redirect'
import { defaultGamemode, gamemodes } from './gamemode'
import { clearSharedRecord, getSharedRecord } from '$share/record'
import MenuAccess from './menu/MenuAccess.svelte'
import { getTheme, setTheme, defaultTheme, listenToThemeChanges, type ThemeName } from './theme'
import { contextKey, createContext, configureTitle } from './menu/context'
import { getName, listenToNameChanges } from '$share/name'

const record = getSharedRecord()
let theme: ThemeName

try {
  theme = record?.theme || getTheme()
  setTheme(theme, { onlyCSS: true })
} catch {
  theme = defaultTheme
  setTheme(theme)
}

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

const NUM_COLORS = 5

const gamemode = record?.gamemode || defaultGamemode
const game = new Game({
  gamemode: gamemodes[gamemode].create(),
  grid: new DOMGrid({
    numTotalSquares: 48,
    colors: Array.from({ length: NUM_COLORS }, (_, i) => `var(--color-square-${i + 1})`),
    domParent: gridParent,
  }),
  onError(err) {
    console.error(err)
  },
  onGameInit({ gamemode, when }) {
    if (when === 'after') {
      context.gamemode.set(gamemode)
    }
  },
  onGameReady({ gamemode, from, when }) {
    if (when === 'before' && (from === 'win' || from === 'lose')) {
      context.gamemode.set(gamemode)
    }
  },
  onGameEnd({ attempt, when }) {
    if (when === 'after') {
      insertAttempt(db, attempt).then(context.statistics.update)
      game.prepare()
    }
  },
})

const context = createContext({
  name: getName(),
  game,
  record,
  gamemode,
  theme,
  attemptsLoader() {
    return retrieveAttempts(db)
  },
})

listenToThemeChanges((themeName) => {
  setTheme(themeName, { onlyCSS: true })
  context.theme.set(themeName)
})

listenToNameChanges(({ newValue }) => {
  context.name.set(newValue)
})

configureTitle(context.name, title, !!record)

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

new MenuAccess({
  target: footer,
  context: new Map([[contextKey, context]]),
})

let db: IDBDatabase

const main = async () => {
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

  await game.prepare()
}

main()
