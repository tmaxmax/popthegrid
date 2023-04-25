import type { Grid } from '$game/grid'
import { randInt } from '$util/index'
import { Gamemode } from '.'

export class RandomCount extends Gamemode {
  name() {
    return 'random' as const
  }

  shouldDestroy(grid: Grid): boolean {
    const count = grid.activeSquares.length
    return count > 1 && count === randInt(count + 1)
  }
}
