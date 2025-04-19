import { Gamemode, type GamemodeName } from '$game/gamemode/index.ts'
import { Passthrough } from '$game/gamemode/passthrough.ts'
import { RandomCount } from '$game/gamemode/randomCount.ts'
import { RandomTimer } from '$game/gamemode/randomTimer.ts'
import { SameSquare } from '$game/gamemode/sameSquare.ts'

export const gamemodes = {
  random: {
    display: 'Mystery',
    description: 'You will win... somehow. Can you do it?',
    create: () => new RandomCount(),
  },
  'random-timer': {
    display: 'Lucky Timer',
    description: "You're on time! Win before the timer ends – but who knows how long you have...",
    create: () => new RandomTimer({ minSeconds: 4, maxSeconds: 9 }),
  },
  'same-square': {
    display: 'Gleich',
    description: 'Be careful, for two squares destroyed one after another alike shall be!',
    create: () => new SameSquare(),
  },
  passthrough: {
    display: 'FFITW',
    description: 'Fastest Fingers In The World. You never lose, go hit it!',
    create: () => new Passthrough(),
  },
} satisfies Record<GamemodeName, { create(): Gamemode; description: string; display: string }>

export const defaultGamemode = 'random' satisfies GamemodeName
