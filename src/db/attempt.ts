import { Attempt } from '$game/attempt'
import { fromRequest } from '$util/indexedDB'
import { transact } from '$util/indexedDB/transact'

export const ATTEMPTS_STORE = 'attempts'

export interface InsertedAttempt extends Attempt {
  id: number
}

export function insertAttempt(db: IDBDatabase, attempt: Attempt): Promise<InsertedAttempt> {
  return transact(db, {
    stores: ATTEMPTS_STORE,
    mode: 'readwrite',
    operation(tx) {
      const req = tx.objectStore(ATTEMPTS_STORE).add(attempt)
      return fromRequest<InsertedAttempt>(req)
    },
  })
}

export function retrieveAttempts(db: IDBDatabase): Promise<InsertedAttempt[]> {
  return transact(db, {
    stores: ATTEMPTS_STORE,
    mode: 'readonly',
    operation(tx) {
      const req = tx.objectStore(ATTEMPTS_STORE).getAll()
      return fromRequest<InsertedAttempt[]>(req)
    },
  })
}
