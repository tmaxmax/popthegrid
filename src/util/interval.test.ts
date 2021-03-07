import interval from './interval'
import wait from './wait'

describe('interval', () => {
  it("should respect the interval, compensate for the callback's duration and take leading into account", async () => {
    const time = 50
    const start = performance.now()
    await interval({
      callback: () => wait(time),
      interval: time * 2,
      iterations: 1,
      leading: true,
    })
    const end = performance.now()
    expect(Math.abs(end - start - time * 2)).toBeLessThan(20) // There is a constant overhead for configuring the interval
  })
  it('should run for a given iteration count', async () => {
    const callback = jest.fn()
    const callCount = await interval({
      callback,
      iterations: 5,
    })
    expect(callback).toBeCalledTimes(5)
    expect(callCount).toBe(5)
  })
  it('should abort on signal', async () => {
    const controller = new AbortController()
    const callback = jest.fn((iteration: number) => {
      if (iteration === 2) {
        controller.abort()
      }
    })
    await interval({ callback, signal: controller.signal })
    expect(callback).toBeCalledTimes(3)
  })
  it('should reject on error', async () => {
    expect(
      interval({
        callback: () => {
          throw 5
        },
      })
    ).rejects
  })
})
