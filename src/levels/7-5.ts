import type { LevelData } from '../level'

export default {
  id: '7-5',
  name: 'Event Horizon',
  theme: 'space',
  gravity: 900,
  start: [180, 430],
  goal: [6300, 380],
  goalMount: 'floating',
  deathY: 1300,
  shapes: [
    // Walls at either end
    { rect: [-400, -1000, 400, 2600] },
    { rect: [7300, -1000, 400, 2600] },
    { path: [[0, 450], [360, 450], [330, 620], [200, 720], [0, 680]] },

    { path: [[0, -1000], [1000, -1000], [1000, 110], [760, 170], [520, 100], [300, 150], [0, 110]] },

  ],
  planets: [
    // Planet to planet across the gaps, with nothing else to catch
    { at: [1400, 320], r: 110, spin: 'ccw' },
    { at: [3460, 300], r: 100, spin: 'cw' },
    { at: [5500, 280], r: 90, spin: 'ccw' },
    // Beside the black hole: whirl over its top to be flung back across the hole at the gong
    { at: [6780, 330], r: 75, spin: 'ccw' },
  ],
  // The gong hangs just above the big black hole: swing round it, or skim past its pull
  blackHoles: [
    { at: [2450, 800], horizon: 35 },
    { at: [6300, 640], horizon: 55 },
  ],
} satisfies LevelData
