import type { LevelData } from '../level'

export default {
  id: '1-3',
  name: 'Stepping Stones',
  theme: 'lava',
  start: [140, 430],
  goal: [7200, 580],
  deathY: 1150,
  shapes: [
    // Walls at either end
    { rect: [-400, -800, 400, 2200] },
    { rect: [7400, -800, 400, 2200] },
    // Start and goal platforms
    { rect: [0, 450, 280, 900] },
    { rect: [7000, 640, 400, 760] },

    // A short roof, then open sky with small rocks
    { path: [[0, -800], [900, -800], [900, 120], [700, 200], [450, 110], [250, 180], [0, 120]] },
    { diamond: [1150, 280, 45] },
    { diamond: [1480, 180, 40] },
    { rect: [1780, 330, 70, 70] },
    { diamond: [2100, 220, 45] },

    // High roof with a stalactite hanging low to swing around
    { path: [[2300, -800], [3500, -800], [3500, 80], [3250, 150], [3000, 60], [2920, 420], [2840, 60], [2600, 150], [2300, 60]] },
    { rect: [3150, 900, 80, 500] },

    // A long chain of rocks over the lava
    { diamond: [3800, 300, 45] },
    { diamond: [4150, 420, 40] },
    { diamond: [4500, 200, 45] },
    { diamond: [4850, 380, 40] },
    { diamond: [5200, 250, 45] },

    // Final roof leading to the goal
    { path: [[5450, -800], [7400, -800], [7400, 140], [7100, 220], [6800, 100], [6450, 240], [6100, 120], [5750, 230], [5450, 120]] },
    { rect: [6100, 900, 80, 500] },
  ],
} satisfies LevelData
