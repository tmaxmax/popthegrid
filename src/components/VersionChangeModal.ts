import { assertNonNull } from '$util/assert'
import { Component } from './internal/Component'

export class VersionChangeModal extends Component<HTMLDivElement, false> {
  constructor(root: HTMLDivElement | null) {
    assertNonNull(root)
    super({ alreadyExisting: true, element: root })
  }

  public async show(): Promise<void> {
    this.addClass('visible')
    this.element.querySelector('.versionchange-content')!.classList.add('visible')
    await this.eventsRace(['transitionend', 'transitioncancel'])
  }
}
