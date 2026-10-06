import type { LevelData } from '../level'
import { asteroid } from './space'

export default {
  id: '7-4',
  name: 'Slingshot',
  theme: 'space',
  gravity: 1000,
  start: [180, 430],
  goal: [7120, 620],
  deathY: 1250,
  shapes: [
    // Walls at either end
    { rect: [-400, -900, 400, 2400] },
    { rect: [7400, -900, 400, 2400] },
    // Start and goal platforms
    { path: [[0, 450], [360, 450], [330, 620], [200, 720], [0, 680]] },
    { path: [[6850, 680], [7400, 680], [7400, 820], [7050, 860], [6880, 790]] },

    { path: [[0, -900], [1000, -900], [1000, 110], [760, 170], [520, 100], [300, 150], [0, 110]] },

    asteroid(5800, 120, 50),

    { path: [[6300, -900], [7400, -900], [7400, 160], [7100, 220], [6850, 130], [6600, 210], [6300, 150]] },
  ],
  planets: [
    { at: [1450, 300], r: 85, spin: 'ccw' },
    // Spinning against you from below: catch it high, over the top
    { at: [2050, 250], r: 80, spin: 'cw' },
    { at: [3100, 420], r: 100, spin: 'ccw' },
    // Nothing between here and the next: fling high, past the black hole above
    { at: [5050, 350], r: 90, spin: 'ccw' },
  ],
  // One under the first long gap and one over the second, bending flights down and then up
  blackHoles: [
    { at: [2600, 780], horizon: 35 },
    { at: [4100, -50], horizon: 40 },
  ],
} satisfies LevelData
