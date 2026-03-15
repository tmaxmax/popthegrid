import type { Grid, Square } from '$game/grid'
import type { Rand } from '$rand'
import { intn, pick } from '$util/index'
import { Gamemode, type Progress } from '.'

export class OddOneOut extends Gamemode {
  properties = {
    name: 'odd-one-out',
    // Square colors must be generated from an authenticated and reproducible RNG sequence.
    criticalSquares: true,
  } as const

  initialSquares(numColors: number, rand: Rand) {
    return this.genSquares(numColors, 48, rand)
  }

  progress(grid: Grid, squareToRemove: Square, rand: Rand): Progress {
    const done = grid.removeSquare(squareToRemove)
    const lose = grid.activeSquares.some((s) => s !== squareToRemove && s.color === squareToRemove.color)
    const count = grid.activeSquares.length

    if (lose) {
      return { done, state: 'lose' }
    } else if (count === 0) {
      return { done, state: 'win' }
    }

    if (count > 1) {
      grid.setColors(grid.colors, this.genSquares(grid.colors.length, count, rand))
    }

    return { done, state: 'continue' }
  }

  private genSquares(numColors: number, numSquares: number, rand: Rand): number[] {
    const colorSelection = Array.from({ length: numColors }, (_, i) => i)
    // Pull out a single random color to color one square in.
    // Runs multiple times in case the number of squares is less than
    // the number of colors for some reason.
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
