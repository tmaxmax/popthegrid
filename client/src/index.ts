import './reset.css'
import './style.css'

import { Grid } from './components/Grid'
import { randInt } from './util/'
import { Square } from './components/Square'
import { Component } from './internal/Component'
import { SillyName } from './components/SillyName'

const componentFrom = <T extends HTMLElement>(elem: T | null, name: string): Component<T> => {
  if (!elem) {
    throw new Error(`${name} doesn't exist in the HTML document!`)
  }
  return Component.from(elem, false)
}

const gridParent = componentFrom(document.querySelector<HTMLElement>('.grid__parent'), 'Grid parent')
const sillyNameParent = componentFrom(document.querySelector<HTMLParagraphElement>('#silly-name'), 'Silly name parent')

const squareMousedown = (() => {
  let ignoreClicks = false
  return async function (this: Square) {
    if (ignoreClicks) {
      return
    }
    grid.removeSquare(this)
    if (grid.squareCount > 1 && grid.squareCount === randInt(grid.squareCount + 1)) {
      ignoreClicks = true
      await grid.destroy(true)
      await grid.create(gridParent, true)
    } else if (grid.squareCount === 0) {
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

const sillyName = new SillyName(`wss://${window.location.host.split(':')[0]}/ws`)

const main = async () => {
  sillyName.create(sillyNameParent)
  await grid.create(gridParent, true)
}

main()
