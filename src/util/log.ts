import debug from 'debug'

const log = debug('popthegrid')

if (import.meta.env.MODE == 'development') {
  debug.enable(import.meta.env.VITE_DEBUG)
} else {
  debug.disable()
}
log(`Environment: ${import.meta.env.MODE}\nDebug namespaces: ${import.meta.env.VITE_DEBUG}`)

export default log
