import { getCodeFromPath, storageKey } from './code.ts'
import type { ThemeName } from '$theme'

// keep in sync with Go's share.Record
export type GameRecord = { name?: string; theme: ThemeName; when: Date } & (
  | { gamemode: 'random'; data: { numWins: number } }
  | { gamemode: 'random-timer' | 'same-square' | 'passthrough'; data: { fastestWinDuration: number } }
)

export const getSharedRecord = (): GameRecord | undefined => {
  const code = getCodeFromPath(location.pathname)
  if (!code) {
    return
  }

  const data = sessionStorage.getItem(storageKey)
  if (!data) {
    return
  }

  return JSON.parse(data)
}

export const clearSharedRecord = () => {
  const code = getCodeFromPath(location.pathname)
  if (!code) {
    return
  }

  sessionStorage.removeItem(storageKey)
}
