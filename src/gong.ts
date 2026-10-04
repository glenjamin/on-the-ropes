import { add, type Vec } from './geom'

/** The goal: a disc hanging from a frame by short cords, swinging when struck. */
export type Gong = {
  pivot: Vec
  /** Distance from the pivot down to the disc's centre. */
  hang: number
  radius: number
  /** Swing angle in radians (positive swings the disc right) and its rate of change. */
  swing: number
  swingVel: number
  /** Sim times of each solid hit, for the ring-out effect. */
  hits: number[]
}

const CORD = 14
const SWING_STIFFNESS = 25
const SWING_DAMPING = 0.8

/** A gong at rest, its disc centred on `centre`. */
export function restingGong(centre: Vec, radius: number): Gong {
  const hang = radius + CORD
  return { pivot: { x: centre.x, y: centre.y - hang }, hang, radius, swing: 0, swingVel: 0, hits: [] }
}

export function gongCentre(gong: Gong): Vec {
  return add(gong.pivot, { x: Math.sin(gong.swing) * gong.hang, y: Math.cos(gong.swing) * gong.hang })
}

export function swingGong(gong: Gong, dt: number) {
  gong.swingVel += (-SWING_STIFFNESS * Math.sin(gong.swing) - SWING_DAMPING * gong.swingVel) * dt
  gong.swing += gong.swingVel * dt
}
