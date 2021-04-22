import './Grid.css'

import { Component } from '../internal/Component'
import { Square, SquareEventListener } from './Square'
import { generateArray, baseLog, randInt, wait } from '../util'
import ResizeObserver from 'resize-observer-polyfill'

interface GridProperties {
  colors?: string[]
  animationDelay?: number
  squareCount?: number
  squareEventListeners?: SquareEventListener[]
}

const log = baseLog.extend('Grid')

const generateSquares = (props: Required<GridProperties>) =>
  generateArray<Square>(
    props.squareCount,
    () =>
      new Square({
        color: props.colors[randInt(props.colors.length)],
        eventListeners: props.squareEventListeners,
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
  squareEventListeners: [],
}

class Grid extends Component<HTMLDivElement> {
  private readonly properties: Required<GridProperties>
  private squares: Square[] = []
  private readonly resizeObserver: ResizeObserver

  constructor(properties: GridProperties) {
    super({ tag: 'div', classList: ['grid'] })
    this.properties = { ...defaultProps, ...properties }
    log('Grid properties: %O', this.properties)
    this.addClass('grid')
    this.resizeObserver = new ResizeObserver(() => {
      this.setSquaresPosition()
    })
  }

  private setSquaresPosition(start?: number, end?: number) {
    start ??= 0
    end ??= this.squares.length

    const size = this.squareData.sideLength
    const cols = (this.width / size) | 0

    this.squares.slice(start, end).forEach((s, i) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const j = start! + i
      s.size = size
      s.row = (j / cols) | 0
      s.col = j % cols
    })
  }

  get colors(): string[] {
    return this.properties.colors
  }

  set colors(colors: string[]) {
    this.properties.colors = colors
    this.squares.forEach((square) => (square.color = colors[randInt(colors.length)]))
  }

  get squareCount(): number {
    return this.squares.length
  }

  removeSquare(square: Square): void {
    const i = this.squares.indexOf(square)
    log('Square %d removed', i)
    this.squares.splice(i, 1)[0].destroy(true)
    this.setSquaresPosition(i)
  }

  async create<T extends HTMLElement>(parent: Component<T>, animate: boolean): Promise<void> {
    log('Creating grid')
    this.appendTo(parent)
    this.resizeObserver.observe(this.element)
    this.addClass('grid--no-interaction')
    await this.appendSquares(generateSquares(this.properties), animate)
    this.removeClass('grid--no-interaction')
  }

  async destroy(animate: boolean): Promise<void> {
    log('Destroying grid')
    this.resizeObserver.disconnect()
    this.addClass('grid--no-interaction')
    if (animate) {
      let promise: Promise<void> | undefined
      for (let square = this.squares.pop(); square; square = this.squares.pop()) {
        promise = square.destroy(true)
        await wait(this.properties.animationDelay)
      }
      await promise
    }
    this.removeClass('grid--no-interaction')
    this.remove()
  }

  private async appendSquares(squares: Square[], animate: boolean): Promise<void> {
    let promise: Promise<void> | undefined
    let i = this.squares.length
    this.squares.push(...squares)
    for (; i < this.squares.length; i++) {
      const square = this.squares[i]
      promise = square.create(this, animate)
      if (animate) {
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

export { Grid, GridProperties }
