import type { Code } from '$edge/share'
import type { GamemodeName } from '$game/gamemode'
import type { ThemeName } from '$theme'
import { fromRequest } from '$util/indexedDB'
import { transact } from '$util/indexedDB/transact'

export const LINKS_STORE = 'links'
export const LINKS_INDEX = 'data'

export interface CodeInfo {
  name?: string
  gamemode: GamemodeName
  when: Date
  theme: ThemeName
}

export function findCachedLink(db: IDBDatabase, { name, gamemode, when, theme }: CodeInfo): Promise<Code | undefined> {
  return transact(db, {
    stores: 'links',
    async operation(tx) {
      const req = tx
        .objectStore(LINKS_STORE)
        .index(LINKS_INDEX)
        .get([name || '', gamemode, when, theme])
      const link = await fromRequest<Link | undefined>(req)
      if (link) {
        return link.code
      }
      return undefined
    },
    mode: 'readonly',
  })
}

export interface Link extends CodeInfo {
  code: Code
}

export function cacheLink(db: IDBDatabase, { code, name, gamemode, when, theme }: Link): Promise<boolean> {
  return transact(db, {
    stores: 'links',
    async operation(tx) {
      const req = tx.objectStore(LINKS_STORE).add({ code, name: name || '', gamemode, when, theme })
      try {
        await fromRequest(req)
        return true
      } catch (err) {
        if (err instanceof DOMException && err.name === 'ConstraintError') {
          return false
        }
        throw err
      }
    },
    mode: 'readwrite',
    ignoreAbort: true,
  })
}
