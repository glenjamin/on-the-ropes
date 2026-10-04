import type { LevelData } from '../level'

export default {
  id: '1-1',
  name: 'First Swing',
  theme: 'lava',
  start: [180, 430],
  goal: [5750, 580],
  deathY: 1250,
  shapes: [
    // Walls at either end
    { rect: [-400, -800, 400, 2300] },
    { rect: [6000, -800, 400, 2300] },
    // Start and goal platforms
    { rect: [0, 450, 360, 1000] },
    { rect: [5500, 640, 500, 800] },

    // One low roof the whole way, so there's always something to grab
    { path: [[0, -800], [6000, -800], [6000, 200], [5700, 250], [5400, 190], [5100, 260], [4800, 200], [4500, 270], [4200, 190], [3900, 260], [3600, 200], [3300, 270], [3000, 190], [2700, 260], [2400, 200], [2100, 270], [1800, 190], [1500, 260], [1200, 200], [900, 270], [600, 190], [300, 250], [0, 200]] },

    // Pillars to land on and catch your breath
    { rect: [1500, 800, 140, 700] },
    { rect: [2900, 760, 140, 740] },
    { rect: [4300, 800, 140, 700] },
    { diamond: [2200, 560, 50] },
    { diamond: [3700, 580, 50] },
  ],
} satisfies LevelData
