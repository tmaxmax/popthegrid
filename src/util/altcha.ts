// Code from https://github.com/altcha-org/altcha.
//
// MIT License
//
// Copyright (c) 2023 Daniel Regeci
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

const encoder = new TextEncoder()

function ab2hex(ab: ArrayBuffer): string {
  return [...new Uint8Array(ab)].map((x) => x.toString(16).padStart(2, '0')).join('')
}

async function hashChallenge(salt: string, num: number, algorithm: string): Promise<string> {
  if (typeof crypto === 'undefined' || !('subtle' in crypto) || !('digest' in crypto.subtle)) {
    throw new Error(
      'Web Crypto is not available. Secure context is required (https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts).'
    )
  }
  return ab2hex(await crypto.subtle.digest(algorithm.toUpperCase(), encoder.encode(salt + num)))
}

export interface Challenge {
  algorithm: string
  challenge: string
  maxNumber: number
  salt: string
  signature: string
}

export interface Solution {
  number: number
  took: number
  worker?: boolean
}

export interface Payload {
  algorithm: string
  challenge: string
  number: number
  salt: string
  signature: string
  took: number
}

export function solveChallenge({ challenge, salt, algorithm, maxNumber: max }: Challenge, signal?: AbortSignal): Promise<Solution | null> {
  const startTime = Date.now()
  const fn = async () => {
    for (let n = 0; n <= max; n += 1) {
      if (signal?.aborted) {
        return null
      }
      const t = await hashChallenge(salt, n, algorithm)
      if (t === challenge) {
        return {
          number: n,
          took: Date.now() - startTime,
        }
      }
    }
    return null
  }
  return fn()
}
