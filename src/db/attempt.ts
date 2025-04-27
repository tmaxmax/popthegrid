import type { Attempt } from '$game/attempt.ts'
import { isDefined } from '$util/index'
import { fromRequest } from '$util/indexedDB/index.ts'
import { transact } from '$util/indexedDB/transact.ts'

export const ATTEMPTS_STORE = 'attempts'

export const RAND_KEYS_STORE = 'rand-keys'
export const RAND_KEYS_INDEX = 'key'

export interface InsertedAttempt extends Attempt {
  id: number
}

interface StoredAttempt extends Omit<Attempt, 'randState'> {
  randKey: IDBValidKey
  offset: number
}

export async function insertAttempt(db: IDBDatabase, attempt: Attempt): Promise<InsertedAttempt> {
  const { key, off } = attempt.randState!

  let randKeyID = await transact(db, {
    stores: [RAND_KEYS_STORE],
    mode: 'readonly',
    operation(tx) {
      return fromRequest(tx.objectStore(RAND_KEYS_STORE).index(RAND_KEYS_INDEX).getKey(key))
    },
  })

  if (!isDefined(randKeyID)) {
    randKeyID = await transact(db, {
      stores: [RAND_KEYS_STORE],
      mode: 'readwrite',
      operation(tx) {
        return fromRequest(tx.objectStore(RAND_KEYS_STORE).add(key))
      },
    })
  }

  return transact(db, {
    stores: [ATTEMPTS_STORE],
    mode: 'readwrite',
    async operation(tx) {
      const toStore: StoredAttempt = { ...attempt, randKey: randKeyID, offset: off }
      delete (toStore as Attempt).randState

      const id = (await fromRequest(tx.objectStore(ATTEMPTS_STORE).add(toStore))) as number
      return { ...attempt, id }
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
