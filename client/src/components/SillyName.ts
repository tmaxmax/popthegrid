import { Component } from '../internal/Component'

interface Response {
  name: string
}

export class SillyName extends Component<HTMLElement> {
  private readonly websocket: WebSocket

  constructor(websocketURL: string) {
    super({ tag: 'em', classList: ['sillyname'] })
    this.websocket = new WebSocket(websocketURL)
    this.websocket.addEventListener('message', (ev) => {
      const res: Response = JSON.parse(ev.data)
      this.text = res.name
    })
  }

  create<T extends HTMLElement>(parent: Component<T>): void {
    this.appendTo(parent)
  }

  destroy(): void {
    this.websocket.close()
    this.remove()
  }
}
