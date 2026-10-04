import {
  add,
  closestOnSegment,
  cross,
  dist,
  dot,
  len,
  norm,
  pointInPolygon,
  pointInTriangle,
  scale,
  segmentHit,
  sub,
  type Vec,
} from './geom'
import type { Level } from './level'

export const RADIUS = 12
export const HOOK_RANGE = 1000

const HOOK_SPEED = 6000
/** Shortest the rope can reel to; it can still be stretched longer than this when wrapped round corners. */
const ROPE_MIN_LENGTH = 24
const MAX_SPEED = 900
/** Walls give back some speed; floors and ceilings absorb most of it. */
const WALL_BOUNCE = 0.4
const CEILING_BOUNCE = 0.25
const FLOOR_BOUNCE = 0.15
/** Low, so the floor feels like ice. */
const GROUND_FRICTION = 0.3
const ANCHOR_OFFSET = 1.5
/** Fraction of critical damping on the rope's stretch, so bungee bounces die away. */
const ROPE_DAMPING = 0.15

/** A point the rope passes through; `side` records which way it bent so it can unbend. */
type Anchor = { p: Vec; side: number }

/** `age` is how long the rope has been attached. */
export type Rope = { anchors: Anchor[]; length: number; age: number }
export type Hook = { origin: Vec; pos: Vec; dir: Vec; travelled: number }

export class Sim {
  pos: Vec
  vel: Vec = { x: 0, y: 0 }
  rope: Rope | null = null
  hook: Hook | null = null
  grounded = false
  /** Rope spring constant (per s²): very high is effectively rigid, low is a stretchy bungee. */
  stiffness = 30
  /** Rope rest length on grabbing, as a fraction of the distance to the anchor; below 1 it pulls straight away. */
  startLength = 0.3
  /** Downward acceleration, units/s². */
  gravity = 2000

  constructor(private level: Level) {
    this.pos = { ...level.start }
  }

  reset() {
    this.pos = { ...this.level.start }
    this.vel = { x: 0, y: 0 }
    this.rope = null
    this.hook = null
  }

  fire(dir: Vec) {
    this.rope = null
    this.hook = { origin: { ...this.pos }, pos: { ...this.pos }, dir: norm(dir), travelled: 0 }
  }

  release() {
    this.rope = null
    this.hook = null
  }

  /** Advances by dt while reeling the rope out (positive speed) or in (negative). */
  step(dt: number, reelSpeed: number) {
    const prev = this.pos
    if (this.rope) this.rope.age += dt
    this.reel(reelSpeed * dt)
    this.vel.y += this.gravity * dt
    this.pullOnRope(dt)
    const speed = len(this.vel)
    if (speed > MAX_SPEED) this.vel = scale(this.vel, MAX_SPEED / speed)
    this.pos = add(this.pos, scale(this.vel, dt))

    // A fresh rope sweeps from where it was fired, since the player kept moving while the hook flew
    const firedFrom = this.advanceHook(dt)
    if (this.rope) {
      this.updateWraps(firedFrom ?? prev)
    }
    this.collide(dt)
  }

  /** Changes the rope's rest length; reeling in a taut rope stretches it, and the stretch pulls the player in. */
  private reel(delta: number) {
    const rope = this.rope
    if (!rope || delta === 0) return
    rope.length = Math.max(ROPE_MIN_LENGTH, Math.min(HOOK_RANGE, rope.length + delta))
  }

  /** The rope is a bungee: slack when shorter than its rest length, pulling back in proportion to any stretch. */
  private pullOnRope(dt: number) {
    const rope = this.rope
    if (!rope) return
    const toPivot = sub(rope.anchors[rope.anchors.length - 1].p, this.pos)
    const l = len(toPivot)
    const stretch = fixedLength(rope) + l - rope.length
    if (stretch <= 0 || l < 1e-6) return
    const n = scale(toPivot, 1 / l)
    const damping = 2 * ROPE_DAMPING * Math.sqrt(this.stiffness) * dot(this.vel, n)
    const pull = Math.max(0, this.stiffness * stretch - damping)
    this.vel = add(this.vel, scale(n, pull * dt))
  }

  /** Moves the hook, returning where it was fired from if it attached. */
  private advanceHook(dt: number): Vec | null {
    const hook = this.hook
    if (!hook) return null
    const stepLen = HOOK_SPEED * dt
    const next = add(hook.pos, scale(hook.dir, stepLen))
    const hit = this.raycast(hook.pos, next)
    if (hit) {
      const p = add(hit.point, scale(hit.normal, ANCHOR_OFFSET))
      this.rope = { anchors: [{ p, side: 0 }], length: Math.max(ROPE_MIN_LENGTH, dist(p, this.pos) * this.startLength), age: 0 }
      this.hook = null
      return hook.origin
    }
    hook.pos = next
    hook.travelled += stepLen
    if (hook.travelled > HOOK_RANGE) this.hook = null
    return null
  }

