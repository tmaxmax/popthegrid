import WS from 'jest-websocket-mock'
import { Component } from '../internal/Component'
import { SillyName } from './SillyName'
import { wait } from '../util/'

beforeEach(() => {
  WS.clean()
})

describe('SillyName', () => {
  const [host, port] = ['ws://localhost', 1234]

  it('should output the text received from the server', async () => {
    const server = new WS(`ws://${host}:${port}`, { jsonProtocol: true })

    const component = new SillyName(`ws://${host}:${port}`)
    await server.connected

    component.create(Component.body)

    const message = { name: 'sarmale' } as const
    server.send(message)

    const dom = document.querySelector('.silly-name') as HTMLElement
    expect(dom).not.toBeNull()
    expect(dom.textContent).toBe(message.name)

    server.close()
  })

  it('should output "Teodor Maxim" if there is a connection error', () => {
    const component = new SillyName(`ws://${host}:1233`)

    component.create(Component.body)
    const dom = document.querySelector('.silly-name') as HTMLElement
    expect(dom.textContent).toBe('Teodor Maxim')
  })
})