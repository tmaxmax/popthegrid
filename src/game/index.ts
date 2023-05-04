import { UnreachableError, isDefined } from '$util/index'
import { writable, type Readable, type Writable } from 'svelte/store'
import { startAttempt } from './attempt'
import type { Attempt, OngoingAttempt } from './attempt'
import { Gamemode, type GamemodeName } from './gamemode'
import type { Grid, Square } from './grid'

export interface OnGameData {
  when: CallbackWhen
  from?: StateName
}

export interface OnGameInitData extends OnGameData {
  gamemode: GamemodeName
}

export type OnGameReadyData = OnGameInitData

export interface OnGameEndData extends OnGameData {
  attempt: Attempt
}

export interface OnGameStartData extends OnGameData {
  attempt: OngoingAttempt
}

export type OnGameOverData = OnGameData

export interface GameProps {
  grid: Grid
  gamemode: Gamemode
  onError(err: unknown): unknown
  onGameInit?(data: OnGameInitData): unknown
  onGameReady?(data: OnGameReadyData): unknown
  onGameStart?(data: OnGameStartData): unknown
  onGameEnd?(data: OnGameEndData): unknown
  onGameOver?(data: OnGameOverData): unknown
}

type BaseProps = Pick<GameProps, 'grid' | 'gamemode'>
type Callbacks = Omit<GameProps, 'grid' | 'gamemode' | 'onError'>

export type GamemodeSetWhen = 'now' | 'next-game'

export type CallbackWhen = 'before' | 'after'

export type StateName = 'initial' | 'ready' | 'ongoing' | 'win' | 'lose' | 'over'

export type Event =
  | {
      name: 'transitionstart' | 'transitionend'
      from?: StateName
      to: StateName
    }
  | {
      name: 'error'
      error: Error
    }

type GameEvent =
  | { type: 'prepare' }
  | { type: 'removeSquare'; square: Square }
  | { type: 'forceEnd'; canRestart?: boolean }
  | { type: 'pause' }
  | { type: 'resume' }

export class Game {
  private gen!: GameGenerator
  private state!: State
  private dispatchedEvents: Writable<Event>

  constructor(private readonly props: GameProps) {
    const { grid } = this.props

    grid.onSquare((square) => {
      try {
        this.sendEvent({ type: 'removeSquare', square })
      } catch (err) {
        this.props.onError(err)
      }
    })

    this.dispatchedEvents = writable<Event>(undefined)

    // NOTE: This is sync, as Initial has no transition
    // when the grid was never created. This call initializes the game's
    // gen and state fields, do not remove.
    this.setState(new Initial({ ...this.props }))
  }

  prepare() {
    return this.sendEvent({ type: 'prepare' })
  }

  forceEnd(canRestart?: boolean) {
    return this.sendEvent({ type: 'forceEnd', canRestart })
  }

  pause() {
    return this.sendEvent({ type: 'pause' })
  }

  resume() {
    return this.sendEvent({ type: 'resume' })
  }

  setGamemode(gamemode: Gamemode): GamemodeSetWhen {
    return this.state.setGamemode(gamemode)
  }

  get events(): Readable<Event> {
    return { subscribe: this.dispatchedEvents.subscribe }
  }

  private setState(state: State): void | Promise<void> {
    const from = this.state?.name

    this.state = state

    this.dispatchedEvents.set({
      name: 'transitionstart',
      from: from,
      to: this.state.name,
    })

    this.state.executeCallback(this.props, { when: 'before', from })

    const done = this.state.transition()
    const setNewState = () => {
      const newGen = this.state.run()
      newGen.next()
      this.gen = newGen

      this.dispatchedEvents.set({
        name: 'transitionend',
        from: from,
        to: this.state.name,
      })

      this.state.executeCallback(this.props, { when: 'after', from })
    }

    if (done) {
      return done.then(setNewState)
    }

    setNewState()
  }

