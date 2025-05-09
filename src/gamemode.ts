import { Gamemode, type GamemodeName } from '$game/gamemode/index.ts'
import { OddOneOut } from '$game/gamemode/oddOneOut'
import { Passthrough } from '$game/gamemode/passthrough.ts'
import { RandomCount } from '$game/gamemode/randomCount.ts'
import { SameSquare } from '$game/gamemode/sameSquare.ts'

export const gamemodes = {
  random: {
    display: 'Mystery',
    description: 'You will win... somehow. Can you do it?',
    create: () => new RandomCount(),
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
  'odd-one-out': {
    display: 'Odd One Out',
    description: 'Tap the one that does not fit until there are no squares to hit!',
    create: () => new OddOneOut(),
  },
} satisfies Record<GamemodeName, { create(): Gamemode; description: string; display: string }>

export const defaultGamemode = 'random' satisfies GamemodeName
