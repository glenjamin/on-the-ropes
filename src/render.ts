import { norm, type Vec } from './geom'
import { gongCentre, restingGong } from './gong'
import { gustStrength, type Level, type Theme } from './level'
import { RADIUS, type Sim } from './sim'

export type Camera = { pos: Vec; zoom: number }
/** Transient visuals: the player's recent path (oldest first) and rings where the screen was tapped. */
export type Effects = {
  trail: Vec[]
  tapRings: { at: Vec; age: number }[]
  /** Set after falling into lava: where it happened and seconds since. */
  lavaDeath?: { at: Vec; age: number }
}

export const TAP_RING_SECS = 0.4
const RING_OUT_SECS = 1.2

type Rgb = [number, number, number]
type Palette = {
  sky: [top: string, middle: string, bottom: string]
  terrainFill: string
  terrainStroke: string
  stars: boolean
  rope: string
  /** Trail colour at the player, fading to `trailFar` at its tail. */
  trailNear: Rgb
  trailFar: Rgb
}

const PALETTES: Record<Theme, Palette> = {
  lava: {
    sky: ['#120d1c', '#2a1733', '#5a2326'],
    terrainFill: '#3a2d4f',
    terrainStroke: '#8c74b8',
    stars: true,
    rope: '#e8c78a',
    trailNear: [255, 255, 255],
    trailFar: [80, 220, 255],
  },
  clouds: {
    sky: ['#4f8fdc', '#93c3f3', '#e3f0ff'],
    terrainFill: '#f8faff',
    terrainStroke: '#b4c8e8',
    stars: false,
    rope: '#8a5a32',
    trailNear: [255, 120, 170],
    trailFar: [120, 150, 255],
  },
}

const STARS = Array.from({ length: 140 }, (_, i) => ({
  x: hash(i * 3.1) * 4000,
  y: hash(i * 7.7) * 1600 - 900,
  r: 0.6 + hash(i * 1.3) * 1.4,
}))

export function render(ctx: CanvasRenderingContext2D, w: number, h: number, cam: Camera, level: Level, sim: Sim, fx: Effects, time: number) {
  const palette = PALETTES[level.theme]
  const sky = ctx.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, palette.sky[0])
  sky.addColorStop(0.65, palette.sky[1])
  sky.addColorStop(1, palette.sky[2])
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, h)

  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.scale(cam.zoom, cam.zoom)

  if (palette.stars) drawStars(ctx, cam, w, h)
  ctx.translate(-cam.pos.x, -cam.pos.y)

  drawGusts(ctx, level, sim.time)
  drawGong(ctx, level, sim)
  drawTerrain(ctx, level, palette)
  drawRope(ctx, sim, palette)
  drawTrail(ctx, fx.trail, palette)
  if (fx.lavaDeath) drawSinkingPlayer(ctx, fx.lavaDeath, time)
  else drawPlayer(ctx, sim.pos, sim.vel, time)
  if (level.theme === 'lava') drawLava(ctx, level, cam, w, h, time)
  else drawFog(ctx, level, cam, w, h)
  if (fx.lavaDeath) drawSplash(ctx, fx.lavaDeath, level)
  drawTapRings(ctx, fx.tapRings)

  ctx.restore()
  drawGoalArrow(ctx, w, h, cam, level, sim, time)
}

/** World-to-screen scale for a viewport, so the playfield reads similarly on phones and desktops. */
export function zoomFor(w: number, h: number): number {
  return Math.max(0.45, Math.min(1.4, Math.sqrt(w * h) / 850))
}

