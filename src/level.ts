import { add, dist, dot, norm, perp, pointInPolygon, scale, sub, vec, type Vec } from './geom'

export type Poly = {
  pts: Vec[]
  /** Outward normal of edge i (pts[i] → pts[i+1]). */
  edgeNormals: Vec[]
  /** Convex corners the rope can bend around, and the point just outside each where it rests. */
  corners: { at: Vec; wrap: Vec }[]
  surface: Surface
  ramp: boolean
  foliage: boolean
  bumper: boolean
  /** Surface speed of a conveyor belt along its top (positive to the right), or 0 for none. */
  belt: number
}

/** Ice is slippery underfoot and the rope only holds on it briefly; dark ice lets go of the rope almost at once. */
export type Surface = 'rock' | 'ice' | 'dark-ice'

/** Terrain pieces as plain data: an axis-aligned box, a square turned on its corner, or any polygon; rock unless said otherwise. */
export type Shape = ({ rect: [x: number, y: number, w: number, h: number] } | { diamond: [cx: number, cy: number, r: number] } | { path: [number, number][] }) & {
  surface?: Surface
  /** A launch ramp: sliding on it lifts the speed limit, so a ski jump can really fly. */
  ramp?: boolean
  /** Drawn as leaves rather than wood or rock; it holds the rope just the same. */
  foliage?: boolean
  /** A pinball bumper or slingshot: it kicks the player away harder than they hit it. */
  bumper?: boolean
  /** A conveyor belt along its top, carrying whoever stands on it at this speed (units/s, positive to the right). */
  belt?: number
}

export type Theme = 'lava' | 'clouds' | 'ice' | 'jungle' | 'pinball' | 'factory' | 'space'

/** Green vines hold and swing you harder; brown vines snap soon after you grab them. */
export type VineKind = 'green' | 'brown'

/** A vine hanging `length` down from a fixed `pivot`, optionally already swaying `angle` degrees from straight down. */
export type VineData = { pivot: [number, number]; length: number; kind: VineKind; angle?: number }

export type Vine = { pivot: Vec; length: number; kind: VineKind; angle: number }

/**
 * A region of wind that pushes the player while they're inside it, with `force` as an acceleration in units/s².
 * With `cycle` it blows in bursts: on for `on` seconds out of every `period`, starting `offset` seconds in.
 */
export type GustData = {
  rect: [x: number, y: number, w: number, h: number]
  force: [x: number, y: number]
  cycle?: CycleData
}

/** On for `on` seconds out of every `period`, starting `offset` seconds in. */
export type CycleData = { period: number; on: number; offset?: number }
type Cycle = { period: number; on: number; offset: number }

/**
 * A pinball flipper: a paddle `length` long on a `pivot`, resting at `rest` degrees (clockwise from pointing right) that
 * flips through `swing` degrees, then back, when the player comes near the side it flips towards.
 */
export type FlipperData = { pivot: [number, number]; length: number; rest: number; swing: number }

export type Flipper = { pivot: Vec; length: number; rest: number; swing: number }

/** A cup with the middle of its floor at `at`: landing in it holds the player briefly, then fires them along `aim` at `speed`. */
export type LauncherData = { at: [number, number]; aim: [number, number]; speed: number }

export type Launcher = { at: Vec; aim: Vec; speed: number }

/**
 * A solid block that glides from where it's drawn by `travel` and back again, easing at each end, once every `period`
 * seconds, `offset` seconds into its trip at the start.
 */
export type PlatformData = { rect: [x: number, y: number, w: number, h: number]; travel: [x: number, y: number]; period: number; offset?: number }

/** A conveyor carrying `crates` open-topped crates, evenly spaced, round the closed `loop` their floors follow, at `speed`. */
export type ConveyorData = { loop: [number, number][]; speed: number; crates: number }

export type Conveyor = { loop: Vec[]; speed: number }

