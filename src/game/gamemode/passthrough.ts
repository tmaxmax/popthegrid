import { Gamemode } from './index.ts'

export class Passthrough extends Gamemode {
  shouldDestroy(): boolean {
    return false
  }

  name() {
    return 'passthrough' as const
  }
}
