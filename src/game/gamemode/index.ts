import type { Grid, Square } from '../grid/index.ts'
import type { Passthrough } from './passthrough.ts'
import { RandomCount } from './randomCount.ts'
import { RandomTimer } from './randomTimer.ts'
import type { SameSquare } from './sameSquare.ts'

export type GamemodeName = ReturnType<(RandomCount | RandomTimer | SameSquare | Passthrough)['name']>

export abstract class Gamemode {
  abstract shouldDestroy(grid: Grid, destroyedSquare: Square): boolean
  abstract name(): GamemodeName

  reset(): void | Promise<void> {
    return
  }

  pause() {
    return
  }

  resume() {
    return
  }
}
