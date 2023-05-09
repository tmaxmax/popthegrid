export interface Square {
  color: string
  row: number
  col: number
}

export type Animation = 'none' | 'short' | 'long'

export interface Grid {
  readonly activeSquares: readonly Square[]

  numTotalSquares: number
  colors: readonly string[]

  create(animation: Animation): Promise<void>
  destroy(animation: Animation): Promise<void>
  removeSquare(square: Square): Promise<void>

  onSquare(callback: (square: Square, grid: Grid) => unknown): void
  toggleInteraction(enabled: boolean): void
}

export interface GridProps {
  numTotalSquares: number
  colors: string[]
}
