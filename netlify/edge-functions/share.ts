import type { Context } from 'https://edge.netlify.com'
import { createOrChange, getContentType, parseHTML, toUpper, toResponseBody, formatDuration } from '../edge/utils.ts'

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
    { query: '#objective', text: `Objective: ${description}` },
    { query: 'meta[name="description"], meta[property="og:description"]', assert: 2, attrs: { content: toUpper(description) } },
    { query: 'meta[property="og:url"]', attrs: { content: `${baseURL}/${code}` } },
    { tag: 'script', html: `sessionStorage.setItem('record-data', '${JSON.stringify(record)}')` },
    ...[
      { property: 'og:image', content: `/og/${record.gamemode}.jpg` },
      { property: 'og:image:type', content: 'image/jpeg' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '627' },
      { property: 'og:image:alt', content: `Pop the grid: ${metaAlts[record.gamemode]}` },
      { name: 'robots', content: 'noindex' },
    ].map((attrs) => ({ tag: 'meta', attrs }))
  )

  return new Response(toResponseBody(html), response)
}

type Code = string & { __brand: 'code' }

const getCodeFromPath = (path: string): Code | undefined => {
  const [first, code, ...rest] = path.split('/')
  if (first !== '' || !isCode(code) || rest.length > 0) {
    return
  }

  return code
}

const isCode = (s: string): s is Code => /^[A-Za-z0-9]{6}$/.test(s)

const mockCodes: Record<Code, { gamemode: string; name?: string; [key: string]: unknown }> = {
  ['r4nd0m' as Code]: {
    gamemode: 'random',
    numWins: 5,
  },
  ['t1m3rM' as Code]: {
    gamemode: 'random-timer',
    name: 'Michael',
    fastestWinDuration: 5450,
  },
}

const getDescription = ({ name, gamemode, ...data }: (typeof mockCodes)[Code]) => {
  switch (gamemode) {
    case 'random':
      return `be more lucky than your friend${name ? ` ${name}` : ``}! They were lucky ${data.numWins} times.`
    case 'random-timer':
      return `beat your friend${name ? ` ${name}` : ``} on time! He won in ${formatDuration(data.fastestWinDuration as number)}.`
    default:
      throw new Error(`Unknown gamemode ${gamemode}`)
  }
}

const metaAlts: Record<string, string> = {
  random: 'be more lucky than me.',
  'random-timer': 'beat me on time.',
}
