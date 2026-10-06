import type { Shape } from '../level'

/** A lumpy asteroid about `r` across from its middle at (cx, cy). */
export function asteroid(cx: number, cy: number, r: number): Shape {
  const points = 11
  const path = Array.from({ length: points }, (_, i): [number, number] => {
    const angle = (i / points) * Math.PI * 2
    const lump = 1 + 0.18 * Math.sin(i * 2.3 + cx * 0.013) + 0.08 * Math.sin(i * 5.1 + cy * 0.007)
    return [Math.round(cx + Math.cos(angle) * r * lump), Math.round(cy + Math.sin(angle) * r * lump)]
  })
  return { path }
}
