import { add, dot, norm, perp, pointInPolygon, scale, sub, vec, type Vec } from './geom'

export type Poly = {
  pts: Vec[]
  /** Outward normal of edge i (pts[i] → pts[i+1]). */
  edgeNormals: Vec[]
  /** Convex corners the rope can bend around, and the point just outside each where it rests. */
  corners: { at: Vec; wrap: Vec }[]
}

/** Terrain pieces as plain data: an axis-aligned box, a square turned on its corner, or any polygon. */
export type Shape = { rect: [x: number, y: number, w: number, h: number] } | { diamond: [cx: number, cy: number, r: number] } | { path: [number, number][] }

/** A level as authored: an id like "1-2" (set, then position in the set), terrain, and where the run starts and ends. */
export type LevelData = {
  id: string
  name: string
  start: [number, number]
  goal: [number, number]
  lavaY: number
  shapes: Shape[]
}

export type Level = {
  id: string
  name: string
  polys: Poly[]
  start: Vec
  goal: { pos: Vec; radius: number }
  lavaY: number
}

const GOAL_RADIUS = 40

export function buildLevel(data: LevelData): Level {
  return {
    id: data.id,
    name: data.name,
    polys: data.shapes.map((s) => makePoly(shapePoints(s))),
    start: vec(...data.start),
    goal: { pos: vec(...data.goal), radius: GOAL_RADIUS },
    lavaY: data.lavaY,
  }
}

/** Kept clear of both edges by more than the rope's anchor offset so a taut rope never clips the tip. */
const WRAP_OFFSET = 2.5
const MAX_MITER = 4

function makePoly(pts: Vec[]): Poly {
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
  return { pts, edgeNormals, corners }
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
