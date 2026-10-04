export type Vec = { x: number; y: number }

export const vec = (x: number, y: number): Vec => ({ x, y })
export const add = (a: Vec, b: Vec): Vec => ({ x: a.x + b.x, y: a.y + b.y })
export const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y })
export const scale = (a: Vec, s: number): Vec => ({ x: a.x * s, y: a.y * s })
export const dot = (a: Vec, b: Vec): number => a.x * b.x + a.y * b.y
export const cross = (a: Vec, b: Vec): number => a.x * b.y - a.y * b.x
export const len = (a: Vec): number => Math.hypot(a.x, a.y)
export const dist = (a: Vec, b: Vec): number => Math.hypot(a.x - b.x, a.y - b.y)
export const perp = (a: Vec): Vec => ({ x: -a.y, y: a.x })

export function norm(a: Vec): Vec {
  const l = len(a)
  return l > 1e-9 ? { x: a.x / l, y: a.y / l } : { x: 0, y: 0 }
}

export function closestOnSegment(p: Vec, a: Vec, b: Vec): Vec {
  const ab = sub(b, a)
  const t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / dot(ab, ab)))
  return add(a, scale(ab, t))
}

/** Fraction along p→p2 where it crosses segment q→q2, or null if it doesn't. */
export function segmentHit(p: Vec, p2: Vec, q: Vec, q2: Vec): number | null {
  const r = sub(p2, p)
  const s = sub(q2, q)
  const denom = cross(r, s)
  if (Math.abs(denom) < 1e-12) return null
  const qp = sub(q, p)
  const t = cross(qp, s) / denom
  const u = cross(qp, r) / denom
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? t : null
}

export function pointInPolygon(p: Vec, pts: Vec[]): boolean {
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i]
    const b = pts[j]
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside
    }
  }
  return inside
}

export function pointInTriangle(p: Vec, a: Vec, b: Vec, c: Vec): boolean {
  const d1 = cross(sub(b, a), sub(p, a))
  const d2 = cross(sub(c, b), sub(p, b))
  const d3 = cross(sub(a, c), sub(p, c))
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0
  return !(hasNeg && hasPos)
}
