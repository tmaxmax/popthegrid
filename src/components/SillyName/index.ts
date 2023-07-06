import './index.css'

import { Component } from '../internal/Component.ts'
import interval from '$util/time/interval.ts'
import { LocalStorage } from './storage.ts'
import type { EasterEggStorage } from './storage.ts'
import { type ThemeName, themes, defaultTheme, type Hex } from '$theme'

const toUpper = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const fetchSillyName = async () => {
  const { noun, adjective } = await import('./data.ts')
  return toUpper(noun()) + adjective()
}

const interpolate = (a: Hex, b: Hex) => {
  const ah = parseInt(a.replace(/#/g, ''), 16),
    ar = ah >> 16,
    ag = (ah >> 8) & 0xff,
    ab = ah & 0xff,
    bh = parseInt(b.replace(/#/g, ''), 16),
    br = bh >> 16,
    bg = (bh >> 8) & 0xff,
    bb = bh & 0xff

  return (amount: number) => {
    const rr = ar + amount * (br - ar),
      rg = ag + amount * (bg - ag),
      rb = ab + amount * (bb - ab)

    return '#' + (((1 << 24) + (rr << 16) + (rg << 8) + rb) | 0).toString(16).slice(1)
  }
}

const DISCOVER_COUNT = 5

export class SillyName extends Component {
  private readonly controller = new AbortController()
  private counter = 0
  private colorScheme: (index: number) => string

  constructor(props?: { storage?: EasterEggStorage; theme?: ThemeName }) {
    super({ tag: 'p', classList: ['silly-name', 'undiscovered'] })

    const storage = props?.storage || new LocalStorage()
    const { warning, assurance } = themes[props?.theme || defaultTheme].colors

    this.colorScheme = interpolate(warning, assurance)

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
        await this.waitForAnimation(undefined, { endOnly: true })
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
    this.controller.abort()
  }

  setTheme(name: ThemeName) {
    const { warning, assurance } = themes[name].colors
    this.colorScheme = interpolate(warning, assurance)
    this.setStyle('--color', `${this.colorScheme(this.counter / 5)}`)
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
    this.setStyle('--color', `${this.colorScheme(this.counter / 5)}`)

    return this.counter
  }
}
