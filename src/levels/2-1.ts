import type { LevelData } from '../level'
import { cloud } from './cloud'

export default {
  id: '2-1',
  name: 'Windswept',
  theme: 'clouds',
  start: [150, 440],
  goal: [6700, 560],
  deathY: 1300,
  shapes: [
    // Clouds to start and finish on
    { path: cloud(150, 520, 340, 110) },
    { path: cloud(6700, 660, 420, 130) },

    // Banks of cloud overhead to swing from, with gaps between
    { path: cloud(700, 100, 900, 160) },
    { path: cloud(2300, 110, 1000, 170) },
    { path: cloud(4700, 100, 900, 160) },
    { path: cloud(6300, 110, 900, 160) },

    // Small clouds to grab in the gaps
    { path: cloud(1450, -60, 220, 80) },
    { path: cloud(3200, 260, 170, 70) },
    { path: cloud(3700, 190, 170, 70) },
    { path: cloud(5500, -40, 200, 80) },
  ],
  gusts: [
    // An updraft lifts you over the first gap
    { rect: [1230, 150, 400, 1150], force: [0, -2600] },
    // A tailwind in bursts carries you through the middle
    { rect: [2820, -250, 1380, 1550], force: [1400, 0], cycle: { period: 3, on: 1.8 } },
    // A steady headwind under the third bank
    { rect: [4300, 180, 800, 800], force: [-1500, 0] },
    // A downdraft in bursts over the last gap; cross while it's off
    { rect: [5250, -250, 500, 1550], force: [0, 1800], cycle: { period: 2.5, on: 1.25, offset: 0.5 } },
  ],
} satisfies LevelData
