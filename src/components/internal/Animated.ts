import './Animated.css'

import { Component } from './Component'
import type { ComponentProps, KnownHTMLElement } from './Component'

const CREATE_ANIMATION_CLASS_NAME = 'visible'
const DESTROY_ANIMATION_CLASS_NAME = 'hidden'

export type DurationString = `${number | `.${number}`}${'ms' | 's'}`

export interface AnimationDuration {
  create: DurationString
  destroy?: DurationString
}

export type AnimatedProps<T extends KnownHTMLElement> = ComponentProps<T> & {
  /**
   * The duration of the create & destroy animations.
   * If a DurationString is given, the create & destroy animations will have the same duration.
   * If an AnimationDuration object is given and its property 'destroyed' is set,
   * then the animation durations will differ
   */
  duration?: DurationString | AnimationDuration
}

const CSS_VAR_NAME = 'animation-duration'

export class Animated<T extends KnownHTMLElement = HTMLElement> extends Component<T> {
  private duration?: Required<AnimationDuration>
  private children: Animated[] = []
  private op?: AbortController

  constructor(props: AnimatedProps<T>) {
    super(props)

    // This is important, as it assigns the duration.
    this.animationDuration = props.duration
  }

  async create(parent: Component, animate: boolean): Promise<void> {
    const signal = this.startOperation()

    this.appendTo(parent)

    const promiseList: Promise<void>[] = []

    if (animate && this.duration) {
      this.removeClass(DESTROY_ANIMATION_CLASS_NAME)
      this.addClass(CREATE_ANIMATION_CLASS_NAME)
      promiseList.push(this.waitForAnimation(signal))
    }

    promiseList.push(...this.children.map((c) => c.create(this, animate)))

    await Promise.all(promiseList)
  }

  async destroy(animate: boolean): Promise<void> {
    const signal = this.startOperation()
    const promiseList: Promise<void>[] = []

    if (animate && this.duration) {
      this.removeClass(CREATE_ANIMATION_CLASS_NAME)
      this.addClass(DESTROY_ANIMATION_CLASS_NAME)
      promiseList.push(this.waitForAnimation(signal))
    }

    promiseList.push(...this.children.map((c) => c.destroy(animate)))

    await Promise.all(promiseList)

    if (!signal.aborted) {
      this.remove()
    }
  }

  set animationDuration(duration: DurationString | AnimationDuration | undefined) {
    const cssCreateVarName = `--${CSS_VAR_NAME}-${CREATE_ANIMATION_CLASS_NAME}`
    const cssDestroyVarName = `--${CSS_VAR_NAME}-${DESTROY_ANIMATION_CLASS_NAME}`

    switch (typeof duration) {
      case 'undefined':
        this.duration = undefined
        this.setStyle(cssCreateVarName, null)
        this.setStyle(cssDestroyVarName, null)

        return
      case 'string':
        this.duration = {
          create: duration,
          destroy: duration,
        }
        break
      default:
        this.duration = {
          create: duration.create,
          destroy: duration.destroy || duration.create,
        }
        break
    }

    this.setStyle(cssCreateVarName, this.duration.create)
    this.setStyle(cssDestroyVarName, this.duration.destroy)
  }

  get animationDuration(): AnimationDuration | undefined {
    return this.duration
  }

  protected appendChild(component: Animated) {
    this.children.push(component)
  }

  private startOperation(): AbortSignal {
    this.op?.abort()
    this.op = new AbortController()
    return this.op.signal
  }

  static from<T extends KnownHTMLElement>(element: T, duration?: DurationString | AnimationDuration): Animated<T> {
    return new Animated({ element, alreadyExisting: true, duration })
  }
}
