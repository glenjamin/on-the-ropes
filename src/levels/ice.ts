import type { Shape } from '../level'

/**
 * A ski jump of solid ice, filled down to `base`: a straight run from `top` sloping down at `drop` degrees for `run`,
 * then a curve of `radius` turning up into a lip at `lip` degrees. Short and tight, so little speed is lost climbing
 * to the lip, and finely divided so sliding round it doesn't bounce. As a `ramp` it launches past the usual speed limit.
 */
export function skiJump(jump: { top: [number, number]; drop: number; run: number; radius: number; lip: number; base: number; ramp?: boolean }): Shape {
  const { top, drop, run, radius, lip, base, ramp } = jump
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
  return { path: [...curve, [x, base], [top[0], base]], surface: 'ice', ramp }
}
