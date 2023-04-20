import './reset.css'
import './style.css'

import { Component } from '$components/internal/Component'
import { open as openIndexedDB } from '$util/indexedDB'
import schema from '$db/schema'
import { assertNonNull } from '$util/assert'
import { Modal } from '$components/Modal'
import { Fieldset } from '$components/Input/Fieldset'
import { RandomCount } from '$game/gamemode/randomCount'
import { Game } from '$game'
import { GamemodeName } from '$game/gamemode'
import { DOMGrid } from '$game/grid/dom'
import { RandomTimer } from '$game/gamemode/randomTimer'
import { insertAttempt } from '$db/attempt'

const componentFrom = <T extends HTMLElement>(elem: T | null, name: string): Component<T> => {
  assertNonNull(elem, `${name} doesn't exist in the HTML document!`)
  return Component.from(elem)
}

const gridParent = componentFrom(document.querySelector<HTMLElement>('.grid__parent'), 'Grid parent')
const footer = componentFrom(document.querySelector('footer'), 'Footer')

const NUM_COLORS = 5

const game = new Game({
  gamemode: new RandomCount(),
  grid: new DOMGrid({
    numTotalSquares: 48,
    colors: Array.from({ length: NUM_COLORS }, (_, i) => `var(--color-square-${i + 1})`),
    domParent: gridParent,
  }),
  onError(err) {
    console.error(err)
  },
  onGameInit() {
    console.log('Initialized')
  },
  onGameReady() {
    console.log('Ready')
  },
  onGameStart(data) {
    console.log('Started:', data)
  },
  onGameEnd({ attempt }) {
    console.log('Ended:', attempt)
    insertAttempt(db, attempt)
    game.prepare()
  },
  onGameOver() {
    console.log('Over')
  },
})

const gamemodePicker = new Fieldset({
  name: 'gamemode',
  legend: 'Gamemode',
  onChange(name: GamemodeName) {
    switch (name) {
      case 'random':
        game.setGamemode(new RandomCount())
        break
      case 'random-timer':
        game.setGamemode(new RandomTimer({ minSeconds: 4, maxSeconds: 9 }))
        break
    }
  },
  values: [
    {
      name: 'Luck',
      value: 'random',
      default: true,
    },
    {
      name: 'Time (4–9 seconds)',
      value: 'random-timer',
    },
  ],
})

const getVersionChangeModalContent = () => {
  const root = document.createElement('div')
  const title = document.createElement('h2')
  title.append('Game update!')
  root.append(title)
  const content = document.createElement('p')
  content.append('The game was updated! Please refresh the page.')
  root.append(content)
  return root
}

const getVersionChangeModal = () => {
  return new Modal({ content: getVersionChangeModalContent(), allowClose: true, animateClose: true })
}

let db: IDBDatabase

const main = async () => {
  db = await openIndexedDB(window.indexedDB, {
    schema,
    onVersionChange() {
      game.forceEnd(false)
      getVersionChangeModal().create(Component.body, true)
    },
  })
  await gamemodePicker.create(footer, false)
  await game.prepare()
}

main()
