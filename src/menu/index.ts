import { name } from './internal/name'
import { getName } from '$share/name'

export const configureTitle = (element: Element) => {
  const originalText = element.textContent
  const set = (name: string | undefined) => {
    if (name) {
      element.textContent = `Welcome, ${name}!`
    } else {
      element.textContent = originalText
    }
  }

  set(getName())

  return name.subscribe(set)
}
