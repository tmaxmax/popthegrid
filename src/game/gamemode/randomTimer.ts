import interval from '$util/time/interval'
import type { Interval } from '$util/time/interval'
import { randInt } from '$util'
import { Gamemode } from '.'

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
    this.numIterations = minSeconds + randInt(maxSeconds - minSeconds + 1)
  }

  name() {
    return 'random-timer' as const
  }

  shouldDestroy(): boolean {
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

    return this.done
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
