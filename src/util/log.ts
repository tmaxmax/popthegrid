import debug from 'debug'

const log = debug('popthegrid')

if (import.meta.env.DEBUG) {
  debug.enable(import.meta.env.DEBUG)
} else {
  debug.disable()
}
log(`Environment: ${import.meta.env.NODE_ENV}\nDebug namespaces: ${import.meta.env.DEBUG}`)

export default log
