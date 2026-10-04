import { describe, expect, it } from 'vitest'
import { dist, pointInPolygon, segmentHit, type Vec } from './geom'
import { buildLevel, type Level } from './level'
import { Sim } from './sim'

const DT = 1 / 240

describe('swinging on the rope', () => {
  it('hangs below where the rope grabbed after firing straight up', () => {
    const level = buildLevel()
    const sim = new Sim(level)
    sim.fire({ x: 0, y: -1 })
    run(sim, 3, () => 0)

    const anchor = sim.rope!.anchors[0].p
    expect(sim.rope!.anchors).toHaveLength(1)
    expect(Math.abs(sim.pos.x - anchor.x)).toBeLessThan(5)
    expect(sim.pos.y).toBeGreaterThan(anchor.y)
    expect(dist(sim.pos, anchor)).toBeCloseTo(sim.rope!.length, 0)
  })

  it('never lets the player or the rope pass through terrain during random play', () => {
    const stats = randomPlay(400)
    expect(stats.attaches).toBeGreaterThan(200)
    expect(stats.stepsInsideTerrain).toBe(0)
    expect(stats.stepsRopeThroughTerrain).toBe(0)
  })

  it('bends the rope around corners and unbends it when swung back', () => {
    const stats = randomPlay(400)
    expect(stats.maxBends).toBeGreaterThan(0)
    expect(stats.unbends).toBeGreaterThan(0)
  })
})

/** Fires at random upward angles, swinging right while holding then letting go, like an eager player. */
function randomPlay(attempts: number) {
  const level = buildLevel()
  const sim = new Sim(level)
  const random = seededRandom(1)
  const stats = { attaches: 0, maxBends: 0, unbends: 0, stepsInsideTerrain: 0, stepsRopeThroughTerrain: 0 }

  for (let attempt = 0; attempt < attempts; attempt++) {
    const angle = -Math.PI / 2 + random() * 1.1
    const hold = 0.4 + random() * 1.5
    sim.fire({ x: Math.cos(angle), y: Math.sin(angle) })
    let hadRope = false
    let lastBends = 0
    for (let t = 0; t < hold + 0.35; t += DT) {
      if (t > hold && sim.rope) sim.release()
      sim.step(DT, t < hold ? 0.6 : 0)

      if (sim.rope) {
        if (!hadRope) stats.attaches++
        hadRope = true
        const bends = sim.rope.anchors.length - 1
        if (bends < lastBends) stats.unbends++
        lastBends = bends
        stats.maxBends = Math.max(stats.maxBends, bends)
        const points = [...sim.rope.anchors.map((a) => a.p), sim.pos]
        if (points.some((p, i) => i > 0 && crossesTerrain(level, points[i - 1], p))) stats.stepsRopeThroughTerrain++
      }
      if (level.polys.some((poly) => pointInPolygon(sim.pos, poly.pts))) stats.stepsInsideTerrain++
      if (sim.pos.y > level.lavaY) {
        sim.reset()
        break
      }
    }
  }
  return stats
}

function run(sim: Sim, seconds: number, pump: (t: number) => number) {
  for (let t = 0; t < seconds; t += DT) sim.step(DT, pump(t))
}

/** Ignores touches at the very ends, where the rope legitimately rests just off a surface. */
function crossesTerrain(level: Level, a: Vec, b: Vec): boolean {
  return level.polys.some((poly) =>
    poly.pts.some((p, i) => {
      const t = segmentHit(a, b, p, poly.pts[(i + 1) % poly.pts.length])
      return t !== null && t > 0.01 && t < 0.99
    }),
  )
}

function seededRandom(seed: number): () => number {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}
