import type { LevelData } from '../level'
import { asteroid } from './space'

export default {
  id: '7-1',
  name: 'Low Orbit',
  theme: 'space',
  gravity: 1500,
  start: [180, 430],
  goal: [6520, 620],
  deathY: 1250,
  shapes: [
    // Walls at either end
    { rect: [-400, -800, 400, 2300] },
    { rect: [6800, -800, 400, 2300] },
    // Start and goal platforms
    { path: [[0, 450], [360, 450], [330, 620], [200, 720], [0, 680]] },
    { path: [[6250, 680], [6800, 680], [6800, 820], [6450, 860], [6280, 790]] },

    { path: [[0, -800], [1100, -800], [1100, 100], [850, 160], [600, 100], [350, 150], [0, 110]] },

    // Asteroids between the planets to catch your breath on
    asteroid(1950, 150, 60),
    asteroid(3050, 120, 60),
    asteroid(3450, 380, 50),
    asteroid(4500, 180, 60),

    { path: [[5600, -800], [6800, -800], [6800, 160], [6500, 220], [6250, 130], [6000, 210], [5800, 140], [5600, 170]] },
  ],
  // Each spins the way you're going, so it whirls you on round underneath and flings you forwards
  planets: [
    { at: [1500, 260], r: 80, spin: 'ccw' },
    { at: [2500, 300], r: 90, spin: 'ccw' },
    { at: [3950, 240], r: 90, spin: 'ccw' },
    { at: [5100, 280], r: 80, spin: 'ccw' },
  ],
} satisfies LevelData
