import { solveChallenge, type Challenge, type Payload } from '$util/altcha.ts'
import { wait } from '$util/index.ts'
import baseLog from '$util/log'
import type { Context } from './menu/context'

const log = baseLog.extend('Session')
const sessionStorageKey = 'session'
const sessionLock = 'session'

export function configureSession(uiStatus: Context['sessionStatus']) {
  let abort = new AbortController()

  const loop = async (signal: AbortSignal, initialWait?: number) => {
    try {
      if (initialWait) {
        await wait(initialWait, signal)
      }

      while (!signal.aborted) {
        log('refreshing')
        uiStatus.update(() => 'pending')
        const s = await fetchSession(signal)
        if (s.error) {
          throw s.error
        }
        uiStatus.update(() => 'valid')
        log('successfully refreshed')

        await wait(s.fetchNext, signal)
      }
    } catch (err) {
      log('error', { abort: signal.reason, err })
      // The loop stops completely on error. Since fetchSession retries
      // when called on an error this means that the user must explicitly
      // refresh the page to retry. The errors here shouldn't be the kind
      // to occur in production anyway, they are in most cases bugs.
      if (!signal.aborted) {
        console.error(err)
      }
    }

    uiStatus.update(() => (signal.aborted ? signal.reason : 'error'))
  }

  window.addEventListener('online', () => {
    log('back online')
    abort = new AbortController()
    loop(abort.signal)
  })

  window.addEventListener('offline', () => abort.abort('offline'))

  window.addEventListener('storage', (ev) => {
    if (ev.key !== sessionStorageKey) {
      return
    }

    // A new value should always exist. The entry is always overwritten, never removed.
    const s: SessionFetch = JSON.parse(ev.newValue!) as SessionFetch

    log('other tab refreshed session', s)

    if (s.error) {
      abort.abort('error')
      return
    }

    abort.abort('valid')
    abort = new AbortController()
    loop(abort.signal, s.fetchNext)
  })

  log('first start', { online: navigator.onLine })

  if (navigator.onLine) {
    loop(abort.signal)
  } else {
    uiStatus.update(() => 'offline')
  }
}

type SessionExpiry = {
  fetchNext: number
  fetchedAt: number
}

type SessionResponse = { challenge: true; data: Challenge } | { challenge?: false; data: SessionExpiry }

type SessionFetch = SessionExpiry & {
  error?: unknown
}

async function fetchSession(signal: AbortSignal): Promise<SessionFetch> {
  return await navigator.locks.request(sessionLock, { mode: 'exclusive' }, async () => {
    const previousFetch = localStorage.getItem(sessionStorageKey)
    if (previousFetch) {
      try {
        const prev: SessionFetch = JSON.parse(previousFetch)
        if (prev.error) {
          throw prev.error
        }

        const fetchNext = prev.fetchedAt + prev.fetchNext
        const now = Date.now()

        if (fetchNext > now) {
          return { fetchNext: fetchNext - now, fetchedAt: prev.fetchedAt }
        }
      } catch (err) {
        // Either invalid JSON for some reason or previous fetch had error.
        // Log and behave as if there was no entry.
        console.error(err)
      }
    }

    try {
      const { challenge, data }: SessionResponse = await fetchWithBackoff(
        new Request('/session', {
          method: 'POST',
          credentials: 'same-origin',
          signal,
        }),
      ).then((res) => res.json())

      if (!challenge) {
        localStorage.setItem(sessionStorageKey, JSON.stringify(data))

        return data
      }

      const solution = await solveChallenge(data, signal)
      if (!solution) {
        throw new Error("couldn't solve challenge")
      }

      delete (data as any).maxNumber

      const payload: Payload = { ...data, ...solution }
      const res: SessionResponse = await fetchWithBackoff(
        new Request('/session', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'X-Pow-Challenge': btoa(JSON.stringify(payload)),
          },
          signal,
        }),
      ).then((res) => res.json())

      if (res.challenge) {
        throw new Error('incorrectly solved challenge')
      }

      localStorage.setItem(sessionStorageKey, JSON.stringify(res.data))

      return res.data
    } catch (err) {
      const payload: SessionFetch = {
        fetchedAt: Date.now(),
        fetchNext: 0,
        error: err instanceof Error ? { message: err.message, cause: err.cause } : err,
      }

      // Keep previous localStorage entry if offline.
      // When going back online fetchSession will see
      // a stale localStorage entry and retry fetching.
      // If we would write the offline error then no tab
      // could retry when going back online.
      if (!signal.aborted) {
        localStorage.setItem(sessionStorageKey, JSON.stringify(payload))
      }

      return payload
    }
  })
}

async function fetchWithBackoff(req: Request) {
  let lastErr: unknown
  let res: Response | undefined

  for (const backoffTime of [0, 2000, 4000, 8000]) {
    if (backoffTime) {
      await wait(backoffTime, req.signal)
    }

    try {
      res = await fetch(req)
      if (res.ok) {
        return res
      }

      if (res.status < 500 && res.status !== 429) {
        break
      }
    } catch (err) {
      if (req.signal.aborted) {
        throw err
      }

      lastErr = err
    }
  }

  if (res) {
    const cause = await res.json()
    throw new Error(res.statusText, { cause })
  }

  throw lastErr
}
