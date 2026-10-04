import type { LevelData } from '../level'

export default {
  id: '1-2',
  name: 'Lava Cave',
  start: [180, 430],
  goal: [6520, 620],
  lavaY: 1200,
  shapes: [
    // Walls at either end
    { rect: [-400, -800, 400, 2200] },
    { rect: [6800, -800, 400, 2200] },
    // Start and goal platforms
    { rect: [0, 450, 360, 950] },
    { rect: [6250, 680, 550, 720] },

    // First cave roof, jagged underside
    { path: [[0, -800], [1450, -800], [1450, 60], [1320, 140], [1180, 90], [1040, 170], [900, 110], [760, 200], [600, 120], [430, 170], [260, 90], [0, 130]] },
    { diamond: [900, 470, 70] },
    { rect: [1520, 760, 130, 700] },

    // Open sky: only floating rocks to grab
    { diamond: [1780, 260, 80] },
    { rect: [2080, 140, 220, 80] },
    { diamond: [2250, 560, 55] },

    // Second cave roof with pillars underneath
    { path: [[2450, -800], [3850, -800], [3850, 120], [3700, 220], [3560, 140], [3400, 260], [3200, 180], [3000, 240], [2800, 140], [2620, 200], [2450, 100]] },
    { rect: [2720, 820, 110, 600] },
    { rect: [3220, 660, 110, 760] },
    { path: [[3600, 1400], [3640, 900], [3720, 860], [3780, 1400]] },

    // Rock garden
    { diamond: [4100, 330, 70] },
    { diamond: [4480, 220, 60] },
    { rect: [4700, 420, 90, 90] },
    { diamond: [5000, 300, 75] },

    // Final roof leading to the goal
    { path: [[5300, -800], [6800, -800], [6800, 160], [6600, 220], [6400, 120], [6100, 230], [5850, 150], [5600, 260], [5300, 140]] },
    { diamond: [5750, 640, 50] },
  ],
} satisfies LevelData
