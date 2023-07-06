import { getCodeFromPath } from '$edge/share.ts'
import { clientsClaim } from 'workbox-core'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { createHandlerBoundToURL, precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

// @ts-expect-error something's wrong with type
self.skipWaiting()

clientsClaim()

cleanupOutdatedCaches()
// @ts-expect-error something's wrong with type
precacheAndRoute(self.__WB_MANIFEST)

registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), {
    allowlist: [/^\/$/],
    denylist: [/^\/[a-zA-Z0-9]{6}$/],
  })
)

registerRoute(
  ({ request }) => {
    const url = new URL(request.url)
    return request.mode === 'navigate' && !!getCodeFromPath(url.pathname)
  },
  new StaleWhileRevalidate({
    cacheName: 'shared-urls',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 7,
        purgeOnQuotaError: true,
      }),
      new CacheableResponsePlugin({
        statuses: [200],
      }),
    ],
  })
)

registerRoute(
  ({ request }) => request.destination === 'font',
  new StaleWhileRevalidate({
    cacheName: 'assets',
    plugins: [new CacheableResponsePlugin({ statuses: [200] })],
  })
)
