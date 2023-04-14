import './reset.css'
import './style.css'

import { Grid } from './components/Grid'
import { Square } from './components/Square'
import { Component } from './components/internal/Component'
import { SillyName } from './components/SillyName'
import { Gamemode, RandomCount, RandomTimer } from './gamemode'

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
console.log(gamemodeInputs.length)

let gamemode: Gamemode = new RandomCount()
let canChangeGamemode = true

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
    }
    const removed = grid.removeSquare(this)
    if (gamemode.shouldDestroy(grid, this)) {
      ignoreClicks = true
      await Promise.all([grid.destroy(true), gamemode.reset()])
      setGamemodeChangePermission(true)
      await grid.create(gridParent, true)
    } else if (grid.squareCount === 0) {
      await Promise.all([removed, gamemode.reset()])
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

type GamemodeInput = 'random' | 'random-timer'

const gamemodeChangeEvent = (ev: Event) => {
  if (!canChangeGamemode) return

  const gamemodeName = (ev.target! as HTMLInputElement).value as GamemodeInput
  console.log(gamemodeName)

  switch (gamemodeName) {
    case 'random':
      gamemode = new RandomCount()
      gamemodePrompt.textContent = 'Gamemode: Luck'
      break
    case 'random-timer':
      gamemode = new RandomTimer({ minSeconds: 4, maxSeconds: 9 })
      gamemodePrompt.textContent = `Gamemode: Time (${(gamemode as RandomTimer).numSeconds} seconds)`
      break
  }
}

const main = async () => {
  gamemodeFieldset.addEventListener('change', gamemodeChangeEvent)
  sillyName.create(sillyNameParent)
  await grid.create(gridParent, true)
}

main()
