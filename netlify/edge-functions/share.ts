import { DOMParser, initParser, HTMLDocument } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm-noinit.ts'
import type { Context } from 'https://edge.netlify.com'
import humanizeDuration from 'https://esm.sh/humanize-duration@3.28.0'
import { parse } from 'https://deno.land/x/content_type@1.0.1/mod.ts'

export default async (request: Request, context: Context) => {
  const url = new URL(request.url)
  const baseURL = `${url.protocol}//${url.host}`
  const code = getCodeFromPath(url.pathname)
  if (!code || !(code in mockCodes)) {
    return
  }

  const response = await context.next(new Request(baseURL))
  const contentType = response.headers.get('Content-Type')
  const parsedContentType = contentType != null && parse(contentType)

  if (!parsedContentType || parsedContentType.type !== 'text/html') {
    return response
  }

  const { name, gamemode, ...data } = mockCodes[code]
  const text = await response.text()

  await initParser()
  const html = new DOMParser().parseFromString(text, 'text/html')
  if (!html) {
    return new Response(text, response)
  }

  let description: string
  switch (gamemode) {
    case 'random':
      description = `be more lucky than your friend${name ? ` ${name}` : ``}! They were lucky ${data.numWins} times.`
      break
    case 'random-timer':
      description = `beat your friend${name ? ` ${name}` : ``} on time! He won in ${formatDuration(data.fastestWinDuration as number)}.`
      break
    default:
      throw new Error(`Unknown gamemode ${gamemode}`)
  }

  const objective = html.querySelector('.greeting > p')!
  objective.textContent = `Objective: ${description}`

  const descriptionTags = [html.querySelector('meta[name="description"]')!, html.querySelector('meta[property="og:description"]')!]
  for (const tag of descriptionTags) {
    tag.setAttribute('content', toUpper(description))
  }

  const urlTag = html.querySelector('meta[property="og:url"]')!
  const urlNoParams = new URL(`/${code}`, baseURL)
  urlTag.setAttribute('content', urlNoParams.toString())

  appendImageMetaTags(html, gamemode)

  const scriptData = html.createElement('script')
  scriptData.textContent = `sessionStorage.setItem('record-data', '${JSON.stringify({ name, gamemode, ...data })}')`
  html.head.appendChild(scriptData)

  const responseBody = `
    <!DOCTYPE html>
    <html>
      <head>${html.head.innerHTML}</head>
      <body>${html.body.innerHTML}</body>
    </html>
  `

  return new Response(responseBody, response)
}

const getCodeFromPath = (path: string): string | undefined => {
  const [first, code, ...rest] = path.split('/')
  if (first !== '' || rest.length > 0) {
    return undefined
  }

  return code
}

const appendImageMetaTags = (document: HTMLDocument, gamemode: string) => {
  const image = document.createElement('meta')
  image.setAttribute('property', 'og:image')
  image.setAttribute('content', `/og/${gamemode}.jpg`)

  const type = document.createElement('meta')
  type.setAttribute('property', 'og:image:type')
  type.setAttribute('content', 'image/jpeg')

  const width = document.createElement('meta')
  width.setAttribute('property', 'og:image:width')
  width.setAttribute('content', '1200')

  const height = document.createElement('meta')
  height.setAttribute('property', 'og:image:height')
  height.setAttribute('content', '627')

  const alt = document.createElement('meta')
  alt.setAttribute('property', 'og:image:alt')
  alt.setAttribute('content', `Pop the grid: ${metaAlts[gamemode]}`)

  document.head.append(image, type, width, height, alt)
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

const metaAlts: Record<string, string> = {
  random: 'be more lucky than me.',
  'random-timer': 'beat me on time.',
}

const formatDuration = humanizeDuration.humanizer({ units: ['s'], maxDecimalPoints: 2 })

const toUpper = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
