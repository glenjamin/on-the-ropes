import {
  add,
  closestOnSegment,
  cross,
  dist,
  dot,
  len,
  norm,
  perp,
  pointInPolygon,
  pointInTriangle,
  scale,
  segmentHit,
  sub,
  type Vec,
} from './geom'
import { gongCentre, restingGong, swingGong, type Gong } from './gong'
import { gustStrength, type Level, type Poly, type Surface, type Vine } from './level'

export const RADIUS = 12
export const HOOK_RANGE = 700

const HOOK_SPEED = 6000
/** Shortest the rope can reel to; it can still be stretched longer than this when wrapped round corners. */
const ROPE_MIN_LENGTH = 24
const MAX_SPEED = 900
/** The speed limit after sliding on a launch ramp, until the next rope catches or the player touches other terrain. */
const LAUNCH_MAX_SPEED = 3600
/** Launch ramps push the player along them (units/s²), so a full run down one builds speed for a huge jump. */
const RAMP_BOOST = 2500
/** Walls give back some speed; floors and ceilings absorb most of it. */
const WALL_BOUNCE = 0.4
const CEILING_BOUNCE = 0.25
const FLOOR_BOUNCE = 0.15
/** Low, so the floor feels like ice. */
const GROUND_FRICTION = 0.3
/** Seconds the rope holds on each surface before slipping off; rock holds for good. Ice is well short of a full swing. */
const GRIP_SECS: Record<Surface, number | null> = { rock: null, ice: 0.25, 'dark-ice': 0.06 }
/** Real ice is slipperier still than the ordinary floor. */
const ICE_FRICTION = 0.05
/** Sliding on ice speeds the player up gently (units/s²), once they're moving faster than the minimum. */
const ICE_GLIDE = 150
const GLIDE_MIN_SPEED = 40
const ANCHOR_OFFSET = 1.5
/** Fraction of critical damping on the rope's stretch, so bungee bounces die away. */
const ROPE_DAMPING = 0.15
/** Once the gong is struck the player is held to its centre by a short, stiff cord. */
export const GONG_CORD_LENGTH = 47
const GONG_TETHER_STIFFNESS = 200
const GONG_BOUNCE = 0.7
/** How much of the player's impact speed goes into swinging the gong. */
const GONG_KICK = 0.004
/** A vine's weight relative to the player's: enough to swing heavily, light enough that grabbing one sets it swinging with you. */
const VINE_MASS = 2
/** Fraction of a vine's swing lost per second, so a vine left alone settles. */
const VINE_DAMPING = 0.8
/** A rope caught on a vine stretches far less than the bungee does on terrain, so the two swing together like one heavy rope. */
const VINE_ROPE_STIFFNESS = 240
const VINE_ROPE_DAMPING = 0.6
/** Rest length on catching a vine, as a fraction of the distance: nearly taut, so it doesn't yank like the bungee. */
const VINE_START_LENGTH = 0.9
/** Furthest a vine swings from hanging straight down, in radians, so it can't loop up over its branch. */
const VINE_MAX_ANGLE = (80 * Math.PI) / 180
/** Seconds a brown vine holds before snapping. */
const VINE_SNAP_SECS = 1
/** A green vine pushes the player along their swing (units/s²), building it up to `VINE_MAX_SPEED`. */
const VINE_PUMP = 700
/** The speed limit while on a green vine and in the flight after letting go, until the next catch or touching terrain. */
const VINE_MAX_SPEED = 1400

/** A point the rope passes through; `side` records which way it bent so it can unbend. */
type Anchor = { p: Vec; side: number }

/**
 * `age` is how long the rope has been attached; `grip` how long it holds before slipping off, or null if it holds for good.
 * `caught` is the terrain piece it caught on, or the vine and how far down it.
 */
