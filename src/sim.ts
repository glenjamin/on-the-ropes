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
import { gustStrength, moverOffset, moverVelocity, wireLive, type Flipper, type Level, type Poly, type Surface, type Vine } from './level'

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
const VINE_SNAP_SECS = 0.5
/** A green vine pushes the player along their swing (units/s²), building it up to `VINE_MAX_SPEED`. */
const VINE_PUMP = 700
/** The speed limit while on a green vine and in the flight after letting go, until the next catch or touching terrain. */
const VINE_MAX_SPEED = 1400
/** A bumper sends the player back out as fast as they hit it, plus this much (units/s). */
const BUMPER_KICK = 450
/** The speed limit after a bumper or flipper strikes the player, until the next catch or touching terrain. */
const KICK_MAX_SPEED = 1400
/** Seconds a flipper takes to flip up, how long it stays up, and how long it takes to drop back. */
const FLIP_UP_SECS = 0.08
const FLIP_HOLD_SECS = 0.25
const FLIP_DOWN_SECS = 0.25
/** How close the player comes to a flipper's face, beyond touching it, before it flips. */
const FLIPPER_REACH = 40
/** Half a flipper paddle's thickness. */
export const FLIPPER_RADIUS = 10
/** A flipper's own bounce, on top of the speed its paddle is moving at. */
const FLIPPER_BOUNCE = 0.4
/** Seconds a launcher holds the player before firing, and after firing before it can catch them again. */
export const LAUNCHER_HOLD_SECS = 0.5
const LAUNCHER_REARM_SECS = 0.5
/** How near a launcher's resting point the player must come to be caught. */
const LAUNCHER_CATCH = 36
/** How quickly a conveyor belt brings whoever stands on it up to its speed (per second). */
const BELT_GRIP = 4
/** How far a moving platform can squeeze the player into something else before crushing them. */
const CRUSH_DEPTH = 5
/** Half a live wire's thickness: touching it is the player's radius plus this away. */
export const WIRE_RADIUS = 3

/** What has lifted the speed limit, until the next rope catches or the player touches terrain. */
type Boost = 'ramp' | 'vine' | 'kick' | 'launcher'
const BOOST_MAX_SPEED: Record<Boost, number> = { ramp: LAUNCH_MAX_SPEED, launcher: LAUNCH_MAX_SPEED, vine: VINE_MAX_SPEED, kick: KICK_MAX_SPEED }

/** A point the rope passes through; `side` records which way it bent so it can unbend. */
type Anchor = { p: Vec; side: number }

/**
 * `age` is how long the rope has been attached; `grip` how long it holds before slipping off, or null if it holds for good.
 * `caught` is the terrain piece it caught on, the vine and how far down it, or the platform and where on it (unmoved).
 */
