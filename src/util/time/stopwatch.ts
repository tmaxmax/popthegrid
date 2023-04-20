import { isDefined } from '..'

export interface Time {
  now(): number
}

export default class Stopwatch {
  private startedAt: number | undefined
  private totalElapsed = 0
  private readonly time: Time

  constructor(time?: Time) {
    this.time = time || performance || Date
  }

  start() {
    if (!this.ongoing) {
      this.startedAt = this.time.now()
    }
  }

  pause(): number {
    if (!this.ongoing) {
      return 0
    }

    const now = this.time.now()
    const elapsed = now - this.startedAt!

    this.startedAt = undefined
    this.totalElapsed += elapsed

    return elapsed
  }

  end(): number {
    this.pause()

    const elapsed = this.totalElapsed

    this.reset()

    return elapsed
  }

  reset() {
    this.startedAt = undefined
    this.totalElapsed = 0
  }

  get elapsed(): number {
    let elapsed = this.totalElapsed
    if (this.startedAt) {
      elapsed += this.time.now() - this.startedAt
    }

    return elapsed
  }

  get ongoing(): boolean {
    return isDefined(this.startedAt)
  }
}
