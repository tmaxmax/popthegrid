import { isDefined } from '../util'

interface ComponentFromExisting<T extends HTMLElement> {
  alreadyExisting: true
  element: T
}

interface ComponentFromTag {
  alreadyExisting?: false
  tag: keyof HTMLElementTagNameMap
  classList?: string[]
}

export class Component<T extends HTMLElement> {
  protected readonly element: T
  private readonly computedStyle: CSSStyleDeclaration

  protected constructor(props: ComponentFromTag | ComponentFromExisting<T>) {
    if (props.alreadyExisting) {
      this.element = props.element
    } else {
      this.element = document.createElement(props.tag) as T
      if (isDefined(props.classList)) {
        this.addClass(...props.classList)
      }
    }
    this.computedStyle = getComputedStyle(this.element)
  }

  /**
   * Add a class to the element
   * @param name The class name
   */
  protected addClass(...name: string[]): void {
    this.element.classList.add(...name)
  }

  /**
   * Remove a class from the element
   * @param name The class name
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
  protected setStyle(name: string, value: string): void {
    this.element.style.setProperty(name, value)
  }

  /**
   * Get a CSS style property computed value
   * @param name The CSS style name
   */
  protected getComputedStyle(name: string): string {
    return this.computedStyle.getPropertyValue(name)
  }

  /**
   * Add an event listener to the component
   * @param event The event type
   * @param callback The event callback
   */
  protected addEventListener<S extends Component<T>>(
    event: keyof HTMLElementEventMap | string,
    callback: (this: S, ev: Event) => void,
    options?: boolean | AddEventListenerOptions
  ): void {
    this.element.addEventListener(event, callback, options)
  }

  /**
   * Remove the callback triggered by the desired event type
   * @param event The event type
   * @param callback The event callback
   */
  protected removeEventListener<S extends Component<T>>(
    event: keyof HTMLElementEventMap | string,
    callback: (this: S, ev: Event) => void,
    options?: boolean | EventListenerOptions
  ): void {
    this.element.removeEventListener(event, callback, options)
  }

  protected get text(): string {
    return this.element.innerText
  }

  protected set text(value: string) {
    this.element.innerText = value
  }

  /**
   * Insert a component at the end of this component's tree
   * @param child The component to be appended
   */
  protected append<T extends HTMLElement>(child: Component<T>): void {
    this.element.append(child.element)
  }

  /**
   * Append this component to another component's tree
   * @param parent The component to append to
   */
  protected appendTo<T extends HTMLElement>(parent: Component<T>): void {
    parent.append(this)
  }

  /**
   * Remove this component from the DOM tree
   */
  protected remove(): void {
    this.element.remove()
  }

  static from<T extends HTMLElement>(element: T): Component<T> {
    return new Component({ alreadyExisting: true, element })
  }
  static body = Component.from(document.body || document.documentElement)
  static head = Component.from(document.head)
}
