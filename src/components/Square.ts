import './Square.css'

import { Component } from './internal/Component.ts'
import { type Animation } from '$game/grid/index.ts'

export interface SquareEventListener {
  event: keyof HTMLElementEventMap
  callback: (this: Square, event: Event) => void
  options?: AddEventListenerOptions
}

export interface SquareProperties {
  color: string
}

export class Square extends Component<HTMLDivElement> {
  private currentColor!: string
  private rowNum = -1
  private colNum = -1

  constructor(properties: SquareProperties) {
    super({ tag: 'div', classList: ['grid__square'] })
    this.color = properties.color
    this.addEventListener('mouseenter', () => {
      this.setStyle('z-index', `${2}`)
    })
    this.addEventListener('mouseleave', () => {
      this.setStyle('z-index', `${1}`)
      this.eventsRace(['transitionend', 'transitioncancel']).then(() => this.setStyle('z-index', null))
    })
  }

  get color(): string {
    return this.currentColor
  }

  set color(color: string) {
    this.currentColor = color
    this.setStyle('--color', color)
  }

  set row(row: number) {
    if (row !== -1) {
      this.rowNum = row
      this.setStyle('--row', `${row}`)
    } else {
      this.setStyle('--row', null)
    }
  }

  get row(): number {
    return this.rowNum
  }

  set col(col: number) {
    if (col !== -1) {
      this.colNum = col
      this.setStyle('--col', `${col}`)
    } else {
      this.setStyle('--col', null)
    }
  }

  get col(): number {
    return this.colNum
  }

  animate(which: string, animate: Animation = 'long'): Promise<void> {
    if (animate !== 'none') {
      const c = [`grid__square--${which}`]
      if (animate === 'short') {
        c.push('short')
      }
      this.addClass(...c)
      return this.eventsRace(['animationend', 'animationcancel']).then(() => this.removeClass(...c))
    }
    return Promise.resolve()
  }

  create(parent: Component, animate: Animation): Promise<void> {
    this.appendTo(parent)
    return this.animate('inserted', animate)
  }

  destroy(animate: Animation): Promise<void> {
    return this.animate('deleted', animate).then(() => this.remove())
  }
}
