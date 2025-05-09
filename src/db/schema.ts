import { createConfigurator } from '$util/indexedDB/schema.ts'
import type { Schema, Migration } from '$util/indexedDB/schema.ts'
import { ATTEMPTS_STORE } from './attempt.ts'
import { LINKS_INDEX, LINKS_INDEX_ATTEMPT_ID, LINKS_STORE } from './link.ts'

const migrations: Migration[] = [
  (db) => {
    const store = db.createObjectStore(ATTEMPTS_STORE, {
      keyPath: 'id',
      autoIncrement: true,
    })

    store.createIndex('gamemode', 'gamemode', { unique: false })
    store.createIndex('isWin', 'isWin', { unique: false })
    store.createIndex('startedAt', 'startedAt', { unique: false })
    store.createIndex('duration', 'duration', { unique: false })
  },
  (_, tx) => {
    const store = tx.objectStore(ATTEMPTS_STORE)

    store.deleteIndex('gamemode')
    store.deleteIndex('isWin')
    store.deleteIndex('startedAt')
    store.deleteIndex('duration')
  },
  (db) => {
    const store = db.createObjectStore(LINKS_STORE, {
      keyPath: 'code',
    })

    store.createIndex(LINKS_INDEX, ['name', 'gamemode', 'when', 'theme'], { unique: true })
  },
  (_, tx) => {
    const store = tx.objectStore(LINKS_STORE)

    store.createIndex(LINKS_INDEX_ATTEMPT_ID, ['name', 'theme', 'attemptID'], { unique: true })
  },
]

const schema: Schema = {
  name: 'popthegrid',
  version: migrations.length,
  configurator: createConfigurator(migrations),
}

export default schema
