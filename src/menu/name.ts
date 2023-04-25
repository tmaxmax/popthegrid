import { listenToNameChanges, getName, setName } from '$share/name'
import { writable } from 'svelte/store'
import type { Writable } from 'svelte/store'

export const createNameStore = (): Writable<string | undefined> => {
  const { subscribe, set, update } = writable<string | undefined>(undefined, (set) => {
    set(getName())
    return listenToNameChanges((v) => set(v.newValue))
  })

  return {
    subscribe,
    set(value) {
      setName(value)
      set(value)
    },
    update(up) {
      update((old) => {
        const newVal = up(old)
        setName(newVal)
        return newVal
      })
    },
  }
}

export const name = createNameStore()
