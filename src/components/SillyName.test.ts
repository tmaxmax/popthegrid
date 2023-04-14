import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Component } from '$components/internal/Component'
import { SillyName } from '$components/SillyName'
import { wait } from '$util'
import { cleanupDOM } from '$util/tests'
import 'vitest-fetch-mock'

describe('SillyName', () => {
  beforeEach(() => {
    fetchMock.doMock()
  })

  afterEach(() => {
    fetchMock.resetMocks()
    cleanupDOM()
  })

  // Tests seem to affect each other. TODO: fix this
  it('should output "Teodor Maxim" if there is a connection error', async () => {
    fetchMock.mockRejectOnce()
    const component = new SillyName()

    component.create(Component.body)

    await wait(50)

    const dom = document.querySelector('.silly-name') as HTMLElement
    expect(dom.textContent).toEqual('Teodor Maxim')
  })

  it('should output the text received from the server', async () => {
    const message = { name: 'sarmale' } as const
    fetchMock.mockResponseOnce(JSON.stringify(message))

    const controller = new AbortController()
    const component = new SillyName(controller.signal)

    component.create(Component.body)
    controller.abort()

    await wait(50)

    const dom = document.querySelector('.silly-name') as HTMLElement
    expect(dom).toBeDefined()
    expect(dom.textContent).toEqual(message.name)
  })
})
