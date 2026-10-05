import type { LevelData } from '../level'
import { bumper } from './pinball'

export default {
  id: '5-5',
  name: 'Wizard Mode',
  theme: 'pinball',
  start: [180, 430],
  goal: [7650, -450],
  goalMount: 'floating',
  deathY: 1250,
  shapes: [
    // Walls at either end
    { rect: [-400, -1600, 400, 3100] },
    { rect: [7900, -1600, 400, 3100] },
    { rect: [0, 450, 360, 1050] },

    { path: [[0, -1600], [1000, -1600], [1000, 100], [750, 160], [500, 100], [250, 150], [0, 110]] },

    // Small bumpers far apart, with others crowding the swings
    bumper(1350, 220, 40),
    bumper(1650, 560, 40),
    bumper(1950, 160, 40),
    bumper(2200, 480, 40),
    { path: [[2350, 820], [2510, 980], [2350, 980]], bumper: true },
    bumper(2600, 260, 40),
    bumper(2900, 560, 40),
    bumper(3200, 150, 40),

    // A flipper either side of the drain, with a bumper over the gap between them
    { path: [[3650, 780], [3950, 940], [3950, 985], [3650, 830]] },
    { path: [[4600, 780], [4350, 940], [4350, 985], [4600, 830]] },
    bumper(4150, 640, 40),

    bumper(5100, 200, 40),
    bumper(5400, 520, 40),
    bumper(5650, 230, 40),

    // Nothing up high is in reach from down here: drop into the launcher to be fired up to the top lane
    { path: [[5800, 520], [6042, 680], [6042, 740], [5800, 580]] },
    { path: [[6158, 680], [6330, 600], [6330, 660], [6158, 740]] },
    { path: [[6500, -1600], [7900, -1600], [7900, -720], [7600, -650], [7300, -730], [7000, -650], [6700, -720], [6500, -680]] },
  ],
  flippers: [
    { pivot: [3950, 960], length: 150, rest: 30, swing: -55 },
    { pivot: [4350, 960], length: 150, rest: 150, swing: 55 },
  ],
  launchers: [{ at: [6100, 700], aim: [0.7, -1], speed: 2400 }],
} satisfies LevelData
