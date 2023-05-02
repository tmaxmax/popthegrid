import type { Context } from 'https://edge.netlify.com'

export function logRequest(request: Request, context: Context) {
  const headers = Object.fromEntries(request.headers.entries())
  const { cache, isReloadNavigation, url } = request
  const { ip, requestId, geo } = context

  console.info(requestId, JSON.stringify(headers))
  console.info(requestId, JSON.stringify(geo))
  console.info(requestId, JSON.stringify({ cache, isReloadNavigation, url, ip }))
}
