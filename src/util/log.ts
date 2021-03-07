import debug from 'debug'

const log = debug('popthegrid')

if (process.env.DEBUG) {
  debug.enable(process.env.DEBUG)
} else {
  debug.disable()
}
log(`Environment: ${process.env.NODE_ENV}\nDebug namespaces: ${process.env.DEBUG}`)

export default log
