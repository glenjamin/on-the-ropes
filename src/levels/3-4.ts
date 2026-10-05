import type { LevelData } from '../level'

const hexagon = (cx: number, cy: number, r: number): [number, number][] =>
  Array.from({ length: 6 }, (_, i): [number, number] => [cx + r * Math.cos((i * Math.PI) / 3), cy + r * Math.sin((i * Math.PI) / 3)])

export default {
  id: '3-4',
  name: 'Glacier',
  theme: 'ice',
  start: [150, 430],
  goal: [6950, 580],
  deathY: 1250,
  shapes: [
    // Walls at either end
    { rect: [-400, -800, 400, 2300] },
    { rect: [7250, -800, 400, 2300] },
    // Start and goal platforms
    { rect: [0, 450, 300, 1000] },
    { rect: [6700, 640, 550, 860] },

    // A short roof to get going
    { path: [[0, -800], [950, -800], [950, 150], [700, 220], [450, 120], [200, 200], [0, 130]] },

    // Open sky full of broken ice, with a rock every so often to swing properly from; the dark shards break at a touch
    { diamond: [1300, 260, 50] },
    { path: [[1650, 420], [1750, 420], [1700, 540]], surface: 'dark-ice' },
    { rect: [1980, 170, 140, 30], surface: 'ice' },
    { diamond: [2400, 520, 45], surface: 'ice' },
    { path: hexagon(2750, 290, 45) },
    { rect: [3050, 90, 140, 30], surface: 'ice' },
    { path: [[3400, 410], [3500, 410], [3450, 520]], surface: 'dark-ice' },
    { diamond: [3750, 240, 50], surface: 'ice' },
    { diamond: [4100, 330, 50] },
    { rect: [4400, 110, 140, 30], surface: 'ice' },
    { path: [[4750, 440], [4850, 440], [4800, 550]], surface: 'dark-ice' },
    { diamond: [5100, 220, 50], surface: 'ice' },
    { path: hexagon(5450, 380, 40), surface: 'ice' },
    { diamond: [5800, 200, 50] },
    { path: [[6100, 340], [6200, 340], [6150, 450]], surface: 'dark-ice' },
    { rect: [6380, 170, 140, 30], surface: 'ice' },

    // Roof again for the run in to the goal
    { path: [[6600, -800], [7250, -800], [7250, 150], [7000, 230], [6800, 130], [6600, 180]] },
  ],
} satisfies LevelData
