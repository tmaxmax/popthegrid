import { Component } from '../internal/Component'
import { SillyName } from './SillyName'
import mock from 'jest-fetch-mock'
import { wait } from '../util'

mock.enableMocks()

describe('SillyName', () => {
  beforeEach(() => {
    mock.resetMocks()
  })

  // Tests seem to affect each other. TODO: fix this
  // it('should output "Teodor Maxim" if there is a connection error', async () => {
  //   mock.mockRejectOnce()
  //   const component = new SillyName()

  //   component.create(Component.body)

  //   await wait(50)

  //   const dom = document.querySelector('.silly-name') as HTMLElement
  //   expect(dom.innerText).toBe('Teodor Maxim')
  // })

  it('should output the text received from the server', async () => {
    const message = { name: 'sarmale' } as const
    mock.mockResponseOnce(JSON.stringify(message))

    const controller = new AbortController()
    const component = new SillyName(controller.signal)

    component.create(Component.body)
    controller.abort()

    await wait(50)

    const dom = document.querySelector('.silly-name') as HTMLElement
    expect(dom).not.toBeNull()
    expect(dom.innerText).toBe(message.name)
  })
})
