import type { LevelData } from '../level'
import { branch, canopy, clump } from './jungle'

export default {
  id: '4-4',
  name: 'Two Ways',
  theme: 'jungle',
  start: [180, 430],
  goal: [7700, 600],
  deathY: 1350,
  trunks: [[250, -2600, 150], [1500, -2600, 170], [3000, -2600, 120], [5300, -2600, 180], [6600, -2600, 130], [7700, -2600, 160]],
  shapes: [
    // Walls at either end
    { rect: [-400, -2600, 400, 4100] },
    { rect: [8000, -2600, 400, 4100] },
    // Start and goal: tree stumps
    { rect: [0, 450, 360, 1050] },
    { rect: [7450, 660, 550, 840] },

    canopy(0, 1300, [100, 180, 90, 200, 120]),
    // The way splits at the big tree: climb its branches to the high road, or carry on low over the river
    branch([1500, 250], [1250, 180], 55),
    clump(1900, -80, 100, 55),

    // High road: a long line of rotten vines under the canopy, with a couple of branches to catch your breath
    canopy(1300, 5300, [-800, -850, -800, -900, -850, -800, -850, -800, -750]),
    branch([3000, -250], [3250, -320], 50),
    clump(4400, -300, 100, 55),

    // Low road: green vines hang far down to swing on near the water; the widest stretch needs one to fling you over
    clump(2300, 560, 110, 60),
    clump(4900, 520, 110, 60),

    // Both ways meet at the next big tree
    branch([5300, 100], [5000, 30], 55),
    branch([5300, -350], [5650, -420], 55),
    canopy(5300, 8000, [-700, -500, -300, -100, 100, 200, 150, 200]),
    clump(6300, 420, 110, 60),
  ],
  vines: [
    // High road
    { pivot: [2200, -860], length: 540, kind: 'brown' },
    { pivot: [2600, -860], length: 540, kind: 'brown', angle: -6 },
    { pivot: [3600, -910], length: 580, kind: 'brown' },
    { pivot: [4000, -880], length: 560, kind: 'brown', angle: 5 },
    { pivot: [4800, -850], length: 560, kind: 'brown' },
    // Low road
    { pivot: [2800, -860], length: 1050, kind: 'green' },
    { pivot: [3350, -910], length: 1100, kind: 'green' },
    // After the merge
    { pivot: [6900, -200], length: 450, kind: 'brown' },
  ],
} satisfies LevelData
