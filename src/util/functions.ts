/* eslint-disable @typescript-eslint/ban-types */

import { hasOwnProperty } from './objects.ts'

export function isBindable(f: Function): boolean {
  // Bound or unboundable functions have no prototype.
  return hasOwnProperty(f, 'prototype')
}
