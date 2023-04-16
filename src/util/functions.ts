/* eslint-disable @typescript-eslint/ban-types */

export function isBindable(f: Function): boolean {
  return Object.prototype.hasOwnProperty.call(f, 'prototype')
}
