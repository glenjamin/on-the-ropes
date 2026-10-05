import type { Shape } from '../level'

/** A round pop bumper of radius `r` centred on (cx, cy); finely divided so it bounces and wraps the rope like a circle. */
export function bumper(cx: number, cy: number, r: number): Shape {
  const sides = 24
  const path = Array.from({ length: sides }, (_, i): [number, number] => {
    const angle = (i / sides) * Math.PI * 2
    return [Math.round(cx + Math.cos(angle) * r), Math.round(cy + Math.sin(angle) * r)]
  })
  return { path, bumper: true }
}
