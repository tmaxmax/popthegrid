import { OpenOptions, fromRequest } from '$util/indexedDB'
import { transact } from '$util/indexedDB/transact'

export type Gamemode = 'random' | 'random-timer'

export interface OngoingAttempt {
  end(isWin: boolean): Attempt
}

export interface Attempt {
  gamemode: Gamemode
  startedAt: Date
  /** In milliseconds. */
  duration: number
  isWin: boolean
    }

export function startAttempt(gamemode: Gamemode): OngoingAttempt {
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
      }
    },
  }
}

export interface AttemptInserted extends Attempt {
  id: number
}

const ATTEMPTS_STORE = 'attempts'

export const schema: OpenOptions = {
  name: 'popthegrid',
  version: 1,
  configurator({ database: db }) {
    const store = db.createObjectStore(ATTEMPTS_STORE, {
      keyPath: 'id',
      autoIncrement: true,
    })

    store.createIndex('gamemode', 'gamemode', { unique: false })
    store.createIndex('isWin', 'isWin', { unique: false })
  },
}

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

export interface Counts {
  numAttempts: number
  numWins: number
  numLosses: number
}

export type Statistics = Record<Gamemode | 'total', Counts>

const EMPTY_COUNTS: Counts = {
  numAttempts: 0,
  numWins: 0,
  numLosses: 0,
}

export function getStats(data: Attempt[]): Statistics {
  const init: Statistics = {
    total: { ...EMPTY_COUNTS },
    random: { ...EMPTY_COUNTS },
    'random-timer': { ...EMPTY_COUNTS },
  }

  return data.reduce((acc, curr) => {
    acc.total.numAttempts++
    acc[curr.gamemode].numAttempts++

    if (curr.isWin) {
      acc.total.numWins++
      acc[curr.gamemode].numWins++
    } else {
      acc.total.numLosses++
      acc[curr.gamemode].numLosses++
    }

    return acc
  }, init)
}
