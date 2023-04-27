import { derived, type Readable } from 'svelte/store'
import type { Event as GameEvent } from '$game'

type Transition = Exclude<GameEvent, { name: 'error' }>
type Event = { message: string; isTransition?: boolean; isError?: boolean }

export const createEventStore = (events: Readable<GameEvent>): Readable<Event> => {
  return derived(events, (ev, set) => {
    switch (ev.name) {
      case 'transitionstart':
        set({ message: getTransitionStartText(ev), isTransition: true })
        break
      case 'transitionend':
        set({ message: getTransitionEndText(ev) })
        break
      case 'error':
        set({ message: 'Something terribly wrong happened', isError: true })
        break
    }
  })
}

const getTransitionStartText = ({ from, to }: Transition) => {
  switch (to) {
    case 'initial':
      switch (from) {
        case 'win':
          return 'You won!'
        case 'lose':
          return 'You lost.'
        default:
          return 'Starting game...'
      }
    case 'ready':
      return 'Preparing game...'
    case 'ongoing':
      return 'Starting attempt...'
    case 'win':
      return 'You won!'
    case 'lose':
      return 'You lost.'
    case 'over':
      return 'Aborting game...'
  }
}

const getTransitionEndText = ({ to }: Transition) => {
  switch (to) {
    case 'initial':
      return 'You can prepare the game.'
    case 'ready':
      return 'You can start a new game.'
    case 'ongoing':
      return 'Your current game is now paused. It will be resumed automatically when you close this menu.'
    case 'win':
      return 'You won!'
    case 'lose':
      return 'You lost.'
    case 'over':
      return 'Game over.'
  }
}
