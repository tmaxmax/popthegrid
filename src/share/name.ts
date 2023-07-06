import { isDefined, isNonNull } from '$util/index.ts'

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
    if (isNonNull(ev.newValue)) {
      params.newValue = ev.newValue
    }
    if (isNonNull(ev.oldValue)) {
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