/** A live wire from one point to another; with `cycle` it's only live while the cycle is on. */
export type WireData = { from: [number, number]; to: [number, number]; cycle?: CycleData }

export type Wire = { from: Vec; to: Vec; cycle?: Cycle }

/**
 * A mini-planet of radius `r`, still until the rope catches it; then it spins up in its direction (clockwise or
 * anticlockwise as seen on screen), carrying the rope's hook round with its surface.
 */
export type PlanetData = { at: [number, number]; r: number; spin: 'cw' | 'ccw' }

/** `spin` is +1 for clockwise on screen, -1 for anticlockwise. */
export type Planet = { at: Vec; r: number; spin: 1 | -1 }

/** A black hole whose pull grows the nearer you come, and which swallows whatever touches its event horizon (`horizon` radius). */
export type BlackHoleData = { at: [number, number]; horizon: number }

export type BlackHole = { at: Vec; horizon: number }

/**
 * Something solid that moves as a pure function of time: a platform gliding back and forth, or a crate riding a conveyor.
 * Its `poly` is where it sits with no offset; `moverOffset` says how far it has moved.
 */
export type Mover = { poly: Poly } & ({ travel: Vec; period: number; offset: number } | { conveyor: Conveyor; start: number })

/** A level as authored: an id like "1-2" (set, then position in the set), terrain, and where the run starts and ends. */
export type LevelData = {
  id: string
  name: string
  theme: Theme
  start: [number, number]
  goal: [number, number]
  /** Falling below this ends the run: into lava or icy water, or out of the sky. */
  deathY: number
  shapes: Shape[]
  gusts?: GustData[]
  /** The gong stands in a frame on a platform, or floats on its own in mid-air. */
  goalMount?: 'stand' | 'floating'
  /** Flags planted at these points on the ground, marking a spot such as where to land to make a jump. */
  flags?: [number, number][]
  vines?: VineData[]
  /** Tree trunks drawn behind everything, which the player and rope pass through: centre x, top, and width. */
  trunks?: [x: number, top: number, width: number][]
  flippers?: FlipperData[]
  launchers?: LauncherData[]
  platforms?: PlatformData[]
  conveyors?: ConveyorData[]
  wires?: WireData[]
  /** Downward acceleration in units/s², where it differs from the usual. */
  gravity?: number
  planets?: PlanetData[]
  blackHoles?: BlackHoleData[]
}

export type Gust = { min: Vec; max: Vec; force: Vec; cycle?: Cycle }

export type Level = {
  id: string
  name: string
  theme: Theme
  polys: Poly[]
  gusts: Gust[]
  start: Vec
  goal: { pos: Vec; radius: number; mount: 'stand' | 'floating' }
  deathY: number
  flags: Vec[]
  vines: Vine[]
  trunks: { x: number; top: number; width: number }[]
  flippers: Flipper[]
  launchers: Launcher[]
  /** Moving platforms first, then each conveyor's crates in turn. */
  movers: Mover[]
  conveyors: Conveyor[]
  wires: Wire[]
  gravity?: number
  planets: Planet[]
  blackHoles: BlackHole[]
}

/** The goal gong's disc radius. */
const GOAL_RADIUS = 36