export type Rope = { anchors: Anchor[]; length: number; age: number; grip: number | null; caught: Caught }
export type Caught = { poly: number } | { vine: number; along: number } | { mover: number; at: Vec }
/** A vine's swing: `angle` from straight down (radians, positive towards +x), `spin` its rate, and when it snapped. */
export type VineState = { angle: number; spin: number; snapped: number | null }
export type Hook = { origin: Vec; pos: Vec; dir: Vec; travelled: number }
/** The player caught in a launcher's cup at `caught`; `fired` once it has thrown them out. */
export type Launch = { launcher: number; caught: number; fired: boolean }
/** Ways to die other than falling: touching a live wire, or being squeezed by a moving platform. */
export type Death = { cause: 'zapped' | 'crushed'; at: Vec; time: number }

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
  /**
   * Set by sliding on a launch ramp, catching a green vine, being struck by a bumper or flipper, or being fired from a
   * launcher, each of which lifts the speed limit for the flight that follows.
   */
  boost: Boost | null = null
  /** Each of the level's vines, in order. */
  vines: VineState[]
  /** When each of the level's flippers last flipped, or null if it hasn't. */
  flips: (number | null)[]
  /** The last time each bumper that has been hit kicked the player, by terrain index, for its flash. */
  bumps: { poly: number; time: number }[] = []
  launch: Launch | null = null
  /** Set when something other than a fall kills the player; the sim stops there. */
  dead: Death | null = null

  constructor(private level: Level) {
    this.pos = { ...level.start }
    this.vines = hangingVines(level)
    this.flips = level.flippers.map(() => null)
  }

  /** An independent copy, for exploring different choices from the same moment. */
  clone(): Sim {
    const copy = new Sim(this.level)
    const { pos, vel, rope, hook, grounded, stiffness, startLength, gravity, time, gong, slip, broken, boost, vines, flips, bumps, launch, dead } = this
    Object.assign(copy, structuredClone({ pos, vel, rope, hook, grounded, stiffness, startLength, gravity, time, gong, slip, broken, boost, vines, flips, bumps, launch, dead }))
    return copy
  }

  reset() {
    this.time = 0
    this.gong = null
    this.slip = null
    this.broken = []
    this.boost = null
    this.vines = hangingVines(this.level)
    this.flips = this.level.flippers.map(() => null)
    this.bumps = []
    this.launch = null
    this.dead = null
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
    if (this.dead) return
    const prev = this.pos
    this.time += dt
    if (this.rope) this.rope.age += dt
    if (this.heldInLauncher()) return
    this.slipOffIce()
    this.reel(reelSpeed * dt)
    this.triggerFlippers()
    this.vel.y += this.gravity * dt
    this.blowInGusts(dt)
    this.pumpOnVine(dt)
    this.rideMover()
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
    this.zapOnWires()
    this.batWithFlippers(prev, dt)
    this.catchInLauncher()
    if (this.gong) this.bounceOffGong(this.gong, dt)
  }

  /** While a launcher holds the player they stay put in its cup, and once it has held them long enough it fires them. */
  private heldInLauncher(): boolean {
    const launch = this.launch
    if (!launch) return false
    const launcher = this.level.launchers[launch.launcher]
    const held = this.time - launch.caught
    if (launch.fired) {
      if (held > LAUNCHER_HOLD_SECS + LAUNCHER_REARM_SECS) this.launch = null
      return false
    }
    if (held < LAUNCHER_HOLD_SECS) {
      this.pos = launcherRest(launcher.at)
      this.vel = { x: 0, y: 0 }
      this.rope = null
      this.hook = null
      return true
    }
    this.vel = scale(launcher.aim, launcher.speed)
    this.boost = 'launcher'
    launch.fired = true
    return false
  }

  private catchInLauncher() {
    if (this.launch) return
    const index = this.level.launchers.findIndex((l) => dist(this.pos, launcherRest(l.at)) < LAUNCHER_CATCH)
    if (index === -1) return
    this.launch = { launcher: index, caught: this.time, fired: false }
    this.pos = launcherRest(this.level.launchers[index].at)
    this.vel = { x: 0, y: 0 }
    this.rope = null
    this.hook = null
  }

  /** A flipper at rest flips when the player comes close to the side it flips towards. */
  private triggerFlippers() {
    this.level.flippers.forEach((flipper, i) => {
      const flipped = this.flips[i]
      if (flipped !== null && this.time - flipped < FLIP_UP_SECS + FLIP_HOLD_SECS + FLIP_DOWN_SECS) return
      const dir = angleDir(flipper.rest)
      const rel = sub(this.pos, flipper.pivot)
      const along = dot(rel, dir)
      const facing = cross(dir, rel) * Math.sign(flipper.swing)
      if (along > -RADIUS && along < flipper.length + RADIUS && facing > 0 && facing < FLIPPER_RADIUS + RADIUS + FLIPPER_REACH) this.flips[i] = this.time
    })
  }

  /**
   * Flippers push the player out like terrain, adding the speed of the paddle where it strikes them. The side the player
   * was on before this step decides which way they're pushed, so a fast paddle or player can't pass through.
   */
  private batWithFlippers(prev: Vec, dt: number) {
    this.level.flippers.forEach((flipper, i) => {
      const angleBefore = flipperAngle(flipper, this.flips[i], this.time - dt)
      const angle = flipperAngle(flipper, this.flips[i], this.time)
      const dir = angleDir(angle)
      const rel = sub(this.pos, flipper.pivot)
      const along = dot(rel, dir)
      const sideBefore = Math.sign(cross(angleDir(angleBefore), sub(prev, flipper.pivot))) || 1
      const crossed = Math.sign(cross(dir, rel)) !== sideBefore && along >= 0 && along <= flipper.length
      const contact = add(flipper.pivot, scale(dir, Math.max(0, Math.min(flipper.length, along))))
      const reach = FLIPPER_RADIUS + RADIUS
      const away = sub(this.pos, contact)
      if (!crossed && len(away) >= reach) return
      const n = crossed || len(away) < 1e-6 ? scale(perp(dir), sideBefore) : norm(away)
      this.pos = add(contact, scale(n, reach))
      const paddle = scale(perp(sub(contact, flipper.pivot)), (angle - angleBefore) / dt)
      const vn = dot(sub(this.vel, paddle), n)
      if (vn < 0) this.vel = sub(this.vel, scale(n, vn * (1 + FLIPPER_BOUNCE)))
      // A paddle swinging into the player bats them; one lying still is like touching terrain
      this.boost = dot(paddle, n) > 0 ? 'kick' : null
    })
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
    else if ('poly' in caught && this.level.polys[caught.poly].surface === 'dark-ice') this.broken.push({ poly: caught.poly, time: this.time })
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
    const pivotVel = rope.anchors.length === 1 ? this.anchorVelocity(rope.caught) : { x: 0, y: 0 }
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

  /** How fast the rope's first anchor is moving, with whatever it caught on. */
  private anchorVelocity(caught: Caught): Vec {
    if ('mover' in caught) return moverVelocity(this.level.movers[caught.mover], this.time)
    if (!('vine' in caught)) return { x: 0, y: 0 }
    const { angle, spin } = this.vines[caught.vine]
    return { x: Math.cos(angle) * spin * caught.along, y: -Math.sin(angle) * spin * caught.along }
  }

  /** A rope caught on a moving platform is carried along with it. */
  private rideMover() {
    const rope = this.rope
    if (!rope || !('mover' in rope.caught)) return
    rope.anchors[0].p = add(rope.caught.at, moverOffset(this.level.movers[rope.caught.mover], this.time))
  }

  /** Touching a live wire is deadly; the rope is insulated, so it passes through them harmlessly. */
  private zapOnWires() {
    for (const wire of this.level.wires) {
      if (!wireLive(wire, this.time) || dist(this.pos, closestOnSegment(this.pos, wire.from, wire.to)) >= RADIUS + WIRE_RADIUS) continue
      this.die('zapped')
      return
    }
  }

  private die(cause: Death['cause']) {
    this.dead = { cause, at: { ...this.pos }, time: this.time }
    this.rope = null
    this.hook = null
    this.vel = { x: 0, y: 0 }
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
      if (vine.kind === 'green') this.boost = 'vine'
      return hook.origin
    }
    const onMover = this.moverHit(hook.pos, next)
    if (onMover && (!hit || onMover.t < hit.t)) {
      // The hook glances off crates, which are for riding in, not swinging from
      if ('conveyor' in this.level.movers[onMover.mover]) {
        this.hook = null
        return null
      }
      const p = add(onMover.point, scale(onMover.normal, ANCHOR_OFFSET))
      this.attach(p, null, { mover: onMover.mover, at: sub(p, moverOffset(this.level.movers[onMover.mover], this.time)) }, this.startLength)
      return hook.origin
    }
    if (hit) {
      this.attach(add(hit.point, scale(hit.normal, ANCHOR_OFFSET)), GRIP_SECS[hit.poly.surface], { poly: this.level.polys.indexOf(hit.poly) }, this.startLength)
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
    this.boost = null
    this.hook = null
  }

  /** Where along p→p2 it first strikes a moving platform or crate, where they are now. */
  private moverHit(p: Vec, p2: Vec): { t: number; point: Vec; normal: Vec; mover: number } | null {
    let best: { t: number; point: Vec; normal: Vec; mover: number } | null = null
    this.movingPolys().forEach((poly, mover) => {
      const hit = firstHit(p, p2, poly)
      if (hit && (!best || hit.t < best.t)) best = { ...hit, mover }
    })
    return best
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

  /**
   * Pushes the player out of terrain, then out of moving platforms and crates, which carry their speed into the bounce.
   * Standing on a belt or mover drags the player along with it; being squeezed into something by a mover crushes them.
   */
  private collide(dt: number) {
    this.grounded = false
    let onIce = false
    let onRamp = false
    let onOther = false
    let kicked = false
    let pushedByMover = false
    /** The velocity of whatever the player stands on, and how firmly it carries them along. */
    let floor: { vel: Vec; grip: number } | null = null
    const movers = this.movingPolys()
    const touching = [
      ...this.solidPolys().map((poly) => ({ poly, mover: null })),
      ...movers.map((poly, mover) => ({ poly, mover })),
    ]
    for (const { poly, mover } of touching) {
      const pts = poly.pts
      const surfaceVel = mover === null ? { x: 0, y: 0 } : moverVelocity(this.level.movers[mover], this.time)
      if (pointInPolygon(this.pos, pts)) this.pos = escapePolygon(this.pos, pts, poly.edgeNormals)
      for (let i = 0; i < pts.length; i++) {
        const c = closestOnSegment(this.pos, pts[i], pts[(i + 1) % pts.length])
        const d = sub(this.pos, c)
        const l = len(d)
        if (l >= RADIUS) continue
        const n = l > 1e-6 ? scale(d, 1 / l) : poly.edgeNormals[i]
        this.pos = add(c, scale(n, RADIUS))
        pushedByMover ||= mover !== null
        const isFloor = n.y < -0.6
        const isCeiling = n.y > 0.6
        // Only sliding on top of a ramp launches; brushing its sides or underneath neither launches nor lands
        if (poly.ramp) onRamp ||= isFloor
        else if (!poly.bumper) onOther = true
        const vn = dot(sub(this.vel, surfaceVel), n)
        if (vn < 0 && poly.bumper) {
          this.vel = add(this.vel, scale(n, -2 * vn + BUMPER_KICK))
          const index = this.level.polys.indexOf(poly)
          this.bumps = [...this.bumps.filter((b) => b.poly !== index), { poly: index, time: this.time }]
          kicked = true
        } else if (vn < 0) {
          const restitution = isFloor ? FLOOR_BOUNCE : isCeiling ? CEILING_BOUNCE : WALL_BOUNCE
          const bounce = vn < -120 ? restitution : 0
          this.vel = sub(this.vel, scale(n, vn * (1 + bounce)))
        }
        if (isFloor) {
          this.grounded = true
          onIce ||= poly.surface !== 'rock'
          if (mover !== null && !floor) {
            // A mover keeps carrying the player as it speeds up, slows down and turns
            const before = moverVelocity(this.level.movers[mover], this.time - dt)
            this.vel.x += surfaceVel.x - before.x
            floor = { vel: surfaceVel, grip: GROUND_FRICTION }
          } else if (poly.belt) floor = { vel: { x: poly.belt, y: 0 }, grip: BELT_GRIP }
        }
      }
    }
    if (pushedByMover && this.squeezed()) this.die('crushed')
    if (kicked) this.boost = 'kick'
    else if (onOther) this.boost = null
    else if (onRamp) this.boost = 'ramp'
    if (!this.grounded || this.rope) return
    floor ??= { vel: { x: 0, y: 0 }, grip: onIce ? ICE_FRICTION : GROUND_FRICTION }
    this.vel.x = floor.vel.x + (this.vel.x - floor.vel.x) * Math.exp(-floor.grip * dt)
    const speed = len(this.vel)
    const push = (onIce ? ICE_GLIDE : 0) + (this.boost === 'ramp' ? RAMP_BOOST : 0)
    if (push && speed > GLIDE_MIN_SPEED) this.vel = scale(this.vel, Math.min(this.speedLimit(), speed + push * dt) / speed)
  }

  /** Whether the player is pressed into anything solid deeper than they can be squeezed. */
  private squeezed(): boolean {
    return [...this.solidPolys(), ...this.movingPolys()].some(
      (poly) =>
        pointInPolygon(this.pos, poly.pts) ||
        poly.pts.some((p, i) => dist(this.pos, closestOnSegment(this.pos, p, poly.pts[(i + 1) % poly.pts.length])) < RADIUS - CRUSH_DEPTH),
    )
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
    return this.boost ? BOOST_MAX_SPEED[this.boost] : MAX_SPEED
  }

  /** Moving platforms and crates where they are now, in the level's order. */
  movingPolys(): Poly[] {
    return this.level.movers.map((mover) => {
      const offset = moverOffset(mover, this.time)
      return { ...mover.poly, pts: mover.poly.pts.map((p) => add(p, offset)) }
    })
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

/** Where p→p2 first crosses one of the polygon's edges, and that edge's outward normal. */
function firstHit(p: Vec, p2: Vec, poly: Poly): { t: number; point: Vec; normal: Vec } | null {
  let best: { t: number; normal: Vec } | null = null
  for (let i = 0; i < poly.pts.length; i++) {
    const t = segmentHit(p, p2, poly.pts[i], poly.pts[(i + 1) % poly.pts.length])
    if (t !== null && (!best || t < best.t)) best = { t, normal: poly.edgeNormals[i] }
  }
  return best && { t: best.t, point: add(p, scale(sub(p2, p), best.t)), normal: best.normal }
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

/** A flipper's angle at `time`, given when it last flipped: up quickly, a moment held, then back down. */
export function flipperAngle(flipper: Flipper, flipped: number | null, time: number): number {
  if (flipped === null) return flipper.rest
  const t = time - flipped
  const raised = t < FLIP_UP_SECS ? t / FLIP_UP_SECS : t < FLIP_UP_SECS + FLIP_HOLD_SECS ? 1 : 1 - (t - FLIP_UP_SECS - FLIP_HOLD_SECS) / FLIP_DOWN_SECS
  return flipper.rest + flipper.swing * Math.max(0, Math.min(1, raised))
}

/** Where the player sits in a launcher's cup, given the middle of its floor. */
export function launcherRest(floor: Vec): Vec {
  return { x: floor.x, y: floor.y - RADIUS }
}

function angleDir(angle: number): Vec {
  return { x: Math.cos(angle), y: Math.sin(angle) }
}

function hangingVines(level: Level): VineState[] {
  return level.vines.map((v) => ({ angle: v.angle, spin: 0, snapped: null }))
}