  private sendEvent(ev: GameEvent): void | Promise<void> {
    const { value, done } = this.gen.next(ev)
    if (!done) {
      return
    } else if (!isDefined(value)) {
      const x = {} as never
      const error = new UnreachableError(x, 'Unexpected undefined value on state generator return.')
      this.dispatchedEvents.set({ name: 'error', error })
      throw error
    }

    if (value instanceof Error) {
      this.dispatchedEvents.set({ name: 'error', error: value })
      throw value
    }

    return this.setState(value)
  }
}

type GameGenerator = Generator<void, State | Error, GameEvent>

abstract class State {
  constructor(public readonly name: StateName, protected props: BaseProps) {}

  *run(): GameGenerator {
    let nextYield = this.processEvent(yield)

    while (!nextYield) {
      nextYield = this.processEvent(yield nextYield)
    }

    return nextYield
  }

  abstract setGamemode(gamemode: Gamemode): GamemodeSetWhen
  abstract executeCallback(cbs: Callbacks, data: OnGameData): void
  abstract transition(): void | Promise<void>
  protected abstract processEvent(event: GameEvent): void | State | Error
}

class Initial extends State {
  constructor(props: BaseProps, nextGamemode?: Gamemode) {
    super('initial', props)
    if (nextGamemode) {
      this.props.gamemode = nextGamemode
    }
  }

  protected processEvent(event: GameEvent): void | State | Error {
    switch (event.type) {
      case 'prepare':
        return new Ready(this.props)
      case 'forceEnd':
        if (event.canRestart) {
          return
        }
        return new Over(this.props)
      case 'removeSquare':
      case 'pause':
      case 'resume':
        return new Error('Game not initialized, no attempt started.')
      default:
        throw new UnreachableError(event, `Unimplemented event type received in Initial state.`)
    }
  }

  setGamemode(gamemode: Gamemode): GamemodeSetWhen {
    this.props.gamemode = gamemode
    return 'now'
  }

  executeCallback({ onGameInit }: Callbacks, data: OnGameData): void {
    onGameInit?.({ gamemode: this.props.gamemode.name(), ...data })
  }

  transition(): void | Promise<void> {
    const resetDone = this.props.gamemode.reset()
    if (this.props.grid.activeSquares.length > 0) {
      return Promise.all([resetDone, this.props.grid.destroy()]).then(() => void 0)
    }
    return resetDone
  }
}

class Ready extends State {
  private squareWasRemoved = false
  private nextGamemode: Gamemode

  constructor(props: BaseProps) {
    super('ready', props)
    this.nextGamemode = this.props.gamemode
  }

  protected processEvent(event: GameEvent): void | State | Error {
    switch (event.type) {
      case 'prepare':
        return new Error('Game is ready, already prepared.')
      case 'forceEnd':
        if (event.canRestart) {
          return new Initial(this.props)
        }
        return new Over(this.props)
      case 'pause':
        this.props.grid.toggleInteraction(false)
        return
      case 'resume':
        this.props.grid.toggleInteraction(true)
        return
      case 'removeSquare':
        return this.onRemoveSquare(event.square)
      default:
        throw new UnreachableError(event, `Unimplemented event type received in Ready state.`)
    }
  }

  private onRemoveSquare(square: Square): State {
    this.squareWasRemoved = true
    const attempt = startAttempt({ gamemode: this.props.gamemode.name(), numSquares: this.props.grid.numTotalSquares })
    const { grid, gamemode } = this.props

    const done = grid.removeSquare(square)
    if (gamemode.shouldDestroy(grid, square)) {
      return new End(this.props, this.nextGamemode, attempt, 'lose')
    } else if (grid.activeSquares.length === 0) {
      return new End(this.props, this.nextGamemode, attempt, 'win', done)
    }

    return new Ongoing(this.props, this.nextGamemode, attempt)
  }

