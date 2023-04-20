import { Attempt } from './attempt'
import { GamemodeName } from './gamemode'

type Counts = {
  numAttempts: number
  numWins: number
  numLosses: number
}

export type Statistics = Counts &
  (
    | { gamemode?: never }
    | { gamemode: 'random' }
    | { gamemode: 'random-timer'; fastestWinDuration?: number }
    | { gamemode: Exclude<string, GamemodeName> }
  )

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

      if (isTimerGamemode(accg)) {
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

const isTimerGamemode = (acc: Statistics): acc is Counts & { gamemode: 'random-timer'; fastestWinDuration?: number } => {
  return 'gamemode' in acc && acc.gamemode === 'random-timer'
}
