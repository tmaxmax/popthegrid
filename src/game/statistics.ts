import type { Attempt } from './attempt.ts'
import type { GamemodeName } from './gamemode/index.ts'

export interface Counts {
  numAttempts: number
  numWins: number
  numLosses: number
  when: Date
}

export interface Statistics extends Counts {
  gamemode: GamemodeName
  fastestWinDuration?: number
}

const EMPTY_COUNTS: Counts = {
  numAttempts: 0,
  numWins: 0,
  numLosses: 0,
  when: new Date(),
} as const

export type Accumulator = [] | [Counts, ...Statistics[]]

export const addAttemptToStatistics = (acc: Accumulator, curr: Attempt): Accumulator => {
  if (acc.length === 0) {
    acc = [{ ...EMPTY_COUNTS }]
  }

  assertAccumulator(acc)

  let accg = acc.find(isStatistics(curr.gamemode))
  if (!accg) {
    accg = { gamemode: curr.gamemode, ...EMPTY_COUNTS }
    acc = [...acc, accg]
  }

  acc[0].numAttempts++
  accg.numAttempts++

  if (curr.isWin) {
    acc[0].numWins++
    accg.numWins++

    if (accg.gamemode === 'odd-one-out' || accg.gamemode === 'same-square' || accg.gamemode === 'passthrough') {
      if (!accg.fastestWinDuration || accg.fastestWinDuration > curr.duration) {
        accg.fastestWinDuration = curr.duration
        accg.when = curr.startedAt
      }
    }
  } else {
    acc[0].numLosses++
    accg.numLosses++
  }

  if (acc[0].when.getTime() < curr.startedAt.getDate()) {
    acc[0].when = curr.startedAt
  }

  return acc
}

const isStatistics =
  (gamemode: GamemodeName) =>
  (s: Counts | Statistics): s is Statistics => {
    return 'gamemode' in s && s.gamemode === gamemode
  }

function assertAccumulator(acc: Accumulator): asserts acc is Exclude<Accumulator, []> {
  void acc
  return
}
