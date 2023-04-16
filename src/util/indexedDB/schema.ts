export interface ConfiguratorParams {
  database: IDBDatabase
  transaction: IDBTransaction
  oldVersion: number
  newVersion: number
}

export interface Configurator {
  (params: ConfiguratorParams): void
}

export interface Schema {
  name: string
  version?: number
  configurator: Configurator
}

export interface Migration {
  (db: IDBDatabase, tx: IDBTransaction): void
}

export function createConfigurator(migrations: Migration[]): Configurator {
  return ({ database, transaction, oldVersion, newVersion }) => {
    for (let i = oldVersion; i < newVersion; i++) {
      migrations[i](database, transaction)
    }
  }
}

export function concatMigrations(a: Migration, b: Migration, ...others: Migration[]): Migration {
  return (db, tx) => {
    a(db, tx)
    b(db, tx)

    for (const m of others) {
      m(db, tx)
    }
  }
}
