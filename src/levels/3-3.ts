import type { LevelData, Shape } from '../level'
import { skiJump } from './ice'

/** Tall, slim icicles of dark ice from `top` down past the water line at `water`, close enough that there's no squeezing between. */
const icicleWall = (xs: number[], top: number, water: number): Shape[] =>
  xs.map((x) => ({ path: [[x - 50, top], [x + 50, top], [x + 35, water + 50], [x, water + 150], [x - 35, water + 50]], surface: 'dark-ice' }))

export default {
  id: '3-3',
  name: 'Ski Jump',
  theme: 'ice',
  start: [180, 430],
  goal: [10200, 560],
  deathY: 1350,
  flags: [[1793, 355]],
  shapes: [
    // Walls at either end
    { rect: [-400, -1200, 400, 2800] },
    { rect: [10500, -1200, 400, 2800] },
    // Start and goal platforms
    { rect: [0, 450, 360, 1150] },
    { rect: [9950, 620, 550, 980] },

    // A roof to swing out under, ending above the top of the jump
    { path: [[0, -1200], [1900, -1200], [1900, 60], [1700, 120], [1450, 60], [1200, 160], [900, 90], [600, 170], [300, 100], [0, 140]] },
    { diamond: [1000, 560, 60] },

    // Drop onto the ramp above the flag and it throws you onto a second ramp, which sends you almost straight up and
    // over a high wall. Starting lower down falls short of the second ramp
    skiJump({ top: [1750, 330], drop: 30, run: 700, radius: 250, lip: 30, base: 1700, ramp: true }),
    skiJump({ top: [5100, 680], drop: 32, run: 500, radius: 200, lip: 75, base: 1700, ramp: true }),
    { rect: [6200, -100, 150, 1800] },
    { diamond: [7250, 750, 50] },

    // A roof that ends in a wall of icicles hanging into the water. Grab each to break it off, or fall in; a rock rib
    // halfway through gives one chance to swing again
    ...icicleWall([8500, 8575, 8650], 400, 1350),
    { path: [[8690, 400], [8760, 400], [8745, 640], [8705, 640]] },
    { path: [[8680, 630], [8770, 630], [8760, 1400], [8725, 1500], [8690, 1400]], surface: 'dark-ice' },
    ...icicleWall([8800, 8875, 8950], 400, 1350),
    { path: [[9680, 150], [9740, 150], [9710, 330]], surface: 'dark-ice' },
    { path: [[10030, 150], [10090, 150], [10060, 330]], surface: 'dark-ice' },
    { path: [[7700, -1200], [10500, -1200], [10500, 150], [10200, 230], [9900, 130], [9600, 220], [9350, 140], [9250, 450], [8300, 450], [8100, 420], [7900, 480], [7700, 430]] },
  ],
} satisfies LevelData
