import type { Attempt } from './attempt'

type Counts = {
  numAttempts: number
  numWins: number
  numLosses: number
}

export type Statistics = Counts &
  ({ gamemode?: never } | { gamemode: 'random' } | { gamemode: 'random-timer' | 'same-square'; fastestWinDuration?: number })

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

      if ('gamemode' in accg && (accg.gamemode === 'random-timer' || accg.gamemode === 'same-square')) {
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
