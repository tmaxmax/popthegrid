import './Redirect.css'

import { Animated } from './internal/Animated'

export interface RedirectParams {
  href: string
  title: string
  content: Animated
  animateDestroy?: boolean
  on(): void | Promise<void>
}

export class Redirect extends Animated {
  constructor({ href, title, on, content, animateDestroy }: RedirectParams) {
    super({ tag: 'a', alreadyExisting: false, classList: ['redirect'] })

    this.appendChild(content)
    this.setAttribute('title', title)
    this.setAttribute('href', href)
    this.addEventListener('click', async (ev) => {
      ev.preventDefault()
      ev.stopImmediatePropagation()

      await on()
      await this.destroy(animateDestroy || false)
      window.location.href = href
    })
  }
}
