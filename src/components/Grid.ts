import './Grid.css'

import { Component } from './internal/Component.ts'
import { Square } from './Square.ts'
import { type Animation } from '$game/grid/index.ts'
import baseLog from '$util/log.ts'
import { isDefined, randInt, wait } from '$util/index.ts'
import { map as mapAsync } from '$util/async.ts'

export interface GridProperties {
  colors?: string[]
  animationDelay?: number
  squareCount?: number
}

const log = baseLog.extend('Grid')

const generateSquares = (props: Required<GridProperties>) =>
  Array.from(
    { length: props.squareCount },
    () =>
      new Square({
        color: props.colors[randInt(props.colors.length)],
      })
  )

const getDelay = (base: number, current: number, total: number): number => {
  const exp = Math.floor(total / 2)
  const magnitude = Math.floor((10 * exp) / 9)
  const progress = current / total
  const delay = base + Math.floor(Math.pow(progress, exp) * magnitude * base)
  return delay
}

const defaultProps: Required<GridProperties> = {
  colors: ['#000'],
  animationDelay: 50,
  squareCount: 102,
}

export class Grid extends Component<HTMLDivElement> {
  private readonly properties: Required<GridProperties>
  private squares: Square[] = []
  private readonly resizeObserver: ResizeObserver

  constructor(properties: GridProperties) {
    super({ tag: 'div', classList: ['grid'] })
    this.properties = { ...defaultProps, ...properties }
    log('Grid properties: %O', this.properties)
    this.resizeObserver = new ResizeObserver(() => {
      this.setSquaresPosition()
    })
  }

  private async setSquaresPosition(start = 0, end = this.squares.length) {
    const size = this.squareData.sideLength
    const colsUnrounded = this.width / size
    const cols = colsUnrounded | 0
    const offset = (this.width - cols * size) / 2

    this.setStyle('--offset', `${offset}px`)
    this.setStyle('--size', `${size}px`)

    await mapAsync(this.squares.slice(start, end), (s, i) => {
      const j = start + i
      s.row = (j / cols) | 0
      s.col = j % cols
      return this.eventsRace(['transitionend', 'transitioncancel'])
    })
  }

  get colors(): readonly string[] {
    return this.properties.colors
  }

  set colors(colors: readonly string[]) {
    this.properties.colors = [...colors]
    this.squares.forEach((square) => (square.color = colors[randInt(colors.length)]))
  }

  get activeSquares(): readonly Square[] {
    return this.squares
  }

  get numTotalSquares(): number {
    return this.properties.squareCount
  }

  set numTotalSquares(num: number) {
    this.properties.squareCount = num
  }

  async removeSquare(square: Square): Promise<void> {
    const i = this.squares.indexOf(square)
    if (i == -1) {
      throw new Error('Square does not exist in grid')
    }
    log('Square %d removed', i)
    await Promise.all([this.squares.splice(i, 1)[0].destroy('long'), this.setSquaresPosition(i)])
  }

  addSquareEventListener<E extends keyof HTMLElementEventMap>(
    event: E,
    callback: (ev: HTMLElementEventMap[E], square: Square) => unknown,
    options?: AddEventListenerOptions
  ) {
    const cb = (e: Event) => {
      if (!isHTMLDivElement(e.target) || !e.target.classList.contains('grid__square') || !e.isTrusted) {
        return
      }

      const row = parseInt(e.target.style.getPropertyValue('--row'), 10)
      const col = parseInt(e.target.style.getPropertyValue('--col'), 10)

      const square = this.squares.find((v) => v.row === row && v.col === col)
      if (!square) {
        return
      }

      callback(e as HTMLElementEventMap[E], square)
    }

    this.addEventListener(event, cb, options)
  }

  async create(parent: Component, animate: Animation): Promise<void> {
    if (this.activeSquares.length > 0) {
      return
    }
    log('Creating grid')
    this.appendTo(parent)
    this.resizeObserver.observe(this.element)
    this.addClass('grid--no-interaction')
    await this.appendSquares(generateSquares(this.properties), animate)
    this.removeClass('grid--no-interaction')
  }

  async destroy(animate: Animation): Promise<void> {
    log('Destroying grid')
    this.resizeObserver.disconnect()
    this.addClass('grid--no-interaction')
    if (animate !== 'none') {
      let promise: Promise<void> | undefined
      for (let square = this.squares.pop(); square; square = this.squares.pop()) {
        promise = square.destroy(animate)
        if (animate === 'long') {
          await wait(this.properties.animationDelay)
        }
      }
      await promise
    }
    this.removeClass('grid--no-interaction')
    this.remove()
  }

  toggleInteraction(enabled: boolean) {
    if (enabled) {
      this.removeClass('grid--no-interaction')
    } else {
      this.addClass('grid--no-interaction')
    }
  }

  private async appendSquares(squares: Square[], animate: Animation): Promise<void> {
    let promise: Promise<void> | undefined
    let i = this.squares.length
    this.squares.push(...squares)
    for (; i < this.squares.length; i++) {
      const square = this.squares[i]
      promise = square.create(this as unknown as Component, animate)
      if (animate === 'long') {
        await Promise.race([promise, wait(getDelay(this.properties.animationDelay, i, this.squares.length))])
      }
    }
    await promise
  }

  private get width(): number {
    return parseInt(this.getComputedStyle('width'))
  }

  private get height(): number {
    return parseInt(this.getComputedStyle('height'))
  }

  private get squareData() {
    const n = this.properties.squareCount
    const x = this.width
    const y = this.height

    log('Width: %d, Height: %d', x, y)

    const px = Math.ceil(Math.sqrt((n * x) / y))
    let sx
    if (Math.floor((px * y) / x) * px < n) {
      sx = y / Math.ceil((px * y) / x)
    } else {
      sx = x / px
    }

    const py = Math.ceil(Math.sqrt((n * y) / x))
    let sy
    if (Math.floor((py * x) / y) * py < n) {
      sy = x / Math.ceil((x * py) / y)
    } else {
      sy = y / py
    }

    const sideLength = Math.max(sx, sy)

    return { sideLength }
  }
}

const isHTMLDivElement = (v: unknown): v is HTMLDivElement => {
  return isDefined(v) && (v as any).__proto__.constructor.name === 'HTMLDivElement'
}
