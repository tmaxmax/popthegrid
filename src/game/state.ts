import type { Square, Animation } from './grid'

export type GameEvent =
  | { type: 'prepare'; animation: Animation }
  | RemoveSquareEvent
  | { type: 'forceEnd'; canRestart?: boolean }
  | { type: 'pause'; token: string }
  | { type: 'resume'; token: string }

export type RemoveSquareEvent = { type: 'removeSquare'; square: Square }
