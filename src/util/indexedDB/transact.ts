import { OperationError } from '.'

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
