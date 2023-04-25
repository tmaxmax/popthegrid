import { Gamemode, GamemodeName } from '$game/gamemode'
import { RandomCount } from '$game/gamemode/randomCount'
import { RandomTimer } from '$game/gamemode/randomTimer'

export const gamemodes = {
  random: {
    display: 'Luck',
    create: () => new RandomCount(),
  },
  'random-timer': {
    display: 'Time (4–9 seconds)',
    create: () => new RandomTimer({ minSeconds: 4, maxSeconds: 9 }),
  },
} satisfies Record<GamemodeName, { create(): Gamemode; display: string }>
