import { isDefined } from '$util/index'

const key = 'name'

export interface NameListenerParams {
  newValue?: string
  oldValue?: string
}

export const listenToNameChanges = (cb: (params: NameListenerParams) => void) => {
  const wcb = (ev: StorageEvent) => {
    if (ev.storageArea !== localStorage || ev.key !== key) {
      return
    }

    const params: NameListenerParams = {}
    if (ev.newValue) {
      params.newValue = ev.newValue
    }
    if (ev.oldValue) {
      params.oldValue = ev.oldValue
    }

    cb(params)
  }

  window.addEventListener('storage', wcb)

  return () => window.removeEventListener('storage', wcb)
}

export const setName = (value: string | undefined) => {
  if (isDefined(value)) {
    localStorage.setItem(key, value)
  } else {
    localStorage.removeItem(key)
  }
}

export const getName = () => {
  return localStorage.getItem(key) ?? undefined
}

export const configureTitle = (element: Element) => {
  const originalText = element.textContent
  const set = (name: string | undefined) => {
    if (name) {
      element.textContent = `Welcome, ${name}!`
    } else {
      element.textContent = originalText
    }
  }

  const name = getName()
  set(name)

  return listenToNameChanges((v) => set(v.newValue))
}
