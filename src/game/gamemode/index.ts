import type { Grid, Square } from '../grid'
import { RandomCount } from './randomCount'
import { RandomTimer } from './randomTimer'

export type GamemodeName = ReturnType<RandomCount['name']> | ReturnType<RandomTimer['name']>

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
