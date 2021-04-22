import './SillyName.css'

import { Component } from '../internal/Component'

interface Response {
  name: string
}

export class SillyName extends Component<HTMLElement, false> {
  private readonly websocket?: WebSocket

  constructor(websocketURL: string) {
    super({ tag: 'em', classList: ['silly-name'] })
    const onerror = () => {
      this.text = 'Teodor Maxim'
    }
    try {
      this.websocket = new WebSocket(websocketURL)
      this.websocket.onmessage = (ev) => {
        const res: Response = JSON.parse(ev.data)
        this.text = res.name
      }
      this.websocket.onerror = this.websocket.onclose = onerror
    } catch (e) {
      console.error(e)
      onerror()
    }
  }

  create<T extends HTMLElement>(parent: Component<T>): void {
    this.appendTo(parent)
  }

  destroy(): void {
    this.websocket?.close()
    this.remove()
  }
}
