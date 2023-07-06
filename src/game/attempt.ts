import Stopwatch from '$util/time/stopwatch.ts'
import type { GamemodeName } from './gamemode/index.ts'

export interface OngoingAttempt {
  end(isWin: boolean): Attempt
  pause(): void
  resume(): void

  readonly numSquares: number
  readonly startedAt: Date
  readonly gamemode: GamemodeName
  readonly elapsed: number
  readonly paused: boolean
}

export interface Attempt {
  gamemode: GamemodeName
  startedAt: Date
  /** In milliseconds. */
  duration: number
  isWin: boolean
  /** Can be undefined because the previous database version didn't save it. */
  numSquares?: number
}

export interface StartAttemptProps {
  gamemode: GamemodeName
  numSquares: number
}

export function startAttempt({ gamemode, numSquares }: StartAttemptProps): OngoingAttempt {
  const startedAt = new Date()
  const stopwatch = new Stopwatch()
  let ended = false

  stopwatch.start()

  return Object.freeze<OngoingAttempt>({
    end(isWin) {
      if (ended) {
        throw new Error('This attempt was already ended.')
      }

      ended = true

      return {
        gamemode,
        startedAt,
        duration: this.elapsed,
        isWin,
        numSquares,
      }
    },
    pause() {
      stopwatch.pause()
    },
    resume() {
      stopwatch.start()
    },
    gamemode,
    numSquares,
    startedAt,
    get elapsed() {
      return stopwatch.elapsed
    },
    get paused() {
      return !stopwatch.ongoing
    },
  })
}
