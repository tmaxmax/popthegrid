import type { GameRecord } from '$share/record.ts'
import type { Statistics } from '$game/statistics.ts'
import type { Attempts } from './context.ts'

export const getRecordDelta = ({ statistics, last, ongoing }: Attempts, record: GameRecord): [number, boolean] | undefined => {
  const stat = statistics.find((v) => 'gamemode' in v && record.gamemode === v.gamemode) as Statistics | undefined
  if (!stat || !last?.isWin || ongoing) {
    return undefined
  }

  if ('numWins' in record.data) {
    return [record.data.numWins - stat.numWins, false]
  }

  if ('fastestWinDuration' in record.data) {
    return [last!.duration - record.data.fastestWinDuration, true]
  }

  // TODO: Add here new records when necessary. This could surely be cleaner.

  return undefined
}
