import baseLog from '$util/log.ts'
import { solveChallenge, type Challenge, type Payload } from '$util/altcha.ts'
import type { RandConfig } from './rand.ts'
import rand from '$rand'

type Response = { challenge: null; rand?: RandConfig } | Challenge

export async function fetchSession() {
  const log = baseLog.extend('Session')

  log('Refreshing session')

  let res = await fetch('/session', {
    method: 'POST',
    credentials: 'same-origin',
  })
  if (!res.ok) {
    throw new Error('failed to get session', { cause: await res.text() })
  }

  let body: Response = await res.json()
  if (body.challenge == null) {
    if (body.rand) {
      log('Setting random', body.rand)
      rand.set(body.rand)
    }

    return
  }

  log('Solving challenge')

  const solution = await solveChallenge(body)
  if (solution === null) {
    throw new Error('failed to get solution')
  }

  const payload: Payload = {
    algorithm: body.algorithm,
    challenge: body.challenge,
    number: solution.number,
    salt: body.salt,
    signature: body.signature,
    took: solution.took,
  }

  log('Refreshing session')

  res = await fetch('/session', {
    method: 'POST',
    headers: {
      'X-Pow-Challenge': btoa(JSON.stringify(payload)),
    },
    credentials: 'same-origin',
  })
  if (!res.ok) {
    throw new Error('failed to refresh session', { cause: await res.text() })
  }

  body = await res.json()
  if ('rand' in body && body.rand) {
    log('Setting random', body.rand)
    rand.set(body.rand)
  }
}
