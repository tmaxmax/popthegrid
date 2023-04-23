import './Modal.css'

import { Animated } from './internal/Animated'

class ModalContent extends Animated<HTMLDivElement> {
  constructor(element: Animated) {
    super({ tag: 'div', alreadyExisting: false, classList: ['modal-content'], duration: { create: '1s', destroy: '0.3s' } })
    this.appendChild(element)
  }
}

class ModalCloseButton extends Animated<HTMLButtonElement> {
  constructor(onClose: () => void) {
    super({ tag: 'button', classList: ['modal-close-button'], duration: '0.1s' })

    this.addEventListener('click', onClose)
  }
}

export interface ModalProperties {
  content: Animated
  allowClose: boolean
  animateClose: boolean
  afterClose?(): unknown
}

export class Modal extends Animated<HTMLDivElement> {
  constructor({ content, allowClose, animateClose, afterClose }: ModalProperties) {
    super({ tag: 'div', classList: ['modal'], duration: { create: '2s', destroy: '0.3s' } })

    this.appendChild(new ModalContent(content))
    if (allowClose) {
      const hide = () => {
        this.destroy(animateClose).then(afterClose)
      }

      this.appendChild(new ModalCloseButton(hide))
    }
  }
}
