import type { Context, Config } from 'https://edge.netlify.com'
import { createOrChange, getContentType, parseHTML, makePossessive, toResponseBody, formatDuration, makePlural } from '../edge/utils.ts'
import { Code, GameRecord, GamemodeName, getCodeFromPath, storageKey } from '../edge/share.ts'
import { logRequest } from '../edge/log.ts'

export default async (request: Request, context: Context) => {
  const url = new URL(request.url)
  const baseURL = `${url.protocol}//${url.host}`

  console.info(`Request ${context.requestId}: ${url.pathname}`)

  const code = getCodeFromPath(url.pathname)
  if (!code) {
    return
  }

  logRequest(request, context)

  const [server, homepage] = await Promise.all([
    context.next(new Request(`${baseURL}/.netlify/functions/share?code=${code}`)),
    context.next(new Request(baseURL)),
  ])
  if (server.status !== 200) {
    console.warn(`Request ${context.requestId}: fetch code ${code}: ${server.status} ${server.statusText}`)
    console.warn(`Request ${context.requestId}: ${await server.text()}`)

    return createErrorResponse(code, homepage.body, homepage.headers, server.status, context)
  }

  const contentType = getContentType(homepage.headers)
  if (contentType.type !== 'text/html') {
    console.warn(`Request ${context.requestId}: unexpected content type ${contentType.type}`)

    return createErrorResponse(code, homepage.body, homepage.headers, 500, context)
  }

  const text = await homepage.text()
  const html = await parseHTML(text, contentType)
  if (!html) {
    return createErrorResponse(code, text, homepage.headers, 500, context)
  }

  context.cookies.delete({ name: 'status', path: `/${code}` })

  const record: GameRecord = await server.json()
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

  console.info(`Request ${context.requestId}: found code ${code}`)

  const headers = new Headers(homepage.headers)
  headers.set('Cache-Control', 'public, s-maxage=2592000, maxage=2592000')

  return new Response(toResponseBody(html), { status: 200, headers })
}

const devExcludes: `/${string}`[] = Deno.env.get('DEV') === 'true' ? ['/src/*', '/node_modules/*', '/@vite*', '/netlify/*', '/*.js'] : []

export const config: Config = {
  cache: 'manual',
  excludedPath: [
    '/.netlify/functions/*',
    '/assets/*',
    '/icons/*',
    '/og/*',
    '/browserconfig.xml',
    '/manifest.json',
    '/favicon.ico',
    '/',
    ...devExcludes,
  ],
  path: '/*',
}

const getDescription = (r: GameRecord) => {
  const name = r.name || 'your friend'
  const root = `You're in ${makePossessive(name)} world:`

  switch (r.gamemode) {
    case 'random':
      return `${root} can you win more? They won ${r.data.numWins} ${makePlural('time', r.data.numWins)}.`
    case 'random-timer':
      return `${root} be quicker! They won in ${formatDuration(r.data.fastestWinDuration)}.`
    case 'same-square':
      return `${root} zerstöre schneller die gleiche Karos! They did it in ${formatDuration(r.data.fastestWinDuration)}.`
    case 'passthrough':
      return `${root} do you have the FFITW? Beat ${formatDuration(r.data.fastestWinDuration)} to win!`
    default:
      throw new Error(`Unknown gamemode ${(r as GameRecord).gamemode}`)
  }
}

const metaAlts: Record<GamemodeName, string> = {
  random: 'win more than me.',
  'random-timer': 'beat me on time.',
  'same-square': 'destroy faster the same squares.',
  passthrough: 'be faster than me.',
}

const createErrorResponse = (code: Code, body: BodyInit | null, headers: HeadersInit, status: number, context: Context): Response => {
  context.cookies.set({
    name: 'status',
    value: `${status}`,
    path: `/${code}`,
    secure: true,
    sameSite: 'Strict',
  })

  return new Response(body, { headers, status })
}
