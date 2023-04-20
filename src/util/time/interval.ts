import { Time } from '.'

/**
 * Represents the parameters passed to an interval function.
 *
 * - *now* is the current timestamp
 * - *iteration* is the number of the current repetion of the interval
 */
export interface IntervalFnParams {
  /**
   * The time passed since the start of the interval
   */
  elapsed: number
  /**
   * The timestamp at which the current interval occured (the current timestamp)
   */
  now: number
  /**
   * The number of the current repetion of the interval
   */
  iteration: number
}

/**
 * Represents a function used to determine the delay between the current and the new interval.
 */
export type IntervalFn = (params: IntervalFnParams) => number

/**
 * The parameters used to configure the interval.
 */
export interface IntervalProperties {
  /**
   * The function to call on each repetition
   *
   * @param iteration The number of the current repetition of the interval
   */
  callback: (iteration: number) => unknown
  /**
   * The distance between two repetitions, either a value in milliseconds
   * or a function that returns a value in milliseconds. Defaults to 0.
   */
  interval?: number | IntervalFn
  /**
   * An optional flag to indicate if the first repetition occurs instantly
   * or after `interval`
   */
  leading?: boolean
  /**
   * An optional signal to stop the interval
   */
  signal?: AbortSignal
  /**
   * An optional parameter to indicate the number of repetitions to do.
   * Its default value is Infinity.
   */
  iterations?: number
  /** Used to retrieve the current time. */
  time?: Time
}

/**
 * Call a given callback at a specified interval.
 *
 * It's different from `setInterval` due to it being customizable, abortable,
 * limited for a specific iteration count and due to the fact that it compensates
 * for the time taken to execute the callback.
 *
 * @param props The configuration parameters
 * @returns The number of times the callback executed
 */
function interval({ callback, interval, leading, signal, iterations, time }: IntervalProperties): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const nower = time || performance || Date

    const intervalFn: IntervalFn = (() => {
      if (typeof interval === 'number') {
        return () => {
          return interval
        }
      }
      if (typeof interval === 'undefined') {
        return () => {
          return 0
        }
      }
      return interval
    })()

    const start = nower.now()

    let iteration = 0

    const frame = async (time: number) => {
      if (signal?.aborted || iteration >= (iterations ?? Infinity)) {
        resolve(iteration)
        return
      }
      try {
        await callback(iteration)
        iteration++
        schedule(time)
      } catch (e) {
        reject(e)
      }
    }

    const schedule = (time: number) => {
      const elapsed = time - start
      const now = nower.now()
      const interval = intervalFn({ elapsed, now, iteration })
      const rounded = Math.round(elapsed / interval) * interval
      const target = start + rounded + interval
      const delay = target - nower.now()
      setTimeout(() => requestAnimationFrame(frame), delay)
    }

    if (leading) {
      frame(start)
    } else {
      schedule(start)
    }
  })
}

export default interval
