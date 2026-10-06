import type { LevelData } from '../level'
import { asteroid } from './space'

export default {
  id: '7-3',
  name: 'Gravity Well',
  theme: 'space',
  gravity: 1150,
  start: [180, 430],
  goal: [6720, 620],
  deathY: 1250,
  shapes: [
    // Walls at either end
    { rect: [-400, -800, 400, 2300] },
    { rect: [7000, -800, 400, 2300] },
    // Start and goal platforms
    { path: [[0, 450], [360, 450], [330, 620], [200, 720], [0, 680]] },
    { path: [[6450, 680], [7000, 680], [7000, 820], [6650, 860], [6480, 790]] },

    { path: [[0, -800], [1000, -800], [1000, 110], [760, 170], [520, 100], [300, 150], [0, 110]] },
    asteroid(1450, 150, 60),

    // Nothing to grab over the black hole: fling high across it from one planet to the next, or it drags you down
    asteroid(4650, 90, 55),

    { path: [[5900, -800], [7000, -800], [7000, 160], [6700, 220], [6450, 130], [6200, 210], [5900, 150]] },
  ],
  planets: [
    { at: [2100, 280], r: 110, spin: 'ccw' },
    { at: [3950, 300], r: 90, spin: 'ccw' },
    { at: [5200, 330], r: 80, spin: 'cw' },
  ],
  blackHoles: [{ at: [3050, 700], horizon: 35 }],
} satisfies LevelData
