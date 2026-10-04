import { norm, type Vec } from './geom'
import type { Level } from './level'
import { RADIUS, type Sim } from './sim'

export type Camera = { pos: Vec; zoom: number }
/** Transient visuals: the player's recent path (oldest first) and rings where the screen was tapped. */
export type Effects = { trail: Vec[]; tapRings: { at: Vec; age: number }[] }

export const TAP_RING_SECS = 0.4

const STARS = Array.from({ length: 140 }, (_, i) => ({
  x: hash(i * 3.1) * 4000,
  y: hash(i * 7.7) * 1600 - 900,
  r: 0.6 + hash(i * 1.3) * 1.4,
}))

export function render(ctx: CanvasRenderingContext2D, w: number, h: number, cam: Camera, level: Level, sim: Sim, fx: Effects, time: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#120d1c')
  sky.addColorStop(0.65, '#2a1733')
  sky.addColorStop(1, '#5a2326')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h)

  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.scale(cam.zoom, cam.zoom)

  drawStars(ctx, cam, w, h)
  ctx.translate(-cam.pos.x, -cam.pos.y)

  drawGoal(ctx, level, time)
  drawTerrain(ctx, level)
  drawRope(ctx, sim)
  drawTrail(ctx, fx.trail)
  drawPlayer(ctx, sim)
  drawLava(ctx, level, cam, w, h, time)
  drawTapRings(ctx, fx.tapRings)

  ctx.restore()
  drawGoalArrow(ctx, w, h, cam, level, sim, time)
}

/** World-to-screen scale for a viewport, so the playfield reads similarly on phones and desktops. */
export function zoomFor(w: number, h: number): number {
  return Math.max(0.45, Math.min(1.4, Math.sqrt(w * h) / 850))
}

/** Where to centre the camera to follow `p`, keeping it below the middle so more of what's above is in view. */
export function cameraFocus(p: Vec, viewH: number, zoom: number): Vec {
  const raise = 0.25
  return { x: p.x, y: p.y - (viewH / 2 / zoom) * raise }
}

