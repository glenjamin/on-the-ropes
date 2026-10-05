import type { LevelData } from '../level'
import { cloud } from './cloud'

export default {
  id: '2-2',
  name: 'Updraft',
  theme: 'clouds',
  start: [150, 1270],
  goal: [800, -2370],
  deathY: 1700,
  shapes: [
    // Start at the bottom left, finish on a cloud at the top
    { path: cloud(200, 1350, 400, 120) },
    { path: cloud(800, -2250, 500, 120) },

    // Ledges alternating left and right, climbing either side of the updraft
    { path: cloud(1400, 950, 400, 100) },
    { path: cloud(200, 500, 400, 100) },
    { path: cloud(1400, 50, 400, 100) },
    { path: cloud(200, -400, 400, 100) },
    { path: cloud(1400, -850, 400, 100) },
    { path: cloud(200, -1300, 400, 100) },
    { path: cloud(1400, -1750, 400, 100) },

    // A first cloud within reach of the start
    { path: cloud(430, 880, 180, 60) },

    // Small clouds in the middle of the updraft, one at each ledge height, to rope onto between ledges
    { path: cloud(800, 700, 160, 60) },
    { path: cloud(800, 250, 160, 60) },
    { path: cloud(800, -200, 160, 60) },
    { path: cloud(800, -650, 160, 60) },
    { path: cloud(800, -1100, 160, 60) },
    { path: cloud(800, -1500, 160, 60) },
    { path: cloud(800, -1900, 160, 60) },

    // Clouds above the summit, to swing up from and drop onto the gong's cloud
    { path: cloud(420, -2650, 180, 60) },
    { path: cloud(1180, -2650, 180, 60) },
  ],
  gusts: [
    // The updraft up the middle, blowing in bursts
    { rect: [550, -2190, 500, 3690], force: [0, -2700], cycle: { period: 3, on: 1.8 } },
    // Side winds across the whole climb at a few heights, bending the swings between the middle and the ledges
    { rect: [-100, -380, 1800, 300], force: [1300, 0] },
    { rect: [-100, -1280, 1800, 300], force: [-1300, 0] },
    { rect: [-100, -2120, 1800, 300], force: [1500, 0], cycle: { period: 2.5, on: 1.5 } },
  ],
} satisfies LevelData
