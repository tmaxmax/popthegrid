// performance.now polyfill
;(() => {
  if (!('performance' in window)) {
    window.performance = {}
  }

  Date.now = Date.now || (() => new Date().getTime())

  if (!('now' in window.performance)) {
    let offset
    if (performance.timeOrigin) {
      offset = performance.timeOrigin
    } else if (performance.timing?.navigationStart) {
      offset = performance.timing.navigationStart
    } else {
      offset = Date.now()
    }
    window.performance.now = () => Date.now() - offset
  }
})()
// requestAnimationFrame polyfill
;(() => {
  let lastTime = 0
  const vendors = ['ms', 'moz', 'webkit', 'o']
  for (let x = 0; x < vendors.length && !window.requestAnimationFrame; x++) {
    window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame']
    window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame']
  }

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (callback) => {
      const currTime = performance.now()
      const timeToCall = Math.max(0, 16 - (currTime - lastTime))
      const id = window.setTimeout(() => callback(currTime + timeToCall), timeToCall)
      lastTime = currTime + timeToCall
      return id
    }
  }

  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = (id) => clearTimeout(id)
  }
})()
