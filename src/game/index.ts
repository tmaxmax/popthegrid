import { UnreachableError, isDefined } from '$util/index'
import { Attempt, OngoingAttempt, startAttempt } from './attempt'
import { Gamemode } from './gamemode'
import { Grid, Square } from './grid'

export interface OnGameEndData {
  attempt: Attempt
}

export interface OnGameStartData {
  attempt: OngoingAttempt
}

export interface GameProps {
  grid: Grid
  gamemode: Gamemode
  onError(err: Error): unknown
  onGameInit?(): unknown
  onGameReady?(): unknown
  onGameStart?(data: OnGameStartData): unknown
  onGameEnd?(data: OnGameEndData): unknown
  onGameOver?(): unknown
}

type BaseProps = Pick<GameProps, 'grid' | 'gamemode'>
type Callbacks = Omit<GameProps, 'grid' | 'gamemode' | 'onError'>

export type GamemodeSetWhen = 'now' | 'next-game'

type GameEvent =
  | { type: 'prepare' }
  | { type: 'removeSquare'; square: Square }
  | { type: 'forceEnd'; canRestart?: boolean }
  | { type: 'pause' }
  | { type: 'resume' }

export class Game {
  private gen?: GameGenerator
  private state?: State

  constructor(private readonly props: GameProps) {
    const { grid } = this.props

    grid.onSquare((square) => {
      this.sendEvent({ type: 'removeSquare', square }).catch((err) => this.props.onError(err))
    })

    this.setState(new Initial({ ...this.props }))
  }

  async prepare() {
    await this.sendEvent({ type: 'prepare' })
  }

  async forceEnd(canRestart?: boolean) {
    await this.sendEvent({ type: 'forceEnd', canRestart })
  }

  async pause() {
    await this.sendEvent({ type: 'pause' })
  }

  async resume() {
    await this.sendEvent({ type: 'resume' })
  }

  setGamemode(gamemode: Gamemode): GamemodeSetWhen {
    this.assertInit()
    return this.state!.setGamemode(gamemode)
  }

  private async setState(state: State): Promise<void> {
    this.state = state
    await this.state.transition()
    const newGen = this.state.run()
    newGen.next()
    this.gen = newGen
    this.state.executeCallback(this.props)
  }

  private assertInit() {
    if (!this.state || !this.gen) {
      throw new Error('Game not initialized')
    }
  }

  private async sendEvent(ev: GameEvent) {
    this.assertInit()

    const { value, done } = this.gen!.next(ev)
    if (!done) {
      return
    } else if (!isDefined(value)) {
      const x = {} as never
      throw new UnreachableError(x, 'Unexpected undefined value on state generator return.')
    }

    if (value instanceof Error) {
      throw value
    }

    return this.setState(value)
  }
}

type GameGenerator = Generator<void, State | Error, GameEvent>

abstract class State {
  *run(): GameGenerator {
    let nextYield = this.processEvent(yield)

    while (!nextYield) {
      nextYield = this.processEvent(yield nextYield)
    }

    return nextYield
  }

  abstract setGamemode(gamemode: Gamemode): GamemodeSetWhen
  abstract executeCallback(cbs: Callbacks): void
  abstract transition(): Promise<void>
  protected abstract processEvent(event: GameEvent): void | State | Error
}

class Initial extends State {
  constructor(private props: BaseProps, nextGamemode?: Gamemode) {
    super()
    if (nextGamemode) {
      this.props.gamemode = nextGamemode
    }
  }

  protected processEvent(event: GameEvent): State | Error | void {
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
    return 'next-game'
  }

  executeCallback({ onGameInit }: Callbacks): void {
    onGameInit?.()
  }

  async transition() {
    await Promise.all([this.props.grid.destroy(), this.props.gamemode.reset()])
  }
}

class Ready extends State {
  private squareWasRemoved = false
  private nextGamemode: Gamemode

  constructor(private props: BaseProps) {
    super()
    this.nextGamemode = this.props.gamemode
  }

  protected processEvent(event: GameEvent): State | Error | void {
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

  executeCallback({ onGameReady }: Callbacks) {
    onGameReady?.()
  }

  async transition() {
    await this.props.grid.create()
  }
}

class Ongoing extends State {
  constructor(private readonly props: BaseProps, private nextGamemode: Gamemode, private readonly attempt: OngoingAttempt) {
    super()
  }

  protected processEvent(event: GameEvent): void | Error | State {
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
        this.props.grid.toggleInteraction(false)
        return
      case 'resume':
        this.attempt.resume()
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

  executeCallback({ onGameStart }: Callbacks): void {
    onGameStart?.({ attempt: this.attempt })
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

  async transition() {
    return
  }
}

class End extends State {
  private readonly attempt: Attempt

  constructor(
    private props: BaseProps,
    nextGamemode: Gamemode,
    ongoingAttempt: OngoingAttempt,
    private readonly kind: 'win' | 'lose',
    private readonly lastOp?: Promise<void>
  ) {
    super()
    this.attempt = ongoingAttempt.end(kind === 'win')
    this.props.gamemode = nextGamemode
  }

  protected processEvent(event: GameEvent): void | Error | State {
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

  executeCallback({ onGameEnd }: Callbacks): void {
    onGameEnd?.({ attempt: this.attempt })
  }

  async transition() {
    await this.lastOp
    await Promise.all([this.props.gamemode.reset(), this.props.grid.destroy()])
  }
}

class Over extends State {
  constructor(private readonly props: BaseProps) {
    super()
  }

  protected processEvent(): void | Error | State {
    return new Error('Game over.')
  }

  setGamemode(): GamemodeSetWhen {
    throw new Error('Game over.')
  }

  executeCallback({ onGameOver }: Callbacks): void {
    onGameOver?.()
  }

  async transition() {
    await this.props.grid.destroy()
  }
}
