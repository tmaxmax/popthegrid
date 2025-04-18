import baseLog from '$util/log.ts'
import { solveChallenge, type Challenge, type Payload } from '$util/altcha.ts'

type Response = { challenge: null } | Challenge

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

  const body: Response = await res.json()
  if (!body.challenge) {
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
}
