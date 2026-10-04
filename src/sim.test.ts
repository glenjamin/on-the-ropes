import { describe, expect, it } from 'vitest'
import { dist, pointInPolygon, segmentHit, type Vec } from './geom'
import { buildLevel, type Level } from './level'
import { Sim } from './sim'

const DT = 1 / 240
const REEL_SPEED = 450

describe('swinging on the rope', () => {
  it('hangs below where the rope grabbed, stretched by the player’s weight', () => {
    const sim = new Sim(buildLevel())
    sim.fire({ x: 0, y: -1 })
    run(sim, 1, -200)
    run(sim, 3, 0)

    const anchor = sim.rope!.anchors[0].p
    expect(sim.rope!.anchors).toHaveLength(1)
    expect(Math.abs(sim.pos.x - anchor.x)).toBeLessThan(15)
    expect(sim.pos.y).toBeGreaterThan(anchor.y)
    const stretch = dist(sim.pos, anchor) - sim.rope!.length
    const expected = sim.gravity / sim.stiffness
    expect(stretch).toBeGreaterThan(expected * 0.85)
    expect(stretch).toBeLessThan(expected * 1.15)
  })

  it('reeling in pulls the player up towards where the rope grabbed', () => {
    const distanceAfter = (reelSpeed: number) => {
      const sim = new Sim(buildLevel())
      sim.fire({ x: 0, y: -1 })
      run(sim, 1.5, reelSpeed)
      return dist(sim.pos, sim.rope!.anchors[0].p)
    }
    expect(distanceAfter(-200)).toBeLessThan(distanceAfter(0) - 100)
  })

  it('grabbing with a shorter start length pulls the player in straight away', () => {
    const pulledIn = (startLength: number) => {
      const sim = new Sim(buildLevel())
      sim.startLength = startLength
      sim.fire({ x: 0, y: -1 })
      run(sim, 0.15, 0)
      const grabbedFrom = dist(sim.pos, sim.rope!.anchors[0].p)
      run(sim, 0.3, 0)
      return grabbedFrom - dist(sim.pos, sim.rope!.anchors[0].p)
    }
    expect(pulledIn(1)).toBeLessThan(5)
    expect(pulledIn(0.5)).toBeGreaterThan(50)
  })

  it('a stiff rope barely stretches, a soft one stretches like a bungee', () => {
    const maxStretch = (stiffness: number) => {
      const sim = new Sim(buildLevel())
      sim.stiffness = stiffness
      sim.startLength = 1
      sim.fire({ x: Math.sin(0.6), y: -Math.cos(0.6) })
      let most = 0
      for (let t = 0; t < 2; t += DT) {
        sim.step(DT, -200)
        if (sim.rope?.anchors.length === 1) most = Math.max(most, dist(sim.pos, sim.rope.anchors[0].p) - sim.rope.length)
      }
      return most
    }
    expect(maxStretch(20000)).toBeLessThan(3)
    expect(maxStretch(20)).toBeGreaterThan(40)
  })

  it('falls no faster than the speed limit', () => {
    const sim = new Sim(buildLevel())
    sim.pos = { x: 1950, y: -500 }
    let top = 0
    for (let t = 0; t < 1.8; t += DT) {
      sim.step(DT, 0)
      top = Math.max(top, Math.hypot(sim.vel.x, sim.vel.y))
    }
    expect(top).toBeCloseTo(900, 0)
  })

  it('rebounds off walls but mostly absorbs hits on floors and ceilings', () => {
    const wall = new Sim(buildLevel())
    wall.pos = { x: 60, y: 200 }
    wall.vel = { x: -600, y: 0 }
    run(wall, 0.2, 0)
    expect(wall.vel.x).toBeGreaterThan(600 * 0.3)

    const floor = new Sim(buildLevel())
    floor.pos = { x: 180, y: 380 }
    floor.vel = { x: 0, y: 600 }
    let rebound = 0
    for (let t = 0; t < 0.3; t += DT) {
      floor.step(DT, 0)
      rebound = Math.max(rebound, -floor.vel.y)
    }
    expect(rebound).toBeLessThan(600 * 0.2)

    const ceiling = new Sim(buildLevel())
    ceiling.pos = { x: 180, y: 200 }
    ceiling.vel = { x: 0, y: -600 }
    let afterHit = 0
    for (let t = 0; t < 0.3 && afterHit === 0; t += DT) {
      ceiling.step(DT, 0)
      if (ceiling.vel.y > 0) afterHit = ceiling.vel.y
    }
    expect(afterHit).toBeLessThan(600 * 0.3)
  })

  it('slides along the floor like ice', () => {
    const sim = new Sim(buildLevel())
    sim.pos = { x: 6300, y: 668 }
    sim.vel = { x: 300, y: 0 }
    run(sim, 1, 0)
    expect(sim.vel.x).toBeGreaterThan(200)
  })

  it('never lets the player or the rope pass through terrain during random play', () => {
    const stats = randomPlay(400)
    expect(stats.attaches).toBeGreaterThan(200)
    expect(stats.stepsInsideTerrain).toBe(0)
    expect(stats.stepsRopeThroughTerrain).toBe(0)
  })

  it('never lengthens the rope while reeling in, even as it bends round corners', () => {
    expect(randomPlay(400).stepsRopeLengthened).toBe(0)
  })

  it('bends the rope around corners and unbends it when swung back', () => {
    const stats = randomPlay(400)
    expect(stats.maxBends).toBeGreaterThan(0)
    expect(stats.unbends).toBeGreaterThan(0)
  })
})

/** Fires at random upward angles, reeling in for a while then letting go, like an eager player. */
function randomPlay(attempts: number) {
  const level = buildLevel()
  const sim = new Sim(level)
  const random = seededRandom(1)
  const stats = { attaches: 0, maxBends: 0, unbends: 0, stepsInsideTerrain: 0, stepsRopeThroughTerrain: 0, stepsRopeLengthened: 0 }

  for (let attempt = 0; attempt < attempts; attempt++) {
    const angle = -Math.PI / 2 + random() * 1.1
    const hold = 0.4 + random() * 1.5
    const reelFor = random() * hold
    sim.fire({ x: Math.cos(angle), y: Math.sin(angle) })
    let hadRope = false
    let lastBends = 0
    let lastLength = Infinity
    for (let t = 0; t < hold + 0.35; t += DT) {
      if (t > hold && sim.rope) sim.release()
      sim.step(DT, t < reelFor ? -REEL_SPEED : 0)

      if (sim.rope) {
        if (!hadRope) stats.attaches++
        hadRope = true
        const bends = sim.rope.anchors.length - 1
        if (sim.rope.length > lastLength + 1e-6) stats.stepsRopeLengthened++
        lastLength = sim.rope.length
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

function run(sim: Sim, seconds: number, reelSpeed: number) {
  for (let t = 0; t < seconds; t += DT) sim.step(DT, reelSpeed)
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
