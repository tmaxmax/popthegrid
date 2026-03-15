import type { Grid, Square } from '$game/grid/index.ts'
import { intn } from '$util/index.ts'
import { Gamemode, type Progress } from './index.ts'

export class Passthrough extends Gamemode {
  properties = {
    name: 'passthrough',
    // Squares are colored for aesthetics only.
    criticalSquares: false,
  } as const

  initialSquares(numColors: number): number[] {
    return Array.from({ length: 48 }, () => intn(Math.random(), numColors))
  }

  progress(grid: Grid, squareToRemove: Square): Progress {
    const done = grid.removeSquare(squareToRemove)
    const count = grid.activeSquares.length
    return { done, state: count > 0 ? 'continue' : 'win' }
  }
}