export function buildLevel(data: LevelData): Level {
  const launchers = (data.launchers ?? []).map(({ at, aim, speed }) => ({ at: vec(...at), aim: norm(vec(...aim)), speed }))
  const conveyors = (data.conveyors ?? []).map(({ loop, speed }) => ({ loop: loop.map(([x, y]) => vec(x, y)), speed }))
  const platforms = (data.platforms ?? []).map(({ rect, travel, period, offset }) => ({ poly: polyOf({ rect }), travel: vec(...travel), period, offset: offset ?? 0 }))
  const crates = (data.conveyors ?? []).flatMap(({ crates }, i) => {
    const conveyor = conveyors[i]
    return Array.from({ length: crates }, (_, k) => ({ poly: polyOf(CRATE), conveyor, start: (loopLength(conveyor.loop) * k) / crates }))
  })
  return {
    id: data.id,
    name: data.name,
    theme: data.theme,
    polys: [...data.shapes, ...launchers.map(cupShape)].map(polyOf),
    gusts: (data.gusts ?? []).map(({ rect: [x, y, w, h], force, cycle }) => ({
      min: vec(x, y),
      max: vec(x + w, y + h),
      force: vec(...force),
      cycle: cycle && { ...cycle, offset: cycle.offset ?? 0 },
    })),
    start: vec(...data.start),
    goal: { pos: vec(...data.goal), radius: GOAL_RADIUS, mount: data.goalMount ?? 'stand' },
    deathY: data.deathY,
    flags: (data.flags ?? []).map(([x, y]) => vec(x, y)),
    vines: (data.vines ?? []).map(({ pivot, length, kind, angle }) => ({ pivot: vec(...pivot), length, kind, angle: ((angle ?? 0) * Math.PI) / 180 })),
    trunks: (data.trunks ?? []).map(([x, top, width]) => ({ x, top, width })),
    flippers: (data.flippers ?? []).map(({ pivot, length, rest, swing }) => ({ pivot: vec(...pivot), length, rest: (rest * Math.PI) / 180, swing: (swing * Math.PI) / 180 })),
    launchers,
    movers: [...platforms, ...crates],
    conveyors,
    wires: (data.wires ?? []).map(({ from, to, cycle }) => ({ from: vec(...from), to: vec(...to), cycle: cycle && { ...cycle, offset: cycle.offset ?? 0 } })),
    gravity: data.gravity,
    planets: (data.planets ?? []).map(({ at, r, spin }) => ({ at: vec(...at), r, spin: spin === 'cw' ? 1 : -1 })),
    blackHoles: (data.blackHoles ?? []).map(({ at, horizon }) => ({ at: vec(...at), horizon })),
  }
}

/** How far a mover has moved from where its poly sits, at `time`. */
export function moverOffset(mover: Mover, time: number): Vec {
  if ('conveyor' in mover) return loopPoint(mover.conveyor.loop, mover.start + mover.conveyor.speed * time).at
  const phase = (2 * Math.PI * (time + mover.offset)) / mover.period
  return scale(mover.travel, (1 - Math.cos(phase)) / 2)
}

export function moverVelocity(mover: Mover, time: number): Vec {
  if ('conveyor' in mover) return scale(loopPoint(mover.conveyor.loop, mover.start + mover.conveyor.speed * time).dir, mover.conveyor.speed)
  const phase = (2 * Math.PI * (time + mover.offset)) / mover.period
  return scale(mover.travel, (Math.PI / mover.period) * Math.sin(phase))
}

/** Whether a wire is live at `time`. */
export function wireLive(wire: Wire, time: number): boolean {
  return !wire.cycle || cycleOn(wire.cycle, time)
}

/** Seconds until a wire that's off goes live, or 0 if it's live now. */
export function wireWarmup(wire: Wire, time: number): number {
  if (!wire.cycle || cycleOn(wire.cycle, time)) return 0
  const { period, offset } = wire.cycle
  return period - ((((time - offset) % period) + period) % period)
}

/** Kept clear of both edges by more than the rope's anchor offset so a taut rope never clips the tip. */
const WRAP_OFFSET = 2.5
const MAX_MITER = 4

/** An open-topped crate with its floor's middle at the origin: deep enough that riding a conveyor round doesn't throw you out. */
const CRATE_INNER = 44
const CRATE_DEPTH = 56
const CRATE_WALL = 10
const CRATE: Shape = {
  path: [
    [-CRATE_INNER - CRATE_WALL, -CRATE_DEPTH],
    [-CRATE_INNER, -CRATE_DEPTH],
    [-CRATE_INNER, 0],
    [CRATE_INNER, 0],
    [CRATE_INNER, -CRATE_DEPTH],
    [CRATE_INNER + CRATE_WALL, -CRATE_DEPTH],
    [CRATE_INNER + CRATE_WALL, CRATE_WALL],
    [-CRATE_INNER - CRATE_WALL, CRATE_WALL],
  ],
}

