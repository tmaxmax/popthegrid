import './reset.css'
import './style.css'

import { Grid } from './components/Grid'
import { Square } from './components/Square'
import { Component } from './components/internal/Component'
import { SillyName } from './components/SillyName'
import { Gamemode, RandomCount, RandomTimer } from './gamemode'
import { IndexedDB } from '$util'
import { startAttempt, OngoingAttempt, insertAttempt } from '$db/attempt'
import { Gamemode as SchemaGamemode } from '$db/gamemode'
import schema from '$db/schema'

const componentFrom = <T extends HTMLElement>(elem: T | null, name: string): Component<T> => {
  if (!elem) {
    throw new Error(`${name} doesn't exist in the HTML document!`)
  }
  return Component.from(elem, false)
}

const gridParent = componentFrom(document.querySelector<HTMLElement>('.grid__parent'), 'Grid parent')
const sillyNameParent = componentFrom(document.querySelector<HTMLParagraphElement>('#silly-name'), 'Silly name parent')
const gamemodeFieldset: HTMLFieldSetElement = document.querySelector('#gamemode')!
const gamemodePrompt: HTMLLegendElement = document.querySelector('#gamemode legend')!
const gamemodeInputs: NodeListOf<HTMLInputElement> = document.querySelectorAll('input[name=gamemode]')

let gamemode: Gamemode = new RandomCount()
let gamemodeName: SchemaGamemode = 'random'
let canChangeGamemode = true
let db: IDBDatabase
let ongoingAttempt: OngoingAttempt

const setGamemodeChangePermission = (allow: boolean) => {
  canChangeGamemode = allow
  gamemodeInputs.forEach((i) => (i.disabled = !allow))
}

const squareMousedown = (() => {
  let ignoreClicks = false
  return async function (this: Square) {
    if (ignoreClicks) {
      return
    }
    if (canChangeGamemode) {
      setGamemodeChangePermission(false)
      ongoingAttempt = startAttempt(gamemodeName)
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
})()

const grid = new Grid({
  squareCount: 48,
  colors: ['cotton-candy', 'mauve', 'lavender-floral', 'cornflower-blue', 'sky-blue'].map((color) => `var(--color-${color})`),
  squareEventListeners: [
    {
      event: 'mousedown',
      callback: squareMousedown,
    },
  ],
})

const sillyName = new SillyName()

const gamemodeChangeEvent = (ev: Event) => {
  if (!canChangeGamemode) return

  gamemodeName = (ev.target! as HTMLInputElement).value as SchemaGamemode

  switch (gamemodeName) {
    case 'random':
      gamemode = new RandomCount()
      gamemodePrompt.textContent = 'Gamemode: Luck'
      break
    case 'random-timer':
      gamemode = new RandomTimer({ minSeconds: 4, maxSeconds: 9 })
      gamemodePrompt.textContent = `Gamemode: Time (4–9 seconds)`
      break
  }
}

const main = async () => {
  gamemodeFieldset.addEventListener('change', gamemodeChangeEvent)
  sillyName.create(sillyNameParent)
  db = await IndexedDB.open(window.indexedDB, schema)
  await grid.create(gridParent, true)
}

main()