  /** Bend the rope around corners it swings into, and unbend it when it swings back. */
  private updateWraps(prev: Vec) {
    const rope = this.rope!
    const anchors = rope.anchors
    while (anchors.length > 1) {
      const a = anchors[anchors.length - 1]
      const b = anchors[anchors.length - 2]
      if (cross(sub(a.p, b.p), sub(this.pos, b.p)) * a.side >= 0) break
      anchors.pop()
    }
    for (let i = 0; i < 4; i++) {
      const pivot = anchors[anchors.length - 1].p
      if (!this.blocked(pivot, this.pos)) break
      const corner = this.firstCornerSwept(pivot, prev, this.pos)
      if (!corner) break
      const side = Math.sign(cross(sub(corner, pivot), sub(this.pos, pivot)))
      anchors.push({ p: corner, side })
    }
  }

  private collide(dt: number) {
    this.grounded = false
    for (const poly of this.level.polys) {
      const pts = poly.pts
      if (pointInPolygon(this.pos, pts)) this.pos = escapePolygon(this.pos, pts, poly.edgeNormals)
      for (let i = 0; i < pts.length; i++) {
        const c = closestOnSegment(this.pos, pts[i], pts[(i + 1) % pts.length])
        const d = sub(this.pos, c)
        const l = len(d)
        if (l >= RADIUS) continue
        const n = l > 1e-6 ? scale(d, 1 / l) : poly.edgeNormals[i]
        this.pos = add(c, scale(n, RADIUS))
        const isFloor = n.y < -0.6
        const isCeiling = n.y > 0.6
        const vn = dot(this.vel, n)
        if (vn < 0) {
          const restitution = isFloor ? FLOOR_BOUNCE : isCeiling ? CEILING_BOUNCE : WALL_BOUNCE
          const bounce = vn < -120 ? restitution : 0
          this.vel = sub(this.vel, scale(n, vn * (1 + bounce)))
        }
        if (isFloor) this.grounded = true
      }
    }
    if (this.grounded && !this.rope) this.vel.x *= Math.exp(-GROUND_FRICTION * dt)
  }

  private raycast(from: Vec, to: Vec): { point: Vec; normal: Vec } | null {
    let best: { t: number; normal: Vec } | null = null
    for (const poly of this.level.polys) {
      const pts = poly.pts
      for (let i = 0; i < pts.length; i++) {
        const t = segmentHit(from, to, pts[i], pts[(i + 1) % pts.length])
        if (t !== null && (!best || t < best.t)) best = { t, normal: poly.edgeNormals[i] }
      }
    }
    return best && { point: add(from, scale(sub(to, from), best.t)), normal: best.normal }
  }

  private blocked(from: Vec, to: Vec): boolean {
    for (const poly of this.level.polys) {
      const pts = poly.pts
      for (let i = 0; i < pts.length; i++) {
        const t = segmentHit(from, to, pts[i], pts[(i + 1) % pts.length])
        if (t !== null && t > 1e-4 && t < 1 - 1e-4) return true
      }
    }
    return false
  }

  /** Where the rope rests on the corner it struck first while sweeping from pivot→prev to pivot→cur. */
  private firstCornerSwept(pivot: Vec, prev: Vec, cur: Vec): Vec | null {
    const from = sub(prev, pivot)
    let best: { p: Vec; angle: number; d: number } | null = null
    for (const poly of this.level.polys) {
      for (const { at, wrap } of poly.corners) {
        const d = dist(at, pivot)
        if (dist(wrap, pivot) < 1 || !pointInTriangle(at, pivot, prev, cur)) continue
        const rel = sub(at, pivot)
        const angle = Math.abs(Math.atan2(cross(from, rel), dot(from, rel)))
        if (!best || angle < best.angle - 1e-6 || (Math.abs(angle - best.angle) <= 1e-6 && d < best.d)) {
          best = { p: wrap, angle, d }
        }
      }
    }
    return best?.p ?? null
  }
}

export function fixedLength(rope: Rope): number {
  let total = 0
  for (let i = 1; i < rope.anchors.length; i++) total += dist(rope.anchors[i - 1].p, rope.anchors[i].p)
  return total
}

function escapePolygon(p: Vec, pts: Vec[], normals: Vec[]): Vec {
  let best = { d: Infinity, point: p }
  for (let i = 0; i < pts.length; i++) {
    const c = closestOnSegment(p, pts[i], pts[(i + 1) % pts.length])
    const d = dist(p, c)
    if (d < best.d) best = { d, point: add(c, scale(normals[i], RADIUS)) }
  }
  return best.point
}
