import './SillyName.css'

import { Component } from './internal/Component'
import interval from '$util/interval'

interface Response {
  name: string
}

const FUNCTIONS_ROOT = import.meta.env.VITE_FUNCTIONS_ROOT

const fetchSillyName: () => Promise<string> = () =>
  fetch(`${FUNCTIONS_ROOT}/name`)
    .then((res) => res.json())
    .then((res: Response) => res.name)

export class SillyName extends Component<HTMLElement> {
  constructor(signal?: AbortSignal) {
    super({ tag: 'em', classList: ['silly-name'] })

    this.text = '...'

    interval({
      callback: async () => (this.text = await fetchSillyName()),
      interval: 2000,
      leading: true,
      signal,
    }).catch((e) => {
      console.error(e)
      this.text = 'Teodor Maxim'
    })
  }

  create<T extends HTMLElement>(parent: Component<T>): void {
    this.appendTo(parent)
  }

  destroy(): void {
    this.remove()
  }
}
