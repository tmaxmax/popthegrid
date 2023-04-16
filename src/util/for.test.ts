import { test } from 'vitest'

test('[meta] Allow test utils file to exist')

export function fireClick(element: Node): void {
  const ev = document.createEvent('HTMLEvents')
  ev.initEvent('click', true, false)
  element.dispatchEvent(ev)
}

export function cleanupDOM() {
  document.body.innerHTML = ''
  document.head.innerHTML = ''
}
