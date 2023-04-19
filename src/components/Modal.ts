import './Modal.css'

import { Component } from './internal/Component'

class ModalContent extends Component<HTMLElement> {
  constructor(element: HTMLElement) {
    super({ element, alreadyExisting: true })
    this.addClass('modal-content')
  }

  async create(parent: Component, animate: boolean): Promise<void> {
    this.appendTo(parent)

    if (animate) {
      this.removeClass('hidden')
      this.addClass('visible')
      await this.waitForAnimation()
    }
  }

  async destroy(animate: boolean): Promise<void> {
    if (animate) {
      this.removeClass('visible')
      this.addClass('hidden')
      await this.waitForAnimation()
    }

    this.remove()
  }
}

class ModalCloseButton extends Component<HTMLButtonElement> {
  constructor(onClose: () => void) {
    super({ tag: 'button', classList: ['modal-close-button'] })

    this.addEventListener('click', onClose)
  }

  async create(parent: Component, animate: boolean): Promise<void> {
    this.appendTo(parent)

    if (animate) {
      this.removeClass('hidden')
      this.addClass('visible')
      await this.waitForAnimation()
    }
  }

  async destroy(animate: boolean): Promise<void> {
    if (animate) {
      this.removeClass('visible')
      this.addClass('hidden')
      await this.waitForAnimation()
    }

    this.remove()
  }
}

export interface ModalProperties {
  content: HTMLElement
  allowClose: boolean
  animateClose: boolean
}

export class Modal extends Component<HTMLDivElement> {
  private readonly content: ModalContent
  private readonly closeButton: ModalCloseButton | undefined

  constructor({ content, allowClose, animateClose }: ModalProperties) {
    super({ tag: 'div', classList: ['modal'] })

    this.content = new ModalContent(content)
    if (allowClose) {
      const hide = function (this: Modal) {
        this.destroy(animateClose)
      }

      this.closeButton = new ModalCloseButton(hide.bind(this))
    }
  }

  async create(parent: Component, animate: boolean): Promise<void> {
    const promiseList: Promise<void>[] = []
    if (this.closeButton) {
      const closeButtonPromise = this.closeButton.create(this, animate)
      promiseList.push(closeButtonPromise)
    }

    this.appendTo(parent)

    if (animate) {
      this.removeClass('hidden')
      this.addClass('visible')
      promiseList.push(this.waitForAnimation())
    }

    promiseList.push(this.content.create(this, animate))

    await Promise.all(promiseList)
  }

  async destroy(animate: boolean) {
    const promiseList: Promise<void>[] = []
    if (this.closeButton) {
      const closeButtonPromise = this.closeButton.destroy(animate)
      promiseList.push(closeButtonPromise)
    }

    if (animate) {
      this.removeClass('visible')
      this.addClass('hidden')
      promiseList.push(this.waitForAnimation())
    }

    promiseList.push(this.content.destroy(animate))

    await Promise.all(promiseList)

    this.remove()
  }
}
