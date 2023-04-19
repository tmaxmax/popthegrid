import './Fieldset.css'

import { Animated } from '$components/internal/Animated'

export interface Value<T extends string> {
  name: string
  value: T
  default?: boolean
}

export interface FieldsetProps<T extends string> {
  name: string
  legend?: string
  values: Value<T>[]
  onChange(newValue: T): unknown
}

export class Fieldset<T extends string> extends Animated<HTMLFieldSetElement> {
  private readonly inputs: HTMLInputElement[]

  constructor(props: FieldsetProps<T>) {
    super({ tag: 'fieldset' })

    if (props.legend) {
      this.appendChild(buildLegend(props.legend))
    }

    const { content, inputs } = buildContent(props)
    this.appendChild(content)
    this.inputs = inputs

    this.addEventListener('change', (ev) => {
      const value = (ev.target as HTMLInputElement).value as T
      props.onChange(value)
    })
  }

  get disabled(): boolean {
    return this.inputs[0].disabled
  }

  set disabled(isDisabled: boolean) {
    this.inputs.forEach((i) => (i.disabled = isDisabled))
  }
}

function buildLegend(content: string) {
  const legend = document.createElement('legend')
  legend.append(content)

  return Animated.from(legend)
}

function buildContent<T extends string>(props: FieldsetProps<T>) {
  const layout = document.createElement('div')
  layout.classList.add('fieldset-layout')

  const choices = props.values.map((v, i) => {
    const id = `${props.name}-${i}`

    const label = document.createElement('label')
    label.setAttribute('for', id)

    const input = document.createElement('input')
    input.setAttribute('type', 'radio')
    input.setAttribute('name', 'gamemode')
    input.setAttribute('id', id)
    input.setAttribute('value', v.value)

    if (v.default) {
      input.checked = true
    }

    const displaySpan = document.createElement('span')

    const radioSpan = document.createElement('span')
    radioSpan.classList.add('radio')

    displaySpan.append(radioSpan, v.name)

    label.append(input, displaySpan)

    return { label, input }
  })

  const inputs = choices.map((c) => c.input)

  layout.append(...choices.map((c) => c.label))

  return { content: Animated.from(layout), inputs }
}
