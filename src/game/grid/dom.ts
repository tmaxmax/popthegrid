import { Component } from '$components/internal/Component'
import { Grid as GridComponent } from '$components/Grid'
import { Square as SquareComponent } from '$components/Square'
import type { Animation, Grid, GridProps, Square } from '.'

export class DOMGrid implements Grid {
  private readonly grid: GridComponent
  private readonly gridParent: Component

  constructor(props: GridProps & { domParent: Component }) {
    this.grid = new GridComponent({
      squareCount: props.numTotalSquares,
      colors: props.colors,
    })
    this.gridParent = props.domParent
  }

  get activeSquares(): readonly Square[] {
    return this.grid.activeSquares
  }

  get numTotalSquares(): number {
    return this.grid.numTotalSquares
  }

  set numTotalSquares(num: number) {
    this.grid.numTotalSquares = num
  }

  get colors(): readonly string[] {
    return this.grid.colors
  }

  set colors(cols: readonly string[]) {
    this.grid.colors = cols
  }

  create(animation: Animation): Promise<void> {
    return this.grid.create(this.gridParent, animation)
  }

  destroy(animation: Animation): Promise<void> {
    return this.grid.destroy(animation)
  }

  removeSquare(square: Square): Promise<void> {
    if (square instanceof SquareComponent) {
      return this.grid.removeSquare(square)
    }

    throw new Error(`Square type incompatible with DOM grid`)
  }

  onSquare(callback: (square: Square, grid: Grid) => unknown): void {
    this.grid.addSquareEventListener('pointerdown', (ev, square) => {
      if ((ev.buttons || ev.which || ev.button) === 1) {
        ev.preventDefault()
        callback(square, this)
      }
    })
  }

  toggleInteraction(enabled: boolean) {
    this.grid.toggleInteraction(enabled)
  }
}
