import type { LevelData, Shape } from '../level'
import { skiJump } from './ice'

/** Slim icicles of dark ice hanging from `top` down into the water, `spacing` apart. */
const icicleCurtain = (fromX: number, count: number, spacing: number, top: number): Shape[] =>
  Array.from({ length: count }, (_, i) => {
    const x = fromX + i * spacing
    return { path: [[x - 20, top], [x + 20, top], [x + 18, 1800], [x, 1900], [x - 18, 1800]], surface: 'dark-ice' }
  })

export default {
  id: '3-3',
  name: 'Ski Jump',
  theme: 'ice',
  start: [180, 430],
  goal: [10900, 1440],
  deathY: 1750,
  flags: [[1985, 465.68]],
  shapes: [
    // Walls at either end
    { rect: [-400, -1600, 400, 3600] },
    { rect: [11300, -1600, 400, 3600] },
    // Start and goal platforms
    { rect: [0, 450, 360, 1550] },
    { rect: [10600, 1500, 700, 500] },

    // A roof to swing out under, ending above the top of the jump
    { path: [[0, -1600], [1900, -1600], [1900, 60], [1700, 120], [1450, 60], [1200, 160], [900, 90], [600, 170], [300, 100], [0, 140]] },
    { diamond: [1000, 560, 60] },

    // Start the slide at the flag or higher and the jump carries you onto a slab of ice that throws you almost
    // straight up and over a high wall. Start lower and you fall short, under the slab and into the water
    skiJump({ top: [1750, 330], drop: 30, run: 700, radius: 250, lip: 30, base: 2000, ramp: true }),
    skiJump({ top: [5100, 1250], drop: 10, run: 1000, radius: 200, lip: 75, thickness: 60, ramp: true }),
    { rect: [6700, 590, 250, 1410] },

    // Rock to catch on the way down
    { diamond: [7650, 350, 55] },
    { diamond: [8150, 800, 55] },

    // A tall cavern over open water, hung with a few icicles to swing between
    ...icicleCurtain(9350, 4, 250, 1000),
    { path: [[8500, -1600], [11300, -1600], [11300, 900], [10700, 950], [10300, 900], [10160, 1000], [9250, 1000], [9000, 950], [8750, 1010], [8500, 930]] },
  ],
} satisfies LevelData
