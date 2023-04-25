import { Grid, Square } from '../grid'
import { RandomCount } from './randomCount'
import { RandomTimer } from './randomTimer'

export type GamemodeName = ReturnType<RandomCount['name']> | ReturnType<RandomTimer['name']>

export abstract class Gamemode {
  abstract shouldDestroy(grid: Grid, destroyedSquare: Square): boolean

  reset(): void | Promise<void> {
    return
  }

  abstract name(): GamemodeName
}
