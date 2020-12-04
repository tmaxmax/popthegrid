import WS from 'jest-websocket-mock'
import { Component } from '../internal/Component'
import { SillyName } from './SillyName'

test('SillyName', async () => {
  const connectionString = 'ws://localhost:1234'
  const server = new WS(connectionString, { jsonProtocol: true })
  const component = new SillyName(connectionString)
  await server.connected
  component.create(Component.body)
  const element = document.querySelector<HTMLElement>('em.silly-name') as HTMLElement
  expect(element).not.toBeNull()
  const message = { name: 'sarmale' }
  server.send(message)
  expect(element.innerText).toBe(message.name)
  server.close()
  WS.clean()
})