import { UnreachableError, isDefined, randString } from '$util/index.ts'
import { writable, type Readable, type Writable, readonly } from 'svelte/store'
import { startAttempt } from './attempt.ts'
import type { Attempt, OngoingAttempt } from './attempt.ts'
import { Gamemode, type GamemodeName } from './gamemode/index.ts'
import type { Grid, Square, Animation } from './grid/index.ts'
import type { GameEvent } from './state.ts'
import type { Tracer } from './trace.ts'
import { Rand, type RandState } from '$rand'

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
  tracer: Tracer
  rand: RandState
  onError(err: unknown): unknown
  onGameInit?(data: OnGameInitData): unknown
  onGameReady?(data: OnGameReadyData): unknown
  onGameStart?(data: OnGameStartData): unknown
  onGameEnd?(data: OnGameEndData): unknown
  onGameOver?(data: OnGameOverData): unknown
  onGamePause?(data: OnGameData): unknown
}

type BaseProps = Pick<GameProps, 'grid' | 'gamemode' | 'rand'> & { nextGamemode?: Gamemode }
type Callbacks = Omit<GameProps, 'grid' | 'gamemode' | 'rand' | 'onError'>

export type GamemodeSetWhen = 'now' | 'next-game'

export type CallbackWhen = 'before' | 'after'

export type StateName = 'initial' | 'ready' | 'ongoing' | 'win' | 'lose' | 'over' | 'pause'

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

export class Game {
  private state!: State
  private dispatchedEvents: Writable<Event>
  private tracer: Tracer

