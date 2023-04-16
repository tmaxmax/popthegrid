import { Schema, Migration, createConfigurator } from '$util/indexedDB/schema'
import { ATTEMPTS_STORE } from './attempt'

const migrations: Migration[] = [
  {
    up(db) {
      const store = db.createObjectStore(ATTEMPTS_STORE, {
        keyPath: 'id',
        autoIncrement: true,
      })

      store.createIndex('gamemode', 'gamemode', { unique: false })
      store.createIndex('isWin', 'isWin', { unique: false })
      store.createIndex('startedAt', 'startedAt', { unique: false })
      store.createIndex('duration', 'duration', { unique: false })
    },
    down(db, tx) {
      const store = tx.objectStore(ATTEMPTS_STORE)

      store.deleteIndex('gamemode')
      store.deleteIndex('isWin')
      store.deleteIndex('startedAt')
      store.deleteIndex('duration')

      db.deleteObjectStore(ATTEMPTS_STORE)
    },
  },
]

const schema: Schema = {
  name: 'popthegrid',
  version: migrations.length,
  configurator: createConfigurator(migrations),
}

export default schema
