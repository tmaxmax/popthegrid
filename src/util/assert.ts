import { isDefined, isNonNull } from '.'

export function assert(p: boolean, message?: string): asserts p is true {
  if (!p) {
    throw new Error(message || 'The given predicate is false')
  }
}

export function assertDefined<T>(arg: T | undefined, message?: string): asserts arg is T {
  assert(isDefined(arg), message || 'The given argument is undefined')
}

export function assertNonNull<T>(arg: T | null | undefined, message?: string): asserts arg is T {
  assert(isNonNull(arg), message || 'The given argument is null or undefined')
}
