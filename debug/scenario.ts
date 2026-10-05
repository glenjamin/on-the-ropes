// Renders one frame of a scripted run so the game can be inspected in a known state.
// Query params: ang (fire angle in radians, omit to stay put), reel (rope speed once attached; negative reels in),
// secs (max seconds to simulate), until=bend (stop as soon as the rope bends round a corner),
// level (id, default 1-2), at (x,y to start the player from instead of the level start), overview (show the whole level instead of following the player),
// route (draw the bot's saved route for the level over it; see `npm run bot -- --trace`).
import type { Trace } from '../src/bot'
import type { Vec } from '../src/geom'
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
const at = params.get('at')?.split(',').map(Number)
if (at) sim.pos = { x: at[0], y: at[1] }
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
if (params.has('route')) await drawRoute(ctx, cam)

document.body.dataset.summary = JSON.stringify({
  t: Number(t.toFixed(3)),
  pos: { x: Math.round(sim.pos.x), y: Math.round(sim.pos.y) },
  bends: sim.rope ? sim.rope.anchors.length - 1 : null,
  hookFlying: sim.hook !== null,
})

/** Frames the playable span: all the terrain across, from above the higher of start and goal down to just below the death line. */
function overviewCamera() {
  const xs = level.polys.flatMap((p) => p.pts.map((pt) => pt.x))
  const left = Math.min(...xs, level.start.x) - 100
  const right = Math.max(...xs, level.goal.pos.x) + 100
  const top = Math.min(level.start.y, level.goal.pos.y, 400) - 500
  const bottom = level.deathY + 80
  const zoom = Math.min(innerWidth / (right - left), innerHeight / (bottom - top))
  return { pos: { x: (left + right) / 2, y: (top + bottom) / 2 }, zoom }
}

/** Overlays the bot's route: its flight path, a line from each firing point to where the rope caught (numbered), and each let-go. */
async function drawRoute(ctx: CanvasRenderingContext2D, cam: { pos: Vec; zoom: number }) {
  const response = await fetch(`/snapshots/route-${level.id}.json`)
  const trace: unknown = await response.json()
  if (!isTrace(trace)) throw new Error('not a route trace')
  const screen = (p: Vec) => ({ x: (p.x - cam.pos.x) * cam.zoom + innerWidth / 2, y: (p.y - cam.pos.y) * cam.zoom + innerHeight / 2 })

  ctx.strokeStyle = '#ff2fa0'
  ctx.lineWidth = 2
  ctx.beginPath()
  trace.path.forEach((p, i) => {
    const s = screen(p)
    if (i === 0) ctx.moveTo(s.x, s.y)
    else ctx.lineTo(s.x, s.y)
  })
  ctx.stroke()

  ctx.font = 'bold 11px system-ui'
  trace.grabs.forEach(({ from, anchor }, i) => {
    if (!anchor) return
    const [a, b] = [screen(from), screen(anchor)]
    ctx.strokeStyle = 'rgba(255, 220, 0, 0.8)'
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#ffdc00'
    ctx.beginPath()
    ctx.arc(b.x, b.y, 3.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#000'
    ctx.fillText(String(i + 1), b.x + 5, b.y - 5)
  })
  ctx.fillStyle = '#fff'
  for (const r of trace.releases) {
    const s = screen(r)
    ctx.beginPath()
    ctx.arc(s.x, s.y, 3, 0, Math.PI * 2)
    ctx.fill()
  }
}

function isTrace(x: unknown): x is Trace {
  return typeof x === 'object' && x !== null && 'path' in x && Array.isArray(x.path) && 'grabs' in x && Array.isArray(x.grabs) && 'releases' in x && Array.isArray(x.releases)
}
