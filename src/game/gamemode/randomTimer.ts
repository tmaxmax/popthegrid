import interval, { type Interval } from '$util/time/interval.ts'
import { intn } from '$util/index.ts'
import { Gamemode, type Progress, type Properties } from './index.ts'
import rand from '$rand'
import type { Grid, Square } from '$game/grid/index.ts'

export interface RandomTimerProps {
  minSeconds: number
  maxSeconds: number
}

export class RandomTimer extends Gamemode {
  private readonly numIterations: number
  private hasPoppedFirstSquare = false
  private controller?: AbortController
  private interval?: Interval
  private done = false

  constructor({ minSeconds, maxSeconds }: RandomTimerProps) {
    super()
    this.numIterations = minSeconds + intn(rand.next(), maxSeconds - minSeconds + 1)
  }

  properties = {
    name: 'random-timer',
    criticalSquares: false,
  } as const

  initialSquares(numColors: number): number[] {
    return Array.from({ length: 48 }, () => intn(Math.random(), numColors))
  }

  progress(grid: Grid, squareToRemove: Square): Progress {
    const done = grid.removeSquare(squareToRemove)
    const count = grid.activeSquares.length

    if (!this.hasPoppedFirstSquare) {
      this.controller = new AbortController()
      this.interval = interval({
        signal: this.controller.signal,
        iterations: this.numIterations + 1, // the interval is non-inclusive
        interval: 1000,
        callback: ({ iteration }) => this.markAsDone(iteration),
        leading: true,
      })
      this.hasPoppedFirstSquare = true
    }

    return { done, state: this.done ? 'lose' : count > 0 ? 'continue' : 'win' }
  }

  pause() {
    this.interval?.pause()
  }

  resume() {
    this.interval?.resume()
  }

  reset() {
    if (!this.interval || !this.controller) {
      return
    }

    this.controller.abort()
    return this.interval.done.then(() => {
      this.done = false
      this.interval = undefined
      this.controller = undefined
      this.hasPoppedFirstSquare = false
    })
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
