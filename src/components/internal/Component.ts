import { isDefined } from '$util'
import { isBindable } from '$util/functions'

interface ComponentFromExisting<T extends HTMLElement> {
  alreadyExisting: true
  element: T
}

interface ComponentFromTag<K extends keyof HTMLElementTagNameMap> {
  alreadyExisting?: false
  tag: K
  classList?: string[]
}

export type KnownHTMLElement = HTMLElementTagNameMap[keyof HTMLElementTagNameMap]

export type ComponentProps<T extends KnownHTMLElement> =
  | ComponentFromTag<T extends HTMLElementTagNameMap[infer K extends keyof HTMLElementTagNameMap] ? K : never>
  | ComponentFromExisting<T>

type EventOptions = Omit<AddEventListenerOptions, 'once' | 'signal'> & {
  stopPropagation?: 'further' | 'immediate'
} & ({ timeout?: number } | { signal?: AbortSignal })

export class Component<T extends KnownHTMLElement = HTMLElement> {
  public readonly element: T
  private computedStyle?: CSSStyleDeclaration

  protected constructor(props: ComponentProps<T>) {
    if (props.alreadyExisting) {
      this.element = props.element
    } else {
      this.element = document.createElement(props.tag) as T
      if (isDefined(props.classList)) {
        this.addClass(...props.classList)
      }
    }
  }

  /**
   * Adds classes to the element
   * @param name The classes
   */
  protected addClass(...name: string[]): void {
    this.element.classList.add(...name)
  }

  /**
   * Removes classes from the element
   * @param name The classes
   */
  protected removeClass(...name: string[]): void {
    this.element.classList.remove(...name)
  }

  /**
   * Get the value from an attribute of the component
   * @param name The attribute's name
   */
  protected getAttribute(name: string): string | null {
    return this.element.getAttribute(name)
  }

  /**
   * Set the value of an attribute of the component
   * @param name The attribute's name
   * @param value The attribute's new value
   */
  protected setAttribute(name: string, value: string): void {
    this.element.setAttribute(name, value)
  }

  /**
   * Get a CSS style rule or variable name
   * @param name The CSS style or variable name
   */
  protected getStyle(name: string): string {
    return this.element.style.getPropertyValue(name)
  }

  /**
   * Set a CSS style rule or variable's value
   * @param name The CSS style or variable name
   * @param value The new value
   */
  protected setStyle(name: string, value: string | null): void {
    this.element.style.setProperty(name, value)
  }

  /**
   * Get a CSS style property computed value
   * @param name The CSS style name
   */
  protected getComputedStyle(name: string): string {
    if (!this.computedStyle) {
      this.computedStyle = window.getComputedStyle(this.element)
    }

    return this.computedStyle.getPropertyValue(name)
  }

  /**
   * Add an event listener to the component
   * @param event The event type
   * @param callback The event callback
   */
  protected addEventListener<S extends Component<T>, E extends keyof HTMLElementEventMap>(
    event: E,
    callback: (this: S, ev: HTMLElementEventMap[E]) => void,
    options?: AddEventListenerOptions
  ): void {
    if (isBindable(callback)) {
      // @ts-expect-error if the function is bindable then it has no `this`.
      // it would be impossible, in this case, for `this` to have a different type.
      callback = callback.bind(this)
    }

    // @ts-expect-error `this` is different than expected, but the `this` from addEventListener is not used.
    this.element.addEventListener(event, callback, options)
  }

  /**
   * Remove the callback triggered by the desired event type
   * @param event The event type
   * @param callback The event callback
   */
  protected removeEventListener<S extends Component<T>, E extends keyof HTMLElementEventMap>(
    event: E,
    callback: (this: S, ev: HTMLElementEventMap[E]) => void,
    options?: AddEventListenerOptions
  ): void {
    // @ts-expect-error same as above
    this.element.removeEventListener(event, callback, options)
  }

  protected event<E extends keyof HTMLElementEventMap>(event: E, options?: EventOptions): Promise<HTMLElementEventMap[E]> {
    type Ev = HTMLElementEventMap[E]

    return new Promise<Ev>((resolve, reject) => {
      const opts: AddEventListenerOptions = {
        once: true,
      }

      // What type is this?
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let timeoutID: any

      if (options) {
        opts.capture = options.capture
        opts.passive = options.passive

        if ('signal' in options) {
          opts.signal = options.signal
        } else if ('timeout' in options && options.timeout) {
          const controller = new AbortController()
          timeoutID = setTimeout(() => controller.abort(), options.timeout)
          opts.signal = controller.signal
        }
      }

      const callback = (e: Event) => {
        if (options?.stopPropagation) {
          switch (options.stopPropagation) {
            case 'further':
              e.stopPropagation()
              break
            case 'immediate':
              e.stopImmediatePropagation()
              break
            default:
              reject(new Error(`Unhandled stop propagation type ${options.stopPropagation}`))
              return
          }
        }

        if (timeoutID) {
          clearTimeout(timeoutID)
        }

        resolve(e as Ev)
      }

      this.element.addEventListener(event, callback, opts)
    })
  }

  private events(events: (keyof HTMLElementEventMap)[], options?: EventOptions): Promise<Event>[] {
    return events.map((e) => this.event(e, options))
  }

  protected eventsAll(events: (keyof HTMLElementEventMap)[], options?: EventOptions): Promise<Event[]> {
    return Promise.all(this.events(events, options))
  }

  protected eventsRace(events: (keyof HTMLElementEventMap)[], options?: EventOptions): Promise<Event> {
    return Promise.race(this.events(events, options))
  }

  protected async waitForAnimation(signal?: AbortSignal, options?: { endOnly?: boolean }): Promise<void> {
    const events: (keyof HTMLElementEventMap)[] = ['animationend', 'animationcancel']
    if (options?.endOnly) {
      events.splice(1)
    }

    await this.eventsRace(events, { stopPropagation: 'immediate', signal })
  }

  protected get text(): string {
    return this.element.textContent || ''
  }

  protected set text(value: string) {
    this.element.textContent = value
  }

  /**
   * Insert a component at the end of this component's tree
   * @param child The component to be appended
   */
  protected append(child: Component): void {
    this.element.append(child.element)
  }

  /**
   * Append this component to another component's tree
   * @param parent The component to append to
   */
  protected appendTo(parent: Component): void {
    parent.append(this)
  }

  /**
   * Remove this component from the DOM tree
   */
  protected remove(): void {
    this.element.remove()
  }

  static from<T extends HTMLElement>(element: T): Component<T> {
    return new Component<T>({ alreadyExisting: true, element })
  }
  static body = Component.from(document.body || document.documentElement)
  static head = Component.from(document.head)
}
