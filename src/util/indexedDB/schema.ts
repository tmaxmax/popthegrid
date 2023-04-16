import { Configurator } from '.'

export interface Migration {
  up(db: IDBDatabase, tx: IDBTransaction): void
  down(db: IDBDatabase, tx: IDBTransaction): void
}

export function createConfigurator(migrations: Migration[]): Configurator {
  return ({ database, transaction, oldVersion, newVersion }) => {
    if (oldVersion > newVersion) {
      for (let i = oldVersion - 1; i >= newVersion; i--) {
        migrations[i].down(database, transaction)
      }
    } else {
      for (let i = oldVersion; i < newVersion; i++) {
        migrations[i].up(database, transaction)
      }
    }
  }
}

export function concatMigrations(a: Migration, b: Migration, ...others: Migration[]): Migration {
  return {
    up(db, tx) {
      a.up(db, tx)
      b.up(db, tx)

      for (const m of others) {
        m.up(db, tx)
      }
    },
    down(db, tx) {
      a.down(db, tx)
      b.down(db, tx)

      for (const m of others) {
        m.down(db, tx)
      }
    },
  }
}
