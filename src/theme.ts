type Entries<T> = {
  [K in keyof T]: [K, T[K]]
}[keyof T][]

function entries<T extends Record<string, unknown>>(o: T): Entries<T> {
  return Object.entries(o) as Entries<T>
}

export interface Theme {
  display: string
  description: string
  colors: {
    background: string
    heading: string
    body: string
    assurance: string
    warning: string
    danger: string
    squares: [string, string, string, string, string]
  }
}

export type ThemeName = keyof typeof themes

export const themes = {
  candy: {
    display: 'Candy',
    description: 'Each square is a tasty candy! The original Pop the grid theme.',
    colors: {
      background: '#000f1e',
      heading: '#f6f4f3',
      body: '#cecaca',
      assurance: '#0cce6b',
      warning: '#f4fd1f',
      danger: '#ef2d56',
      squares: ['#fdc5f5', '#f7aef8', '#b388eb', '#8093f1', '#72ddf7'],
    },
  },
  blood: {
    display: 'Blood',
    description: 'A literal blood bath.',
    colors: {
      background: '#080c0c',
      heading: '#f4f9e9',
      body: '#c8ceb9',
      assurance: '#20bf55',
      warning: '#ffbe0b',
      danger: '#bc1300',
      squares: ['#7d1128', '#f7a493', '#3c0919', '#bc1300', '#ffa061'],
    },
  },
  noir: {
    display: 'Noir',
    description: 'Inspired by the foggiest and haziest of the mornings. Try to play Gleich!',
    colors: {
      background: '#D5D5D8',
      heading: '#070A0B',
      body: '#3D3D3D',
      assurance: '#2D8B81',
      warning: '#FDE849',
      danger: '#EF233C',
      squares: ['#BABBBF', '#B2B3B7', '#ADB0B3', '#A8A9AD', '#A4A5A8'],
    },
  },
  cozy: {
    display: 'Cozy',
    description: 'Calm and content – take it easy! With a vintage touch.',
    colors: {
      background: '#A5DBF5',
      heading: '#06070E',
      body: '#2F3734',
      assurance: '#0C7C59',
      warning: '#FFB917',
      danger: '#E0002D',
      squares: ['#C4CEA1', '#D9E0A3', '#FDF2B0', '#F3D17C', '#CF9963'],
    },
  },
} satisfies Record<string, Theme>

export const defaultTheme = 'candy' satisfies ThemeName

const key = 'theme'

export const setTheme = (name: ThemeName, opts?: { global?: boolean }) => {
  const theme = themes[name]
  const set = (name: string, value: string) => document.documentElement.style.setProperty(`--color-${name}`, value)
  const props = entries(theme.colors).flatMap(([key, value]) => {
    switch (key) {
      case 'background':
        return [
          [key, value],
          [`${key}-transparent`, `${value}00`],
          [`${key}-opaque`, `${value}99`],
        ]
      case 'squares':
        return value.map((v, i) => [`square-${i + 1}`, v])
      default:
        return [[key, value]]
    }
  })
  props.forEach(([key, value]) => set(key, value))
  document.querySelector('meta[name="theme-color"]')!.setAttribute('content', theme.colors.background)
  if (opts?.global) {
    localStorage.setItem(key, name)
  }
}

export const isTheme = (name: string): name is ThemeName => name in themes

export const getTheme = (): ThemeName => {
  const currentTheme = localStorage.getItem(key)
  if (currentTheme && isTheme(currentTheme)) {
    return currentTheme
  }

  throw new Error('Theme is not set or is invalid')
}

export const listenToThemeChanges = (cb: (newTheme: ThemeName) => void) => {
  const wcb = (ev: StorageEvent) => {
    if (ev.storageArea !== localStorage || ev.key !== key) {
      return
    }

    if (!ev.newValue || !isTheme(ev.newValue)) {
      throw new Error('A null or invalid theme was set.')
    }

    cb(ev.newValue)
  }

  window.addEventListener('storage', wcb)

  return () => window.removeEventListener('storage', wcb)
}
