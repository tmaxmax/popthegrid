export type Code = string & { __brand: 'code' }

export type GamemodeName = 'random' | 'random-timer' | 'same-square' // keep in sync with FE

export type ThemeName = 'candy' | 'blood' // keep in sync with FE

// keep in sync with Go's share.Record
export type GameRecord = { name?: string; theme: ThemeName; when: Date } & (
  | { gamemode: 'random'; data: { numWins: number } }
  | { gamemode: 'random-timer' | 'same-square'; data: { fastestWinDuration: number } }
)

export const getCodeFromPath = (path: string): Code | undefined => {
  const [first, code, ...rest] = path.split('/')
  if (first !== '' || !isCode(code) || rest.length > 0) {
    return
  }

  return code
}

export const isCode = (s: string): s is Code => /^[A-Za-z0-9]{6}$/.test(s)

export const storageKey = 'record-data'
