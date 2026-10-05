import type { LevelData } from '../level'
import { branch, canopy, clump } from './jungle'

export default {
  id: '4-5',
  name: 'Tarzan',
  theme: 'jungle',
  start: [180, 430],
  goal: [8800, -850],
  goalMount: 'floating',
  deathY: 1350,
  trunks: [[200, -2600, 150], [1300, -2600, 130], [4900, -2600, 190], [6200, -2600, 130], [9100, -2600, 170]],
  shapes: [
    // Walls at either end
    { rect: [-400, -2600, 400, 4100] },
    { rect: [9300, -2600, 400, 4100] },
    { rect: [0, 450, 360, 1050] },

    canopy(0, 1300, [150, 220, 120, 230, 160]),

    // Three rotten vines in a row with nowhere to rest, then a green one to fling you over the river
    canopy(1300, 2800, [-600, -650, -620, -680, -620]),
    branch([2750, -560], [3150, -620], 60),
    clump(1350, 380, 110, 60),

    // Up the big tree, pumping a green vine to get high enough
    clump(4750, 330, 120, 65),
    branch([4900, 150], [5200, 80], 55),
    branch([4900, -230], [4600, -300], 55),
    branch([4900, -620], [5200, -690], 55),

    // Rotten vines across the top to a last green one, which alone can carry you out to the gong
    canopy(4400, 7000, [-1450, -1500, -1550, -1500, -1600, -1550, -1500]),
    clump(6000, -900, 100, 55),
    { path: [[8420, -660], [8480, -660], [8450, -520]] },
    clump(9000, -1050, 90, 50),
  ],
  vines: [
    { pivot: [1750, -660], length: 620, kind: 'brown' },
    { pivot: [2150, -650], length: 640, kind: 'brown', angle: 6 },
    { pivot: [2550, -690], length: 660, kind: 'brown', angle: -4 },
    { pivot: [3100, -610], length: 600, kind: 'green' },
    { pivot: [5150, -680], length: 560, kind: 'green' },
    { pivot: [5600, -1530], length: 560, kind: 'brown' },
    { pivot: [6150, -1600], length: 580, kind: 'brown', angle: 5 },
    { pivot: [6550, -1580], length: 560, kind: 'brown' },
    { pivot: [6900, -1560], length: 560, kind: 'green' },
  ],
} satisfies LevelData
