import type { RandState } from '$rand'
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
  readonly randState: RandState
}

export interface Attempt {
  gamemode: GamemodeName
  startedAt: Date
  /** In milliseconds. */
  duration: number
  isWin: boolean
  /** Can be undefined because the previous database version didn't save it. */
  numSquares?: number
  /** Can be undefined because it must explicitly be loaded */
  randState?: RandState
}

export interface StartAttemptProps {
  gamemode: GamemodeName
  numSquares: number
  randState: RandState
}

export function startAttempt({ gamemode, numSquares, randState }: StartAttemptProps): OngoingAttempt {
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
        randState,
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
    randState,
    startedAt,
    get elapsed() {
      return stopwatch.elapsed
    },
    get paused() {
      return !stopwatch.ongoing
    },
  })
}
