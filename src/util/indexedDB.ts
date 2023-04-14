export interface OpenOptions {
  name: string
  configurator(db: IDBDatabase): void
  version?: number
}

type ErrorCode = 'blocked' | 'config-error' | 'request-error' | 'transaction-error' | 'result-error'

const errorMessages: Readonly<Record<ErrorCode, string>> = {
  blocked: 'The user blocked the creation of an IndexedDB',
  'config-error': 'Failed to configure IndexedDB schema',
  'request-error': 'Failed to open an IndexedDB',
  'transaction-error': 'The transaction failed',
  'result-error': 'Failed to get result',
}

export class OperationError extends Error {
  constructor(public readonly code: ErrorCode, cause?: unknown) {
    super(errorMessages[code], { cause })
  }
}

export function open(factory: IDBFactory, { name, version, configurator }: OpenOptions): Promise<IDBDatabase> {
  const openRequest = factory.open(name, version)

  return new Promise((resolve, reject) => {
    openRequest.onerror = () => {
      reject(new OperationError('request-error', openRequest.error))
    }

    openRequest.onupgradeneeded = (ev: Event) => {
      const db = (ev.target as any).result as IDBDatabase

      db.onerror = () => {
        reject(new OperationError('config-error'))
      }

      configurator(db)
    }

    openRequest.onsuccess = () => {
      resolve(openRequest.result)
    }

    openRequest.onblocked = () => {
      reject(new OperationError('blocked', openRequest.error))
    }
  })
}

export interface TransactOptions {
  stores: string | string[]
  mode?: IDBTransactionMode
  operation(tx: IDBTransaction): void
}

export function transact(db: IDBDatabase, { stores, mode, operation }: TransactOptions): Promise<void> {
  const tx = db.transaction(stores || [], mode)

  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => {
      resolve()
    }

    tx.onerror = () => {
      reject(new OperationError('transaction-error', tx.error))
    }

    try {
      operation(tx)
      tx.commit()
    } catch (err) {
      reject(new OperationError('transaction-error', err))
      tx.abort()
    }
  })
}

export function fromRequest<T>(req: IDBRequest<any>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    req.onerror = () => {
      reject(req.error)
    }

    req.onsuccess = (ev) => {
      resolve((ev.target! as any).result)
    }
  })
}
