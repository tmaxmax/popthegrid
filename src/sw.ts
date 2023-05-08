import { getCodeFromPath } from '$edge/share'
import { clientsClaim } from 'workbox-core'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
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
  })
)

registerRoute(
  ({ request }) => {
    const url = new URL(request.url)
    return request.mode === 'navigate' && !!getCodeFromPath(url.pathname)
  },
  new CacheFirst({
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
