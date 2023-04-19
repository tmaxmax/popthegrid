import './Animated.css'

import { Component, ComponentProps, KnownHTMLElement } from './Component'

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
  duration: DurationString | AnimationDuration
}

const CSS_VAR_NAME = 'animation-duration'

export class Animated<T extends KnownHTMLElement = HTMLElement> extends Component<T> {
  private duration!: Required<AnimationDuration>
  private children: Animated[] = []

  constructor(props: AnimatedProps<T>) {
    super(props)

    // This is important, as it assigns the duration.
    this.animationDuration = props.duration
  }

  async create(parent: Component, animate: boolean): Promise<void> {
    this.appendTo(parent)

    const promiseList: Promise<void>[] = []

    if (animate) {
      this.removeClass(DESTROY_ANIMATION_CLASS_NAME)
      this.addClass(CREATE_ANIMATION_CLASS_NAME)
      promiseList.push(this.waitForAnimation())
    }

    promiseList.push(...this.children.map((c) => c.create(this, animate)))

    await Promise.all(promiseList)
  }

  async destroy(animate: boolean): Promise<void> {
    const promiseList: Promise<void>[] = []

    if (animate) {
      this.removeClass(CREATE_ANIMATION_CLASS_NAME)
      this.addClass(DESTROY_ANIMATION_CLASS_NAME)
      promiseList.push(this.waitForAnimation())
    }

    promiseList.push(...this.children.map((c) => c.destroy(animate)))

    await Promise.all(promiseList)

    this.remove()
  }

  set animationDuration(duration: DurationString | AnimationDuration) {
    if (typeof duration === 'string') {
      this.duration = {
        create: duration,
        destroy: duration,
      }
    } else {
      this.duration = {
        create: duration.create,
        destroy: duration.destroy || duration.create,
      }
    }

    this.setStyle(`--${CSS_VAR_NAME}-${CREATE_ANIMATION_CLASS_NAME}`, this.duration.create)
    this.setStyle(`--${CSS_VAR_NAME}-${DESTROY_ANIMATION_CLASS_NAME}`, this.duration.destroy)
  }

  get animationDuration(): AnimationDuration {
    return this.duration
  }

  protected appendChild(component: Animated) {
    this.children.push(component)
  }
}
