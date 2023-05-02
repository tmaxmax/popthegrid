import type { Context } from 'https://edge.netlify.com'

export function logRequest(request: Request, context: Context) {
  const headers = Object.fromEntries(request.headers.entries())
  const { cache, isReloadNavigation, url } = request
  const { ip, requestId, geo } = context

  console.info(requestId, headers)
  console.info(requestId, geo)
  console.info(requestId, { cache, isReloadNavigation, url, ip })
}
