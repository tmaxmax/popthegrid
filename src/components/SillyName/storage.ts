export interface EasterEggStorage {
  isDiscovered: boolean
  discover(): void
}

const KEY = 'easter-egg-discovered'

export class LocalStorage implements EasterEggStorage {
  get isDiscovered(): boolean {
    return window.localStorage.getItem(KEY) == 'true'
  }

  discover() {
    window.localStorage.setItem(KEY, 'true')
  }
}