/** Where to centre the camera to follow `p`, keeping it low on screen so most of the view is what's above. */
export function cameraFocus(p: Vec, viewH: number, zoom: number): Vec {
  // Fraction of the half-height to lift the view by: 0.5 puts the player three-quarters of the way down
  const raise = 0.5
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

function drawTerrain(ctx: CanvasRenderingContext2D, level: Level, palette: Palette) {
  ctx.fillStyle = palette.terrainFill
  ctx.strokeStyle = palette.terrainStroke
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

function drawRope(ctx: CanvasRenderingContext2D, sim: Sim, palette: Palette) {
  ctx.strokeStyle = palette.rope
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

/** A thin line along the actual path, fading from the near colour at the player to the far colour at the tail. */
function drawTrail(ctx: CanvasRenderingContext2D, trail: Vec[], { trailNear: near, trailFar: far }: Palette) {
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  for (let i = 1; i < trail.length; i++) {
    const k = i / trail.length
    const [r, g, b] = far.map((f, c) => Math.round(f + (near[c] - f) * k))
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.9 * k})`
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

/** A round ninja: dark body, eye slit, and a red headband whose tails stream behind faster movement. */
function drawPlayer(ctx: CanvasRenderingContext2D, pos: Vec, vel: Vec, time: number) {
  const { x, y } = pos
  const speed = Math.hypot(vel.x, vel.y)
  const look = norm({ x: vel.x || 1, y: vel.y * 0.5 })
  const facing = look.x >= 0 ? 1 : -1

  // Headband tails, drawn first so they sit behind the body
  const knot = { x: x - facing * 9, y: y - 7 }
  const back = speed > 60 ? norm({ x: -vel.x, y: -vel.y }) : norm({ x: -facing, y: 0.6 })
  const length = 9 + Math.min(18, speed / 40)
  ctx.strokeStyle = '#e63946'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  for (const [i, spread] of [[0, -0.35], [1, 0.35]]) {
    const dir = { x: back.x * Math.cos(spread) - back.y * Math.sin(spread), y: back.x * Math.sin(spread) + back.y * Math.cos(spread) }
    const flutter = Math.sin(time * 14 + i * 2) * (2 + Math.min(4, speed / 200))
    const end = { x: knot.x + dir.x * length, y: knot.y + dir.y * length }
    ctx.beginPath()
    ctx.moveTo(knot.x, knot.y)
    ctx.quadraticCurveTo(knot.x + dir.x * length * 0.5 - dir.y * flutter, knot.y + dir.y * length * 0.5 + dir.x * flutter, end.x, end.y)
    ctx.stroke()
  }

  ctx.fillStyle = '#262a3b'
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(x, y, RADIUS, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Headband and eye slit, clipped to the head
  ctx.save()
  ctx.beginPath()
  ctx.arc(x, y, RADIUS - 0.5, 0, Math.PI * 2)
  ctx.clip()
  ctx.fillStyle = '#e63946'
  ctx.fillRect(x - RADIUS, y - 10, RADIUS * 2, 4)
  ctx.fillStyle = '#f2c7a5'
  ctx.beginPath()
  ctx.roundRect(x - 8 + look.x * 2, y - 5, 16, 6, 3)
  ctx.fill()
  ctx.restore()
  ctx.fillStyle = '#e63946'
  ctx.beginPath()
  ctx.arc(knot.x, knot.y, 2.5, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#1b1024'
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.ellipse(x + look.x * 3 + side * 3.6, y - 2 + look.y * 1.5, 1.6, 2, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** The goal gong in its wooden frame; once struck it swings, shimmers and sends out rings. */
function drawGong(ctx: CanvasRenderingContext2D, level: Level, sim: Sim) {
  const gong = sim.gong ?? restingGong(level.goal.pos, level.goal.radius)
  const { pivot, radius } = gong
  const centre = gongCentre(gong)
  const postX = radius + 18
  const beamY = pivot.y - 6
  const groundY = level.goal.pos.y + radius + 30

  ctx.fillStyle = '#5b3a1e'
  for (const side of [-1, 1]) ctx.fillRect(pivot.x + side * postX - 4, beamY, 8, groundY - beamY)
  ctx.fillRect(pivot.x - postX - 10, beamY - 8, postX * 2 + 20, 8)

  ctx.strokeStyle = '#d8c7a0'
  ctx.lineWidth = 2
  ctx.beginPath()
  for (const side of [-1, 1]) {
    ctx.moveTo(pivot.x + side * radius * 0.5, beamY)
    ctx.lineTo(centre.x + side * radius * 0.5, centre.y - radius * 0.85)
  }
  ctx.stroke()

  const lastHit = gong.hits.at(-1)
  const sinceHit = lastHit === undefined ? 0 : sim.time - lastHit
  const wobble = lastHit === undefined ? 1 : 1 + 0.05 * Math.sin(sinceHit * 55) * Math.exp(-sinceHit * 4)
  const r = radius * wobble
  const bronze = ctx.createRadialGradient(centre.x - r * 0.3, centre.y - r * 0.3, r * 0.1, centre.x, centre.y, r)
  bronze.addColorStop(0, '#f6d27a')
  bronze.addColorStop(0.6, '#c98f2f')
  bronze.addColorStop(1, '#7a4f16')
  ctx.fillStyle = bronze
  ctx.beginPath()
  ctx.arc(centre.x, centre.y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(90, 55, 15, 0.7)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(centre.x, centre.y, r * 0.62, 0, Math.PI * 2)
  ctx.stroke()
  ctx.fillStyle = '#e0a940'
  ctx.beginPath()
  ctx.arc(centre.x, centre.y, r * 0.22, 0, Math.PI * 2)
  ctx.fill()

  ctx.lineWidth = 3
  for (const hit of gong.hits) {
    const age = sim.time - hit
    if (age > RING_OUT_SECS) continue
    const k = age / RING_OUT_SECS
    ctx.strokeStyle = `rgba(255, 215, 120, ${0.7 * (1 - k)})`
    ctx.beginPath()
    ctx.arc(centre.x, centre.y, radius + 10 + 90 * k, 0, Math.PI * 2)
    ctx.stroke()
  }
}

function drawLava(ctx: CanvasRenderingContext2D, level: Level, cam: Camera, w: number, h: number, time: number) {
  const left = cam.pos.x - w / 2 / cam.zoom - 20
  const right = cam.pos.x + w / 2 / cam.zoom + 20
  const bottom = cam.pos.y + h / 2 / cam.zoom + 20
  if (bottom < level.deathY - 20) return

  const grad = ctx.createLinearGradient(0, level.deathY - 10, 0, level.deathY + 200)
  grad.addColorStop(0, '#ffcf4a')
  grad.addColorStop(0.15, '#ff6a1f')
  grad.addColorStop(1, '#7a1010')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.moveTo(left, Math.max(bottom, level.deathY + 40))
  const step = 24
  for (let x = Math.floor(left / step) * step; x <= right + step; x += step) {
    ctx.lineTo(x, level.deathY + Math.sin(x * 0.02 + time * 2.5) * 5 + Math.sin(x * 0.051 - time * 1.7) * 3)
  }
  ctx.lineTo(right + step, Math.max(bottom, level.deathY + 40))
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

/** Wind zones: a faint wash with streaks flowing in the push direction, both fading out while a gust is off. */
function drawGusts(ctx: CanvasRenderingContext2D, level: Level, time: number) {
  const spacing = 70
  const gap = 260
  const streak = 90
  for (const gust of level.gusts) {
    const { min, max } = gust
    const strength = gustStrength(gust, time)
    ctx.save()
    ctx.beginPath()
    ctx.rect(min.x, min.y, max.x - min.x, max.y - min.y)
    ctx.clip()
    ctx.fillStyle = `rgba(255, 255, 255, ${0.06 + 0.1 * strength})`
    ctx.fillRect(min.x, min.y, max.x - min.x, max.y - min.y)

    const along = norm(gust.force)
    const across = { x: -along.y, y: along.x }
    const centre = { x: (min.x + max.x) / 2, y: (min.y + max.y) / 2 }
    const reach = Math.hypot(max.x - min.x, max.y - min.y) / 2
    const flow = (time * 700) % gap
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.12 + 0.45 * strength})`
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.beginPath()
    for (let u = -reach; u <= reach; u += spacing) {
      const stagger = hash(Math.round(u)) * gap
      for (let v = -reach - gap; v <= reach; v += gap) {
        const at = v + ((flow + stagger) % gap)
        ctx.moveTo(centre.x + across.x * u + along.x * at, centre.y + across.y * u + along.y * at)
        ctx.lineTo(centre.x + across.x * u + along.x * (at + streak), centre.y + across.y * u + along.y * (at + streak))
      }
    }
    ctx.stroke()
    ctx.restore()
  }
}

/** For sky levels: a bank of fog rising from below, marking where falling ends the run. */
function drawFog(ctx: CanvasRenderingContext2D, level: Level, cam: Camera, w: number, h: number) {
  const left = cam.pos.x - w / 2 / cam.zoom - 20
  const right = cam.pos.x + w / 2 / cam.zoom + 20
  const bottom = cam.pos.y + h / 2 / cam.zoom + 20
  const top = level.deathY - 250
  if (bottom < top) return
  const fog = ctx.createLinearGradient(0, top, 0, level.deathY + 60)
  fog.addColorStop(0, 'rgba(255, 255, 255, 0)')
  fog.addColorStop(1, 'rgba(255, 255, 255, 0.95)')
  ctx.fillStyle = fog
  ctx.fillRect(left, top, right - left, Math.max(bottom, level.deathY + 60) - top)
}

/** The ninja slowly sinking into the lava where they fell, charring as they go. */
function drawSinkingPlayer(ctx: CanvasRenderingContext2D, { at, age }: NonNullable<Effects['lavaDeath']>, time: number) {
  const pos = { x: at.x, y: at.y + Math.min(age * 80, RADIUS * 3) }
  drawPlayer(ctx, pos, { x: 0, y: 0 }, time)
  const char = Math.min(1, age * 1.5)
  ctx.fillStyle = `rgba(30, 8, 0, ${0.75 * char})`
  ctx.beginPath()
  ctx.arc(pos.x, pos.y, RADIUS + 1, 0, Math.PI * 2)
  ctx.fill()
}

/** A hot flash, molten droplets thrown up where the player went in, a ripple across the surface, and rising smoke. */
function drawSplash(ctx: CanvasRenderingContext2D, { at, age }: NonNullable<Effects['lavaDeath']>, level: Level) {
  const surface = level.deathY
  const flash = Math.max(0, 1 - age / 0.7)
  if (flash > 0) {
    const glow = ctx.createRadialGradient(at.x, surface, 0, at.x, surface, 160)
    glow.addColorStop(0, `rgba(255, 240, 170, ${0.85 * flash})`)
    glow.addColorStop(1, 'rgba(255, 120, 30, 0)')
    ctx.fillStyle = glow
    ctx.fillRect(at.x - 160, surface - 160, 320, 320)
  }

  const ripple = Math.min(1, age / 1.2)
  if (ripple < 1) {
    ctx.strokeStyle = `rgba(255, 220, 120, ${0.8 * (1 - ripple)})`
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.ellipse(at.x, surface, 25 + 170 * ripple, 8 + 18 * ripple, 0, 0, Math.PI * 2)
    ctx.stroke()
  }

  for (let i = 0; i < 28; i++) {
    const vx = (hash(i * 4.3) - 0.5) * 700
    const vy = -(450 + hash(i * 9.1) * 550)
    const x = at.x + vx * age
    const y = surface - 4 + vy * age + 0.5 * 1400 * age * age
    if (y > surface) continue
    const heat = Math.min(1, age / 1.1)
    ctx.fillStyle = `rgb(255, ${Math.round(230 - 160 * heat)}, ${Math.round(90 - 70 * heat)})`
    ctx.beginPath()
    ctx.arc(x, y, (4 + hash(i * 2.7) * 6) * (1 - 0.5 * heat), 0, Math.PI * 2)
    ctx.fill()
  }

  for (let i = 0; i < 10; i++) {
    const t = age - i * 0.1
    if (t <= 0 || t > 2) continue
    const k = t / 2
    ctx.fillStyle = `rgba(60, 50, 60, ${0.6 * (1 - k)})`
    ctx.beginPath()
    ctx.arc(at.x + (hash(i * 6.1) - 0.5) * 70 + Math.sin(t * 3 + i) * 10, surface - 15 - t * 110, 16 + 40 * k, 0, Math.PI * 2)
    ctx.fill()
  }
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
