import type { LevelData } from '../level'
import { cloud } from './cloud'

export default {
  id: '2-3',
  name: 'Crosswinds',
  theme: 'clouds',
  start: [150, 445],
  goal: [7300, 535],
  deathY: 1300,
  shapes: [
    { path: cloud(150, 520, 340, 110) },
    { path: cloud(7300, 660, 420, 130) },

    // Small clouds scattered at varying heights
    { path: cloud(700, 250, 140, 55) },
    { path: cloud(1150, 120, 170, 60) },
    { path: cloud(1600, 380, 140, 55) },
    { path: cloud(2050, 180, 170, 60) },
    { path: cloud(2500, 320, 140, 55) },
    { path: cloud(2950, 80, 170, 60) },
    { path: cloud(3400, 300, 140, 55) },
    { path: cloud(3850, 150, 170, 60) },
    { path: cloud(4300, 400, 140, 55) },
    { path: cloud(4750, 200, 170, 60) },
    { path: cloud(5200, 320, 140, 55) },
    { path: cloud(5650, 100, 170, 60) },
    { path: cloud(6100, 280, 140, 55) },
    { path: cloud(6550, 180, 170, 60) },
    { path: cloud(6950, 350, 140, 55) },
  ],
  gusts: [
    // A headwind up high and a tailwind down low
    { rect: [500, -300, 1600, 350], force: [-1600, 0] },
    { rect: [500, 450, 1600, 350], force: [1600, 0] },
    // Upper and lower bands taking turns to blow in opposite directions
    { rect: [2200, -300, 1500, 450], force: [1800, 0], cycle: { period: 2.4, on: 1.2 } },
    { rect: [2200, 350, 1500, 500], force: [-1800, 0], cycle: { period: 2.4, on: 1.2, offset: 1.2 } },
    // Shear: left above, right below
    { rect: [3800, 0, 1500, 300], force: [-2000, 0] },
    { rect: [3800, 300, 1500, 300], force: [2000, 0] },
    // A strong headwind in long bursts on the run in
    { rect: [5400, -300, 1700, 1100], force: [-1400, 0], cycle: { period: 3, on: 2 } },
  ],
} satisfies LevelData
