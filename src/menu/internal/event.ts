import { derived, type Readable } from 'svelte/store'
import type { Event as GameEvent } from '$game'

type Transition = Exclude<GameEvent, { name: 'error' }>
type Event = { message: string; isTransition?: boolean; isError?: boolean }
type StoreOptions = { short?: boolean }

export const createEventStore = (events: Readable<GameEvent>, opts?: StoreOptions): Readable<Event> => {
  return derived(events, (ev, set) => {
    switch (ev.name) {
      case 'transitionstart':
        set({ message: getTransitionStartText(ev, opts), isTransition: true })
        break
      case 'transitionend':
        set({ message: getTransitionEndText(ev, opts) })
        break
      case 'error':
        set({ message: opts?.short ? 'Error' : 'Something terribly wrong happened', isError: true })
        break
    }
  })
}

const getTransitionStartText = ({ from, to }: Transition, opts?: StoreOptions): string => {
  const short = !!opts?.short

  switch (to) {
    case 'initial':
      switch (from) {
        case 'win':
          return short ? 'Won' : 'You won!'
        case 'lose':
          return short ? 'Lost' : 'You lost.'
        default:
          return short ? 'Starting...' : 'Starting game...'
      }
    case 'ready':
      return short ? 'Preparing...' : 'Preparing game...'
    case 'ongoing':
      return short ? 'Starting...' : 'Starting attempt...'
    case 'pause':
      return short ? 'Paused' : 'Game is paused.'
    case 'win':
      return short ? 'Won' : 'You won!'
    case 'lose':
      return short ? 'Lost' : 'You lost.'
    case 'over':
      return short ? 'Aborting...' : 'Aborting game...'
  }
}

const getTransitionEndText = ({ to }: Transition, opts?: StoreOptions): string => {
  const short = !!opts?.short

  switch (to) {
    case 'initial':
      return short ? 'Can start' : 'You can prepare the game.'
    case 'ready':
      return short ? 'Ready' : 'You can start a new game.'
    case 'pause':
      return short ? 'Paused' : 'Your current game is now paused. It will be resumed automatically when you close this menu.'
    case 'ongoing':
      return short ? 'Ongoing' : 'You are in a game!'
    case 'win':
      return short ? 'Won' : 'You won!'
    case 'lose':
      return short ? 'Lost' : 'You lost.'
    case 'over':
      return short ? 'Over' : 'Game over.'
  }
}
