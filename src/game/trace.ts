import type { GameEvent, RemoveSquareEvent } from './state.ts'
import type { GridResizeData } from '$components/Grid.ts'

export type Trace = (GameTrace | GridResizeTrace | OrientationChangeTrace | PointerMoveTrace | MetadataTrace | ViewportTrace) & {
  time: number
}

type OrientationChangeData = { type: string; angle: number }

type PointerData = {
  id: number
  type: string
  isPrimary: boolean
  size: [number, number]
  pressure?: [number, number] // normal, tangential
  tilt?: [number, number]
  angle?: [number, number, number] // altitude, azimuth, twist
  pos: [number, number, number][] // x, y, timestamp
}

type Metadata = {
  maxTouchPoints: number
  hover: boolean
  coarse: boolean
}

type ViewportData = {
  size: [number, number]
  off: [number, number]
  scale: number
}

type GameTrace = GameEvent | (RemoveSquareEvent & { data: PointerData })
type GridResizeTrace = { data: GridResizeData & { windowSize: [number, number] }; type: 'gridResize' }
type OrientationChangeTrace = { data: OrientationChangeData; type: 'orientationChange' }
type PointerMoveTrace = { data: PointerData; type: 'pointerMove' }
type ViewportTrace = { data: ViewportData; type: 'viewport' }
type MetadataTrace = { data: Metadata; type: 'metadata' }

class Tracer {}
