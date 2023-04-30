import type { Schema } from './schema'

export interface OpenOptions {
  schema: Schema
  onVersionChange: (ev: IDBVersionChangeEvent) => void
}

type ErrorCode = 'blocked' | 'version-change' | 'config-error' | 'request-error' | 'transaction-error' | 'result-error' | 'abort'

const errorMessages: Readonly<Record<ErrorCode, string>> = {
  blocked: 'The user blocked the creation of an IndexedDB',
  'config-error': 'Failed to configure IndexedDB schema',
  'request-error': 'Failed to open an IndexedDB',
  'transaction-error': 'The transaction failed',
  'result-error': 'Failed to get result',
  'version-change': 'The database version was changed',
  abort: 'The transaction was aborted',
}

export class OperationError extends Error {
  constructor(public readonly code: ErrorCode, cause?: unknown) {
    super(errorMessages[code], { cause })
  }
}

export function open(factory: IDBFactory, { schema: { name, version, configurator }, onVersionChange }: OpenOptions): Promise<IDBDatabase> {
  const openRequest = factory.open(name, version)

  return new Promise((resolve, reject) => {
    openRequest.onerror = () => {
      reject(new OperationError('request-error', openRequest.error))
    }

    openRequest.onupgradeneeded = (ev: IDBVersionChangeEvent) => {
      // Should never happen; type definitions say it can, so let's handle this defensively
      if (!ev.target) {
        reject(new OperationError('config-error', 'no event target'))
        return
      }

      const target = ev.target as IDBOpenDBRequest
      if (target.error) {
        reject(new OperationError('config-error', target.error))
        return
      }

      const db = target.result
      // we know this is not null because it is an open request
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const tx = target.transaction!
      const { oldVersion, newVersion } = ev

      configureVersionChange(db, onVersionChange)

      tx.onerror = () => {
        reject(new OperationError('config-error'))
      }

      if (!newVersion) {
        reject(new Error(`newVersion unexpectedly empty: got ${ev.newVersion}`, { cause: ev.newVersion }))
        return
      }

      configurator(db, tx, { oldVersion, newVersion })
    }

    openRequest.onsuccess = () => {
      configureVersionChange(openRequest.result, onVersionChange)
      resolve(openRequest.result)
    }

    openRequest.onblocked = () => {
      reject(new OperationError('blocked', openRequest.error))
    }
  })
}

function configureVersionChange(db: IDBDatabase, cb: (ev: IDBVersionChangeEvent) => void) {
  db.onversionchange = (ev) => {
    db.close()
    cb(ev)
  }
}

export function fromRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    req.onerror = () => {
      reject(req.error)
    }

    req.onsuccess = (ev) => {
      // eslint-disable-next-line
      resolve((ev.target! as any).result)
    }
  })
}
