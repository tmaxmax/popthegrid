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
      this.sendEvent({ type: 'removeSquare', square }, true).catch((err) => void err)
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
    const newGen = this.state.run()
    await newGen.next()
    this.gen = newGen
    this.state.executeCallback(this.props)
  }

  private assertInit() {
    if (!this.state || !this.gen) {
      throw new Error('Game not initialized')
    }
  }

  private async sendEvent(ev: GameEvent, useErrorCallback?: boolean) {
    this.assertInit()

    const { value, done } = await this.gen!.next(ev)
    if (!done) {
      return
    } else if (!isDefined(value)) {
      throw new Error('Unexpected undefined value on state generator return.')
    }

    if (value instanceof Error) {
      if (useErrorCallback) {
        this.props.onError(value)
        return
      } else {
        throw value
      }
    }

    await this.setState(value)
  }
}

type GameGenerator = AsyncGenerator<void, State | Error, GameEvent>

abstract class State {
  async *run(): GameGenerator {
    let nextYield = await this.processEvent(yield)

    while (!nextYield) {
      nextYield = await this.processEvent(yield nextYield)
    }

    return nextYield
  }

  abstract setGamemode(gamemode: Gamemode): GamemodeSetWhen
  abstract executeCallback(cbs: Callbacks): void
  protected abstract processEvent(event: GameEvent): Promise<void | State | Error>
}

class Initial extends State {
  private destroyDone: Promise<void>
  private resetDone: void | Promise<void>

  constructor(private props: BaseProps, nextGamemode?: Gamemode) {
    super()
    this.destroyDone = this.props.grid.destroy()
    if (nextGamemode) {
      this.props.gamemode = nextGamemode
    }
    this.resetDone = this.props.gamemode.reset()
  }

  protected async processEvent(event: GameEvent): Promise<State | Error | void> {
    await Promise.all([this.destroyDone, this.resetDone])

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
}

class Ready extends State {
  private squareWasRemoved = false
  private nextGamemode: Gamemode
  private createDone: Promise<void>

  constructor(private props: BaseProps) {
    super()
    this.nextGamemode = this.props.gamemode
    this.createDone = this.props.grid.create()
  }

  protected async processEvent(event: GameEvent): Promise<State | Error | void> {
    await this.createDone

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

  private async onRemoveSquare(square: Square): Promise<State> {
    this.squareWasRemoved = true
    const attempt = startAttempt({ gamemode: this.props.gamemode.name(), numSquares: this.props.grid.numTotalSquares })
    const { grid, gamemode } = this.props

    const done = grid.removeSquare(square)
    if (gamemode.shouldDestroy(grid, square)) {
      return new End(this.props, this.nextGamemode, attempt, 'lose')
    } else if (grid.activeSquares.length === 0) {
      await done
      return new End(this.props, this.nextGamemode, attempt, 'win')
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
}

class Ongoing extends State {
  constructor(private readonly props: BaseProps, private nextGamemode: Gamemode, private readonly attempt: OngoingAttempt) {
    super()
  }

  protected async processEvent(event: GameEvent): Promise<void | Error | State> {
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

  private async onRemoveSquare(square: Square): Promise<State | void> {
    const { grid, gamemode } = this.props

    const done = grid.removeSquare(square)
    if (gamemode.shouldDestroy(grid, square)) {
      return new End(this.props, this.nextGamemode, this.attempt, 'lose')
    } else if (grid.activeSquares.length === 0) {
      await done
      return new End(this.props, this.nextGamemode, this.attempt, 'win')
    }

    return
  }
}

class End extends State {
  private destroyDone: Promise<void>
  private resetDone: void | Promise<void>
  private readonly attempt: Attempt

  constructor(private props: BaseProps, nextGamemode: Gamemode, ongoingAttempt: OngoingAttempt, kind: 'win' | 'lose') {
    super()
    this.attempt = ongoingAttempt.end(kind === 'win')
    this.props.gamemode = nextGamemode
    this.resetDone = this.props.gamemode.reset()
    this.destroyDone = this.props.grid.destroy()
  }

  protected async processEvent(event: GameEvent): Promise<void | Error | State> {
    await Promise.all([this.destroyDone, this.resetDone])

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
        return new Error('Game is lost.')
    }
  }

  setGamemode(gamemode: Gamemode): GamemodeSetWhen {
    this.props.gamemode = gamemode
    return 'next-game'
  }

  executeCallback({ onGameEnd }: Callbacks): void {
    onGameEnd?.({ attempt: this.attempt })
  }
}

class Over extends State {
  private destroyDone: Promise<void>

  constructor(private readonly props: BaseProps) {
    super()
    this.destroyDone = this.props.grid.destroy()
  }

  protected async processEvent(): Promise<void | Error | State> {
    await this.destroyDone
    throw new Error('Method not implemented.')
  }

  setGamemode(): GamemodeSetWhen {
    throw new Error('Game over.')
  }

  executeCallback({ onGameOver }: Callbacks): void {
    onGameOver?.()
  }
}
