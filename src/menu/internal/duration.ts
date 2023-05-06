import prettyMs, { type Options } from 'pretty-ms'

export const duration = (ms: number, opts?: Options) => prettyMs(ms, { secondsDecimalDigits: 2, ...opts })
