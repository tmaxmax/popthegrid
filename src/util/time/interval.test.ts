import interval, { type IntervalCallbackParams } from '$util/time/interval.ts'
import { wait } from '$util/index.ts'

import { describe, it, expect, vi } from 'vitest'

function raf(cb: FrameRequestCallback) {
  cb(performance.now())
  return 0
}

describe('interval', () => {
  it("should respect the interval, compensate for the callback's duration and take leading into account", async () => {
    const time = 50
    const start = performance.now()
    await interval({
      callback: () => wait(time),
      interval: time * 2,
      iterations: 1,
      leading: true,
      raf,
    }).done
    const end = performance.now()
    expect(Math.round(Math.abs(end - start - time * 2))).toBeLessThanOrEqual(20) // There is a constant overhead for configuring the interval
  })
  it('should run for a given iteration count', async () => {
    const callback = vi.fn()
    const callCount = await interval({
      callback,
      iterations: 5,
      raf,
    }).done
    expect(callback).toBeCalledTimes(5)
    expect(callCount).toBe(5)
  })
  it('should abort on signal', async () => {
    const controller = new AbortController()
    const callback = vi.fn(({ iteration }: IntervalCallbackParams) => {
      if (iteration === 2) {
        controller.abort()
      }
    })
    await interval({ callback, signal: controller.signal, raf }).done
    expect(callback).toBeCalledTimes(3)
  })
  it('should be pausable', async () => {
    let iterations = 0
    const { done, pause, resume } = interval({
      callback({ iteration }) {
        iterations = iteration
      },
      interval: 100,
      iterations: 5,
      leading: true,
      raf,
    })

    expect(iterations).toBe(0)
    await wait(101)
    expect(iterations).toBe(1)
    await wait(50)
    pause()
    await wait(150)
    resume()
    expect(iterations).toBe(1)
    await wait(51)
    expect(iterations).toBe(2)
    await wait(80)
    pause()
    await wait(200)
    resume()
    expect(iterations).toBe(2)
    await wait(20)
    expect(iterations).toBe(3)
    await done
    expect(iterations).toBe(4)
  })
  it('should be abortable when paused', () => {
    const controller = new AbortController()
    const { done, pause } = interval({
      callback: vi.fn(),
      interval: 1000,
      signal: controller.signal,
      raf,
    })
    pause()
    expect(done).resolves
  })
  it('should reject on error', () => {
    expect(
      interval({
        callback: () => {
          throw 5
        },
        raf,
      }).done
    ).rejects
  })
})
