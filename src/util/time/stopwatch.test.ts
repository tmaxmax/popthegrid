import { test, expect } from 'vitest'
import Stopwatch from './stopwatch'

const createMockTime = () => {
  const mock = {
    moment: 0,
    now() {
      return this.moment
    },
    advance(n: number) {
      this.moment = Math.max(this.moment + n, 0)
    },
  }

  return mock
}

test('Stopwatch', () => {
  const time = createMockTime()
  const stopwatch = new Stopwatch(time)

  expect(stopwatch.elapsed).toBe(0)
  stopwatch.start()
  time.advance(50)
  expect(stopwatch.pause()).toBe(50)
  expect(stopwatch.elapsed).toBe(50)
  stopwatch.start()
  time.advance(50)
  expect(stopwatch.pause()).toBe(50)
  expect(stopwatch.elapsed).toBe(100)
  expect(stopwatch.end()).toBe(100)
  expect(stopwatch.elapsed).toBe(0)
})
