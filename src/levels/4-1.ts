import type { LevelData } from '../level'
import { branch, canopy, clump } from './jungle'

export default {
  id: '4-1',
  name: 'Canopy',
  theme: 'jungle',
  start: [180, 430],
  goal: [7000, 600],
  deathY: 1300,
  trunks: [[250, -1400, 160], [1350, -1400, 120], [3350, -1400, 150], [4700, -1400, 130], [7000, -1400, 170]],
  shapes: [
    // Walls at either end
    { rect: [-400, -1400, 400, 2900] },
    { rect: [7300, -1400, 400, 2900] },
    // Start and goal: tree stumps
    { rect: [0, 450, 360, 1050] },
    { rect: [6750, 660, 550, 840] },

    // Low canopy to get going
    canopy(0, 1500, [150, 220, 120, 230, 150, 240, 140]),
    branch([1350, 250], [1050, 380], 50),

    // The canopy opens up high overhead: swing on green vines across
    canopy(1500, 3200, [-500, -600, -550, -650, -500]),
    branch([3350, 400], [3000, 330], 50),

    // Branches round the next trunk climb up, then a clearing over the river
    canopy(3200, 4500, [150, 60, 180, 80, 200]),
    branch([3350, 600], [3700, 520], 60),
    clump(4250, 420, 130, 70),
    branch([4700, 300], [4450, 230], 50),

    // Only a green vine's swing carries you far enough across the clearing
    canopy(4500, 5000, [-300, -450, -500]),
    canopy(6300, 7300, [-200, 120, 220, 140, 200]),
    clump(6500, 350, 120, 70),
  ],
  vines: [
    { pivot: [1800, -560], length: 620, kind: 'green' },
    { pivot: [2300, -590], length: 660, kind: 'green', angle: 10 },
    { pivot: [2800, -600], length: 640, kind: 'green' },
    { pivot: [4900, -480], length: 600, kind: 'green' },
  ],
} satisfies LevelData
