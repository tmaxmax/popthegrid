import type { Grid, Square } from '$game/grid/index.ts'
import { intn } from '$util/index.ts'
import { Gamemode, type Progress } from './index.ts'

export class Passthrough extends Gamemode {
  initialSquares(numColors: number): number[] {
    return Array.from({ length: 48 }, () => intn(Math.random(), numColors))
  }

  progress(grid: Grid, squareToRemove: Square): Progress {
    const done = grid.removeSquare(squareToRemove)
    const count = grid.activeSquares.length
    return { done, state: count > 0 ? 'continue' : 'win' }
  }

  properties = {
    name: 'passthrough',
    criticalSquares: false,
  } as const
}
