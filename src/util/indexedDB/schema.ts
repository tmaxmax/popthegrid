export interface VersionTransition {
  oldVersion: number
  newVersion: number
}

export interface Configurator {
  (db: IDBDatabase, tx: IDBTransaction, transition: VersionTransition): void
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
  return (db, tx, { oldVersion, newVersion }) => {
    for (let i = oldVersion; i < newVersion; i++) {
      migrations[i](db, tx)
    }
  }
}
