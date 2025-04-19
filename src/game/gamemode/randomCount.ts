import type { Grid } from '$game/grid/index.ts'
import { intn } from '$util/index.ts'
import { Rand } from '../../rand.ts'
import { Gamemode } from './index.ts'

export class RandomCount extends Gamemode {
  private rand: Rand

  constructor(rand: Rand) {
    super()
    this.rand = rand
  }

  name() {
    return 'random' as const
  }

  shouldDestroy(grid: Grid): boolean {
    const count = grid.activeSquares.length
    return count > 1 && count === intn(this.rand.next(), count + 1)
  }
}
