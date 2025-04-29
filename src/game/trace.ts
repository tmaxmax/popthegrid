import type { GameEvent, RemoveSquareEvent } from './state.ts'
import type { GridResizeData } from '$components/Grid.ts'
import type { ThemeName } from '$theme'

type Input = GameInput | GridResizeInput | OrientationChangeInput | PointerMoveInput | MetadataInput | ViewportInput | ThemeInput

type OrientationChangeData = { type: string; angle: number }

type Metadata = {
  maxTouchPoints: number
  primaryPointer: number
  anyPointer: number
}

type ViewportData = {
  size: [number, number]
  off: [number, number]
  scale: number
}

type GameInput = (Exclude<GameEvent, RemoveSquareEvent> | (RemoveSquareEvent & { data: PointerEvent })) & { time: number }
type GridResizeInput = { data: GridResizeData; windowSize: [number, number]; type: 'gridResize'; time: number }
type OrientationChangeInput = { data: OrientationChangeData; type: 'orientationChange'; time: number }
type PointerMoveInput = { data: PointerEvent; type: 'pointerMove'; time: number }
type ViewportInput = { data: ViewportData; type: 'viewport'; time: number }
type MetadataInput = { data: Metadata; type: 'metadata'; time: number }
type ThemeInput = { name: ThemeName; type: 'theme'; time: number }

type MetadataMatchMedia = {
  hover: MediaQueryList
  coarse: MediaQueryList
  primaryHover: MediaQueryList
  primaryCoarse: MediaQueryList
}

const pointerTypeFromMedias = (hover: boolean, coarse: boolean) => {
  let type = 0
  if (hover) {
    type |= 0b1
  }
  if (coarse) {
    type |= 0b10
  }
  return type
}

type Pointer = {
  type: string
  primary: boolean
  size: [number, number]
  move: boolean
}

const pointerID = (p: Pointer) => `${p.type}-${p.primary}-${p.size[0]}x${p.size[1]}-${p.move}`

const pointerFromInput = ({ data, time }: { data: PointerEvent; time: number }): [Pointer, PointerTrace] => [
  {
    type: data.pointerType,
    primary: data.isPrimary,
    size: [data.width || 0, data.height || 0],
    move: data.type == 'pointermove',
  },
  [-1, data.clientX, data.clientY, time],
]

type PointerTrace = [
  number, // pointer index
  number, // x
  number, // y
  number // time
]

// Little endian binary representation of pointer events array.
// Stream: [pointer index b0, pointer x b1, pointer y b3, delta b5-8]
export type PointerEvents = Uint8Array

type RemoveSquareTrace = RemoveSquareEvent & { pointerEventIndex: number; time: number }

export type Trace = {
  metadata: Metadata
  events: (
    | Exclude<GameEvent, RemoveSquareEvent>
    | RemoveSquareTrace
    | ViewportInput
    | OrientationChangeInput
    | GridResizeInput
    | ThemeInput
  )[]
  pointers: Pointer[]
  firstPointerEventTime: number
  timeOrigin: number
}

const typesToDeduplicate: Input['type'][] = ['gridResize', 'orientationChange', 'viewport', 'theme']

export class Tracer {
  #inputs: Input[]
  #enabled: boolean

  constructor() {
    this.#inputs = []
    this.#enabled = false
  }

