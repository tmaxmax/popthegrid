import type { InsertedAttempt } from '$db/attempt.ts'
import type { GamemodeName } from '$game/gamemode/index.ts'
import { addAttemptToStatistics, type Accumulator } from '$game/statistics.ts'
import type { ThemeName } from '$theme'
import { writable, type Readable, type Writable } from 'svelte/store'
import { getContext as svelteGetContext } from 'svelte'
import type { Game } from '$game/index.ts'
import type { GameRecord } from '$share/record.ts'
import { getName } from '$share/name.ts'
import type { OngoingAttempt } from '$game/attempt.ts'

export interface Context {
  name: Writable<string | undefined>
  attempts: AttemptsStore
  game: Game
  record?: GameRecord
  gamemode: Writable<GamemodeName>
  nextGamemode: Writable<GamemodeName>
  theme: Writable<ThemeName>
  database: IDBDatabase
}

export interface Attempts {
  statistics: Accumulator
  last?: InsertedAttempt
  ongoing?: OngoingAttempt
}

interface AttemptsStore extends Readable<Attempts> {
  update(attempt: InsertedAttempt): void
  updateOngoing(attempt?: OngoingAttempt): void
}

export interface ContextInput {
  name?: string
  record?: GameRecord
  attemptsLoader(): Promise<InsertedAttempt[]>
  game: Game
  gamemode: GamemodeName
  theme: ThemeName
  database: IDBDatabase
}

export function createContext({ name, attemptsLoader, gamemode, game, theme, database, record }: ContextInput): Context {
  return {
    name: writable<string | undefined>(name),
    game,
    attempts: createAttemptsStore(attemptsLoader),
    gamemode: writable<GamemodeName>(gamemode),
    nextGamemode: writable<GamemodeName>(gamemode),
    theme: writable<ThemeName>(theme),
    database,
    record,
  }
}

export const contextKey = Symbol('context')

export function getContext() {
  return svelteGetContext<Context>(contextKey)
}

export function configureTitle(name: Writable<string | undefined>, element: Element, pretentious: boolean) {
  const originalText = element.textContent
  const set = (name: string | undefined) => {
    if (name) {
      element.textContent = `${pretentious ? 'Salutations' : 'Welcome'}, ${name}!`
    } else {
      element.textContent = originalText
    }
  }

  set(getName())

  return name.subscribe(set)
}

function createAttemptsStore(loader: () => Promise<InsertedAttempt[]>): AttemptsStore {
  let hasSubscribed = false

  const { subscribe, update } = writable<Attempts>({ statistics: [] }, (set) => {
    loader().then((attempts) => {
      set({
        statistics: attempts.reduce(addAttemptToStatistics, []),
        last: attempts.at(-1),
      })
      hasSubscribed = true
    })

    return () => void 0
  })

  return {
    subscribe,
    update(attempt) {
      if (hasSubscribed) {
        update(({ statistics }) => ({
          statistics: addAttemptToStatistics(statistics, attempt),
          last: attempt,
        }))
      } else {
        update((v) => ({ statistics: v.statistics, last: attempt }))
      }
    },
    updateOngoing(attempt) {
      update((v) => ({ ...v, ongoing: attempt }))
    },
  }
}
