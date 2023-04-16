import fs from 'fs'
import path from 'path'
import { Component } from '$components/internal/Component'
import randInt from '$util/randInt'
import { fireClick } from '$util'
import { Grid } from '$components/Grid'
import { Square } from '$components/Square'

import { test, expect, vi } from 'vitest'

test('Grid', async () => {
  document.write(fs.readFileSync(path.resolve(__dirname, '..', '..', 'index.html')).toString())
  const parentDOM = document.querySelector('.grid__parent') as HTMLElement
  expect(parentDOM).not.toBeNull()
  const colors = ['#000', '#fff']
  const squareCount = 48
  const callback = vi.fn(async function (this: Square) {
    expect(colors).toContain(this.color)
    const prevSquareCount = grid.squareCount
    await grid.removeSquare(this)
    expect(grid.squareCount).toBe(prevSquareCount - 1)
  })
  const grid = new Grid({
    squareCount,
    colors,
    squareEventListeners: [
      {
        event: 'click',
        callback,
      },
    ],
  })
  await grid.create(Component.from(parentDOM), false)
  expect(parentDOM.children.length).toBe(1)
  const gridDOM = parentDOM.querySelector('.grid') as HTMLElement
  expect(gridDOM).not.toBeNull()
  expect(gridDOM.children.length).toBe(squareCount)
  fireClick(gridDOM.children.item(randInt(gridDOM.children.length)) as Element)
  expect(callback).toBeCalled()
  cleanupDOM()
})
