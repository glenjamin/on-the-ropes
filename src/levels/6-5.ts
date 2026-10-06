import type { LevelData } from '../level'
import { conveyorLoop, girder } from './factory'

export default {
  id: '6-5',
  name: 'Overtime',
  theme: 'factory',
  start: [180, 430],
  goal: [7400, 620],
  deathY: 1250,
  shapes: [
    // Walls at either end
    { rect: [-400, -1000, 400, 2500] },
    { rect: [7700, -1000, 400, 2500] },
    // Start and goal platforms
    { rect: [0, 450, 360, 1050] },
    { rect: [7150, 680, 550, 820] },

    { path: [[0, -1000], [1100, -1000], [1100, 100], [850, 160], [600, 100], [350, 150], [0, 110]] },
    girder(1350, 110, 220),

    // Nothing to swing from over the long gap: ride a crate across, ducking under the wire
    girder(1750, 150, 200),
    girder(4300, 180, 220),

    girder(5000, 100, 200),
    girder(6000, 140, 200),
    { path: [[6500, -1000], [7700, -1000], [7700, 160], [7400, 220], [7150, 130], [6900, 200], [6650, 120], [6500, 150]] },
  ],
  conveyors: [{ loop: conveyorLoop(1850, 620, 4150, 900), speed: 380, crates: 10 }],
  wires: [
    { from: [2650, 520], to: [3800, 520] },
    { from: [4700, -100], to: [4700, 800], cycle: { period: 2.2, on: 1 } },
    { from: [5500, 450], to: [5900, 450], cycle: { period: 2.2, on: 1, offset: 1.1 } },
    { from: [6300, -100], to: [6300, 820], cycle: { period: 2.4, on: 1.1, offset: 0.5 } },
  ],
  platforms: [
    { rect: [5450, -300, 150, 400], travel: [0, 450], period: 2.4 },
    { rect: [6500, 350, 220, 30], travel: [0, 220], period: 3.5 },
  ],
} satisfies LevelData
