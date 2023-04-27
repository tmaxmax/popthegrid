import type { Grid, Square } from '$game/grid'
import { Gamemode } from '.'

export class SameSquare extends Gamemode {
  private lastColor?: string

  name() {
    return 'same-square' as const
  }

  shouldDestroy(grid: Grid, square: Square): boolean {
    if (!this.lastColor) {
      this.lastColor = square.color
      return false
    }

    if (this.lastColor === square.color) {
      return false
    }

    const sameColoredSquaresExist = grid.activeSquares.some((s) => s.color === this.lastColor)
    if (sameColoredSquaresExist) {
      return true
    }

    this.lastColor = square.color

    return false
  }

  reset() {
    this.lastColor = undefined
  }
}
