import type { LevelData } from '../level'
import { bumper } from './pinball'

export default {
  id: '5-4',
  name: 'Bumper Alley',
  theme: 'pinball',
  start: [180, 430],
  goal: [7300, 620],
  deathY: 1250,
  shapes: [
    // Walls at either end
    { rect: [-400, -800, 400, 2300] },
    { rect: [7600, -800, 400, 2300] },
    // Start and goal platforms
    { rect: [0, 450, 360, 1050] },
    { rect: [7050, 680, 550, 820] },

    { path: [[0, -800], [1100, -800], [1100, 100], [850, 160], [600, 100], [350, 150], [0, 110]] },

    // Bumpers to swing from, with more crowding the swings between them
    bumper(1450, 200, 50),
    bumper(1750, 540, 40),
    bumper(2000, 620, 40),
    { rect: [2100, 100, 260, 34] },
    bumper(2500, 520, 40),
    // A slingshot at the bottom of the swing kicks you up and on
    { path: [[2600, 800], [2760, 960], [2600, 960]], bumper: true },
    bumper(2950, 230, 50),
    bumper(3250, 560, 40),
    bumper(3550, 120, 50),

    // Nothing to grab across the drain: a flipper either side of it bats you back up
    { path: [[3950, 780], [4250, 940], [4250, 985], [3950, 830]] },
    { path: [[4900, 780], [4650, 940], [4650, 985], [4900, 830]] },

    bumper(5500, 180, 50),
    bumper(5750, 520, 40),
    bumper(6050, 280, 50),
    bumper(6350, 600, 40),
    // A slingshot on the far side kicks back the other way
    { path: [[6700, 800], [6700, 960], [6540, 960]], bumper: true },
    { path: [[6450, -800], [7600, -800], [7600, 160], [7300, 220], [7050, 130], [6800, 200], [6600, 110], [6450, 140]] },
  ],
  flippers: [
    { pivot: [4250, 960], length: 150, rest: 30, swing: -55 },
    { pivot: [4650, 960], length: 150, rest: 150, swing: 55 },
  ],
} satisfies LevelData
