import './Square.css'

import { Component } from './internal/Component'

export interface SquareEventListener {
  event: keyof HTMLElementEventMap
  callback: (this: Square, event: Event) => void
  options?: AddEventListenerOptions
}

export interface SquareProperties {
  color: string
  eventListeners?: SquareEventListener[]
}

export class Square extends Component<HTMLDivElement, false> {
  private userEvents?: SquareEventListener[]

  constructor(properties: SquareProperties) {
    super({ tag: 'div', classList: ['grid__square'] })
    ;({ color: this.color, eventListeners: this.userEvents } = properties)
    this.userEvents?.forEach((listener) => this.addEventListener(listener.event, listener.callback.bind(this), listener.options))
    this.addEventListener('mouseenter', () => {
      this.setStyle('z-index', `${2}`)
    })
    this.addEventListener('mouseleave', () => {
      this.setStyle('z-index', `${1}`)
      this.eventsRace(['transitionend', 'transitioncancel']).then(() => this.setStyle('z-index', null))
    })
  }

  get color(): string {
    return this.getStyle('--color')
  }

  set color(color: string) {
    this.setStyle('--color', color)
  }

  set row(row: number) {
    this.setStyle('--row', `${row}`)
  }

  set col(col: number) {
    this.setStyle('--col', `${col}`)
  }

  animate(which: string, animate = true): Promise<void> {
    if (animate) {
      const c = `grid__square--${which}`
      this.addClass(c)
      return this.eventsRace(['animationend', 'animationcancel']).then(() => this.removeClass(c))
    }
    return Promise.resolve()
  }

  create<V extends boolean>(parent: Component<HTMLElement, V>, animate: boolean): Promise<void> {
    this.appendTo(parent)
    return this.animate('inserted', animate)
  }

  destroy(animate: boolean): Promise<void> {
    return this.animate('deleted', animate).then(() => this.remove())
  }
}
