import type { LevelData } from '../level'
import { bumper } from './pinball'

export default {
  id: '5-2',
  name: 'Flippers',
  theme: 'pinball',
  start: [180, 430],
  goal: [7200, 620],
  deathY: 1250,
  shapes: [
    // Walls at either end
    { rect: [-400, -800, 400, 2300] },
    { rect: [7500, -800, 400, 2300] },
    // Start and goal platforms
    { rect: [0, 450, 360, 1050] },
    { rect: [6950, 680, 550, 820] },

    { path: [[0, -800], [1100, -800], [1100, 100], [850, 160], [600, 100], [350, 150], [0, 110]] },
    bumper(1450, 220, 55),
    bumper(1900, 140, 55),

    // Nothing to grab for a long way: drop onto the flipper below and let it bat you over to the next bumper
    bumper(3700, 200, 55),
    bumper(4400, 120, 55),
    { rect: [4750, 220, 300, 34] },

    // Again, with a pair of flippers either side of the drain
    { path: [[5150, 800], [5420, 950], [5420, 995], [5150, 850]] },
    { path: [[6000, 800], [5800, 950], [5800, 995], [6000, 850]] },

    bumper(6650, 200, 55),
    { path: [[6300, -800], [7500, -800], [7500, 160], [7200, 220], [6950, 130], [6700, 60], [6450, 120], [6300, 90]] },
  ],
  flippers: [
    // On its own over the drain, the only way across the first long gap
    { pivot: [2700, 950], length: 160, rest: 40, swing: -55 },
    { pivot: [5420, 970], length: 150, rest: 30, swing: -55 },
    { pivot: [5800, 970], length: 150, rest: 150, swing: 55 },
  ],
} satisfies LevelData
