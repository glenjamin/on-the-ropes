/** A puffy cloud: a box with its corners cut off, centred on (cx, cy). */
export function cloud(cx: number, cy: number, w: number, h: number): [number, number][] {
  const c = Math.min(w, h) * 0.35
  const [l, r, t, b] = [cx - w / 2, cx + w / 2, cy - h / 2, cy + h / 2]
  return [[l + c, t], [r - c, t], [r, t + c], [r, b - c], [r - c, b], [l + c, b], [l, b - c], [l, t + c]]
}
