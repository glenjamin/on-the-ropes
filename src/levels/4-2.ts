import type { LevelData } from '../level'
import { branch, canopy, clump } from './jungle'

export default {
  id: '4-2',
  name: 'Rotten Vines',
  theme: 'jungle',
  start: [180, 430],
  goal: [7250, 600],
  deathY: 1300,
  trunks: [[200, -1400, 150], [1450, -1400, 130], [3300, -1400, 170], [4300, -1400, 120], [6600, -1400, 140], [7250, -1400, 160]],
  shapes: [
    // Walls at either end
    { rect: [-400, -1400, 400, 2900] },
    { rect: [7550, -1400, 400, 2900] },
    // Start and goal: tree stumps
    { rect: [0, 450, 360, 1050] },
    { rect: [7000, 660, 550, 840] },

    canopy(0, 1450, [160, 230, 130, 240, 170]),
    branch([1450, 300], [1150, 380], 50),

    // Brown vines snap a second after you grab them: keep moving, and rest on the green one in the middle
    canopy(1450, 3250, [-560, -620, -600, -650, -560]),
    branch([3300, 330], [2950, 280], 50),

    // Down under a low bough and back up
    canopy(3250, 4300, [-100, 200, 380, 300, 60]),
    clump(3500, 720, 130, 70),
    clump(3950, 650, 110, 60),
    branch([4300, 250], [4550, 180], 50),

    // A clearing: brown vines lead to a green one, whose swing alone carries you across
    canopy(4300, 5300, [-350, -500, -560, -480]),
    canopy(6500, 7550, [-150, 120, 220, 150, 200]),
    clump(6750, 380, 120, 70),
  ],
  vines: [
    { pivot: [1800, -600], length: 650, kind: 'brown' },
    { pivot: [2200, -610], length: 660, kind: 'green', angle: -8 },
    { pivot: [2600, -620], length: 640, kind: 'brown' },
    { pivot: [4700, -520], length: 600, kind: 'brown' },
    { pivot: [5100, -500], length: 600, kind: 'green' },
  ],
} satisfies LevelData
