import type { Shape } from '../level'

/** A steel girder `w` long with its top-left corner at (x, y). */
export function girder(x: number, y: number, w: number): Shape {
  return { rect: [x, y, w, GIRDER_DEPTH] }
}

/** Corners of a rectangular conveyor loop that runs up its left side, right along its top, and back round underneath. */
export function conveyorLoop(left: number, top: number, right: number, bottom: number): [number, number][] {
  return [[left, bottom], [left, top], [right, top], [right, bottom]]
}

const GIRDER_DEPTH = 30
