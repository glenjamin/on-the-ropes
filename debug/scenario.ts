// Renders one frame of a scripted run so the game can be inspected in a known state.
// Query params: ang (fire angle in radians, omit to stay put), reel (rope speed once attached; negative reels in),
// secs (max seconds to simulate), until=bend (stop as soon as the rope bends round a corner),
// level (id, default 1-2), overview (show the whole level instead of following the player).
import { buildLevel } from '../src/level'
import { LEVELS } from '../src/levels'
import { cameraFocus, render, zoomFor } from '../src/render'
import { Sim } from '../src/sim'

const DT = 1 / 240

const params = new URLSearchParams(location.search)
const angle = params.get('ang')
const reel = Number(params.get('reel') ?? 0)
const secs = Number(params.get('secs') ?? 0)
const untilBend = params.get('until') === 'bend'

const levelData = LEVELS.find((l) => l.id === (params.get('level') ?? '1-2'))
if (!levelData) throw new Error(`unknown level ${params.get('level')}`)
const level = buildLevel(levelData)
const sim = new Sim(level)
if (angle !== null) sim.fire({ x: Math.cos(Number(angle)), y: Math.sin(Number(angle)) })
const trail: { p: { x: number; y: number }; t: number }[] = []
let t = 0
for (; t < secs; t += DT) {
  sim.step(DT, sim.rope ? reel : 0)
  trail.push({ p: { ...sim.pos }, t })
  while (t - trail[0].t > 1.4) trail.shift()
  if (untilBend && sim.rope && sim.rope.anchors.length > 1) break
}

const canvas = document.querySelector('canvas')
const ctx = canvas?.getContext('2d')
if (!canvas || !ctx) throw new Error('no canvas')
canvas.width = innerWidth * devicePixelRatio
canvas.height = innerHeight * devicePixelRatio
ctx.scale(devicePixelRatio, devicePixelRatio)
const zoom = zoomFor(innerWidth, innerHeight)
const cam = params.has('overview') ? overviewCamera() : { pos: cameraFocus(sim.pos, innerHeight, zoom), zoom }
render(ctx, innerWidth, innerHeight, cam, level, sim, { trail: trail.map((s) => s.p), tapRings: [] }, t)

document.body.dataset.summary = JSON.stringify({
  t: Number(t.toFixed(3)),
  pos: { x: Math.round(sim.pos.x), y: Math.round(sim.pos.y) },
  bends: sim.rope ? sim.rope.anchors.length - 1 : null,
  hookFlying: sim.hook !== null,
})

/** Frames the playable span: start to goal across, top of the screen to just below the lava. */
function overviewCamera() {
  const left = level.start.x - 250
  const right = level.goal.pos.x + 350
  const top = -100
  const bottom = level.lavaY + 80
  const zoom = Math.min(innerWidth / (right - left), innerHeight / (bottom - top))
  return { pos: { x: (left + right) / 2, y: (top + bottom) / 2 }, zoom }
}
