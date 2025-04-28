import type { Attempt } from '$game/attempt.ts'
import { fromRequest } from '$util/indexedDB/index.ts'
import { transact } from '$util/indexedDB/transact.ts'
import { gamemodes } from '../gamemode'

export const ATTEMPTS_STORE = 'attempts'

export async function insertAttempt(db: IDBDatabase, attempt: Attempt): Promise<number> {
  return transact(db, {
    stores: [ATTEMPTS_STORE],
    mode: 'readwrite',
    async operation(tx) {
      const id = (await fromRequest(tx.objectStore(ATTEMPTS_STORE).add(attempt))) as number
      return id
    },
  })
}

export function retrieveAttempts(db: IDBDatabase): Promise<Attempt[]> {
  return transact(db, {
    stores: ATTEMPTS_STORE,
    mode: 'readonly',
    async operation(tx) {
      const req = tx.objectStore(ATTEMPTS_STORE).getAll()
      const attempts = await fromRequest<Attempt[]>(req)
      // The database might contain games from removed gamemodes.
      return attempts.filter((a) => a.gamemode in gamemodes)
    },
  })
}
