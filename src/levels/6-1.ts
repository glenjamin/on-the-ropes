import type { LevelData } from '../level'
import { girder } from './factory'

export default {
  id: '6-1',
  name: 'Assembly Line',
  theme: 'factory',
  start: [180, 430],
  goal: [7000, 620],
  deathY: 1250,
  shapes: [
    // Walls at either end
    { rect: [-400, -800, 400, 2300] },
    { rect: [7300, -800, 400, 2300] },
    // Start and goal platforms
    { rect: [0, 450, 360, 1050] },
    { rect: [6750, 680, 550, 820] },

    { path: [[0, -800], [1100, -800], [1100, 100], [850, 160], [600, 100], [350, 150], [0, 110]] },

    // A belt to rest on that carries you on towards the next lifts
    { rect: [2700, 650, 500, 60], belt: 220 },
    girder(2850, 80, 260),

    girder(4550, 120, 300),
    { path: [[6200, -800], [7300, -800], [7300, 160], [7000, 220], [6750, 130], [6500, 200], [6200, 120]] },
  ],
  platforms: [
    // Lifts and shuttles to swing from: each carries the rope's hook with it
    { rect: [1350, 120, 220, 30], travel: [0, 200], period: 4 },
    { rect: [1850, 80, 220, 30], travel: [350, 0], period: 5 },
    { rect: [3500, 100, 220, 30], travel: [0, 250], period: 4.5, offset: 1 },
    { rect: [3950, 150, 220, 30], travel: [350, 0], period: 6 },
    { rect: [5250, 60, 220, 30], travel: [0, 220], period: 4 },
    { rect: [5700, 120, 220, 30], travel: [300, 0], period: 5, offset: 2 },
  ],
} satisfies LevelData
