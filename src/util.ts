import debug from 'debug'

export const generateArray = <T>(length: number, generatorFunc: (elem: T, index: number, array: T[]) => T): T[] =>
  new Array(length).fill(null).map(generatorFunc)

export const randInt = (limit: number): number => Math.floor(Math.random() * limit)

export const isDefined = <T>(arg: T | undefined): arg is T => typeof arg !== 'undefined'

export class UnreachableError extends Error {
  constructor(_x: never, message: string) {
    super(`TypeScript thought we could never end up here\n${message}`)
  }
}

export const fireClick = (element: Node): void => {
  const ev = document.createEvent('HTMLEvents')
  ev.initEvent('click', true, false)
  element.dispatchEvent(ev)
}

export const wait = (time: number): Promise<void> => new Promise<void>((resolve) => setTimeout(resolve, time))

export const keys = <T extends Record<string, unknown>>(o: T): (keyof T)[] => Object.keys(o) as (keyof T)[]

export const baseLog = debug('popthegrid')

if (process.env.DEBUG) {
  debug.enable(process.env.DEBUG)
} else {
  debug.disable()
}
baseLog(`Environment: ${process.env.NODE_ENV}\nDebug namespaces: ${process.env.DEBUG}`)
