import baseLog from '$util/log.ts'
import { solveChallenge, type Challenge, type Payload } from '$util/altcha.ts'

export async function fetchSession(requiresChallenge: boolean) {
  const log = baseLog.extend('Session')

  let payload: string | null = null
  if (requiresChallenge) {
    log('Requesting challenge')

    const res = await fetch('/session', { method: 'GET', credentials: 'same-origin' })
    if (!res.ok) {
      throw new Error('failed to fetch challenge', { cause: await res.text() })
    }

    const data: Challenge = await res.json()

    log('Solving challenge', data)

    const solution = await solveChallenge(data)
    if (solution === null) {
      throw new Error('failed to get solution')
    }

    payload = JSON.stringify({
      algorithm: data.algorithm,
      challenge: data.challenge,
      number: solution.number,
      salt: data.salt,
      signature: data.signature,
      took: solution.took,
    } satisfies Payload)
  }

  log('Refreshing session')

  const res = await fetch('/session', {
    method: 'POST',
    body: payload,
    credentials: 'same-origin',
  })
  if (!res.ok) {
    throw new Error('failed to get session', { cause: await res.text() })
  }

  log('Success')
}
