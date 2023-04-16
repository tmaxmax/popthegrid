export function isDefined<T>(arg: T | undefined): arg is T {
  return typeof arg !== 'undefined'
}

export function objectKeys<T extends Record<string, unknown>>(o: T): (keyof T)[] {
  return Object.keys(o) as (keyof T)[]
}

export function randInt(limit: number): number {
  return Math.floor(Math.random() * limit)
}

export type IfElse<Condition, T, F> = [Condition] extends [true] ? T : F
export type If<Condition, T> = IfElse<Condition, T, undefined>

export class UnreachableError extends Error {
  constructor(_x: never, message: string) {
    super(`TypeScript thought we could never end up here\n${message}`)
  }
}

export function wait(time: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, time))
}
