import { findCachedLink, type CodeInfo, cacheLink } from '$db/link.ts'

import { entries } from '$util/objects.ts'
import type { Code } from '$share/code.ts'
import type { ThemeName } from '$theme'
import type { Statistics, Counts } from '$game/statistics.ts'
import type { GamemodeName } from '$game/gamemode/index.ts'
import { UnreachableError } from '$util/index.ts'

const display: Record<Exclude<keyof Statistics, 'when'>, string> = {
  fastestWinDuration: 'fastest win',
  gamemode: 'gamemode',
  numAttempts: 'attempt',
  numWins: 'win',
  numLosses: 'loss',
}

const shareable: Record<GamemodeName | 'total', Array<keyof Statistics>> = {
  random: ['numWins'],
  'random-timer': ['fastestWinDuration'],
  'same-square': ['fastestWinDuration'],
  total: ['numWins', 'numAttempts'],
  passthrough: ['fastestWinDuration'],
}

function makePlural(s: string, count: number): string {
  if (count === 1) {
    return s
  }

  if (s.endsWith('s')) {
    return s + 'es'
  }

  return s + 's'
}

interface Response {
  code: Code
}

interface ResponseErrorData {
  title: string
  status: number
  type?: string
  detail?: string
  instance?: string
  reason: string
}

class ResponseError extends Error {
  constructor({ status, title, detail, reason }: ResponseErrorData) {
    super(`${status} ${title}${detail ? ': ' + detail : ''}`, { cause: new Error(reason) })
  }
}

export interface ShareContentParams {
  /** Keep in sync with Go's share.Record */
  record: {
    gamemode?: GamemodeName
    theme: ThemeName
    name?: string
    data: Record<string, unknown>
    when: Date
  }
  location: Location
}

export function isShareable(s: Counts | Statistics, key: keyof Statistics) {
  if ('gamemode' in s) {
    return shareable[s.gamemode].includes(key)
  }
  return shareable['total'].includes(key)
}

/** Mimics share.Record from Go code. Keep in sync. */
export async function getShareContent(
  db: IDBDatabase,
  { record, location: { protocol, host } }: ShareContentParams,
  validSession: boolean
): Promise<ShareData> {
  if (!recordCanBeCodeInfo(record)) {
    const [[key, value]] = entries(record.data)

    return {
      title: 'Pop the grid!',
      text: `I have ${value} ${makePlural(display[key as keyof typeof display], value as number)} by now, can you beat me?`,
      url: `${protocol}//${host}`,
    }
  }

  let code = await findCachedLink(db, record)

  if (!code) {
    if (!validSession) {
      throw new ResponseError({ status: 401, title: 'Unauthorized', reason: 'You are offline or something went wrong in the background.' })
    }

    const res = await fetch(`/share`, {
      method: 'POST',
      credentials: 'same-origin',
      body: JSON.stringify(record),
    })

    if (res.status !== 200) {
      const data: ResponseErrorData = await res.json()
      throw new ResponseError(data)
    }

    const { code: newCode }: Response = await res.json()
    code = newCode
    await cacheLink(db, { ...record, code })
  }

  let text: string
  switch (record.gamemode!) {
    case 'random':
      text = 'Can you win more than me at Pop the grid?'
      break
    case 'random-timer':
      text = 'Can you Pop the grid quicker than me?'
      break
    case 'same-square':
      text = 'Destroy the same squares! Can you do it quicker?'
      break
    case 'passthrough':
      text = 'Do you have the fastest fingers in the world? Or at least faster than mine?'
      break
    default:
      throw new UnreachableError(record.gamemode, 'unimplemented gamemode')
  }

  return {
    title: 'Pop the grid!',
    url: `${protocol}//${host}/${code}`,
    text,
  }
}

function recordCanBeCodeInfo(r: Omit<ShareContentParams['record'], 'data'>): r is CodeInfo {
  return 'gamemode' in r && !!r.gamemode
}
