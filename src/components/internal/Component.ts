import { If, IfElse, isDefined } from '$util'
import { isBindable } from '$util/functions'

type HasComputedStyle<T extends boolean> = IfElse<T, { hasComputedStyle: true }, { hasComputedStyle?: false }>

interface ComponentFromExisting<T extends HTMLElement> {
  alreadyExisting: true
  element: T
}

interface ComponentFromTag {
  alreadyExisting?: false
  tag: keyof HTMLElementTagNameMap
  classList?: string[]
}

type Timeout = { timeout?: number }

export class Component<T extends HTMLElement = HTMLElement, U extends boolean = boolean> {
  protected readonly element: T
  private readonly computedStyle?: CSSStyleDeclaration

  protected constructor(props: (ComponentFromTag | ComponentFromExisting<T>) & HasComputedStyle<U>) {
    if (props.alreadyExisting) {
      this.element = props.element
    } else {
      this.element = document.createElement(props.tag) as T
      if (isDefined(props.classList)) {
        this.addClass(...props.classList)
      }
    }
    if (props.hasComputedStyle) {
      this.computedStyle = getComputedStyle(this.element)
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
  protected getComputedStyle(name: string): If<U, string> {
    // @ts-expect-error Typescript is not able to infer types here
    return this.computedStyle?.getPropertyValue(name)
  }

  /**
   * Add an event listener to the component
   * @param event The event type
   * @param callback The event callback
   */
  protected addEventListener<S extends Component<T, U>, E extends keyof HTMLElementEventMap>(
    event: E,
    callback: (this: S, ev: HTMLElementEventMap[E]) => void,
    options?: boolean | AddEventListenerOptions
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
  protected removeEventListener<S extends Component<T, U>, E extends keyof HTMLElementEventMap>(
    event: E,
    callback: (this: S, ev: HTMLElementEventMap[E]) => void,
    options?: boolean | EventListenerOptions
  ): void {
    // @ts-expect-error same as above
    this.element.removeEventListener(event, callback, options)
  }

  protected event<E extends keyof HTMLElementEventMap>(
    event: E,
    options?: boolean | (EventListenerOptions & Timeout)
  ): Promise<HTMLElementEventMap[E]> {
    type Ev = HTMLElementEventMap[E]

    return new Promise<Ev>((resolve, reject) => {
      const callback = (e: Ev) => {
        this.element.removeEventListener(event, callback, options)
        resolve(e)
      }

      if (options && typeof options !== 'boolean' && 'timeout' in options) {
        setTimeout(() => {
          this.element.removeEventListener(event, callback, options)
          reject()
        }, options.timeout)
      }

      this.element.addEventListener(event, callback, options)
    })
  }

  private events(events: (keyof HTMLElementEventMap)[]): Promise<Event>[] {
    return events.map((e) => this.event(e))
  }

  protected eventsAll(events: (keyof HTMLElementEventMap)[]): Promise<Event[]> {
    return Promise.all(this.events(events))
  }

  protected eventsRace(events: (keyof HTMLElementEventMap)[]): Promise<Event> {
    return Promise.race(this.events(events))
  }

  protected async waitForAnimation(): Promise<void> {
    await this.eventsRace(['animationend', 'animationcancel'])
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

  static from<T extends HTMLElement, U extends boolean>(element: T, hasComputedStyle?: U): Component<T, U> {
    return new Component<T, U>({ alreadyExisting: true, element, hasComputedStyle })
  }
  static body = Component.from(document.body || document.documentElement)
  static head = Component.from(document.head)
}
