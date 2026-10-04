import type { LevelData } from '../level'

const hexagon = (cx: number, cy: number, r: number): [number, number][] =>
  Array.from({ length: 6 }, (_, i): [number, number] => [cx + r * Math.cos((i * Math.PI) / 3), cy + r * Math.sin((i * Math.PI) / 3)])

export default {
  id: '1-5',
  name: 'Open Sky',
  theme: 'lava',
  start: [150, 430],
  goal: [10800, 580],
  deathY: 1200,
  shapes: [
    // Walls at either end
    { rect: [-400, -800, 400, 2200] },
    { rect: [11000, -800, 400, 2200] },
    // Start and goal platforms
    { rect: [0, 450, 300, 1000] },
    { rect: [10600, 640, 400, 760] },

    // A short roof to get going
    { path: [[0, -800], [1100, -800], [1100, 150], [850, 220], [600, 120], [350, 200], [0, 130]] },

    // A long stretch with no ceiling: small rocks of mixed shapes, high and low, close together and far apart
    { diamond: [1350, 260, 45] },
    { path: [[1600, 420], [1670, 530], [1530, 530]] },
    { rect: [1990, 170, 120, 26] },
    { diamond: [2250, 560, 30] },
    { path: hexagon(2700, 300, 45) },
    { rect: [2930, 60, 40, 140] },
    { path: [[3450, 380], [3550, 380], [3500, 480]] },
    { rect: [3700, 600, 40, 40] },
    { diamond: [4150, 250, 55] },
    { rect: [4390, 80, 120, 24] },
    { path: [[4880, 440], [4960, 440], [4960, 500], [4920, 500], [4920, 580], [4880, 580]] },
    { diamond: [5150, 330, 30] },
    { rect: [5135, 950, 30, 450] },
    { path: [[5700, 110], [5770, 220], [5630, 220]] },
    { rect: [5920, 420, 60, 60] },
    { path: hexagon(6450, 280, 40) },
    { diamond: [6650, 600, 35] },
    { rect: [7180, 140, 40, 140] },
    { rect: [7400, 410, 110, 24] },
    { diamond: [8000, 140, 50] },
    { path: [[8200, 480], [8300, 480], [8250, 580]] },
    { rect: [8670, 300, 60, 60] },
    { rect: [8685, 980, 30, 420] },
    { diamond: [9000, 180, 40] },
    { path: [[9450, 400], [9520, 500], [9380, 500]] },

    // Roof again for the run in to the goal
    { path: [[9700, -800], [11000, -800], [11000, 150], [10700, 230], [10400, 120], [10100, 220], [9700, 140]] },
  ],
} satisfies LevelData
