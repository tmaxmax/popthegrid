import { Modal } from '$components/Modal'
import { Component } from '$components/internal/Component'
import type { Game } from '$game'
import Menu from './Menu.svelte'

export interface MenuProps {
  animate: boolean
  game: Game
}

export const openMenu = async ({ game, animate }: MenuProps) => {
  const modal = new Modal({
    content: (target) => new Menu({ target }),
    allowClose: true,
    animateClose: animate,
    afterClose() {
        game.resume()
    },
  })

    await game.pause()
  await modal.create(Component.body, animate)
}
