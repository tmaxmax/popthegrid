export function createFlag(key: string) {
  let value = $state(localStorage.getItem(key) === 'true')

  window.addEventListener('storage', (ev) => (value = ev.key === key && ev.newValue === 'true' ? true : value))

  return {
    mark: () => {
      localStorage.setItem(key, 'true')
      value = true
    },
    get: () => value,
  }
}
