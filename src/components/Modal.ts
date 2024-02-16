import './Modal.css'

import { Animated } from './internal/Animated.ts'

export interface SvelteMounter {
  (target: Element): () => void
}

class ModalContent extends Animated<HTMLDivElement> {
  private svelteUnmount?: () => void

  constructor(element: Animated | SvelteMounter) {
    super({ tag: 'div', alreadyExisting: false, classList: ['modal-content'], duration: { create: '1s', destroy: '0.3s' } })
    if (element instanceof Animated) {
      this.appendChild(element)
    } else {
      this.svelteUnmount = element(this.element)
    }
  }

  async destroy(animate: boolean) {
    await super.destroy(animate)
    this.svelteUnmount?.()
  }
}

class ModalCloseButton extends Animated<HTMLButtonElement> {
  constructor(onClose: () => void) {
    super({ tag: 'button', classList: ['modal-close-button'], duration: '0.1s' })

    this.addEventListener('click', onClose)
  }
}

export type ModalProperties = { content: Animated | SvelteMounter } & (
  | { allowClose: false }
  | {
      allowClose: true
      animateClose: boolean
      afterClose?(): unknown
    }
)

export class Modal extends Animated<HTMLDivElement> {
  constructor(props: ModalProperties) {
    super({ tag: 'div', classList: ['modal'], duration: { create: '2s', destroy: '0.3s' } })

    this.appendChild(new ModalContent(props.content))
    if (props.allowClose) {
      const hide = () => {
        this.destroy(props.animateClose).then(props.afterClose)
      }

      this.appendChild(new ModalCloseButton(hide))
    }
  }
}
