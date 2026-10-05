import type { LevelData } from '../level'
import { skiJump } from './ice'

export default {
  id: '3-5',
  name: 'Avalanche',
  theme: 'ice',
  start: [150, 430],
  goal: [12200, 950],
  goalMount: 'floating',
  deathY: 1700,
  flags: [[3877, 330]],
  shapes: [
    // Walls at either end
    { rect: [-400, -800, 400, 2800] },
    { rect: [12800, -800, 400, 2800] },
    { rect: [0, 450, 300, 1450] },

    // A roof glazed with ice, with rock showing in a couple of places
    { path: [[700, 90], [1300, 90], [1280, 230], [1150, 260], [1000, 220], [850, 270], [720, 220]], surface: 'ice' },
    { path: [[0, -800], [1300, -800], [1300, 120], [1050, 180], [800, 110], [550, 170], [300, 100], [0, 140]] },

    // Scattered ice and two rocks up to the top of the jump, with icicles that break as soon as they're grabbed
    { diamond: [1650, 300, 45], surface: 'ice' },
    { rect: [2000, 120, 130, 30], surface: 'ice' },
    { path: [[1980, 150], [2030, 150], [2005, 290]], surface: 'dark-ice' },
    { diamond: [2350, 380, 50] },
    { path: [[2700, 200], [2800, 200], [2750, 310]], surface: 'dark-ice' },
    { diamond: [2850, 380, 45] },
    { diamond: [3050, 120, 45] },

    // Room to swing in high and drop onto the top of the ramp
    { diamond: [3350, 250, 45] },
    { diamond: [3600, -50, 50] },

    // A long launch ramp: start above the flag, and the slide throws you across screens of open water.
    // Dropping onto the slope lower down doesn't build enough speed to reach the far side
    skiJump({ top: [3750, 250], drop: 32, run: 1500, radius: 300, lip: 35, base: 2000, ramp: true }),

    // Nothing to land on: latch onto the ice at the end of the flight, only in reach after a full jump, or fall
    { diamond: [10150, 1050, 45], surface: 'ice' },
    { diamond: [10400, 900, 50], surface: 'ice' },
    { diamond: [10700, 650, 45], surface: 'ice' },
    { rect: [10950, 420, 140, 30], surface: 'ice' },
    { diamond: [11350, 350, 50], surface: 'ice' },
    // A fin of ice below glances a missed latch back up for a moment near the ice, then drops it in the water
    { path: [[10600, 1290], [10820, 1140], [10850, 1200], [10660, 1340]], surface: 'ice' },

    // Then rock, and the gong floating beyond among a few shards of ice
    { diamond: [11750, 550, 50] },
    { path: [[12150, 500], [12220, 500], [12185, 660]], surface: 'dark-ice' },
    { diamond: [12500, 600, 50] },
  ],
} satisfies LevelData
