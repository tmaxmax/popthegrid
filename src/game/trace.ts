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
  tilt: [number, number]
  pressure: { normal: number; tangential: number }
  angle: { altitude: number; azimuth: number; twist: number }
  move: boolean
}

const pointerID = (p: Pointer) =>
  `${p.type}-${p.primary}-${p.size[0]}x${p.size[1]}-${p.tilt[0]}x${p.tilt[1]}-${p.pressure.normal}x${p.pressure.tangential}-${p.angle.altitude}x${p.angle.azimuth}x${p.angle.twist}`

const pointerFromInput = ({ data, time }: { data: PointerEvent; time: number }): [Pointer, PointerTrace] => [
  {
    type: data.pointerType,
    primary: data.isPrimary,
    size: [data.width || 0, data.height || 0],
    tilt: [data.tiltX || 0, data.tiltY || 0],
    pressure: { normal: data.pressure || 0, tangential: data.tangentialPressure || 0 },
    angle: { altitude: data.altitudeAngle || 0, azimuth: data.azimuthAngle || 0, twist: data.twist || 0 },
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

type RemoveSquareTrace = RemoveSquareEvent & { pointerEventIndex: number; time: number }

export type Trace = {
  metadata: Metadata
  events: (
    | Exclude<GameEvent, RemoveSquareEvent>
    | RemoveSquareTrace
    | ViewportInput
    | { pointerEventIndex: number; type: 'pointerMove'; time: number }
    | OrientationChangeInput
    | GridResizeInput
    | ThemeInput
  )[]
  pointers: Pointer[]
  pointerEvents: PointerTrace[] // pointer index, x, y, timestamp
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
      pointerEvents: [],
      pointers: [],
      timeOrigin: performance.timeOrigin,
    } as unknown as Trace
    const pids: string[] = []

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

          const pointerEventIndex = trace.pointerEvents.length
          trace.pointerEvents.push(pointerTrace)

          if (input.type === 'removeSquare') {
            delete (input as any).data
            const t = input as any as RemoveSquareTrace
            t.pointerEventIndex = pointerEventIndex
            trace.events.push(t)
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

    this.clear()

    return trace
  }
}
