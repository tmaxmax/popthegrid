import './reset.css'
import './style.css'

import { Grid } from './components/Grid'
import { randInt } from './util'
import { Square } from './components/Square'
import { Component } from './internal/Component'
import { SillyName } from './components/SillyName'

const ComponentFrom = <T extends HTMLElement>(elem: T | null, name: string): Component<T> => {
  if (!elem) {
    throw new Error(`${name} doesn't exist in the HTML document!`)
  }
  return Component.from(elem)
}

const gridParent = ComponentFrom(document.querySelector<HTMLElement>('.grid__parent'), 'Grid parent')
const sillyNameParent = ComponentFrom(document.querySelector<HTMLParagraphElement>('#silly-name'), 'Silly name parent')

const squareMousedown = (() => {
  let ignoreClicks = false
  return async function (this: Square) {
    if (ignoreClicks) {
      return
    }
    grid.removeSquare(this).destroy(true)
    if (grid.squareCount === randInt(grid.squareCount + 1)) {
      ignoreClicks = true
      await grid.destroy(true)
      await grid.create(gridParent, true)
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

const sillyName = new SillyName(`ws://${window.location.host.split(':')[0]}`)

const main = async () => {
  sillyName.create(sillyNameParent)
  await grid.create(gridParent, true)
}

main()
