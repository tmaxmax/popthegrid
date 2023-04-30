import { Gamemode } from '.'

export class Passthrough extends Gamemode {
  shouldDestroy(): boolean {
    return false
  }

  name() {
    return 'passthrough' as const
  }
}
