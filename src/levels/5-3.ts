import type { LevelData } from '../level'
import { bumper } from './pinball'

export default {
  id: '5-3',
  name: 'Skill Shot',
  theme: 'pinball',
  start: [180, 430],
  goal: [7400, 620],
  deathY: 1250,
  shapes: [
    // Walls at either end
    { rect: [-400, -800, 400, 2300] },
    { rect: [7700, -800, 400, 2300] },
    // Start and goal platforms
    { rect: [0, 450, 360, 1050] },
    { rect: [7150, 680, 550, 820] },

    { path: [[0, -800], [1100, -800], [1100, 100], [850, 160], [600, 100], [350, 150], [0, 110]] },
    bumper(1400, 220, 55),
    bumper(1850, 150, 50),

    // A funnel down into the launcher, which fires you over the long drain
    { path: [[1950, 540], [2244, 738], [2244, 800], [1950, 600]] },
    { path: [[2356, 738], [2620, 620], [2620, 680], [2356, 800]] },

    // Catch something at the end of the flight
    bumper(4750, 250, 55),
    bumper(5150, 120, 55),
    { rect: [5250, 380, 300, 34] },
    bumper(5800, 220, 55),
    bumper(6300, 140, 55),
    { path: [[6600, -800], [7700, -800], [7700, 160], [7400, 220], [7150, 130], [6900, 200], [6600, 120]] },
  ],
  launchers: [{ at: [2300, 760], aim: [1, -0.8], speed: 2400 }],
} satisfies LevelData
