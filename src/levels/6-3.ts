import type { LevelData } from '../level'
import { girder } from './factory'

export default {
  id: '6-3',
  name: 'Stamping Press',
  theme: 'factory',
  start: [180, 430],
  goal: [7300, 620],
  deathY: 1250,
  shapes: [
    // Walls at either end
    { rect: [-400, -1000, 400, 2500] },
    { rect: [7600, -1000, 400, 2500] },
    // Start and goal platforms
    { rect: [0, 450, 360, 1050] },
    { rect: [7050, 680, 550, 820] },

    { path: [[0, -1000], [1100, -1000], [1100, 100], [850, 160], [600, 100], [350, 150], [0, 110]] },
    { rect: [1100, -1000, 5200, 600] },
    girder(1350, 120, 220),
    girder(2250, 100, 220),
    // A belt to rest on, carrying you under a press
    { rect: [2900, 650, 700, 60], belt: 180 },
    girder(3200, 60, 220),
    girder(4200, 120, 220),
    girder(5150, 90, 220),
    { path: [[6300, -1000], [7600, -1000], [7600, 160], [7300, 220], [7050, 130], [6800, 200], [6550, 120], [6300, 150]] },
    { rect: [5900, -400, 400, 300] },
  ],
  platforms: [
    // Presses slamming down out of the roof through the swings between girders
    { rect: [1830, -850, 150, 950], travel: [0, 450], period: 2.4 },
    { rect: [2700, -900, 150, 950], travel: [0, 500], period: 2.6, offset: 1 },
    // The press over the belt comes down far enough to flatten anyone standing there
    { rect: [3420, -945, 160, 1045], travel: [0, 545], period: 3 },
    { rect: [3750, -850, 150, 950], travel: [0, 450], period: 2.2, offset: 0.6 },
    // A ram sweeping sideways across the gap
    { rect: [4500, 420, 300, 80], travel: [450, 0], period: 3 },
    { rect: [5550, -920, 150, 970], travel: [0, 520], period: 2.5, offset: 1.6 },
  ],
} satisfies LevelData
