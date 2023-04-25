export function hasOwnProperty(obj: object, propKey: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, propKey)
}

export function keys<T extends Record<string, unknown>>(o: T): (keyof T)[] {
  return Object.keys(o) as (keyof T)[]
}

type Entries<T> = {
  [K in keyof T]: [K, T[K]]
}[keyof T][]

export function entries<T extends Record<string, unknown>>(o: T): Entries<T> {
  return Object.entries(o) as Entries<T>
}
