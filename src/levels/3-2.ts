import type { LevelData } from '../level'

const icicle = (x: number, top: number, length: number): [number, number][] => [[x - 35, top], [x + 35, top], [x, top + length]]

export default {
  id: '3-2',
  name: 'Icicle Cavern',
  theme: 'ice',
  start: [180, 430],
  goal: [6750, 600],
  deathY: 1250,
  shapes: [
    // Walls at either end
    { rect: [-400, -800, 400, 2300] },
    { rect: [7050, -800, 400, 2300] },
    // Start and goal platforms
    { rect: [0, 450, 360, 1000] },
    { rect: [6500, 660, 550, 840] },

    // Rock stalactites between sheets of ice
    { path: [[450, 120], [600, 120], [560, 330], [500, 330]] },
    { path: [[1720, 110], [1880, 110], [1830, 340], [1770, 340]] },
    { path: [[3120, 100], [3280, 100], [3230, 320], [3170, 320]] },
    { path: [[4520, 120], [4680, 120], [4630, 340], [4570, 340]] },
    { path: [[5900, 100], [6060, 100], [6010, 320], [5950, 320]] },

    // Sheets of ice between the stalactites, with icicles hanging off them
    { path: [[600, 100], [1720, 100], [1700, 240], [1450, 280], [1200, 230], [950, 270], [700, 230], [620, 250]], surface: 'ice' },
    { path: [[1880, 100], [3120, 100], [3100, 250], [2850, 220], [2600, 270], [2350, 230], [2100, 280], [1900, 240]], surface: 'ice' },
    { path: [[3280, 90], [4520, 90], [4500, 230], [4250, 280], [4000, 240], [3750, 270], [3500, 220], [3300, 250]], surface: 'ice' },
    { path: [[4680, 100], [5900, 100], [5880, 250], [5650, 230], [5400, 280], [5150, 240], [4900, 270], [4700, 230]], surface: 'ice' },
    { path: icicle(1200, 225, 170), surface: 'dark-ice' },
    { path: icicle(2350, 225, 150), surface: 'dark-ice' },
    { path: icicle(2850, 215, 200), surface: 'dark-ice' },
    { path: icicle(4000, 235, 180), surface: 'dark-ice' },
    { path: icicle(5150, 235, 160), surface: 'dark-ice' },
    { path: icicle(5650, 225, 210), surface: 'dark-ice' },

    // A rock roof over it all, hiding the tops of what hangs from it
    { path: [[0, -800], [7050, -800], [7050, 130], [6500, 160], [6000, 110], [5500, 150], [5000, 100], [4500, 150], [4000, 110], [3500, 150], [3000, 100], [2500, 150], [2000, 110], [1500, 150], [1000, 110], [500, 150], [0, 120]] },

    // Ice floes on the water to land on
    { rect: [2200, 860, 320, 640], surface: 'ice' },
    { rect: [3800, 820, 260, 680], surface: 'ice' },
    { rect: [5250, 860, 320, 640], surface: 'ice' },
  ],
} satisfies LevelData
