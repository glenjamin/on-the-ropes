// Renders one frame of a scripted run so the game can be inspected in a known state.
// Query params: ang (fire angle in radians, omit to stay put), pump (-1..1 while held),
// secs (max seconds to simulate), until=bend (stop as soon as the rope bends round a corner).
import { buildLevel } from '../src/level'
import { render, zoomFor } from '../src/render'
import { Sim } from '../src/sim'

const DT = 1 / 240

const params = new URLSearchParams(location.search)
const angle = params.get('ang')
const pump = Number(params.get('pump') ?? 0)
const secs = Number(params.get('secs') ?? 0)
const untilBend = params.get('until') === 'bend'

const level = buildLevel()
const sim = new Sim(level)
if (angle !== null) sim.fire({ x: Math.cos(Number(angle)), y: Math.sin(Number(angle)) })
let t = 0
for (; t < secs; t += DT) {
  sim.step(DT, pump)
  if (untilBend && sim.rope && sim.rope.anchors.length > 1) break
}

const canvas = document.querySelector('canvas')
const ctx = canvas?.getContext('2d')
if (!canvas || !ctx) throw new Error('no canvas')
canvas.width = innerWidth * devicePixelRatio
canvas.height = innerHeight * devicePixelRatio
ctx.scale(devicePixelRatio, devicePixelRatio)
render(ctx, innerWidth, innerHeight, { pos: { ...sim.pos }, zoom: zoomFor(innerWidth, innerHeight) }, level, sim, t)

document.body.dataset.summary = JSON.stringify({
  t: Number(t.toFixed(3)),
  pos: { x: Math.round(sim.pos.x), y: Math.round(sim.pos.y) },
  bends: sim.rope ? sim.rope.anchors.length - 1 : null,
  hookFlying: sim.hook !== null,
})
