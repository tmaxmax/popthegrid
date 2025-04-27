import type { Grid, Square } from '$game/grid'
import rand from '$rand'
import { intn, pick } from '$util/index'
import { Gamemode, type Progress } from '.'

export class OddOneOut extends Gamemode {
  properties = {
    name: 'odd-one-out',
    criticalSquares: true,
  } as const

  initialSquares(numColors: number) {
    return this.genSquares(numColors, 48)
  }

  progress(grid: Grid, squareToRemove: Square): Progress {
    const done = grid.removeSquare(squareToRemove)
    const lose = grid.activeSquares.some((s) => s !== squareToRemove && s.color === squareToRemove.color)
    const count = grid.activeSquares.length

    if (lose) {
      return { done, state: 'lose' }
    } else if (count === 0) {
      return { done, state: 'win' }
    }

    if (count > 1) {
      grid.setColors(grid.colors, this.genSquares(grid.colors.length, count))
    }

    return { done, state: 'continue' }
  }

  private genSquares(numColors: number, numSquares: number): number[] {
    const colorSelection = Array.from({ length: numColors }, (_, i) => i)
    let oddColor!: number
    while (colorSelection.length >= Math.min(numColors, numSquares)) {
      const i = intn(rand.next(), colorSelection.length)
      ;[colorSelection[i], colorSelection[colorSelection.length - 1]] = [colorSelection[colorSelection.length - 1], colorSelection[i]]
      oddColor = colorSelection.pop()!
    }

    const colors = Array.from({ length: numSquares }, () => pick(rand.next(), colorSelection))

    const oddSquare = intn(rand.next(), colors.length)
    colors[oddSquare] = oddColor

    return colors
  }
}
