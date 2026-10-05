import type { LevelData } from '../level'
import { cloud } from './cloud'

export default {
  id: '2-5',
  name: 'Eye of the Storm',
  theme: 'clouds',
  start: [150, 445],
  goal: [5800, 300],
  goalMount: 'floating',
  deathY: 1300,
  shapes: [
    { path: cloud(150, 520, 340, 110) },

    { path: cloud(800, 100, 900, 160) },
    { path: cloud(1500, -80, 180, 60) },
    { path: cloud(1900, 250, 150, 60) },
    { path: cloud(2600, 80, 800, 150) },

    { path: cloud(3300, -200, 160, 60) },
    { path: cloud(3800, 150, 160, 60) },
    { path: cloud(4200, -100, 160, 60) },
    { path: cloud(4600, 250, 160, 60) },
    { path: cloud(5100, 100, 160, 60) },

    // Low clouds below the gong, clear of its winds, to grab after a miss and climb back for another go
    { path: cloud(5350, 650, 170, 60) },
    { path: cloud(6250, 650, 170, 60) },
    { path: cloud(6450, 150, 160, 60) },

    // Clouds above the floating gong to swing in from
    { path: cloud(5300, -450, 180, 60) },
    { path: cloud(6300, -450, 180, 60) },
    { path: cloud(5800, -600, 220, 70) },
  ],
  gusts: [
    { rect: [1300, 200, 450, 1100], force: [0, -2600], cycle: { period: 3, on: 2 } },
    { rect: [2200, 180, 800, 700], force: [1600, 0], cycle: { period: 2.5, on: 1.5 } },
    { rect: [3050, -300, 450, 1600], force: [0, 2000], cycle: { period: 2, on: 1, offset: 0.5 } },
    { rect: [3600, -400, 1300, 500], force: [-1500, 0], cycle: { period: 3, on: 1.5 } },

    // The gong floats in a small calm pocket; every wind around it blows steadily away, so it takes speed and aim to reach
    { rect: [5250, 250, 480, 300], force: [-1700, 0] },
    { rect: [5870, 100, 480, 450], force: [1700, 0] },
    { rect: [5730, 370, 140, 500], force: [0, 1700] },
    { rect: [5730, -250, 140, 450], force: [0, -1700] },
    { rect: [5250, -250, 480, 500], force: [-1200, -1200] },
    { rect: [5870, -250, 480, 350], force: [1200, -1200] },
  ],
} satisfies LevelData
