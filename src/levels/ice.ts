import type { Shape } from '../level'

/**
 * A ski jump of solid ice, filled down to `base` or as a floating slab `thickness` deep: a straight run from `top`
 * sloping down at `drop` degrees for `run`, then a curve of `radius` turning up into a lip at `lip` degrees. Short and
 * tight, so little speed is lost climbing to the lip, and finely divided so sliding round it doesn't bounce. As a
 * `ramp` it launches past the usual speed limit. A slab has no face below its top, so falling short can't climb on.
 */
export function skiJump(jump: { top: [number, number]; drop: number; run: number; radius: number; lip: number; ramp?: boolean } & ({ base: number } | { thickness: number })): Shape {
  const { top, drop, run, radius, lip, ramp } = jump
  const rad = Math.PI / 180
  let [x, y] = [top[0] + Math.cos(drop * rad) * run, top[1] + Math.sin(drop * rad) * run]
  const curve: [number, number][] = [top, [x, y]]
  const turn = rad
  for (let angle = drop * rad; angle > -lip * rad + 1e-9; angle -= turn) {
    const step = Math.min(turn, angle + lip * rad)
    const chord = 2 * radius * Math.sin(step / 2)
    x += Math.cos(angle - step / 2) * chord
    y += Math.sin(angle - step / 2) * chord
    curve.push([x, y])
  }
  if ('base' in jump) return { path: [...curve, [x, jump.base], [top[0], jump.base]], surface: 'ice', ramp }
  return { path: [...curve, ...underside(curve, jump.thickness)], surface: 'ice', ramp }
}

/** The curve offset `thickness` beneath itself, traced back from its far end. */
function underside(curve: [number, number][], thickness: number): [number, number][] {
  return curve
    .map(([x, y], i): [number, number] => {
      const [ax, ay] = curve[Math.max(0, i - 1)]
      const [bx, by] = curve[Math.min(curve.length - 1, i + 1)]
      const l = Math.hypot(bx - ax, by - ay)
      return [x - ((by - ay) / l) * thickness, y + ((bx - ax) / l) * thickness]
    })
    .reverse()
}