export type Rope = { anchors: Anchor[]; length: number; age: number; grip: number | null; caught: Caught }
export type Caught = { poly: number } | { vine: number; along: number }
/** A vine's swing: `angle` from straight down (radians, positive towards +x), `spin` its rate, and when it snapped. */
export type VineState = { angle: number; spin: number; snapped: number | null }
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
  /** Seconds simulated since the level started, which times gusts that blow in bursts. */
  time = 0
  /** Set once the player reaches the goal: they bounce off the gong and stay caught around it. */
  gong: Gong | null = null
  /** Where and when the rope last slipped off ice or snapped a vine, for the puff of ice or leaves it leaves. */
  slip: { at: Vec; time: number } | null = null
  /** Pieces of dark ice that broke off when the rope slipped from them, by index, and when; they're gone until reset. */
  broken: { poly: number; time: number }[] = []
  /** Set by sliding on a launch ramp, which lifts the speed limit for the flight that follows. */
  launched = false
  /** Set by catching a green vine, which lifts the speed limit for the swing and the flight after it. */
  flung = false
  /** Each of the level's vines, in order. */
  vines: VineState[]

  constructor(private level: Level) {
    this.pos = { ...level.start }
    this.vines = hangingVines(level)
  }

  /** An independent copy, for exploring different choices from the same moment. */
  clone(): Sim {
    const copy = new Sim(this.level)
    const { pos, vel, rope, hook, grounded, stiffness, startLength, gravity, time, gong, slip, broken, launched, flung, vines } = this
    Object.assign(copy, structuredClone({ pos, vel, rope, hook, grounded, stiffness, startLength, gravity, time, gong, slip, broken, launched, flung, vines }))
    return copy
  }

  reset() {
    this.time = 0
    this.gong = null
    this.slip = null
    this.broken = []
    this.launched = false
    this.flung = false
    this.vines = hangingVines(this.level)
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

  /** Strike the goal gong: lets go of the rope, and from now on the player bounces off the gong and stays near it. */
  catchOnGong() {
    this.release()
    this.gong = restingGong(this.level.goal.pos, this.level.goal.radius)
  }

  /** Advances by dt while reeling the rope out (positive speed) or in (negative). */
  step(dt: number, reelSpeed: number) {
    const prev = this.pos
    this.time += dt
    if (this.rope) this.rope.age += dt
    this.slipOffIce()
    this.reel(reelSpeed * dt)
    this.vel.y += this.gravity * dt
    this.blowInGusts(dt)
    this.pumpOnVine(dt)
    this.swingVines(dt, this.pullOnRope(dt))
    const speed = len(this.vel)
    if (speed > this.speedLimit()) this.vel = scale(this.vel, this.speedLimit() / speed)
    this.pos = add(this.pos, scale(this.vel, dt))

    // A fresh rope sweeps from where it was fired, since the player kept moving while the hook flew
    const firedFrom = this.advanceHook(dt)
    if (this.rope) {
      this.updateWraps(firedFrom ?? prev)
    }
    this.collide(dt)
    if (this.gong) this.bounceOffGong(this.gong, dt)
  }

  private bounceOffGong(gong: Gong, dt: number) {
    swingGong(gong, dt)
    const centre = gongCentre(gong)
    const away = sub(this.pos, centre)
    const l = len(away)
    const touching = gong.radius + RADIUS
    if (!gong.bounced && l < touching && l > 1e-6) {
      const n = scale(away, 1 / l)
      this.pos = add(centre, scale(n, touching))
      const vn = dot(this.vel, n)
      if (vn < 0) {
        this.vel = sub(this.vel, scale(n, vn * (1 + GONG_BOUNCE)))
        gong.swingVel += n.x * vn * GONG_KICK
        gong.hits.push(this.time)
        gong.bounced = true
      }
    }
    const stretch = l - GONG_CORD_LENGTH
    if (stretch > 0) {
      const n = scale(away, -1 / l)
      const damping = 2 * ROPE_DAMPING * Math.sqrt(GONG_TETHER_STIFFNESS) * dot(this.vel, n)
      this.vel = add(this.vel, scale(n, Math.max(0, GONG_TETHER_STIFFNESS * stretch - damping) * dt))
    }
  }

  /** The rope lets go of ice once its grip runs out, and dark ice breaks off as it does; a brown vine snaps instead. */
  private slipOffIce() {
    const rope = this.rope
    if (rope?.grip == null || rope.age < rope.grip) return
    const { caught } = rope
    this.rope = null
    this.slip = { at: { ...rope.anchors[0].p }, time: this.time }
    if ('vine' in caught) this.vines[caught.vine].snapped = this.time
    else if (this.level.polys[caught.poly].surface === 'dark-ice') this.broken.push({ poly: caught.poly, time: this.time })
  }

  /** Changes the rope's rest length; reeling in a taut rope stretches it, and the stretch pulls the player in. */
  private reel(delta: number) {
    const rope = this.rope
    if (!rope || delta === 0) return
    rope.length = Math.max(ROPE_MIN_LENGTH, Math.min(HOOK_RANGE, rope.length + delta))
  }

  private blowInGusts(dt: number) {
    for (const gust of this.level.gusts) {
      const { min, max } = gust
      if (this.pos.x < min.x || this.pos.x > max.x || this.pos.y < min.y || this.pos.y > max.y) continue
      this.vel = add(this.vel, scale(gust.force, gustStrength(gust, this.time) * dt))
    }
  }

  /**
   * The rope is a bungee: slack when shorter than its rest length, pulling back in proportion to any stretch.
   * Returns how hard it pulls (per unit of the player's mass), which pulls the other way on a vine it's caught on.
   */
  private pullOnRope(dt: number): number {
    const rope = this.rope
    if (!rope) return 0
    const pivot = rope.anchors[rope.anchors.length - 1]
    const toPivot = sub(pivot.p, this.pos)
    const l = len(toPivot)
    const stretch = fixedLength(rope) + l - rope.length
    if (stretch <= 0 || l < 1e-6) return 0
    const n = scale(toPivot, 1 / l)
    const onVine = 'vine' in rope.caught
    const stiffness = onVine ? VINE_ROPE_STIFFNESS : this.stiffness
    // Damp the stretch as it changes, which on a swinging vine means relative to the vine's own movement
    const pivotVel = rope.anchors.length === 1 && 'vine' in rope.caught ? this.vineVelocity(rope.caught.vine, rope.caught.along) : { x: 0, y: 0 }
    const damping = 2 * (onVine ? VINE_ROPE_DAMPING : ROPE_DAMPING) * Math.sqrt(stiffness) * dot(sub(this.vel, pivotVel), n)
    const pull = Math.max(0, stiffness * stretch - damping)
    this.vel = add(this.vel, scale(n, pull * dt))
    return pull
  }

  /** A green vine pushes the player on along their swing, until they're going as fast as a vine can fling them. */
  private pumpOnVine(dt: number) {
    const rope = this.rope
    if (!rope || !('vine' in rope.caught) || this.level.vines[rope.caught.vine].kind !== 'green') return
    const across = norm(perp(sub(rope.anchors[rope.anchors.length - 1].p, this.pos)))
    const swing = dot(this.vel, across)
    if (Math.abs(swing) < GLIDE_MIN_SPEED || len(this.vel) >= VINE_MAX_SPEED) return
    this.vel = add(this.vel, scale(across, Math.sign(swing) * VINE_PUMP * dt))
  }

  /**
   * Vines swing as rods hanging from their pivots, pulled by the rope (with `pull` from `pullOnRope`) when it's
   * caught on one; the rope's anchor then moves with the vine.
   */
  private swingVines(dt: number, pull: number) {
    const rope = this.rope
    const held = rope && 'vine' in rope.caught ? rope.caught : null
    this.level.vines.forEach((vine, i) => {
      const state = this.vines[i]
      if (state.snapped !== null) return
      const inertia = (VINE_MASS * vine.length * vine.length) / 3
      let accel = -((3 * this.gravity) / (2 * vine.length)) * Math.sin(state.angle) - VINE_DAMPING * state.spin
      if (rope && held?.vine === i && pull > 0) {
        // The rope pulls the vine towards the next point along it, as hard as it pulls the player
        const next = rope.anchors[1]?.p ?? this.pos
        const force = scale(norm(sub(next, rope.anchors[0].p)), pull)
        accel += (held.along * dot(force, { x: Math.cos(state.angle), y: -Math.sin(state.angle) })) / inertia
      }
      state.spin += accel * dt
      state.angle += state.spin * dt
      if (Math.abs(state.angle) > VINE_MAX_ANGLE) {
        state.angle = Math.sign(state.angle) * VINE_MAX_ANGLE
        state.spin = 0
      }
    })
    if (rope && held) rope.anchors[0].p = vinePoint(this.level.vines[held.vine], this.vines[held.vine].angle, held.along)
  }

  private vineVelocity(index: number, along: number): Vec {
    const { angle, spin } = this.vines[index]
    return { x: Math.cos(angle) * spin * along, y: -Math.sin(angle) * spin * along }
  }

  /** Moves the hook, returning where it was fired from if it attached. */
  private advanceHook(dt: number): Vec | null {
    const hook = this.hook
    if (!hook) return null
    const stepLen = HOOK_SPEED * dt
    const next = add(hook.pos, scale(hook.dir, stepLen))
    const hit = this.raycast(hook.pos, next)
    const onVine = this.vineHit(hook.pos, next)
    if (onVine && (!hit || onVine.t < hit.t)) {
      const vine = this.level.vines[onVine.vine]
      const p = vinePoint(vine, this.vines[onVine.vine].angle, onVine.along)
      this.attach(p, vine.kind === 'brown' ? VINE_SNAP_SECS : null, { vine: onVine.vine, along: onVine.along }, VINE_START_LENGTH)
      this.flung = vine.kind === 'green'
      return hook.origin
    }
    if (hit) {
      this.attach(add(hit.point, scale(hit.normal, ANCHOR_OFFSET)), GRIP_SECS[hit.poly.surface], { poly: this.level.polys.indexOf(hit.poly) }, this.startLength)
      this.flung = false
      return hook.origin
    }
    hook.pos = next
    hook.travelled += stepLen
    if (hook.travelled > HOOK_RANGE) this.hook = null
    return null
  }

  private attach(p: Vec, grip: number | null, caught: Caught, startLength: number) {
    const length = Math.max(ROPE_MIN_LENGTH, dist(p, this.pos) * startLength)
    this.rope = { anchors: [{ p, side: 0 }], length, age: 0, grip, caught }
    this.launched = false
    this.hook = null
  }

  /** Where along p→p2 it first crosses a vine still hanging, and how far down that vine. */
  private vineHit(p: Vec, p2: Vec): { t: number; vine: number; along: number } | null {
    let best: { t: number; vine: number; along: number } | null = null
    this.level.vines.forEach((vine, i) => {
      const { angle, snapped } = this.vines[i]
      if (snapped !== null) return
      const tip = vinePoint(vine, angle, vine.length)
      const t = segmentHit(p, p2, vine.pivot, tip)
      if (t === null || (best && best.t <= t)) return
      best = { t, vine: i, along: dist(vine.pivot, add(p, scale(sub(p2, p), t))) }
    })
    return best
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
    let onIce = false
    let onRamp = false
    let onOther = false
    for (const poly of this.solidPolys()) {
      const pts = poly.pts
      if (pointInPolygon(this.pos, pts)) this.pos = escapePolygon(this.pos, pts, poly.edgeNormals)
      for (let i = 0; i < pts.length; i++) {
        const c = closestOnSegment(this.pos, pts[i], pts[(i + 1) % pts.length])
        const d = sub(this.pos, c)
        const l = len(d)
        if (l >= RADIUS) continue
        const n = l > 1e-6 ? scale(d, 1 / l) : poly.edgeNormals[i]
        this.pos = add(c, scale(n, RADIUS))
        if (poly.ramp) onRamp = true
        else onOther = true
        const isFloor = n.y < -0.6
        const isCeiling = n.y > 0.6
        const vn = dot(this.vel, n)
        if (vn < 0) {
          const restitution = isFloor ? FLOOR_BOUNCE : isCeiling ? CEILING_BOUNCE : WALL_BOUNCE
          const bounce = vn < -120 ? restitution : 0
          this.vel = sub(this.vel, scale(n, vn * (1 + bounce)))
        }
        if (isFloor) {
          this.grounded = true
          onIce ||= poly.surface !== 'rock'
        }
      }
    }
    if (onOther) this.launched = false
    else if (onRamp) this.launched = true
    if (onOther || onRamp) this.flung = false
    if (!this.grounded || this.rope) return
    this.vel.x *= Math.exp(-(onIce ? ICE_FRICTION : GROUND_FRICTION) * dt)
    const speed = len(this.vel)
    const push = (onIce ? ICE_GLIDE : 0) + (this.launched ? RAMP_BOOST : 0)
    if (push && speed > GLIDE_MIN_SPEED) this.vel = scale(this.vel, Math.min(this.speedLimit(), speed + push * dt) / speed)
  }

  private raycast(from: Vec, to: Vec): { t: number; point: Vec; normal: Vec; poly: Poly } | null {
    let best: { t: number; normal: Vec; poly: Poly } | null = null
    for (const poly of this.solidPolys()) {
      const pts = poly.pts
      for (let i = 0; i < pts.length; i++) {
        const t = segmentHit(from, to, pts[i], pts[(i + 1) % pts.length])
        if (t !== null && (!best || t < best.t)) best = { t, normal: poly.edgeNormals[i], poly }
      }
    }
    return best && { t: best.t, point: add(from, scale(sub(to, from), best.t)), normal: best.normal, poly: best.poly }
  }

  private blocked(from: Vec, to: Vec): boolean {
    for (const poly of this.solidPolys()) {
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
    for (const poly of this.solidPolys()) {
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

  private speedLimit(): number {
    return this.launched ? LAUNCH_MAX_SPEED : this.flung ? VINE_MAX_SPEED : MAX_SPEED
  }

  /** The terrain still in place, leaving out ice that has broken off. */
  solidPolys(): Poly[] {
    if (!this.broken.length) return this.level.polys
    return this.level.polys.filter((_, i) => !this.broken.some((b) => b.poly === i))
  }
}

/** The point `along` a vine from its pivot, when it hangs at `angle`. */
export function vinePoint(vine: Vine, angle: number, along: number): Vec {
  return { x: vine.pivot.x + Math.sin(angle) * along, y: vine.pivot.y + Math.cos(angle) * along }
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

function hangingVines(level: Level): VineState[] {
  return level.vines.map((v) => ({ angle: v.angle, spin: 0, snapped: null }))
}
