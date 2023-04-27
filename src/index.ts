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
import { insertAttempt } from '$db/attempt'
import { Redirect } from '$components/Redirect'
import { gamemodes } from './gamemode'
import { clearSharedRecord, getSharedRecord } from '$share/record'
import MenuAccess from './menu/MenuAccess.svelte'
import { configureTitle } from './menu'
import { getTheme, setTheme, defaultTheme, listenToThemeChanges } from './theme'

const record = getSharedRecord()

try {
  setTheme(record?.theme || getTheme(), { onlyCSS: true })
} catch {
  setTheme(defaultTheme)
}

listenToThemeChanges((themeName) => setTheme(themeName, { onlyCSS: true }))

const componentFrom = <T extends HTMLElement>(elem: T | null, name: string): Component<T> => {
  assertNonNull(elem, `${name} doesn't exist in the HTML document!`)
  return Component.from(elem)
}

const title = document.querySelector('#title')
assertNonNull(title)
configureTitle(title)

const objective = componentFrom(document.querySelector<HTMLParagraphElement>('#objective'), 'Objective')
const gridParent = componentFrom(document.querySelector<HTMLElement>('.grid__parent'), 'Grid parent')

const footer = document.querySelector('footer')
assertNonNull(footer)

const NUM_COLORS = 5

const game = new Game({
  gamemode: gamemodes[record?.gamemode || 'random'].create(),
  grid: new DOMGrid({
    numTotalSquares: 48,
    colors: Array.from({ length: NUM_COLORS }, (_, i) => `var(--color-square-${i + 1})`),
    domParent: gridParent,
  }),
  onError(err) {
    console.error(err)
  },
  onGameEnd({ attempt }) {
    insertAttempt(db, attempt)
    game.prepare()
  },
})

const getVersionChangeModalContent = () => {
  const root = document.createElement('div')
  const title = document.createElement('h2')
  title.append('Game update!')
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
  props: { props: { game, record } },
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
