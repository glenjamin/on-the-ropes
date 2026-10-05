import type { LevelData } from '../level'
import { bumper } from './pinball'

export default {
  id: '5-1',
  name: 'Pop Bumpers',
  theme: 'pinball',
  start: [180, 430],
  goal: [6520, 620],
  deathY: 1250,
  shapes: [
    // Walls at either end
    { rect: [-400, -800, 400, 2300] },
    { rect: [6800, -800, 400, 2300] },
    // Start and goal platforms
    { rect: [0, 450, 360, 1050] },
    { rect: [6250, 680, 550, 820] },

    // A roof to get going
    { path: [[0, -800], [1100, -800], [1100, 100], [850, 160], [600, 100], [350, 150], [0, 110]] },

    // Bumpers to swing from: reel in too close and they kick you off
    bumper(1400, 250, 55),
    bumper(1900, 150, 55),
    bumper(2450, 260, 55),
    // Low bumpers under the swings knock a dip back up
    bumper(1650, 800, 45),
    bumper(2950, 820, 45),

    { rect: [2850, 110, 320, 34] },
    bumper(3550, 240, 55),
    bumper(4050, 140, 55),
    bumper(4350, 780, 45),
    bumper(4600, 260, 55),
    bumper(5100, 160, 55),

    // Roof over the goal
    { path: [[5450, -800], [6800, -800], [6800, 160], [6500, 220], [6200, 130], [5900, 220], [5650, 140], [5450, 170]] },
  ],
} satisfies LevelData