function polyOf(s: Shape): Poly {
  return makePoly(shapePoints(s), { surface: s.surface ?? 'rock', ramp: s.ramp ?? false, foliage: s.foliage ?? false, bumper: s.bumper ?? false, belt: s.belt ?? 0 })
}

function makePoly(pts: Vec[], kind: Pick<Poly, 'surface' | 'ramp' | 'foliage' | 'bumper' | 'belt'>): Poly {
  const edgeNormals = pts.map((a, i) => {
    const b = pts[(i + 1) % pts.length]
    const n = norm(perp(sub(b, a)))
    const probe = add(scale(add(a, b), 0.5), scale(n, 0.01))
    return pointInPolygon(probe, pts) ? scale(n, -1) : n
  })
  const corners: Poly['corners'] = []
  pts.forEach((p, i) => {
    const prevN = edgeNormals[(i - 1 + pts.length) % pts.length]
    const nextN = edgeNormals[i]
    const miter = Math.min(MAX_MITER, 1 / Math.max(1e-3, (1 + dot(prevN, nextN)) / 2))
    const out = add(p, scale(add(prevN, nextN), (WRAP_OFFSET * miter) / 2))
    if (!pointInPolygon(out, pts)) corners.push({ at: p, wrap: out })
  })
  return { pts, edgeNormals, corners, ...kind }
}

/** Half the width inside a launcher's cup, and how high its rim stands above the floor: shallow, so a fairly flat shot clears the rim. */
const CUP_INNER = 44
const CUP_DEPTH = 20
const CUP_WALL = 14

/** A launcher's cup: a shallow bowl with the middle of its floor at `at`. */
function cupShape({ at }: Launcher): Shape {
  const floor = at.y
  const [l, r] = [at.x - CUP_INNER, at.x + CUP_INNER]
  const rim = floor - CUP_DEPTH
  return { path: [[l - CUP_WALL, rim], [l, rim], [l, floor], [r, floor], [r, rim], [r + CUP_WALL, rim], [r + CUP_WALL, floor + 24], [l - CUP_WALL, floor + 24]] }
}

function shapePoints(shape: Shape): Vec[] {
  if ('rect' in shape) {
    const [x, y, w, h] = shape.rect
    return [vec(x, y), vec(x + w, y), vec(x + w, y + h), vec(x, y + h)]
  }
  if ('diamond' in shape) {
    const [cx, cy, r] = shape.diamond
    return [vec(cx, cy - r), vec(cx + r, cy), vec(cx, cy + r), vec(cx - r, cy)]
  }
  return shape.path.map(([x, y]) => vec(x, y))
}

/** How hard a gust is blowing at `time`: 1 while on, 0 while off. */
export function gustStrength(gust: Gust, time: number): number {
  return !gust.cycle || cycleOn(gust.cycle, time) ? 1 : 0
}

function cycleOn({ period, on, offset }: Cycle, time: number): boolean {
  return (((time - offset) % period) + period) % period < on
}

/** The point `distance` round a closed loop, and the direction the loop runs there. */
function loopPoint(loop: Vec[], distance: number): { at: Vec; dir: Vec } {
  let d = ((distance % loopLength(loop)) + loopLength(loop)) % loopLength(loop)
  for (let i = 0; ; i++) {
    const a = loop[i % loop.length]
    const b = loop[(i + 1) % loop.length]
    const l = dist(a, b)
    if (d <= l || i >= loop.length - 1) return { at: add(a, scale(sub(b, a), Math.min(1, d / l))), dir: norm(sub(b, a)) }
    d -= l
  }
}

function loopLength(loop: Vec[]): number {
  return loop.reduce((total, p, i) => total + dist(p, loop[(i + 1) % loop.length]), 0)
}
