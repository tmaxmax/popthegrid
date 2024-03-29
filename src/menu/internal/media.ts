import { readable } from 'svelte/store'

export const createMediaMatcher = (query: string) => {
  const media = window.matchMedia(query)
  const store = readable(media.matches, (set) => {
    const callback = (ev: MediaQueryListEvent) => set(ev.matches)
    media.addEventListener('change', callback)
    return () => media.removeEventListener('change', callback)
  })
  return store
}
