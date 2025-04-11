import { test } from 'vitest'

test('[meta] Allow test utils file to exist')

export function fireClick(element: Node): void {
  const ev = new Event('click', { bubbles: true, cancelable: false })
  element.dispatchEvent(ev)
}

export function cleanupDOM() {
  document.body.innerHTML = ''
  document.head.innerHTML = ''
}
