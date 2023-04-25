import { Modal } from '$components/Modal'
import Menu from './Menu.svelte'

export interface MenuProps {
  animateClose: boolean
}

export const createMenu = (props: MenuProps) => {
  return new Modal({
    content: (target) => new Menu({ target }),
    allowClose: true,
    animateClose: props.animateClose,
  })
}
