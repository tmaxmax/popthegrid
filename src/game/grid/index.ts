export interface Square {
  color: string
  row: number
  col: number
}

export interface Grid {
  readonly activeSquares: readonly Square[]

  numTotalSquares: number
  colors: readonly string[]

  create(): Promise<void>
  destroy(): Promise<void>
  removeSquare(square: Square): Promise<void>

  onSquare(callback: (square: Square, grid: Grid) => unknown): void
  toggleInteraction(enabled: boolean): void
}

export interface GridProps {
  numTotalSquares: number
  colors: string[]
}
