import { Gamemode } from '$game/gamemode'
import type { GamemodeName } from '$game/gamemode'
import { RandomCount } from '$game/gamemode/randomCount'
import { RandomTimer } from '$game/gamemode/randomTimer'
import { SameSquare } from '$game/gamemode/sameSquare'

export const gamemodes = {
  random: {
    display: 'Luck',
    create: () => new RandomCount(),
  },
  'random-timer': {
    display: 'Time (4–9 seconds)',
    create: () => new RandomTimer({ minSeconds: 4, maxSeconds: 9 }),
  },
  'same-square': {
    display: 'Gleich',
    create: () => new SameSquare(),
  },
} satisfies Record<GamemodeName, { create(): Gamemode; display: string }>

export const defaultGamemode = 'random' satisfies GamemodeName
