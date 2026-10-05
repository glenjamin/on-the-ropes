import type { Shape } from '../level'

/** A clump of leaves: a bumpy oval `rx` by `ry` around (cx, cy). */
export function clump(cx: number, cy: number, rx: number, ry: number): Shape {
  const points = 14
  const path = Array.from({ length: points }, (_, i): [number, number] => {
    const angle = (i / points) * Math.PI * 2
    const bump = 1 + 0.1 * Math.sin(i * 2.7 + cx * 0.01)
    return [Math.round(cx + Math.cos(angle) * rx * bump), Math.round(cy + Math.sin(angle) * ry * bump)]
  })
  return { path, foliage: true }
}

/** A branch from `from` to `to`, `thick` where it leaves the trunk and tapering towards its end. */
export function branch(from: [number, number], to: [number, number], thick: number): Shape {
  const [dx, dy] = [to[0] - from[0], to[1] - from[1]]
  const length = Math.hypot(dx, dy)
  const [nx, ny] = [-dy / length, dx / length]
  const at = ([x, y]: [number, number], half: number, side: number): [number, number] => [Math.round(x + nx * half * side), Math.round(y + ny * half * side)]
  return { path: [at(from, thick / 2, 1), at(to, thick / 5, 1), at(to, thick / 5, -1), at(from, thick / 2, -1)] }
}

/**
 * A canopy of leaves across the top from `x1` to `x2`, its underside dipping and rising through `underside` heights
 * (evenly spaced), scalloped like the edge of a mass of leaves and rounded up at the ends.
 */
export function canopy(x1: number, x2: number, underside: number[]): Shape {
  const step = (x2 - x1) / (underside.length - 1)
  const heightAt = (x: number) => {
    const i = Math.min(underside.length - 2, Math.floor((x - x1) / step))
    const k = (x - x1 - i * step) / step
    return underside[i] + (underside[i + 1] - underside[i]) * k
  }
  const scallops = Math.max(2, Math.round((x2 - x1) / SCALLOP))
  const edge: [number, number][] = []
  for (let i = 0; i <= scallops; i++) {
    const x = x1 + ((x2 - x1) * i) / scallops
    const end = Math.min(i, scallops - i)
    // Lift the first and last scallops so the canopy's ends round up instead of dropping as a wall
    const lift = end === 0 ? 90 : end === 1 ? 30 : 0
    edge.push([Math.round(x), Math.round(heightAt(x) - lift + (i % 2 ? 14 : 0))])
  }
  return { path: [[x1, CANOPY_TOP], [x2, CANOPY_TOP], ...edge.reverse()], foliage: true }
}

/** Width of each scallop along a canopy's underside. */
const SCALLOP = 70
/** Well above anything the rope can reach, so a canopy fills the top of the view however high the level climbs. */
const CANOPY_TOP = -2600
