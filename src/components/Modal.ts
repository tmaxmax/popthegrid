import './Modal.css'

import { Animated } from './internal/Animated'

class ModalContent extends Animated<HTMLElement> {
  constructor(element: HTMLElement) {
    super({ element, alreadyExisting: true, duration: { create: '1s', destroy: '0.3s' } })
    this.addClass('modal-content')
  }
}

class ModalCloseButton extends Animated<HTMLButtonElement> {
  constructor(onClose: () => void) {
    super({ tag: 'button', classList: ['modal-close-button'], duration: '0.1s' })

    this.addEventListener('click', onClose)
  }
}

export interface ModalProperties {
  content: HTMLElement
  allowClose: boolean
  animateClose: boolean
}

export class Modal extends Animated<HTMLDivElement> {
  constructor({ content, allowClose, animateClose }: ModalProperties) {
    super({ tag: 'div', classList: ['modal'], duration: { create: '2s', destroy: '0.3s' } })

    this.appendChild(new ModalContent(content))
    if (allowClose) {
      const hide = function (this: Modal) {
        this.destroy(animateClose)
      }

      this.appendChild(new ModalCloseButton(hide.bind(this)))
    }
  }
}
