import type { Grid, Square } from '$game/grid/index.ts'
import rand from '$rand'
import { intn } from '$util/index.ts'
import { Gamemode, type Progress } from './index.ts'

export class SameSquare extends Gamemode {
  private lastColor?: string

  properties = {
    name: 'same-square',
    criticalSquares: true,
  } as const

  initialSquares(numColors: number): number[] {
    return Array.from({ length: 48 }, () => intn(rand.next(), numColors))
  }

  progress(grid: Grid, square: Square): Progress {
    const done = grid.removeSquare(square)
    const state = grid.activeSquares.length === 0 ? ('win' as const) : ('continue' as const)

    if (!this.lastColor) {
      this.lastColor = square.color
      return { done, state }
    }

    if (this.lastColor === square.color) {
      return { done, state }
    }

    const sameColoredSquaresExist = grid.activeSquares.some((s) => s.color === this.lastColor)
    if (sameColoredSquaresExist) {
      return { done, state: 'lose' }
    }

    this.lastColor = square.color

    return { done, state }
  }

  reset() {
    this.lastColor = undefined
  }
}
