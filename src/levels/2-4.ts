import type { LevelData } from '../level'
import { cloud } from './cloud'

export default {
  id: '2-4',
  name: 'Storm Front',
  theme: 'clouds',
  start: [150, 445],
  goal: [6300, 495],
  deathY: 1300,
  shapes: [
    { path: cloud(150, 520, 340, 110) },
    { path: cloud(6300, 620, 420, 130) },

    // Two cloud banks with a downdraft between them
    { path: cloud(700, 80, 800, 150) },
    { path: cloud(1950, 100, 800, 150) },

    // A staircase of small clouds up an updraft
    { path: cloud(2550, 300, 160, 60) },
    { path: cloud(2800, 0, 160, 60) },
    { path: cloud(3050, -250, 160, 60) },

    // A high crossing in a crosswind
    { path: cloud(3450, -350, 200, 70) },
    { path: cloud(3900, -250, 200, 70) },
    { path: cloud(4350, -400, 200, 70) },

    // Down to a last bank, and a low cloud to approach the gong from
    { path: cloud(5000, -100, 700, 140) },
    { path: cloud(5650, 300, 180, 60) },
  ],
  gusts: [
    { rect: [1100, -300, 400, 1600], force: [0, 2200], cycle: { period: 2, on: 1 } },
    { rect: [2400, -200, 800, 1500], force: [0, -2400] },
    { rect: [3300, -700, 1300, 500], force: [1500, 0], cycle: { period: 2.6, on: 1.4 } },
    // Wind over the gong pushes anything coming in from above off to the left
    { rect: [6000, 0, 650, 450], force: [-1800, 0] },
  ],
} satisfies LevelData
