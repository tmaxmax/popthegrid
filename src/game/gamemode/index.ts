import type { Grid, Square } from '../grid/index.ts'
import type { Passthrough } from './passthrough.ts'
import type { RandomCount } from './randomCount.ts'
import type { SameSquare } from './sameSquare.ts'
import type { OddOneOut } from './oddOneOut.ts'

export type GamemodeName = Properties['name']

export type Progress = {
  done: Promise<void>
  state: 'win' | 'lose' | 'continue'
}

export type Properties = (RandomCount | SameSquare | Passthrough | OddOneOut)['properties']

export abstract class Gamemode {
  abstract progress(grid: Grid, squareToRemove: Square): Progress
  abstract initialSquares(numColors: number): number[]

  abstract readonly properties: Properties

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