  constructor(private readonly props: GameProps) {
    const { grid, tracer } = this.props

    this.tracer = tracer

    grid.onSquare((square, _, pev) => {
      try {
        const gev = { type: 'removeSquare', square } as const
        if (pev) {
          this.tracer.gameRemoveSquare(gev, pev)
        }
        this.sendEvent(gev)
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

  prepare(animation: Animation) {
    return this.sendEvent({ type: 'prepare', animation })
  }

  forceEnd(canRestart?: boolean) {
    return this.sendEvent({ type: 'forceEnd', canRestart })
  }

  pause() {
    const token = randString(8)
    this.sendEvent({ type: 'pause', token })

    return token
  }

  resume(token: string) {
    return this.sendEvent({ type: 'resume', token })
  }

  setGamemode(gamemode: Gamemode): GamemodeSetWhen {
    return this.state.setGamemode(gamemode)
  }

  get events(): Readable<Event> {
    return readonly(this.dispatchedEvents)
  }

  private setState(state: State): void | Promise<void> {
    const from = this.state?.name
    const to = state.name

    this.dispatchedEvents.set({ name: 'transitionstart', from, to })
    state.executeCallback(this.props, { when: 'before', from })

    const done = state.transition()
    const endTransition = () => {
      // Set state on Game only after transition so no events
      // can be sent to this new state before it finishes configuring.
      // Set it before dispatching events to Svelte interface
      // and to the Game object event listeners themselves so they
      // can use this new state after it is configured.
      this.state = state
      this.dispatchedEvents.set({ name: 'transitionend', from, to })
      this.state.executeCallback(this.props, { when: 'after', from })
    }

    if (done) {
      return done.then(endTransition)
    }

    endTransition()
  }

  private sendEvent(ev: GameEvent): void | Promise<void> {
    if (ev.type !== 'removeSquare') {
      // The removeSquare events is traced differently in the grid.onSquare handler.
      this.tracer.game(ev)
    }

    const res = this.state.processEvent(ev)
    if (!res) {
      return
    }

    if (res instanceof Error) {
      this.tracer.clear()
      this.dispatchedEvents.set({ name: 'error', error: res })
      throw res
    }

    return this.setState(res)
  }
}

abstract class State {
  constructor(
    public readonly name: StateName,
    protected props: BaseProps,
  ) {}

  properties(): BaseProps {
    return { ...this.props }
  }

  abstract setGamemode(gamemode: Gamemode): GamemodeSetWhen
  abstract executeCallback(cbs: Callbacks, data: OnGameData): void
  abstract transition(): void | Promise<void>
  abstract processEvent(event: GameEvent): void | State | Error
}

interface EndProps {
  attempt: OngoingAttempt
  kind: 'win' | 'lose'
  lastOp?: Promise<void>
  rand: RandState
}

class Initial extends State {
  private readonly attempt?: Attempt
  private readonly lastOp?: Promise<void>
  private readonly rand: RandState

  constructor(props: BaseProps, end?: EndProps) {
    super(end?.kind || 'initial', props)
    // Initial also implements the Win and Lose states.
    // If this is the end of the game, we want to not play
    // the usual grid destroy animation and let instead
    // whatever happens at the end of the game play.
    if (end) {
      this.attempt = end.attempt.end(end.kind === 'win')
      this.lastOp = end.lastOp
      this.rand = end.rand
    } else {
      this.rand = props.rand
    }
    // If the player switched gamemodes mid-play set it now,
    // since the previous game is over.
    if (this.props.nextGamemode) {
      this.props.gamemode = this.props.nextGamemode
      this.props.nextGamemode = undefined
    }
  }

  processEvent(event: GameEvent): void | State | Error {
    switch (event.type) {
      case 'prepare':
        return new Ready(this.props, event.animation, this.rand)
      case 'forceEnd':
        if (event.canRestart) {
          return
        }
        return new Over(this.props)
      case 'removeSquare':
        return new Error('Game is not started, cannot remove square.')
      case 'pause':
        return new Pause(this, event.token)
      case 'resume':
        return
      default:
        throw new UnreachableError(event, `Unimplemented event type received in Initial state.`)
    }
  }

  setGamemode(gamemode: Gamemode): GamemodeSetWhen {
    this.props.gamemode = gamemode
    return 'now'
  }

  executeCallback({ onGameInit, onGameEnd }: Callbacks, data: OnGameData): void {
    if (this.name === 'initial') {
      onGameInit?.({ gamemode: this.props.gamemode.properties.name, ...data })
    } else {
      onGameEnd?.({ attempt: this.attempt!, ...data })
    }
  }

  transition(): void | Promise<void> {
    if (this.lastOp) {
      return this.transitionLastOp()
    }

    const resetDone = this.props.gamemode.reset()
    if (this.props.grid.activeSquares.length > 0) {
      return Promise.all([resetDone, this.props.grid.destroy('short')]).then(() => void 0)
    }

    return resetDone
  }

  private async transitionLastOp() {
    await this.lastOp
    await Promise.all([this.props.grid.destroy('none'), this.props.gamemode.reset()])
  }
}

class Ready extends State {
  private rand?: Rand

  constructor(
    props: BaseProps,
    private readonly animation: Animation,
    private readonly randState: RandState,
  ) {
    super('ready', props)
  }

  processEvent(event: GameEvent): void | State | Error {
    switch (event.type) {
      case 'prepare':
        return new Error('Game is ready, already prepared.')
      case 'forceEnd':
        if (event.canRestart) {
          return new Initial(this.props)
        }
        return new Over(this.props)
      case 'pause':
        return new Pause(this, event.token)
      case 'resume':
        return
      case 'removeSquare':
        return this.onRemoveSquare(event.square)
      default:
        throw new UnreachableError(event, `Unimplemented event type received in Ready state.`)
    }
  }

  private onRemoveSquare(square: Square): State {
    // must exist since it was set in transition and onRemoveSquare
    // can't execute before transitione ends.
    const rand = this.rand!
    const { grid, gamemode } = this.props
    const attempt = startAttempt({
      gamemode: gamemode.properties.name,
      numSquares: grid.numTotalSquares,
      randState: this.randState,
    })

    const progress = gamemode.progress(grid, square, rand)
    // In case first destroyed square already decided the fate of the game.
    if (progress.state === 'lose') {
      return new Initial(this.props, { attempt, kind: 'lose', rand: rand.state() })
    } else if (progress.state === 'win') {
      return new Initial(this.props, { attempt, kind: 'win', lastOp: progress.done, rand: rand.state() })
    }

    return new Ongoing(this.props, attempt, this.rand!)
  }

  setGamemode(gamemode: Gamemode): GamemodeSetWhen {
    // When starting a game, we always want to use
    // the exact random state with which Ready was initialized.
    // Switching gamemodes may advance random state (when switching
    // to gamemodes with critical squares) so it must be reset.
    this.rand = new Rand(this.randState)

    this.props.gamemode = gamemode
    if (gamemode.properties.criticalSquares) {
      this.props.grid.setColors(this.props.grid.colors, gamemode.initialSquares(this.props.grid.colors.length, this.rand))
    }

    return 'now'
  }

  executeCallback({ onGameReady }: Callbacks, data: OnGameData) {
    onGameReady?.({ gamemode: this.props.gamemode.properties.name, ...data })
  }

  transition() {
    this.rand = new Rand(this.randState)
    const { gamemode, grid } = this.props

    return grid.create(this.animation, gamemode.initialSquares(grid.colors.length, this.rand))
  }
}

class Ongoing extends State {
  constructor(
    props: BaseProps,
    private readonly attempt: OngoingAttempt,
    private readonly rand: Rand,
  ) {
    super('ongoing', props)
  }

  processEvent(event: GameEvent): void | State | Error {
    switch (event.type) {
      case 'prepare':
        return new Error('Game is ongoing, already prepared.')
      case 'forceEnd':
        if (event.canRestart) {
          return new Initial(this.props)
        }
        return new Over(this.props)
      case 'removeSquare':
        return this.onRemoveSquare(event.square)
      case 'pause':
        return new Pause(this, event.token)
      case 'resume':
        return
      default:
        throw new UnreachableError(event, `Unimplemented event type received in Ongoing state.`)
    }
  }

  setGamemode(gamemode: Gamemode): GamemodeSetWhen {
    this.props.nextGamemode = gamemode
    return 'next-game'
  }

  executeCallback({ onGameStart }: Callbacks, data: OnGameData): void {
    onGameStart?.({ attempt: this.attempt, ...data })
  }

  private onRemoveSquare(square: Square): State | void {
    const { grid, gamemode } = this.props

    const progress = gamemode.progress(grid, square, this.rand)
    if (progress.state === 'lose') {
      return new Initial(this.props, { attempt: this.attempt, kind: 'lose', rand: this.rand.state() })
    } else if (progress.state === 'win') {
      return new Initial(this.props, { attempt: this.attempt, kind: 'win', lastOp: progress.done, rand: this.rand.state() })
    }

    return
  }

  transition() {
    return
  }
}

class Over extends State {
  constructor(props: BaseProps) {
    super('over', props)
  }

  processEvent(): void | State | Error {
    return new Error('Game over.')
  }

  setGamemode(): GamemodeSetWhen {
    throw new Error('Game over.')
  }

  executeCallback({ onGameOver }: Callbacks, data: OnGameData): void {
    onGameOver?.({ ...data })
  }

  async transition() {
    await this.props.grid.destroy('long')
  }
}

class Pause extends State {
  constructor(
    private previousState: State,
    private readonly token: string,
  ) {
    super('pause', previousState.properties())
  }

  processEvent(event: GameEvent): void | State | Error {
    switch (event.type) {
      case 'prepare':
        return new Error('Game is paused, already prepared.')
      case 'removeSquare':
        return new Error("Game is paused, can't remove square.")
      case 'forceEnd':
        if (event.canRestart) {
          return new Initial(this.props)
        }
        return new Over(this.props)
      case 'pause':
        return
      case 'resume':
        // In the sequence of pause-resumes "pause A pause B resume B resume A"
        // only "resume A" should resume the game. This is what tokens are for.
        // Concretely, this happens when the user opens the game menu (A),
        // leaves the window (B), comes back (B), closes the menu (A). Coming back
        // to the game menu should not resume the game.
        if (event.token !== this.token) {
          return
        }
        // Replace the default state transition (e.g. creating the grid for Ready)
        // with one which only resumes the game and re-enables grid interaction.
        return withResumeTransition(this.previousState)
      default:
        throw new UnreachableError(event, `Unimplemented event type received in Pause state.`)
    }
  }

  setGamemode(gamemode: Gamemode): GamemodeSetWhen {
    return this.previousState.setGamemode(gamemode)
  }

  executeCallback({ onGamePause }: Callbacks, data: OnGameData): void {
    onGamePause?.(data)
  }

  transition(): void | Promise<void> {
    this.props.grid.toggleInteraction(false)
    this.props.gamemode.pause()
  }
}

function withResumeTransition(state: State): State {
  interface Wrapped extends State {
    unwrap(): State
  }

  if ('unwrap' in state) {
    return state as Wrapped
  }

  return new Proxy<Wrapped>(state as Wrapped, {
    get(target, p, receiver) {
      switch (p) {
        case 'transition':
          return () => {
            const props = state.properties()
            props.gamemode.resume()
            props.grid.toggleInteraction(true)
          }
        case 'unwrap':
          return () => state
        default:
          return Reflect.get(target, p, receiver)
      }
    },
  })
}
