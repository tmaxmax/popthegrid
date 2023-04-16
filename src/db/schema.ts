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

type Counts = {
  numAttempts: number
  numWins: number
  numLosses: number
}

type GamemodeRecord<T extends Gamemode> = { gamemode: T }

export type Statistics =
  | (Counts & { gamemode?: never })
  | (Counts & GamemodeRecord<'random'>)
  | (Counts & GamemodeRecord<'random-timer'> & { fastestWinDuration?: number })

const EMPTY_COUNTS: Counts = {
  numAttempts: 0,
  numWins: 0,
  numLosses: 0,
} as const

export function getStatistics(data: Attempt[]): Statistics[] {
  const init: Statistics[] = [{ ...EMPTY_COUNTS }]

  return data.reduce((acc, curr) => {
    let accg = acc.find((s) => 'gamemode' in s && s.gamemode === curr.gamemode)
    if (!accg) {
      acc.push({ gamemode: curr.gamemode, ...EMPTY_COUNTS })
      accg = acc[acc.length - 1]
    }

    acc[0].numAttempts++
    accg.numAttempts++

    if (curr.isWin) {
      acc[0].numWins++
      accg.numWins++

      if ('gamemode' in accg && accg.gamemode === 'random-timer') {
        if (!accg.fastestWinDuration || accg.fastestWinDuration > curr.duration) {
          accg.fastestWinDuration = curr.duration
        }
      }
    } else {
      acc[0].numLosses++
      accg.numLosses++
    }

    return acc
  }, init)
}
