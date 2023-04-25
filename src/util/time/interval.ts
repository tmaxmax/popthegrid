import type { Time } from '.'
import { isDefined } from '..'

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
  interval?: number
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
  raf?: typeof requestAnimationFrame
}

export interface Interval {
  pause(): void
  resume(): void
  done: Promise<number>
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
function interval({
  callback,
  interval: providedInterval,
  leading,
  signal,
  iterations,
  time,
  raf: providedRAF,
}: IntervalProperties): Interval {
  let pause: () => void, resume: () => void

  const done = new Promise<number>((resolve, reject) => {
    const interval = Math.floor(providedInterval || 0)
    const nower = time || performance || Date
    const raf = providedRAF || requestAnimationFrame
    const start = nower.now()

    let iteration = 0
    let timeoutID: TimeoutID | undefined
    let paused = false
    let lastTime: number | undefined
    let nextTime: number | undefined

    signal?.addEventListener('abort', () => {
      if (paused) {
        resolve(iteration)
      } else if (isDefined(timeoutID)) {
        clearTimeout(timeoutID)
        resolve(iteration)
      }
    })

    const frame = async (time: number) => {
      timeoutID = undefined
      lastTime = undefined

      if (signal?.aborted || iteration >= (iterations ?? Infinity)) {
        resolve(iteration)
        return
      }
      try {
        await callback(iteration)
        iteration++
        if (!paused) {
          schedule(time)
        }
      } catch (e) {
        reject(e)
      }
    }

    const getTargetTime = (time: number, previousTime?: number) => {
      if (nextTime) {
        const target = nextTime
        nextTime = undefined

        return target
      }

      const target = time + interval
      const now = nower.now()

      if (previousTime) {
        return Math.max(Math.floor(target - (time - previousTime) - now), 0)
      }

      return Math.max(Math.floor(target - now), 0)
    }

    const schedule = (time: number) => {
      lastTime = time
      timeoutID = setTimeout(() => raf(frame), getTargetTime(time))
    }

    pause = () => {
      if (paused) {
        return
      }

      paused = true
      clearTimeout(timeoutID)
      timeoutID = undefined
      nextTime = getTargetTime(nower.now(), lastTime)
      lastTime = undefined
    }

    resume = () => {
      if (!paused) {
        return
      }

      paused = false
      schedule(nower.now())
    }

    if (leading) {
      frame(start)
    } else {
      schedule(start)
    }
  })

  return {
    done,
    pause: pause!,
    resume: resume!,
  }
}

export default interval

type TimeoutID = ReturnType<typeof setTimeout>
