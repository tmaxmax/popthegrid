export interface Square {
  color: string
  row: number
  col: number
}

export type Animation = 'none' | 'short' | 'long'

export interface Grid {
  readonly activeSquares: Square[]
  readonly numTotalSquares: number

  colors: readonly string[]
  setColors(colors: readonly string[], squaresColorSequence: number[]): void

  create(animation: Animation, squaresColorSequence: number[]): Promise<void>
  destroy(animation: Animation): Promise<void>
  removeSquare(square: Square): Promise<void>

  onSquare(callback: (square: Square, grid: Grid, ev?: PointerEvent) => unknown): void
  toggleInteraction(enabled: boolean): void
}

export interface GridProps {
  colors: string[]
}
