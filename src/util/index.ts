export function isDefined<T>(arg: T | undefined): arg is T {
  return typeof arg !== 'undefined'
}

export function isNonNull<T>(arg: T | null | undefined): arg is T {
  return arg != null
}

export function randInt(limit: number): number {
  return Math.floor(Math.random() * limit)
}

export type IfElse<Condition, T, F> = [Condition] extends [true] ? T : F
export type If<Condition, T> = IfElse<Condition, T, undefined>
export type KeyOfUnion<T> = T extends T ? keyof T : never

export class UnreachableError extends Error {
  constructor(_x: never, message: string) {
    super(`TypeScript thought we could never end up here\n${message}`)
  }
}

export function wait(time: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, time))
}
