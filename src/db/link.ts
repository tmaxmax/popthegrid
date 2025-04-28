import type { Code } from '$share/code.ts'
import type { GamemodeName } from '$game/gamemode/index.ts'
import type { ThemeName } from '$theme'
import { fromRequest } from '$util/indexedDB/index.ts'
import { transact } from '$util/indexedDB/transact.ts'

export const LINKS_STORE = 'links'
export const LINKS_INDEX = 'data'
export const LINKS_INDEX_ATTEMPT_ID = 'attemptID'

export type CodeInfo = {
  name?: string
  gamemode: GamemodeName
  when: Date
  theme: ThemeName
  attemptID?: string
}

export function findCachedLink(db: IDBDatabase, info: CodeInfo): Promise<Code | undefined> {
  return transact(db, {
    stores: LINKS_STORE,
    async operation(tx) {
      const links = tx.objectStore(LINKS_STORE)

      let req: IDBRequest<Link | undefined>
      if (info.attemptID) {
        req = links.index(LINKS_INDEX_ATTEMPT_ID).get([info.name || '', info.theme, info.attemptID])
      } else {
        req = links.index(LINKS_INDEX).get([info.name || '', info.gamemode, info.when, info.theme])
      }

      const link = await fromRequest(req)
      if (link) {
        return link.code
      }

      return undefined
    },
    mode: 'readonly',
  })
}

export type Link = CodeInfo & {
  code: Code
}

export function cacheLink(db: IDBDatabase, link: Link): Promise<boolean> {
  return transact(db, {
    stores: 'links',
    async operation(tx) {
      link.name ||= ''

      const req = tx.objectStore(LINKS_STORE).add(link)
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
