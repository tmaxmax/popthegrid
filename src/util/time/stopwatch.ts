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
    if (!isDefined(this.startedAt)) {
      this.startedAt = this.time.now()
    }
  }

  pause(): number {
    if (!isDefined(this.startedAt)) {
      return 0
    }

    const now = this.time.now()
    const elapsed = now - this.startedAt

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
    return this.totalElapsed
  }
}
