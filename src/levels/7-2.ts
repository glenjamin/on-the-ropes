import type { LevelData } from '../level'
import { asteroid } from './space'

export default {
  id: '7-2',
  name: 'Moon Hop',
  theme: 'space',
  gravity: 1300,
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

    // Too far apart to reach with a swing from rock: only a planet's fling carries you from one to the next
    asteroid(3050, 120, 55),
    { path: [[5950, -800], [7000, -800], [7000, 160], [6700, 220], [6450, 130], [6200, 210], [5950, 150]] },
  ],
  planets: [
    { at: [1450, 300], r: 115, spin: 'ccw' },
    // Coming at it from above, the other way round carries you over the top
    { at: [3800, 330], r: 110, spin: 'cw' },
  ],
} satisfies LevelData
