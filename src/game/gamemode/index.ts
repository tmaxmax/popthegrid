import type { Grid, Square } from '../grid'
import type { Passthrough } from './passthrough'
import { RandomCount } from './randomCount'
import { RandomTimer } from './randomTimer'
import type { SameSquare } from './sameSquare'

export type GamemodeName =
  | ReturnType<RandomCount['name']>
  | ReturnType<RandomTimer['name']>
  | ReturnType<SameSquare['name']>
  | ReturnType<Passthrough['name']>

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
