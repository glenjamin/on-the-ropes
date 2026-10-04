import type { LevelData } from '../level'

export default {
  id: '1-5',
  name: 'Open Sky',
  start: [150, 430],
  goal: [7800, 580],
  lavaY: 1200,
  shapes: [
    // Walls at either end
    { rect: [-400, -800, 400, 2200] },
    { rect: [8000, -800, 400, 2200] },
    // Start and goal platforms
    { rect: [0, 450, 300, 1000] },
    { rect: [7600, 640, 400, 760] },

    // A short roof to get going
    { path: [[0, -800], [1100, -800], [1100, 150], [850, 220], [600, 120], [350, 200], [0, 130]] },

    // A long stretch with no ceiling: small rocks of mixed shapes, heights and spacings
    { diamond: [1350, 300, 45] },
    { path: [[1650, 180], [1720, 300], [1580, 300]] },
    { rect: [1950, 380, 120, 30] },
    { diamond: [2300, 220, 35] },
    { path: [[2695, 330], [2672, 369], [2628, 369], [2605, 330], [2628, 291], [2672, 291]] },
    { rect: [3000, 150, 40, 140] },
    { path: [[3300, 420], [3400, 420], [3350, 520]] },
    { diamond: [3750, 260, 55] },
    { rect: [4050, 330, 60, 60] },
    { rect: [4060, 950, 40, 450] },
    { path: [[4400, 180], [4480, 180], [4480, 240], [4440, 240], [4440, 320], [4400, 320]] },
    { diamond: [4800, 420, 30] },
    { rect: [5100, 200, 140, 26] },
    { path: [[5500, 300], [5580, 190], [5640, 320]] },
    { diamond: [5900, 260, 45] },
    { rect: [6250, 360, 50, 50] },
    { diamond: [6550, 220, 40] },

    // Roof again for the run in to the goal
    { path: [[6800, -800], [8000, -800], [8000, 150], [7700, 230], [7400, 120], [7100, 220], [6800, 140]] },
  ],
} satisfies LevelData
