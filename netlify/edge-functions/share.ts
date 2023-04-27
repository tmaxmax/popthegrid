import type { Context } from 'https://edge.netlify.com'
import { createOrChange, getContentType, parseHTML, makePossessive, toResponseBody, formatDuration } from '../edge/utils.ts'
import { Code, GameRecord, GamemodeName, getCodeFromPath, storageKey } from '../edge/share.ts'

export default async (request: Request, context: Context) => {
  const url = new URL(request.url)
  const baseURL = `${url.protocol}//${url.host}`

  const code = getCodeFromPath(url.pathname)
  if (!code || !(code in mockCodes)) {
    return
  }

  const response = await context.next(new Request(baseURL))
  const contentType = getContentType(response.headers)
  if (contentType.type !== 'text/html') {
    return response
  }

  const text = await response.text()
  const html = await parseHTML(text, contentType)
  if (!html) {
    return new Response(text, response)
  }

  const record = mockCodes[code]
  const description = getDescription(record)

  createOrChange(
    html.head,
    { query: '#objective', text: description },
    { query: 'meta[name="description"], meta[property="og:description"]', assert: 2, attrs: { content: description } },
    { query: 'meta[property="og:url"]', attrs: { content: `${baseURL}/${code}` } },
    { tag: 'script', html: `sessionStorage.setItem('${storageKey}', '${JSON.stringify(record)}')` },
    ...[
      { property: 'og:image', content: `/og/${record.gamemode}-${record.theme}.jpg` },
      { property: 'og:image:type', content: 'image/jpeg' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '627' },
      { property: 'og:image:alt', content: `Pop the grid: ${metaAlts[record.gamemode]}` },
      { name: 'robots', content: 'noindex' },
    ].map((attrs) => ({ tag: 'meta', attrs }))
  )

  return new Response(toResponseBody(html), response)
}

const mockCodes: Record<Code, GameRecord> = {
  ['r4nd0m' as Code]: {
    gamemode: 'random',
    numWins: 5,
    theme: 'candy',
  },
  ['t1m3rM' as Code]: {
    gamemode: 'random-timer',
    name: 'Michael',
    fastestWinDuration: 5450,
    theme: 'blood',
  },
  ['s4m3sQ' as Code]: {
    gamemode: 'same-square',
    name: 'Hans',
    fastestWinDuration: 6000,
    theme: 'blood',
  },
}

const getDescription = (r: GameRecord) => {
  const name = r.name || 'your friend'
  const root = `You're in ${makePossessive(name)} world:`

  switch (r.gamemode) {
    case 'random':
      return `${root} be luckier! They won ${r.numWins} times.`
    case 'random-timer':
      return `${root} be quicker! They won in ${formatDuration(r.fastestWinDuration)}.`
    case 'same-square':
      return `${root} zerstöre schneller die gleiche Karos! They did it in ${formatDuration(r.fastestWinDuration)}.`
    default:
      throw new Error(`Unknown gamemode ${(r as GameRecord).gamemode}`)
  }
}

const metaAlts: Record<GamemodeName, string> = {
  random: 'be more lucky than me.',
  'random-timer': 'beat me on time.',
  'same-square': 'destroy faster the same squares.',
}