  setGamemode(gamemode: Gamemode): GamemodeSetWhen {
    if (this.squareWasRemoved) {
      this.nextGamemode = gamemode
      return 'next-game'
    }

    this.props.gamemode = gamemode
    this.nextGamemode = gamemode

    return 'now'
  }

  executeCallback({ onGameReady }: Callbacks, data: OnGameData) {
    onGameReady?.({ gamemode: this.props.gamemode.name(), ...data })
  }

  transition() {
    return this.props.grid.create()
  }
}

class Ongoing extends State {
  constructor(props: BaseProps, private nextGamemode: Gamemode, private readonly attempt: OngoingAttempt) {
    super('ongoing', props)
  }

  protected processEvent(event: GameEvent): void | State | Error {
    switch (event.type) {
      case 'prepare':
        return new Error('Game is ongoing, already prepared.')
      case 'forceEnd':
        if (event.canRestart) {
          return new Initial(this.props, this.nextGamemode)
        }
        return new Over(this.props)
      case 'removeSquare':
        return this.onRemoveSquare(event.square)
      case 'pause':
        this.attempt.pause()
        this.props.gamemode.pause()
        this.props.grid.toggleInteraction(false)
        return
      case 'resume':
        this.attempt.resume()
        this.props.gamemode.resume()
        this.props.grid.toggleInteraction(true)
        return
      default:
        throw new UnreachableError(event, `Unimplemented event type received in Ongoing state.`)
    }
  }

  setGamemode(gamemode: Gamemode): GamemodeSetWhen {
    this.nextGamemode = gamemode
    return 'next-game'
  }

  executeCallback({ onGameStart }: Callbacks, data: OnGameData): void {
    onGameStart?.({ attempt: this.attempt, ...data })
  }

  private onRemoveSquare(square: Square): State | void {
    const { grid, gamemode } = this.props

    const done = grid.removeSquare(square)
    if (gamemode.shouldDestroy(grid, square)) {
      return new End(this.props, this.nextGamemode, this.attempt, 'lose')
    } else if (grid.activeSquares.length === 0) {
      return new End(this.props, this.nextGamemode, this.attempt, 'win', done)
    }

    return
  }

  transition() {
    return
  }
}

class End extends State {
  private readonly attempt: Attempt

  constructor(
    props: BaseProps,
    nextGamemode: Gamemode,
    ongoingAttempt: OngoingAttempt,
    private readonly kind: 'win' | 'lose',
    private readonly lastOp?: Promise<void>
  ) {
    super(kind, props)
    this.attempt = ongoingAttempt.end(kind === 'win')
    this.props.gamemode = nextGamemode
  }

  protected processEvent(event: GameEvent): void | State | Error {
    switch (event.type) {
      case 'prepare':
        return new Ready(this.props)
      case 'forceEnd':
        if (event.canRestart) {
          return
        }
        return new Over(this.props)
      case 'removeSquare':
      case 'pause':
      case 'resume':
        return new Error(`Game is ${this.kind === 'win' ? 'won' : 'lost'}.`)
    }
  }

  setGamemode(gamemode: Gamemode): GamemodeSetWhen {
    this.props.gamemode = gamemode
    return 'next-game'
  }

  executeCallback({ onGameEnd }: Callbacks, data: OnGameData): void {
    onGameEnd?.({ attempt: this.attempt, ...data })
  }

  async transition() {
    await this.lastOp
    await Promise.all([this.props.gamemode.reset(), this.props.grid.destroy()])
  }
}

class Over extends State {
  constructor(props: BaseProps) {
    super('over', props)
  }

  protected processEvent(): void | State | Error {
    return new Error('Game over.')
  }

  setGamemode(): GamemodeSetWhen {
    throw new Error('Game over.')
  }

  executeCallback({ onGameOver }: Callbacks, data: OnGameData): void {
    onGameOver?.({ ...data })
  }

  async transition() {
    await this.props.grid.destroy()
  }
}
