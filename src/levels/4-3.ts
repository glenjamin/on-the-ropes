import type { LevelData } from '../level'
import { branch, canopy, clump } from './jungle'

export default {
  id: '4-3',
  name: 'Treetops',
  theme: 'jungle',
  start: [180, 880],
  goal: [6150, -760],
  deathY: 1350,
  trunks: [[900, -2600, 170], [2200, -2600, 150], [3500, -2600, 130], [5000, -2600, 160], [6200, -2600, 180]],
  shapes: [
    // Walls at either end
    { rect: [-400, -2600, 400, 4100] },
    { rect: [6550, -2600, 400, 4100] },
    // Start on a stump by the river, finish on a bough high in the next tree
    { rect: [0, 900, 360, 600] },
    { rect: [5850, -700, 700, 60] },

    // Climb the first tree's branches, then swing up on a vine to the next
    branch([900, 620], [600, 540], 60),
    branch([900, 260], [1200, 180], 55),
    clump(1350, 560, 110, 60),
    clump(1550, -430, 100, 55),
    branch([2200, -230], [1850, -310], 55),
    branch([2200, -640], [2550, -720], 55),
    clump(1700, -800, 120, 70),

    // Across the top, swinging under the canopy on rotten vines
    canopy(0, 4100, [-1550, -1600, -1650, -1700, -1750, -1700, -1650]),
    clump(3050, -1150, 110, 60),

    // The canopy ends: drop down into the gully and swing back up out of it
    clump(4500, 150, 120, 65),
    branch([5000, 250], [4700, 330], 55),
    branch([5000, -150], [5300, -230], 55),
    branch([5000, -560], [4700, -640], 55),
    canopy(5300, 6550, [-1300, -1300, -1250]),
  ],
  vines: [
    { pivot: [1550, -400], length: 520, kind: 'green' },
    { pivot: [2850, -1740], length: 580, kind: 'brown' },
    { pivot: [3350, -1720], length: 600, kind: 'brown', angle: 6 },
    { pivot: [3750, -1700], length: 560, kind: 'brown' },
    { pivot: [5000, -150], length: 400, kind: 'brown' },
    { pivot: [5500, -1330], length: 560, kind: 'green' },
  ],
} satisfies LevelData
