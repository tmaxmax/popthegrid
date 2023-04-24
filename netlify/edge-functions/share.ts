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
    { query: '.greeting > p', text: `Objective: ${description}` },
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

const getCodeFromPath = (path: string): string | undefined => {
  const [first, code, ...rest] = path.split('/')
  if (first !== '' || rest.length > 0) {
    return undefined
  }

  return code
}

const mockCodes: Record<string, { gamemode: string; name?: string; [key: string]: unknown }> = {
  r4nd0mJh: {
    gamemode: 'random',
    numWins: 5,
  },
  t1m3rMch: {
    gamemode: 'random-timer',
    name: 'Michael',
    fastestWinDuration: 5450,
  },
}

const getDescription = ({ name, gamemode, ...data }: (typeof mockCodes)[string]) => {
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
