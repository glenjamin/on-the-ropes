import type { LevelData } from '../level'
import { girder } from './factory'

export default {
  id: '6-2',
  name: 'Live Wires',
  theme: 'factory',
  start: [180, 430],
  goal: [7100, 620],
  deathY: 1250,
  shapes: [
    // Walls at either end
    { rect: [-400, -800, 400, 2300] },
    { rect: [7400, -800, 400, 2300] },
    // Start and goal platforms
    { rect: [0, 450, 360, 1050] },
    { rect: [6850, 680, 550, 820] },

    { path: [[0, -800], [1100, -800], [1100, 100], [850, 160], [600, 100], [350, 150], [0, 110]] },
    girder(1350, 120, 240),
    girder(1950, 60, 240),
    girder(2550, 140, 240),
    { path: [[3150, -800], [3900, -800], [3900, 120], [3700, 180], [3500, 110], [3300, 170], [3150, 100]] },
    girder(4500, 100, 240),
    girder(5100, 160, 240),
    girder(5700, 80, 240),
    { path: [[6300, -800], [7400, -800], [7400, 160], [7100, 220], [6850, 130], [6600, 200], [6300, 120]] },
  ],
  wires: [
    // Strung low under the first swings, so dip too far and you touch them
    { from: [1200, 780], to: [2400, 780] },
    // Hanging between girders: swing under or let go over
    { from: [1850, 160], to: [1850, 470] },
    { from: [2450, 140], to: [2450, 450] },
    // A curtain that switches on and off
    { from: [2950, -200], to: [2950, 820], cycle: { period: 2.4, on: 1.1 } },
    { from: [4050, 450], to: [4500, 450] },
    // Two curtains taking turns
    { from: [5000, -150], to: [5000, 800], cycle: { period: 2.6, on: 1.1 } },
    { from: [5600, -150], to: [5600, 800], cycle: { period: 2.6, on: 1.1, offset: 1.3 } },
  ],
  platforms: [{ rect: [3950, 80, 220, 30], travel: [0, 220], period: 4 }],
} satisfies LevelData
