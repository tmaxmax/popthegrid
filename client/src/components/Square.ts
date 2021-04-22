import './Square.css'

import { Component } from '../internal/Component'

interface SquareEventListener {
  event: string
  callback: (this: Square, event: Event) => void
  options?: boolean | AddEventListenerOptions
}

interface SquareProperties {
  color: string
  eventListeners?: SquareEventListener[]
}

class Square extends Component<HTMLDivElement> {
  private userEvents?: SquareEventListener[]

  constructor(properties: SquareProperties) {
    super({ tag: 'div', classList: ['grid__square'] })
    ;({ color: this.color, eventListeners: this.userEvents } = properties)
    this.userEvents?.forEach((listener) => this.addEventListener(listener.event, listener.callback.bind(this), listener.options))
    this.addEventListener('mouseenter', () => {
      this.setStyle('z-index', `${2}`)
    })
    this.addEventListener('mouseleave', () => {
      const transitionEventHandler = function (this: Square) {
        this.setStyle('z-index', '')
        this.removeEventListener('transitionend', transitionEventHandler)
      }.bind(this)
      this.setStyle('z-index', `${1}`)
      this.addEventListener('transitionend', transitionEventHandler)
    })
  }

  get color(): string {
    return this.getStyle('--color')
  }

  set color(color: string) {
    this.setStyle('--color', color)
  }

  get row(): number {
    return parseInt(this.getStyle('--row'), 10)
  }

  set row(row: number) {
    this.setStyle('--row', `${row}`)
  }

  get col(): number {
    return parseInt(this.getStyle('--col'), 10)
  }

  set col(col: number) {
    this.setStyle('--col', `${col}`)
  }

  async create<T extends HTMLElement>(parent: Component<T>, animate: boolean): Promise<void> {
    this.appendTo(parent)
    if (animate) {
      this.addClass('grid__square--inserted')
      await new Promise<void>((resolve) => {
        this.addEventListener('animationend', () => {
          this.removeClass('grid__square--inserted')
          resolve()
        })
      })
    }
  }

  async destroy(animate: boolean): Promise<void> {
    if (animate) {
      await new Promise<void>((resolve) => {
        this.addEventListener('animationend', () => resolve())
        this.addClass('grid__square--deleted')
      })
    }
    this.remove()
  }
}

export { Square, SquareProperties, SquareEventListener }
