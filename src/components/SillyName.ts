import './SillyName.css'

import { Component } from '../internal/Component'

interface Response {
  name: string
}

const fetchSillyName: () => Promise<string> = () =>
  fetch(`https://${window.location.host}/.netlify/functions/name`)
    .then((res) => res.json())
    .then((res: Response) => res.name)

export class SillyName extends Component<HTMLElement> {
  constructor() {
    super({ tag: 'em', classList: ['silly-name'] })

    const interval = setInterval(async () => {
      try {
        this.text = await fetchSillyName()
      } catch (e) {
        console.error(e)
        this.text = 'Teodor Maxim'
        clearInterval(interval)
      }
    }, 2000)
  }

  create<T extends HTMLElement>(parent: Component<T>): void {
    this.appendTo(parent)
  }

  destroy(): void {
    this.remove()
  }
}
