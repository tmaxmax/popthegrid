import './reset.css'
import './style.css'

import { Grid } from '$components/Grid'
import { Square } from '$components/Square'
import { Component } from '$components/internal/Component'
import { Gamemode, RandomCount, RandomTimer } from './gamemode'
import { open as openIndexedDB } from '$util/indexedDB'
import { startAttempt, OngoingAttempt, insertAttempt } from '$db/attempt'
import { Gamemode as SchemaGamemode } from '$db/gamemode'
import schema from '$db/schema'
import { assertNonNull } from '$util/assert'
import { Modal } from '$components/Modal'
import { Fieldset } from '$components/Input/Fieldset'
import { map } from '$util/async'

const componentFrom = <T extends HTMLElement>(elem: T | null, name: string): Component<T> => {
  assertNonNull(elem, `${name} doesn't exist in the HTML document!`)
  return Component.from(elem)
}

const gridParent = componentFrom(document.querySelector<HTMLElement>('.grid__parent'), 'Grid parent')
const footer = componentFrom(document.querySelector('footer'), 'Footer')

let gamemode: Gamemode = new RandomCount()
let gamemodeName: SchemaGamemode = 'random'
let canChangeGamemode = true
let db: IDBDatabase
let ongoingAttempt: OngoingAttempt
let ignoreClicks = false

const setGamemodeChangePermission = (allow: boolean) => {
  canChangeGamemode = allow
  gamemodePicker.disabled = !allow
}

const squareMousedown = async function (this: Square) {
  if (ignoreClicks) {
    return
  }
  if (canChangeGamemode) {
    setGamemodeChangePermission(false)
    ongoingAttempt = startAttempt({ gamemode: gamemodeName, numSquares: grid.squareCount })
  }
  const removed = grid.removeSquare(this)
  if (gamemode.shouldDestroy(grid, this)) {
    ignoreClicks = true
    const att = insertAttempt(db, ongoingAttempt.end(false))
    await Promise.all([grid.destroy(true), gamemode.reset()])
    setGamemodeChangePermission(true)
    await Promise.all([grid.create(gridParent, true), att])
  } else if (grid.squareCount === 0) {
    await Promise.all([removed, gamemode.reset(), insertAttempt(db, ongoingAttempt.end(true))])
    // TODO: Better win alert
    alert('you won')
  }
  ignoreClicks = false
}

const NUM_COLORS = 5

const grid = new Grid({
  squareCount: 48,
  colors: Array.from({ length: NUM_COLORS }, (_, i) => `var(--color-square-${i + 1})`),
  squareEventListeners: [
    {
      event: 'mousedown',
      callback: squareMousedown,
    },
  ],
})

const gamemodePicker = new Fieldset({
  name: 'gamemode',
  legend: 'Gamemode',
  onChange(name: SchemaGamemode) {
    if (!canChangeGamemode) return

    gamemodeName = name

    switch (name) {
      case 'random':
        gamemode = new RandomCount()
        break
      case 'random-timer':
        gamemode = new RandomTimer({ minSeconds: 4, maxSeconds: 9 })
        break
    }
  },
  values: [
    {
      name: 'Luck',
      value: 'random',
      default: true,
    },
    {
      name: 'Time (4–9 seconds)',
      value: 'random-timer',
    },
  ],
})

const getVersionChangeModalContent = () => {
  const root = document.createElement('div')
  const title = document.createElement('h2')
  title.append('Game update!')
  root.append(title)
  const content = document.createElement('p')
  content.append('The game was updated! Please refresh the page.')
  root.append(content)
  return root
}

const getVersionChangeModal = () => {
  return new Modal({ content: getVersionChangeModalContent(), allowClose: true, animateClose: true })
}

const main = async () => {
  gamemodePicker.create(footer, false)
  db = await openIndexedDB(window.indexedDB, {
    schema,
    onVersionChange() {
      ignoreClicks = true
      setGamemodeChangePermission(false)
      grid.destroy(true)
      getVersionChangeModal().create(Component.body, true)
    },
  })
  await grid.create(gridParent, true)
}

main()
