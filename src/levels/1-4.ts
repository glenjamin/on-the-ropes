import type { LevelData } from '../level'

/** A stalagmite rising out of the lava to a point. */
const stalagmite = (x: number, tipY: number): [number, number][] => [[x - 70, 1400], [x, tipY], [x + 70, 1400]]

export default {
  id: '1-4',
  name: 'Fangs',
  start: [150, 430],
  goal: [7400, 580],
  lavaY: 1200,
  shapes: [
    // Walls at either end
    { rect: [-400, -800, 400, 2200] },
    { rect: [7600, -800, 400, 2200] },
    // Start and goal platforms
    { rect: [0, 450, 300, 1000] },
    { rect: [7200, 640, 400, 760] },

    // One long roof bristling with stalactites
    {
      path: [
        [0, -800], [7600, -800], [7600, 160],
        [7300, 220], [7000, 140],
        [6840, 150], [6800, 380], [6760, 150],
        [6500, 230],
        [6240, 170], [6200, 500], [6160, 170],
        [5800, 140],
        [5290, 180], [5250, 750], [5210, 180],
        [4900, 230],
        [4340, 160], [4300, 550], [4260, 160],
        [3800, 200],
        [3390, 150], [3350, 700], [3310, 150],
        [3000, 220],
        [2540, 170], [2500, 480], [2460, 170],
        [2100, 120],
        [1740, 180], [1700, 600], [1660, 180],
        [1300, 230],
        [940, 150], [900, 520], [860, 150],
        [500, 220], [250, 120], [0, 150],
      ],
    },

    // Stalagmites; two pairs overlap a stalactite to make a zig-zag passage
    { path: stalagmite(1300, 800) },
    { path: stalagmite(2100, 750) },
    { path: stalagmite(3500, 450) },
    { path: stalagmite(3900, 800) },
    { path: stalagmite(4700, 700) },
    { path: stalagmite(5100, 500) },
    { path: stalagmite(5800, 780) },
  ],
} satisfies LevelData
