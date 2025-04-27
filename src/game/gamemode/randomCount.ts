import type { Grid, Square } from '$game/grid/index.ts'
import { intn } from '$util/index.ts'
import rand from '$rand'
import { Gamemode, type Progress } from './index.ts'

export class RandomCount extends Gamemode {
  properties = {
    name: 'random',
    criticalSquares: false,
  } as const

  initialSquares(numColors: number): number[] {
    return Array.from({ length: 48 }, () => intn(Math.random(), numColors))
  }

  progress(grid: Grid, squareToRemove: Square): Progress {
    const done = grid.removeSquare(squareToRemove)
    const count = grid.activeSquares.length
    const lose = count > 1 && count === intn(rand.next(), count + 1)
    return { done, state: lose ? 'lose' : count > 0 ? 'continue' : 'win' }
  }
}
