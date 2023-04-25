export type Code = string & { __brand: 'code' }

export type GamemodeName = 'random' | 'random-timer' // keep in sync with FE

export type GameRecord = { name?: string } & (
  | { gamemode: 'random'; numWins: number }
  | { gamemode: 'random-timer'; fastestWinDuration: number }
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
