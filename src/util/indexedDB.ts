export interface ConfiguratorParams {
  database: IDBDatabase
  transaction: IDBTransaction
  oldVersion: number
  newVersion: number
}

export interface Configurator {
  (params: ConfiguratorParams): void
}

export interface OpenOptions {
  name: string
  configurator: Configurator
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

      const database = target.result
      const transaction = target.transaction! // we know this is not null because it is an open request

      transaction.onerror = () => {
        reject(new OperationError('config-error'))
      }

      if (!ev.newVersion) {
        reject(new Error(`newVersion unexpectedly empty: got ${ev.newVersion}`, { cause: ev.newVersion }))
        return
      }

      configurator({ database, transaction, oldVersion: ev.oldVersion, newVersion: ev.newVersion })
    }

    openRequest.onsuccess = () => {
      resolve(openRequest.result)
    }

    openRequest.onblocked = () => {
      reject(new OperationError('blocked', openRequest.error))
    }
  })
}

export interface TransactOptions<T> {
  stores: string | string[]
  mode?: IDBTransactionMode
  operation(tx: IDBTransaction): T | Promise<T>
}

export async function transact<T>(db: IDBDatabase, { stores, mode, operation }: TransactOptions<T>): Promise<T> {
  const tx = db.transaction(stores || [], mode)

  return await new Promise<T | Promise<T>>((resolve, reject) => {
    let res: T | Promise<T>

    tx.oncomplete = () => {
      resolve(res)
    }

    tx.onerror = () => {
      reject(new OperationError('transaction-error', tx.error))
    }

    try {
      res = operation(tx)
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
