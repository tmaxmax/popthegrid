import baseLog from '$util/log.ts'
import { solveChallenge, type Challenge, type Payload } from '$util/altcha.ts'
import type { RandConfig } from './rand.ts'
import rand from '$rand'

type Response = { challenge: null; rand?: RandConfig } | Challenge
type GivenRand = { randSignature: string; randState: RandConfig }

const randSessionKey = 'rand'
const randSignatureSessionKey = 'randSignature'
const randOffsetLocalKey = 'randOffset'

export function initRand(): GivenRand | undefined {
  const state: RandConfig = JSON.parse(sessionStorage.getItem(randSessionKey)!)
  const signature = sessionStorage.getItem(randSignatureSessionKey)
  // signature is provided => new session => new random function => offset must be reset
  const off = parseInt((signature && localStorage.getItem(randOffsetLocalKey)) || '') || 0

  rand.set({ ...state, off })

  localStorage.setItem(randOffsetLocalKey, off.toString())

  document.addEventListener('visibilitychange', (ev) => {
    if (ev.isTrusted && document.visibilityState === 'hidden') {
      localStorage.setItem(randOffsetLocalKey, rand.state().off.toString())
    }
  })

  if (signature) {
    return { randSignature: signature, randState: state }
  }
}

function setRand(state: RandConfig) {
  const curr = rand.state()
  if (curr.mask === state.mask && curr.key[0] === state.key[0] && curr.key[1] === state.key[1]) {
    // Random function will be the same if the session ID expired
    // but the browsing session was not closed AND a random function was provided on open.
    return
  }

  localStorage.setItem(randOffsetLocalKey, '0')
  rand.set({ ...state, off: 0 })
}

export async function fetchSession(given?: GivenRand) {
  const log = baseLog.extend('Session')

  log('Refreshing session')

  const jsonGiven = given && JSON.stringify(given)

  let res = await fetch('/session', {
    method: 'POST',
    credentials: 'same-origin',
    body: jsonGiven,
  })
  if (!res.ok) {
    throw new Error('failed to get session', { cause: await res.text() })
  }

  let body: Response = await res.json()
  if (body.challenge == null) {
    if (body.rand) {
      log('Setting random', body.rand)
      setRand(body.rand)
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
    body: jsonGiven,
  })
  if (!res.ok) {
    throw new Error('failed to refresh session', { cause: await res.text() })
  }

  body = await res.json()
  if ('rand' in body && body.rand) {
    log('Setting random', body.rand)
    setRand(body.rand)
  }
}