  #now() {
    return performance.now()
  }

  #push(i: Input) {
    if (this.#enabled) {
      this.#inputs.push(i)
    }
  }

  metadata(navigator: Navigator, { hover, coarse, primaryHover, primaryCoarse }: MetadataMatchMedia) {
    this.#push({
      time: this.#now(),
      type: 'metadata',
      data: {
        maxTouchPoints: navigator.maxTouchPoints,
        primaryPointer: pointerTypeFromMedias(primaryHover.matches, primaryCoarse.matches),
        anyPointer: pointerTypeFromMedias(hover.matches, coarse.matches),
      },
    })
  }

  viewport(vp: VisualViewport) {
    this.#push({
      time: this.#now(),
      type: 'viewport',
      data: {
        size: [vp.width, vp.height],
        off: [vp.offsetLeft, vp.offsetTop],
        scale: vp.scale,
      },
    })
  }

  pointerMove(data: PointerEvent) {
    this.#push({
      time: this.#now(),
      type: 'pointerMove',
      data,
    })
  }

  orientationChange(or: ScreenOrientation) {
    this.#push({
      time: this.#now(),
      type: 'orientationChange',
      data: { angle: or.angle, type: or.type },
    })
  }

  gridResize(data: GridResizeData, window: Window) {
    this.#push({
      time: this.#now(),
      type: 'gridResize',
      data,
      windowSize: [window.innerWidth, window.innerHeight],
    })
  }

  theme(name: ThemeName) {
    this.#push({
      time: this.#now(),
      type: 'theme',
      name,
    })
  }

  game(data: Exclude<GameEvent, RemoveSquareEvent>) {
    this.#push({
      time: this.#now(),
      ...data,
    })
  }

  gameRemoveSquare(data: RemoveSquareEvent, pev: PointerEvent) {
    this.#push({
      time: this.#now(),
      type: data.type,
      data: pev,
      square: { row: data.square.row, col: data.square.col, color: data.square.color },
    })
  }

  get enabled() {
    return this.#enabled
  }

  set enabled(doEnable: boolean) {
    this.#enabled = doEnable
  }

  clear() {
    this.#inputs = []
  }

  flush() {
    const trace = {
      events: [],
      pointers: [],
      timeOrigin: performance.timeOrigin,
    } as unknown as Trace
    const pids: string[] = []
    const ptraces: PointerTrace[] = []

    let lastPointerTraceTime: number | undefined

    for (const input of this.#inputs) {
      switch (input.type) {
        case 'removeSquare':
        case 'pointerMove':
          const [pointer, pointerTrace] = pointerFromInput(input)
          const pid = pointerID(pointer)

          let pointerIndex = pids.indexOf(pid)
          if (pointerIndex === -1) {
            pointerIndex = pids.length
            pids.push(pid)
            trace.pointers.push(pointer)
          }

          pointerTrace[0] = pointerIndex
          // A 65535x65535 viewport should be big enough for most intents.
          pointerTrace[1] = Math.min(Math.round(pointerTrace[1]), 65535) >>> 0
          pointerTrace[2] = Math.min(Math.round(pointerTrace[2]), 65535) >>> 0

          const time = pointerTrace[3]
          if (lastPointerTraceTime) {
            // performance.now has in isolated contexts a resolution of 5 microseconds.
            // By multiplying by 200 we get the smallest integer which can represent
            // all possible performance.now outputs.
            pointerTrace[3] = ((time - lastPointerTraceTime) * 200) >>> 0
          } else {
            trace.firstPointerEventTime = time
            pointerTrace[3] = 0
          }

          if (input.type === 'removeSquare') {
            delete (input as any).data
            const t = input as any as RemoveSquareTrace
            t.pointerEventIndex = ptraces.length
            ptraces.push(pointerTrace)
            trace.events.push(t)
            lastPointerTraceTime = time
          } else if (!lastPointerTraceTime || pointerTrace[3] >= 16 * 200) {
            // A smooth 60fps replay requires a new event every ~16ms; drop everything in between to reduce size.
            ptraces.push(pointerTrace)
            lastPointerTraceTime = time
          }

          break
        case 'metadata':
          trace.metadata = input.data
          break
        default:
          let i = trace.events.length - 1
          for (; i >= 0; i--) {
            const ev = trace.events[i]
            if (!typesToDeduplicate.includes(ev.type) || ev.type === input.type) {
              break
            }
          }

          if (i !== -1) {
            trace.events[i] = input
          } else {
            trace.events.push(input)
          }

          break
      }
    }

    const pevs = new Uint8Array(ptraces.length * 9)
    for (let i = 0; i < ptraces.length; i++) {
      const ptrace = ptraces[i]
      let j = 9 * i

      pevs[j++] = ptrace[0]

      const x = ptrace[1]
      pevs[j++] = x
      pevs[j++] = x >>> 8

      const y = ptrace[2]
      pevs[j++] = y
      pevs[j++] = y >>> 8

      const delta = ptrace[3]
      pevs[j++] = delta
      pevs[j++] = delta >>> 8
      pevs[j++] = delta >>> 16
      pevs[j++] = delta >>> 24
    }

    this.clear()

    return { trace, pointerEvents: pevs } as const
  }
}
