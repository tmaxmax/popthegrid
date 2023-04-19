import { fromRequest } from '$util/indexedDB'
import { transact } from '$util/indexedDB/transact'
import { Gamemode } from './gamemode'

export interface OngoingAttempt {
  end(isWin: boolean): Attempt
}

export interface Attempt {
  gamemode: Gamemode
  startedAt: Date
  /** In milliseconds. */
  duration: number
  isWin: boolean
  /** Can be undefined because the previous database version didn't save it. */
  numSquares?: number
}

export interface StartAttemptProps {
  gamemode: Gamemode
  numSquares: number
}

export function startAttempt({ gamemode, numSquares }: StartAttemptProps): OngoingAttempt {
  const now = performance.now()
  const startedAt = new Date()
  let ended = false

  return {
    end(isWin) {
      if (ended) {
        throw new Error('This attempt was already ended.')
      }

      ended = true

      return {
        gamemode,
        startedAt,
        duration: performance.now() - now,
        isWin,
        numSquares,
      }
    },
  }
}

export interface AttemptInserted extends Attempt {
  id: number
}

export const ATTEMPTS_STORE = 'attempts'

export function insertAttempt(db: IDBDatabase, attempt: Attempt): Promise<AttemptInserted> {
  return transact(db, {
    stores: ATTEMPTS_STORE,
    mode: 'readwrite',
    operation(tx) {
      const req = tx.objectStore(ATTEMPTS_STORE).add(attempt)
      return fromRequest<AttemptInserted>(req)
    },
  })
}

export function retrieveAttempts(db: IDBDatabase): Promise<AttemptInserted[]> {
  return transact(db, {
    stores: ATTEMPTS_STORE,
    mode: 'readonly',
    operation(tx) {
      const req = tx.objectStore(ATTEMPTS_STORE).getAll()
      return fromRequest<AttemptInserted[]>(req)
    },
  })
}
