import './index.css'
import interpolate from 'color-interpolate'

import { Component } from '../internal/Component'
import interval from '$util/time/interval'
import { LocalStorage } from './storage'
import type { EasterEggStorage } from './storage'

interface Response {
  name: string
}

const FUNCTIONS_ROOT = import.meta.env.VITE_FUNCTIONS_ROOT

const fetchSillyName: () => Promise<string> = () =>
  fetch(`${FUNCTIONS_ROOT}/name`)
    .then((res) => res.json())
    .then((res: Response) => res.name)

const DISCOVER_COUNT = 5

const colorScheme = interpolate(['#f4fd1f', '#0cce6b'])

export class SillyName extends Component {
  private readonly controller = new AbortController()
  private counter = 0

  constructor(props?: { storage?: EasterEggStorage }) {
    super({ tag: 'p', classList: ['silly-name', 'undiscovered'] })

    const storage = props?.storage || new LocalStorage()

    if (storage.isDiscovered) {
      this.showURL()
    } else {
      this.setCounter(0)

      interval({
        callback: async () => (this.text = `Made by ${await fetchSillyName()}`),
        interval: 2000,
        leading: true,
        signal: this.controller.signal,
      }).done.catch((e) => {
        console.error(e)
        this.text = 'Made by Teodor Maxim'
      })

      let inClick = false

      const cb = async function (this: SillyName, ev: Event) {
        ev.stopImmediatePropagation()
        if (inClick) {
          return
        }

        inClick = true

        this.addClass('clicked')
        await this.waitForAnimation()
        this.removeClass('clicked')

        if (this.setCounter(this.counter + 1) !== DISCOVER_COUNT) {
          inClick = false
          return
        }

        storage.discover()
        this.removeEventListener('click', cb)
        this.controller.abort()
        this.showURL()
        inClick = false
      }.bind(this)

      this.addEventListener('click', cb)
    }
  }

  create(parent: Component): void {
    this.appendTo(parent)
  }

  destroy(): void {
    this.remove()
  }

  private showURL() {
    this.text = 'Made by '
    this.removeClass('undiscovered')

    const a = document.createElement('a')
    a.setAttribute('href', 'https://github.com/tmaxmax/popthegrid')
    a.append('tmaxmax')

    this.append(new Component({ element: a, alreadyExisting: true }))
  }

  private setCounter(value: number): number {
    this.counter = value
    this.setStyle('--color', `${colorScheme(this.counter / 5)}`)

    return this.counter
  }
}
