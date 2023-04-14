import { interval, randInt } from './util'

export interface Square {
  color: string
  row: number
  col: number
}

export interface Grid {
  activeSquares: readonly Square[]
  colors: readonly string[]
}

export abstract class Gamemode {
  abstract shouldDestroy(grid: Grid, destroyedSquare: Square): boolean

  reset(): void | Promise<void> {
    return
  }
}

export class RandomCount extends Gamemode {
  shouldDestroy(grid: Grid, _: Square): boolean {
    const count = grid.activeSquares.length
    return count > 1 && count === randInt(count + 1)
  }
}

export interface RandomTimerParameters {
  minSeconds: number
  maxSeconds: number
}

export class RandomTimer implements Gamemode {
  private readonly numIterations: number
  private hasPoppedFirstSquare = false
  private controller: AbortController | undefined
  private interval: Promise<number> | undefined
  private done = false

  constructor({ minSeconds, maxSeconds }: RandomTimerParameters) {
    this.numIterations = minSeconds + randInt(maxSeconds - minSeconds + 1)
  }

  shouldDestroy(_grid: Readonly<Grid>, _square: Readonly<Square>): boolean {
    if (!this.hasPoppedFirstSquare) {
      this.controller = new AbortController()
      this.interval = interval({
        signal: this.controller.signal,
        iterations: this.numIterations + 1, // the interval is non-inclusive
        interval: 1000,
        callback: this.markAsDone.bind(this),
        leading: true,
      })
      this.hasPoppedFirstSquare = true
    }

    return this.done
  }

  async reset() {
    if (!this.interval || !this.controller) {
      return
    }

    this.controller.abort()
    await this.interval

    this.done = false
    this.interval = undefined
    this.controller = undefined
    this.hasPoppedFirstSquare = false
  }

  private markAsDone(iteration: number) {
    if (iteration === this.numIterations) {
      this.done = true
    }
  }

  public get numSeconds(): number {
    return this.numIterations
  }
}
