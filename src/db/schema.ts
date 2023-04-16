import { OpenOptions } from '$util/indexedDB'
import { ATTEMPTS_STORE } from './attempt'

const schema: OpenOptions = {
  name: 'popthegrid',
  version: 1,
  configurator({ database: db }) {
    const store = db.createObjectStore(ATTEMPTS_STORE, {
      keyPath: 'id',
      autoIncrement: true,
    })

    store.createIndex('gamemode', 'gamemode', { unique: false })
    store.createIndex('isWin', 'isWin', { unique: false })
  },
}

export default schema