function drawStars(ctx: CanvasRenderingContext2D, cam: Camera, w: number, h: number) {
  const parallax = 0.2
  const halfW = w / 2 / cam.zoom
  const halfH = h / 2 / cam.zoom
  ctx.fillStyle = '#ffffff55'
  for (const s of STARS) {
    const x = ((((s.x - cam.pos.x * parallax) % 4000) + 4000) % 4000) - 2000
    const y = s.y - cam.pos.y * parallax
    if (Math.abs(x) > halfW + 4 || Math.abs(y) > halfH + 4) continue
    ctx.beginPath()
    ctx.arc(x, y, s.r, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawTerrain(ctx: CanvasRenderingContext2D, level: Level) {
  ctx.fillStyle = '#3a2d4f'
  ctx.strokeStyle = '#8c74b8'
  ctx.lineWidth = 3
  ctx.lineJoin = 'round'
  for (const poly of level.polys) {
    ctx.beginPath()
    poly.pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }
}

function drawRope(ctx: CanvasRenderingContext2D, sim: Sim) {
  ctx.strokeStyle = '#e8c78a'
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  if (sim.rope) {
    const anchors = sim.rope.anchors
    ctx.beginPath()
    ctx.moveTo(anchors[0].p.x, anchors[0].p.y)
    for (const a of anchors.slice(1)) ctx.lineTo(a.p.x, a.p.y)
    ctx.lineTo(sim.pos.x, sim.pos.y)
    ctx.stroke()
    drawHookHead(ctx, anchors[0].p)
  } else if (sim.hook) {
    ctx.beginPath()
    ctx.moveTo(sim.pos.x, sim.pos.y)
    ctx.lineTo(sim.hook.pos.x, sim.hook.pos.y)
    ctx.stroke()
    drawHookHead(ctx, sim.hook.pos)
  }
}

/** A thin line along the actual path, white at the player fading to cyan at the tail. */
function drawTrail(ctx: CanvasRenderingContext2D, trail: Vec[]) {
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  for (let i = 1; i < trail.length; i++) {
    const k = i / trail.length
    ctx.strokeStyle = `rgba(${Math.round(80 + 175 * k)}, ${Math.round(220 + 35 * k)}, 255, ${0.9 * k})`
    ctx.beginPath()
    ctx.moveTo(trail[i - 1].x, trail[i - 1].y)
    ctx.lineTo(trail[i].x, trail[i].y)
    ctx.stroke()
  }
}

function drawTapRings(ctx: CanvasRenderingContext2D, rings: Effects['tapRings']) {
  ctx.lineWidth = 3
  for (const { at, age } of rings) {
    const k = Math.min(1, age / TAP_RING_SECS)
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * (1 - k)})`
    ctx.beginPath()
    ctx.arc(at.x, at.y, 12 + 36 * k, 0, Math.PI * 2)
    ctx.stroke()
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, sim: Sim) {
  const { x, y } = sim.pos
  ctx.fillStyle = '#ff8fb1'
  ctx.beginPath()
  ctx.arc(x, y, RADIUS, 0, Math.PI * 2)
  ctx.fill()

  const look = norm({ x: sim.vel.x || 1, y: sim.vel.y * 0.5 })
  for (const side of [-1, 1]) {
    const ex = x + look.x * 4 + side * 4.5
    const ey = y - 3 + look.y * 3
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(ex, ey, 3.6, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#1b1024'
    ctx.beginPath()
    ctx.arc(ex + look.x * 1.5, ey + look.y * 1.5, 1.8, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawGoal(ctx: CanvasRenderingContext2D, level: Level, time: number) {
  const { pos, radius } = level.goal
  ctx.fillStyle = `rgba(140, 255, 180, ${0.12 + 0.08 * Math.sin(time * 4)})`
  ctx.beginPath()
  ctx.arc(pos.x, pos.y, radius + 6 * Math.sin(time * 4), 0, Math.PI * 2)
  ctx.fill()

  const baseY = pos.y + radius
  ctx.strokeStyle = '#ddd'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(pos.x, baseY)
  ctx.lineTo(pos.x, baseY - 90)
  ctx.stroke()
  const wave = Math.sin(time * 6) * 4
  ctx.fillStyle = '#8cffb4'
  ctx.beginPath()
  ctx.moveTo(pos.x, baseY - 90)
  ctx.quadraticCurveTo(pos.x + 25, baseY - 85 + wave, pos.x + 50, baseY - 78)
  ctx.quadraticCurveTo(pos.x + 25, baseY - 70 + wave, pos.x, baseY - 62)
  ctx.closePath()
  ctx.fill()
}

function drawLava(ctx: CanvasRenderingContext2D, level: Level, cam: Camera, w: number, h: number, time: number) {
  const left = cam.pos.x - w / 2 / cam.zoom - 20
  const right = cam.pos.x + w / 2 / cam.zoom + 20
  const bottom = cam.pos.y + h / 2 / cam.zoom + 20
  if (bottom < level.lavaY - 20) return

  const grad = ctx.createLinearGradient(0, level.lavaY - 10, 0, level.lavaY + 200)
  grad.addColorStop(0, '#ffcf4a')
  grad.addColorStop(0.15, '#ff6a1f')
  grad.addColorStop(1, '#7a1010')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.moveTo(left, Math.max(bottom, level.lavaY + 40))
  const step = 24
  for (let x = Math.floor(left / step) * step; x <= right + step; x += step) {
    ctx.lineTo(x, level.lavaY + Math.sin(x * 0.02 + time * 2.5) * 5 + Math.sin(x * 0.051 - time * 1.7) * 3)
  }
  ctx.lineTo(right + step, Math.max(bottom, level.lavaY + 40))
  ctx.closePath()
  ctx.fill()
}

/** Sits at the top-middle of the screen pointing from the player towards the goal, while the goal is off screen. */
function drawGoalArrow(ctx: CanvasRenderingContext2D, w: number, h: number, cam: Camera, level: Level, sim: Sim, time: number) {
  const toScreen = (p: Vec) => ({ x: (p.x - cam.pos.x) * cam.zoom + w / 2, y: (p.y - cam.pos.y) * cam.zoom + h / 2 })
  const goal = toScreen(level.goal.pos)
  const margin = 40
  if (goal.x > margin && goal.x < w - margin && goal.y > margin && goal.y < h - margin) return

  const player = toScreen(sim.pos)
  const dir = norm({ x: goal.x - player.x, y: goal.y - player.y })
  const bob = Math.sin(time * 4) * 4
  ctx.save()
  ctx.translate(w / 2 + dir.x * bob, 64 + dir.y * bob)
  ctx.rotate(Math.atan2(dir.y, dir.x))
  ctx.beginPath()
  ctx.moveTo(14, 0)
  ctx.lineTo(-8, -11)
  ctx.lineTo(-3, 0)
  ctx.lineTo(-8, 11)
  ctx.closePath()
  ctx.fillStyle = '#8cffb4'
  ctx.strokeStyle = '#120d1c'
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.9
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

function drawHookHead(ctx: CanvasRenderingContext2D, p: Vec) {
  ctx.fillStyle = '#f5e2b8'
  ctx.beginPath()
  ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
  ctx.fill()
}

function hash(n: number): number {
  const s = Math.sin(n * 12.9898) * 43758.5453
  return s - Math.floor(s)
}
