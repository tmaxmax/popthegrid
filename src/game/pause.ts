import type { Game } from '$game'
import { get } from 'svelte/store'

export function pause(game: Game): string | undefined {
  if (get(game.events).name !== 'transitionstart') {
    return game.pause()
  }

  return
}

export function resume(game: Game, token: string | undefined) {
  if (!token) {
    return
  }

  if (get(game.events).name !== 'transitionstart') {
    game.resume(token)
  }
}
