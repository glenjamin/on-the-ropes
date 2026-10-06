import type { LevelData } from '../level'
import { girder } from './factory'

export default {
  id: '6-4',
  name: 'Crate Lift',
  theme: 'factory',
  start: [180, 430],
  goal: [6250, -1350],
  goalMount: 'floating',
  deathY: 1250,
  shapes: [
    // Walls at either end
    { rect: [-400, -2000, 400, 3500] },
    { rect: [6600, -2000, 400, 3500] },
    { rect: [0, 450, 360, 1050] },

    { path: [[0, -2000], [1100, -2000], [1100, 100], [850, 160], [600, 100], [350, 150], [0, 110]] },
    girder(1300, 150, 250),
    // Inside the lift's loop, to swing out over the crates coming along the bottom
    girder(2100, 180, 200),

    // The upper floor: nothing up here is in reach from below, so ride a crate up to it
    { rect: [3280, -1100, 500, 40] },
    { path: [[1700, -2000], [6600, -2000], [6600, -1650], [6300, -1600], [5900, -1700], [5500, -1620], [5100, -1720], [4700, -1640], [4300, -1730], [3900, -1650], [3500, -1720], [3100, -1660], [2700, -1740], [2300, -1680], [1700, -1720]] },
    girder(3700, -1350, 220),
    girder(4800, -1300, 220),
  ],
  conveyors: [
    {
      // Along the bottom, up to the upper floor, then back over the top and down past the way in
      loop: [[1900, 700], [2500, 700], [2500, -1100], [3200, -1100], [3200, -1500], [1900, -1500]],
      speed: 320,
      crates: 8,
    },
  ],
  wires: [
    { from: [3500, -1000], to: [3500, -600] },
    { from: [4250, -1150], to: [4250, -750], cycle: { period: 2.4, on: 1.2 } },
    { from: [5300, -1100], to: [5700, -1100] },
  ],
  platforms: [{ rect: [5500, -1450, 220, 30], travel: [0, 200], period: 4 }],
} satisfies LevelData
