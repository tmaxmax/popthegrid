import type { Grid } from '$game/grid/index.ts'
import { randInt } from '$util/index.ts'
import { Gamemode } from './index.ts'

export class RandomCount extends Gamemode {
  name() {
    return 'random' as const
  }

  shouldDestroy(grid: Grid): boolean {
    const count = grid.activeSquares.length
    return count > 1 && count === randInt(count + 1)
  }
}
