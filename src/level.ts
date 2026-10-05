import { add, dot, norm, perp, pointInPolygon, scale, sub, vec, type Vec } from './geom'

export type Poly = {
  pts: Vec[]
  /** Outward normal of edge i (pts[i] → pts[i+1]). */
  edgeNormals: Vec[]
  /** Convex corners the rope can bend around, and the point just outside each where it rests. */
  corners: { at: Vec; wrap: Vec }[]
  surface: Surface
  ramp: boolean
  foliage: boolean
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
}

export type Theme = 'lava' | 'clouds' | 'ice' | 'jungle'

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
  cycle?: { period: number; on: number; offset?: number }
}

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
}

export type Gust = { min: Vec; max: Vec; force: Vec; cycle?: { period: number; on: number; offset: number } }

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
}

/** The goal gong's disc radius. */
const GOAL_RADIUS = 36

export function buildLevel(data: LevelData): Level {
  return {
    id: data.id,
    name: data.name,
    theme: data.theme,
    polys: data.shapes.map((s) => makePoly(shapePoints(s), s.surface ?? 'rock', s.ramp ?? false, s.foliage ?? false)),
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
  }
}

/** Kept clear of both edges by more than the rope's anchor offset so a taut rope never clips the tip. */
const WRAP_OFFSET = 2.5
const MAX_MITER = 4

function makePoly(pts: Vec[], surface: Surface, ramp: boolean, foliage: boolean): Poly {
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
  return { pts, edgeNormals, corners, surface, ramp, foliage }
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
  if (!gust.cycle) return 1
  const { period, on, offset } = gust.cycle
  const t = (((time - offset) % period) + period) % period
  return t < on ? 1 : 0
}
