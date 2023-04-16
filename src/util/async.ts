import isDefined from './isDefined'

type Callback<T, U> = (elem: T, i: number, arr: readonly T[]) => Promise<U>
type Reducer<T, U> = (acc: U, elem: T, i: number, arr: readonly T[]) => Promise<U>

export default class Async {
  static map<T, U>(arr: readonly T[], fn: Callback<T, U>): Promise<U[]> {
    return Promise.all(arr.map(fn))
  }

  static filter<T>(arr: readonly T[], fn: Callback<T, boolean>): Promise<T[]> {
    return Async.map(arr, fn).then((conds) => arr.filter((_, i) => conds[i]))
  }

  static reduce<T extends never>(arr: readonly [], fn: Reducer<T, T>, init?: never): Promise<null>
  static reduce<T>(arr: readonly T[], fn: Reducer<T, T>): Promise<T | null>
  static reduce<T, U>(arr: readonly T[], fn: Reducer<T, U>, init: U): Promise<U>
  // eslint-disable-next-line
  static async reduce<T, U>(arr: readonly T[], fn: Reducer<T, U>, init?: any): Promise<U | null> {
    const existsInit = isDefined(init)
    if (arr.length === 0) {
      if (existsInit) {
        return init
      }
      return null
    }
    let i = 0
    if (existsInit) {
      init = arr[i]
      i++
    }
    for (; i < arr.length; i++) {
      init = await fn(init, arr[i], i, arr)
    }
    return init
  }
}
