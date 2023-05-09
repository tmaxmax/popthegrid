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

export async function reset(game: Game): Promise<void> {
  let unsubscribe: () => void
  const shouldReset = await new Promise<boolean>((resolve, reject) => {
    unsubscribe = game.events.subscribe((event) => {
      if (event.name === 'error') {
        reject(event)

        return
      }

      if (event.to === 'ongoing') {
        if (event.name === 'transitionend') {
          resolve(true)
        }

        return
      }

      resolve(false)
    })
  })
  unsubscribe!()

  if (shouldReset) {
    await game.forceEnd(true)
    await game.prepare('short')
  }
}
