import type { InsertedAttempt } from '$db/attempt'
import type { GamemodeName } from '$game/gamemode'
import { addAttemptToStatistics, type Accumulator } from '$game/statistics'
import type { ThemeName } from '$theme'
import { writable, type Readable, type Writable } from 'svelte/store'
import { getContext as svelteGetContext } from 'svelte'
import type { Game } from '$game'
import type { GameRecord } from '$edge/share'
import { getName } from '$share/name'

export interface Context {
  name: Writable<string | undefined>
  statistics: StatisticsStore
  game: Game
  record?: GameRecord
  gamemode: Writable<GamemodeName>
  nextGamemode: Writable<GamemodeName>
  theme: Writable<ThemeName>
}

interface StatisticsStore extends Readable<Accumulator> {
  update(attempt: InsertedAttempt): void
}

export interface ContextInput {
  name?: string
  record?: GameRecord
  attemptsLoader(): Promise<InsertedAttempt[]>
  game: Game
  gamemode: GamemodeName
  theme: ThemeName
}

export function createContext({ name, attemptsLoader, gamemode, game, theme }: ContextInput): Context {
  return {
    name: writable<string | undefined>(name),
    game,
    statistics: createStatisticsStore(attemptsLoader),
    gamemode: writable<GamemodeName>(gamemode),
    nextGamemode: writable<GamemodeName>(gamemode),
    theme: writable<ThemeName>(theme),
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

function createStatisticsStore(loader: () => Promise<InsertedAttempt[]>): StatisticsStore {
  let hasSubscribed = false

  const { subscribe, update } = writable<Accumulator>([], (set) => {
    loader().then((attempts) => {
      set(attempts.reduce(addAttemptToStatistics, []))
      hasSubscribed = true
    })

    return () => void 0
  })

  return {
    subscribe,
    update(attempt) {
      if (hasSubscribed) {
        update((stats) => addAttemptToStatistics(stats, attempt))
      }
    },
  }
}
