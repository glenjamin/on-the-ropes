import { add, norm, scale, sub, type Vec } from './geom'
import { gongCentre, restingGong } from './gong'
import { gustStrength, type Level, type Poly, type Surface, type Theme, type Vine, type VineKind } from './level'
import { flipperAngle, FLIPPER_RADIUS, GONG_CORD_LENGTH, LAUNCHER_HOLD_SECS, launcherRest, RADIUS, vinePoint, type Sim } from './sim'

export type Camera = { pos: Vec; zoom: number }
/** Transient visuals: the player's recent path (oldest first) and rings where the screen was tapped. */
export type Effects = {
  trail: Vec[]
  tapRings: { at: Vec; age: number }[]
  /** Set after falling into lava or icy water: where it happened and seconds since. */
  sinking?: { at: Vec; age: number }
}

export const TAP_RING_SECS = 0.4
const RING_OUT_SECS = 1.2
const ICE_PUFF_SECS = 0.8
/** How long a broken piece of ice is drawn falling away, and how fast it falls. */
const BREAK_FALL_SECS = 1.5
const BREAK_FALL_GRAVITY = 1600
/** Colours (as "r, g, b") of the ripple, spray and mist where the player falls into water. */
type SplashLook = { ripple: string; spray: string; mist: string }
const SPLASHES: Record<'ice' | 'jungle', SplashLook> = {
  ice: { ripple: '235, 250, 255', spray: '225, 245, 255', mist: '240, 250, 255' },
  jungle: { ripple: '210, 235, 200', spray: '175, 215, 165', mist: '215, 235, 205' },
}
const FOLIAGE = { fill: '#2f7a2c', stroke: '#16461a' }
const VINE_LOOKS: Record<VineKind, { stem: string; leaf: string }> = {
  green: { stem: '#3f9a2f', leaf: '#74d24e' },
  brown: { stem: '#7a5230', leaf: '#b08040' },
}
/** How long a snapped vine is drawn falling away, and the burst of leaves where it snapped. */
const VINE_FALL_SECS = 1.5
const VINE_SNAP_BURST_SECS = 0.7
const ICE_LOOKS: Record<Surface, { fill: string; stroke: string; sheen: string } | null> = {
  rock: null,
  ice: { fill: '#b2e6ff', stroke: '#f4fcff', sheen: 'rgba(255, 255, 255, 0.55)' },
  'dark-ice': { fill: '#1e5096', stroke: '#8fd0f5', sheen: 'rgba(160, 215, 255, 0.4)' },
}

/** How long a bumper lights up after kicking the player. */
const BUMP_FLASH_SECS = 0.35
const BUMPER_LOOK = { fill: '#ff2f9a', core: '#ffd1ec', stroke: '#fff2fa' }
const FLIPPER_LOOK = { fill: '#f4f6ff', stroke: '#36e0ff' }
/** How long a launcher's chevrons blaze after it fires. */
const LAUNCH_FLASH_SECS = 0.6

type Rgb = [number, number, number]
type Palette = {
  sky: [top: string, middle: string, bottom: string]
  terrainFill: string
  terrainStroke: string
  stars: boolean
  snow: boolean
  /** Snow or moss along the tops of terrain. */
  caps: string | null
  /** A neon glow around terrain outlines. */
  glow: boolean
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
    snow: false,
    caps: null,
    glow: false,
    rope: '#e8c78a',
    trailNear: [255, 255, 255],
    trailFar: [80, 220, 255],
  },
  clouds: {
    sky: ['#4f8fdc', '#93c3f3', '#e3f0ff'],
    terrainFill: '#f8faff',
    terrainStroke: '#b4c8e8',
    stars: false,
    snow: false,
    caps: null,
    glow: false,
    rope: '#8a5a32',
    trailNear: [255, 120, 170],
    trailFar: [120, 150, 255],
  },
  ice: {
    sky: ['#0d1f3c', '#2f5f8f', '#b5dcf0'],
    terrainFill: '#3d4859',
    terrainStroke: '#7f8ea6',
    stars: false,
    snow: true,
    caps: '#f2f8ff',
    glow: false,
    rope: '#d9a066',
    trailNear: [255, 255, 255],
    trailFar: [255, 170, 90],
  },
  jungle: {
    sky: ['#0f2a1c', '#2d5a32', '#7fae5a'],
    terrainFill: '#5a3d26',
    terrainStroke: '#2e1d10',
    stars: false,
    snow: false,
    caps: '#6cb83f',
    glow: false,
    rope: '#f0d9a0',
    trailNear: [255, 250, 200],
    trailFar: [255, 140, 60],
  },
  pinball: {
    sky: ['#06021a', '#12083a', '#260a3f'],
    terrainFill: '#140c33',
    terrainStroke: '#36e0ff',
    stars: false,
    snow: false,
    caps: null,
    glow: true,
    rope: '#ffe066',
    trailNear: [255, 255, 255],
    trailFar: [255, 60, 200],
  },
}

const STARS = Array.from({ length: 140 }, (_, i) => ({
  x: hash(i * 3.1) * 4000,
  y: hash(i * 7.7) * 1600 - 900,
  r: 0.6 + hash(i * 1.3) * 1.4,
}))

const DAPPLES = Array.from({ length: 70 }, (_, i) => ({
  x: hash(i * 4.7) * 3000,
  y: hash(i * 6.3) * 2000,
  r: 6 + hash(i * 2.2) * 18,
}))

const SNOW = Array.from({ length: 160 }, (_, i) => ({
  x: hash(i * 5.3) * 3000,
  y: hash(i * 2.9) * 2000,
  r: 1 + hash(i * 8.1) * 2,
  fall: 25 + hash(i * 3.7) * 45,
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
  if (palette.snow) drawSnow(ctx, cam, w, h, time)
  if (level.theme === 'jungle') drawCanopyLight(ctx, cam, w, h, time)
  if (level.theme === 'pinball') drawPlayfieldLights(ctx, cam, w, h, time)
  ctx.translate(-cam.pos.x, -cam.pos.y)

  drawGusts(ctx, level, sim.time)
  for (const trunk of level.trunks) drawTrunk(ctx, trunk, level)
  drawGong(ctx, level, sim)
  drawVines(ctx, level, sim)
  drawTerrain(ctx, level, sim, palette)
  drawLaunchers(ctx, level, sim, time)
  drawFlippers(ctx, level, sim)
  for (const flag of level.flags) drawFlag(ctx, flag, time)
  drawRope(ctx, sim, palette)
  if (level.theme === 'jungle') drawVineSnap(ctx, sim)
  else drawIcePuff(ctx, sim)
  drawTrail(ctx, fx.trail, palette)
  if (fx.sinking) drawSinkingPlayer(ctx, fx.sinking, level.theme, time)
  else drawPlayer(ctx, sim.pos, sim.vel, time, sim.boost === 'ramp')
  if (level.theme === 'lava') drawLava(ctx, level, cam, w, h, time)
  else if (level.theme === 'ice') drawWater(ctx, level, cam, w, h, time)
  else if (level.theme === 'jungle') drawRiver(ctx, level, cam, w, h, time)
  else if (level.theme === 'pinball') drawDrain(ctx, level, cam, w, h, time)
  else drawFog(ctx, level, cam, w, h)
  if (fx.sinking && level.theme === 'lava') drawSplash(ctx, fx.sinking, level)
  if (fx.sinking && (level.theme === 'ice' || level.theme === 'jungle')) drawWaterSplash(ctx, fx.sinking, level, SPLASHES[level.theme])
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

/**
 * Rock in the theme's colours, capped with snow in snowy themes; ice is glassy so it reads apart from rock, and dark ice
 * a deeper blue; launch ramps are striped, and bumpers light up as they kick. Pieces that have broken off tumble away and fade.
 */
function drawTerrain(ctx: CanvasRenderingContext2D, level: Level, sim: Sim, palette: Palette) {
  ctx.lineWidth = 3
  ctx.lineJoin = 'round'
  level.polys.forEach((poly, index) => {
    const broke = sim.broken.find((b) => b.poly === index)
    const fallen = broke ? sim.time - broke.time : 0
    if (fallen > BREAK_FALL_SECS) return
    ctx.save()
    if (broke) {
      const xs = poly.pts.map((p) => p.x)
      const pivot = { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: poly.pts[0].y }
      ctx.globalAlpha = 1 - fallen / BREAK_FALL_SECS
      ctx.translate(pivot.x, pivot.y + 0.5 * BREAK_FALL_GRAVITY * fallen * fallen)
      ctx.rotate(fallen * (hash(index) - 0.5) * 3)
      ctx.translate(-pivot.x, -pivot.y)
    }
    ctx.beginPath()
    poly.pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)))
    ctx.closePath()
    const ice = ICE_LOOKS[poly.surface]
    const look = ice ?? (poly.foliage ? FOLIAGE : poly.bumper ? BUMPER_LOOK : null)
    ctx.fillStyle = look?.fill ?? palette.terrainFill
    ctx.strokeStyle = look?.stroke ?? palette.terrainStroke
    if (palette.glow) {
      ctx.shadowColor = ctx.strokeStyle
      ctx.shadowBlur = 12
    }
    ctx.fill()
    ctx.stroke()
    ctx.shadowBlur = 0
    if (poly.bumper) drawBumperLight(ctx, poly, sim.bumps.find((b) => b.poly === index), sim.time)
    else if (ice) drawIceSheen(ctx, poly, ice.sheen)
    else if (poly.foliage) drawLeafDapples(ctx, poly)
    else if (palette.caps) drawCaps(ctx, poly, palette.caps)
    if (poly.ramp) drawRampStripe(ctx, poly)
    ctx.restore()
  })
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
    drawHookHead(ctx, sim.rope.grip === null ? anchors[0].p : slippingHook(anchors[0].p, sim.rope.age / sim.rope.grip))
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
/** With `skis`, for riding a ski jump and the flight after it. */
function drawPlayer(ctx: CanvasRenderingContext2D, pos: Vec, vel: Vec, time: number, skis = false) {
  const { x, y } = pos
  const speed = Math.hypot(vel.x, vel.y)
  const look = norm({ x: vel.x || 1, y: vel.y * 0.5 })
  const facing = look.x >= 0 ? 1 : -1
  if (skis) drawSkis(ctx, pos, speed > 60 ? norm(vel) : { x: facing, y: 0 })

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

/** The goal gong, hanging in a wooden frame or floating free; once struck it swings, shimmers and sends out rings. */
function drawGong(ctx: CanvasRenderingContext2D, level: Level, sim: Sim) {
  const gong = sim.gong ?? restingGong(level.goal.pos, level.goal.radius)
  const { pivot, radius } = gong
  const centre = gongCentre(gong)
  const postX = radius + 18
  const beamY = pivot.y - 6
  const groundY = level.goal.pos.y + radius + 30

  if (level.goal.mount === 'stand') {
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
  }

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

  if (sim.gong) drawGongCord(ctx, centre, sim.pos)

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

/** For icy levels: freezing water with ice floes bobbing on it. */
function drawWater(ctx: CanvasRenderingContext2D, level: Level, cam: Camera, w: number, h: number, time: number) {
  const left = cam.pos.x - w / 2 / cam.zoom - 20
  const right = cam.pos.x + w / 2 / cam.zoom + 20
  const bottom = cam.pos.y + h / 2 / cam.zoom + 20
  if (bottom < level.deathY - 20) return

  const surface = (x: number) => level.deathY + Math.sin(x * 0.012 + time * 1.2) * 4 + Math.sin(x * 0.031 - time * 0.9) * 2
  const grad = ctx.createLinearGradient(0, level.deathY - 10, 0, level.deathY + 220)
  grad.addColorStop(0, '#d8f3ff')
  grad.addColorStop(0.08, '#3f8fbf')
  grad.addColorStop(1, '#0b2a48')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.moveTo(left, Math.max(bottom, level.deathY + 40))
  const step = 24
  for (let x = Math.floor(left / step) * step; x <= right + step; x += step) ctx.lineTo(x, surface(x))
  ctx.lineTo(right + step, Math.max(bottom, level.deathY + 40))
  ctx.closePath()
  ctx.fill()

  const spacing = 260
  ctx.fillStyle = 'rgba(240, 250, 255, 0.9)'
  for (let i = Math.floor(left / spacing); i * spacing < right; i++) {
    if (hash(i * 1.7) < 0.45) continue
    const x = i * spacing + hash(i * 4.1) * spacing * 0.6
    const floeW = 30 + hash(i * 2.3) * 60
    ctx.beginPath()
    ctx.ellipse(x, surface(x) + 2, floeW / 2, 5, 0, 0, Math.PI * 2)
    ctx.fill()
  }
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

/** The ninja sinking where they fell: charring in lava, freezing into a block of ice that bobs half under, or swept downriver. */
function drawSinkingPlayer(ctx: CanvasRenderingContext2D, { at, age }: NonNullable<Effects['sinking']>, theme: Theme, time: number) {
  if (theme === 'jungle') {
    // Carried off downstream as they go under
    drawPlayer(ctx, { x: at.x + age * 90, y: at.y + Math.min(age * 50, RADIUS * 2.5) + Math.sin(age * 4) * 2 }, { x: 0, y: 0 }, time)
    return
  }
  if (theme === 'ice') {
    const pos = { x: at.x, y: at.y + Math.min(age * 60, RADIUS * 1.6) + Math.sin(age * 3) * 2 }
    drawPlayer(ctx, pos, { x: 0, y: 0 }, time)
    const frost = Math.min(1, age * 1.5)
    const size = RADIUS + 5
    ctx.fillStyle = `rgba(190, 235, 255, ${0.6 * frost})`
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.9 * frost})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(pos.x - size, pos.y - size, size * 2, size * 2, 4)
    ctx.fill()
    ctx.stroke()
    return
  }
  const pos = { x: at.x, y: at.y + Math.min(age * 80, RADIUS * 3) }
  drawPlayer(ctx, pos, { x: 0, y: 0 }, time)
  const char = Math.min(1, age * 1.5)
  ctx.fillStyle = `rgba(30, 8, 0, ${0.75 * char})`
  ctx.beginPath()
  ctx.arc(pos.x, pos.y, RADIUS + 1, 0, Math.PI * 2)
  ctx.fill()
}

/** A hot flash, molten droplets thrown up where the player went in, a ripple across the surface, and rising smoke. */
function drawSplash(ctx: CanvasRenderingContext2D, { at, age }: NonNullable<Effects['sinking']>, level: Level) {
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

/** Spray thrown up where the player went into the water, a ripple, and a mist drifting off it. */
function drawWaterSplash(ctx: CanvasRenderingContext2D, { at, age }: NonNullable<Effects['sinking']>, level: Level, look: SplashLook) {
  const surface = level.deathY
  const ripple = Math.min(1, age / 1.4)
  if (ripple < 1) {
    ctx.strokeStyle = `rgba(${look.ripple}, ${0.8 * (1 - ripple)})`
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.ellipse(at.x, surface, 25 + 150 * ripple, 6 + 14 * ripple, 0, 0, Math.PI * 2)
    ctx.stroke()
  }

  for (let i = 0; i < 30; i++) {
    const vx = (hash(i * 4.3) - 0.5) * 500
    const vy = -(400 + hash(i * 9.1) * 600)
    const x = at.x + vx * age
    const y = surface - 4 + vy * age + 0.5 * 2000 * age * age
    if (y > surface) continue
    ctx.fillStyle = `rgba(${look.spray}, ${0.9 - 0.4 * hash(i * 3.3)})`
    ctx.beginPath()
    ctx.arc(x, y, 2.5 + hash(i * 2.7) * 4, 0, Math.PI * 2)
    ctx.fill()
  }

  for (let i = 0; i < 8; i++) {
    const t = age - i * 0.12
    if (t <= 0 || t > 2) continue
    const k = t / 2
    ctx.fillStyle = `rgba(${look.mist}, ${0.45 * (1 - k)})`
    ctx.beginPath()
    ctx.arc(at.x + (hash(i * 6.1) - 0.5) * 80 + Math.sin(t * 2 + i) * 8, surface - 10 - t * 60, 14 + 36 * k, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** Shards of ice and a little frost cloud bursting from where the rope last slipped off. */
function drawIcePuff(ctx: CanvasRenderingContext2D, sim: Sim) {
  if (!sim.slip) return
  const age = sim.time - sim.slip.time
  if (age > ICE_PUFF_SECS) return
  const k = age / ICE_PUFF_SECS
  const { at } = sim.slip
  ctx.fillStyle = `rgba(235, 248, 255, ${0.55 * (1 - k)})`
  ctx.beginPath()
  ctx.arc(at.x, at.y, 8 + 30 * Math.sqrt(k), 0, Math.PI * 2)
  ctx.fill()

  for (let i = 0; i < 14; i++) {
    const angle = hash(i * 3.9 + 0.5) * Math.PI * 2
    const speed = 120 + hash(i * 7.3) * 260
    const x = at.x + Math.cos(angle) * speed * age
    const y = at.y + Math.sin(angle) * speed * age + 0.5 * 900 * age * age
    const size = (3 + hash(i * 1.9) * 3.5) * (1 - 0.5 * k)
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle + age * 8)
    ctx.fillStyle = `rgba(${i % 3 ? 255 : 170}, ${i % 3 ? 255 : 225}, 255, ${1 - k})`
    ctx.beginPath()
    ctx.moveTo(0, -size)
    ctx.lineTo(size * 0.5, 0)
    ctx.lineTo(0, size)
    ctx.lineTo(-size * 0.5, 0)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
}

/** The short cord holding the ninja to a struck gong, in the headband's red; it sags while slack. */
function drawGongCord(ctx: CanvasRenderingContext2D, from: Vec, to: Vec) {
  const length = GONG_CORD_LENGTH
  const span = Math.hypot(to.x - from.x, to.y - from.y)
  const sag = Math.sqrt(Math.max(0, length * length - span * span)) * 0.5
  ctx.strokeStyle = '#e63946'
  ctx.lineWidth = 2.5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.quadraticCurveTo((from.x + to.x) / 2, (from.y + to.y) / 2 + sag, to.x, to.y)
  ctx.stroke()
}

function drawHookHead(ctx: CanvasRenderingContext2D, p: Vec) {
  ctx.fillStyle = '#f5e2b8'
  ctx.beginPath()
  ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
  ctx.fill()
}

/** Snowflakes drifting down behind everything, with a little parallax. */
function drawSnow(ctx: CanvasRenderingContext2D, cam: Camera, w: number, h: number, time: number) {
  const parallax = 0.3
  const halfW = w / 2 / cam.zoom
  const halfH = h / 2 / cam.zoom
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  for (const s of SNOW) {
    const x = ((((s.x - cam.pos.x * parallax + Math.sin(time * 0.7 + s.y) * 12) % 3000) + 3000) % 3000) - 1500
    const y = ((((s.y + time * s.fall - cam.pos.y * parallax) % 2000) + 2000) % 2000) - 1000
    if (Math.abs(x) > halfW + 4 || Math.abs(y) > halfH + 4) continue
    ctx.beginPath()
    ctx.arc(x, y, s.r, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** Glossy streaks across an ice surface, clipped to its outline. */
function drawIceSheen(ctx: CanvasRenderingContext2D, poly: Poly, colour: string) {
  const xs = poly.pts.map((p) => p.x)
  const ys = poly.pts.map((p) => p.y)
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  ctx.save()
  ctx.clip()
  ctx.strokeStyle = colour
  ctx.lineWidth = 4
  ctx.beginPath()
  for (let x = minX - (maxY - minY); x < maxX; x += 90) {
    ctx.moveTo(x, maxY)
    ctx.lineTo(x + (maxY - minY), minY)
  }
  ctx.stroke()
  ctx.restore()
}

/** A layer of snow or moss along the upward-facing edges of rock and wood. */
function drawCaps(ctx: CanvasRenderingContext2D, poly: Poly, colour: string) {
  ctx.strokeStyle = colour
  ctx.lineWidth = 6
  ctx.lineCap = 'round'
  ctx.beginPath()
  poly.pts.forEach((a, i) => {
    if (poly.edgeNormals[i].y > -0.5) return
    const b = poly.pts[(i + 1) % poly.pts.length]
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
  })
  ctx.stroke()
}

/** A pole planted at `base` flying a red pennant that flutters. */
function drawFlag(ctx: CanvasRenderingContext2D, base: Vec, time: number) {
  const top = { x: base.x, y: base.y - 70 }
  ctx.strokeStyle = '#d8d8e0'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(base.x, base.y)
  ctx.lineTo(top.x, top.y)
  ctx.stroke()
  const flutter = Math.sin(time * 6) * 4
  ctx.fillStyle = '#ff4d5e'
  ctx.beginPath()
  ctx.moveTo(top.x, top.y)
  ctx.quadraticCurveTo(top.x + 20, top.y + 4 + flutter, top.x + 42, top.y + 12 + flutter * 0.5)
  ctx.quadraticCurveTo(top.x + 20, top.y + 18 - flutter, top.x, top.y + 26)
  ctx.closePath()
  ctx.fill()
}

/** A dashed racing stripe just inside the top of a launch ramp. */
function drawRampStripe(ctx: CanvasRenderingContext2D, poly: Poly) {
  ctx.strokeStyle = '#ff4d5e'
  ctx.lineWidth = 4
  ctx.setLineDash([26, 18])
  ctx.beginPath()
  let joined = false
  poly.pts.forEach((a, i) => {
    const n = poly.edgeNormals[i]
    if (n.y > -0.3) {
      joined = false
      return
    }
    const b = poly.pts[(i + 1) % poly.pts.length]
    if (!joined) ctx.moveTo(a.x - n.x * 8, a.y - n.y * 8)
    ctx.lineTo(b.x - n.x * 8, b.y - n.y * 8)
    joined = true
  })
  ctx.stroke()
  ctx.setLineDash([])
}

/** A pair of skis under the player, pointing along `dir`, tips turned up at the front. */
function drawSkis(ctx: CanvasRenderingContext2D, pos: Vec, dir: Vec) {
  // Whichever side of the direction of travel is further down, so the skis stay underfoot going either way
  const under = dir.x >= 0 ? { x: -dir.y, y: dir.x } : { x: dir.y, y: -dir.x }
  ctx.lineCap = 'round'
  ctx.lineWidth = 4
  for (const [colour, depth, shift] of [['#c99a1e', RADIUS, -5], ['#ffd23f', RADIUS + 3, 3]] as const) {
    const mid = { x: pos.x + under.x * depth + dir.x * shift, y: pos.y + under.y * depth + dir.y * shift }
    const tail = { x: mid.x - dir.x * 22, y: mid.y - dir.y * 22 }
    const nose = { x: mid.x + dir.x * 18, y: mid.y + dir.y * 18 }
    const tip = { x: nose.x + dir.x * 6 - under.x * 5, y: nose.y + dir.y * 6 - under.y * 5 }
    ctx.strokeStyle = colour
    ctx.beginPath()
    ctx.moveTo(tail.x, tail.y)
    ctx.lineTo(nose.x, nose.y)
    ctx.quadraticCurveTo(nose.x + dir.x * 5, nose.y + dir.y * 5, tip.x, tip.y)
    ctx.stroke()
  }
}

/** A rope's hook on ice shakes more and more as its grip runs out; `held` is the fraction of the grip used. */
function slippingHook(p: Vec, held: number): Vec {
  const shake = Math.max(0, held - 0.3) * 8
  return { x: p.x + Math.sin(held * 40) * shake, y: p.y + Math.cos(held * 33) * shake * 0.5 }
}

/** Each hanging vine, swaying with its swing, with leaves along it; a held brown vine trembles as it's about to snap. Snapped ones fall away. */
function drawVines(ctx: CanvasRenderingContext2D, level: Level, sim: Sim) {
  level.vines.forEach((vine, i) => {
    const { angle, snapped } = sim.vines[i]
    const fallen = snapped === null ? 0 : sim.time - snapped
    if (fallen > VINE_FALL_SECS) return
    ctx.save()
    if (snapped !== null) {
      ctx.globalAlpha = 1 - fallen / VINE_FALL_SECS
      ctx.translate(0, 0.5 * BREAK_FALL_GRAVITY * fallen * fallen)
      ctx.translate(vine.pivot.x, vine.pivot.y)
      ctx.rotate(fallen * (hash(i) - 0.5) * 2)
      ctx.translate(-vine.pivot.x, -vine.pivot.y)
    }
    const rope = sim.rope
    const held = rope && 'vine' in rope.caught && rope.caught.vine === i ? rope : null
    const strain = held?.grip ? Math.max(0, held.age / held.grip - 0.3) * 6 : 0
    drawVine(ctx, vine, angle, strain, sim.time)
    ctx.restore()
  })
}

function drawVine(ctx: CanvasRenderingContext2D, vine: Vine, angle: number, strain: number, time: number) {
  const look = VINE_LOOKS[vine.kind]
  const at = (along: number) => {
    const p = vinePoint(vine, angle, along)
    const wiggle = Math.sin(along * 0.05) * 3 + Math.sin(time * 40 + along * 0.1) * strain
    return { x: p.x + Math.cos(angle) * wiggle, y: p.y - Math.sin(angle) * wiggle }
  }
  ctx.strokeStyle = look.stem
  ctx.lineWidth = vine.kind === 'green' ? 5 : 4.5
  ctx.lineCap = 'round'
  ctx.beginPath()
  for (let along = 0; along <= vine.length; along += 12) {
    const p = at(along)
    if (along === 0) ctx.moveTo(p.x, p.y)
    else ctx.lineTo(p.x, p.y)
  }
  ctx.stroke()

  // Leaves on alternate sides; brown vines have fewer, and knots where they'll give way
  ctx.fillStyle = look.leaf
  const spacing = vine.kind === 'green' ? 34 : 70
  for (let along = 30, side = 1; along < vine.length; along += spacing, side = -side) {
    const p = at(along)
    const dir = angle + side * 0.9 + Math.PI / 2
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(-dir)
    ctx.beginPath()
    ctx.ellipse(0, 9, 4.5, 9, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  if (vine.kind === 'brown') {
    ctx.fillStyle = '#4a3018'
    for (let along = 60; along < vine.length; along += 70) {
      const p = at(along)
      ctx.beginPath()
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

/** Leaves and splinters bursting from where a brown vine snapped under the rope. */
function drawVineSnap(ctx: CanvasRenderingContext2D, sim: Sim) {
  if (!sim.slip) return
  const age = sim.time - sim.slip.time
  if (age > VINE_SNAP_BURST_SECS) return
  const k = age / VINE_SNAP_BURST_SECS
  const { at } = sim.slip
  for (let j = 0; j < 14; j++) {
    const angle = hash(j * 3.1 + 0.5) * Math.PI * 2
    const speed = 100 + hash(j * 5.7) * 220
    ctx.save()
    ctx.translate(at.x + Math.cos(angle) * speed * age, at.y + Math.sin(angle) * speed * age + 0.5 * 700 * age * age)
    ctx.rotate(angle + age * 9)
    ctx.globalAlpha = 1 - k
    ctx.fillStyle = j % 3 ? VINE_LOOKS.brown.leaf : '#e8d2a0'
    ctx.beginPath()
    ctx.ellipse(0, 0, j % 3 ? 3 : 1.5, j % 3 ? 6 : 7, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

/** A tree trunk from its top down past the river, with bark lines; purely background. */
function drawTrunk(ctx: CanvasRenderingContext2D, { x, top, width }: Level['trunks'][number], level: Level) {
  const bottom = level.deathY + 300
  const bark = ctx.createLinearGradient(x - width / 2, 0, x + width / 2, 0)
  bark.addColorStop(0, '#2a1c12')
  bark.addColorStop(0.35, '#4b3423')
  bark.addColorStop(1, '#1f150d')
  ctx.fillStyle = bark
  ctx.fillRect(x - width / 2, top, width, bottom - top)
  ctx.strokeStyle = 'rgba(15, 8, 4, 0.45)'
  ctx.lineWidth = 3
  ctx.beginPath()
  for (let i = 1; i < 4; i++) {
    const lx = x - width / 2 + (width * i) / 4
    for (let y = top; y < bottom; y += 120) {
      const wobble = (hash(lx + y) - 0.5) * width * 0.15
      ctx.moveTo(lx + wobble, y)
      ctx.lineTo(lx - wobble, y + 90)
    }
  }
  ctx.stroke()
}

/** Speckles of lighter green inside a canopy clump, as if sunlight were coming through the leaves. */
function drawLeafDapples(ctx: CanvasRenderingContext2D, poly: Poly) {
  const xs = poly.pts.map((p) => p.x)
  const ys = poly.pts.map((p) => p.y)
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  ctx.save()
  ctx.clip()
  for (let x = minX; x < maxX; x += 34) {
    for (let y = minY; y < maxY; y += 30) {
      const n = hash(x * 0.37 + y * 1.13)
      ctx.fillStyle = n > 0.6 ? 'rgba(150, 220, 90, 0.35)' : 'rgba(10, 40, 10, 0.25)'
      ctx.beginPath()
      ctx.ellipse(x + n * 20, y + hash(x + y) * 18, 10 + n * 8, 7 + n * 5, n * 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

/** Far-off trunks with a little parallax, and shafts and specks of sunlight that shimmer through the canopy. */
function drawCanopyLight(ctx: CanvasRenderingContext2D, cam: Camera, w: number, h: number, time: number) {
  const halfW = w / 2 / cam.zoom
  const halfH = h / 2 / cam.zoom
  const parallax = 0.3
  const spacing = 380
  ctx.fillStyle = 'rgba(20, 50, 28, 0.55)'
  const shift = cam.pos.x * parallax
  for (let i = Math.floor((shift - halfW) / spacing) - 1; i * spacing < shift + halfW + spacing; i++) {
    const width = 40 + hash(i * 2.1) * 50
    ctx.fillRect(i * spacing + hash(i * 5.3) * 200 - shift - width / 2, -halfH, width, halfH * 2)
  }

  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  for (let i = 0; i < 5; i++) {
    const x = ((((hash(i * 9.1) * 2400 - cam.pos.x * 0.15) % 2400) + 2400) % 2400) - 1200
    const shimmer = 0.04 + 0.03 * Math.sin(time * 0.6 + i * 1.7)
    const beam = ctx.createLinearGradient(0, -halfH, 0, halfH)
    beam.addColorStop(0, `rgba(255, 250, 190, ${shimmer * 2})`)
    beam.addColorStop(1, 'rgba(255, 250, 190, 0)')
    ctx.fillStyle = beam
    ctx.beginPath()
    ctx.moveTo(x - 40, -halfH)
    ctx.lineTo(x + 50, -halfH)
    ctx.lineTo(x + 50 + halfH * 0.7, halfH)
    ctx.lineTo(x - 90 + halfH * 0.7, halfH)
    ctx.closePath()
    ctx.fill()
  }
  for (const s of DAPPLES) {
    const x = ((((s.x - cam.pos.x * 0.5) % 3000) + 3000) % 3000) - 1500
    const y = ((((s.y - cam.pos.y * 0.5) % 2000) + 2000) % 2000) - 1000
    if (Math.abs(x) > halfW + 20 || Math.abs(y) > halfH + 20) continue
    ctx.fillStyle = `rgba(230, 255, 170, ${0.06 + 0.06 * Math.sin(time * 1.3 + s.x)})`
    ctx.beginPath()
    ctx.arc(x, y, s.r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

/** For jungle levels: a murky river flowing past, with ripples and leaves carried downstream. */
function drawRiver(ctx: CanvasRenderingContext2D, level: Level, cam: Camera, w: number, h: number, time: number) {
  const left = cam.pos.x - w / 2 / cam.zoom - 20
  const right = cam.pos.x + w / 2 / cam.zoom + 20
  const bottom = cam.pos.y + h / 2 / cam.zoom + 20
  if (bottom < level.deathY - 20) return

  const surface = (x: number) => level.deathY + Math.sin(x * 0.01 - time * 1.5) * 4 + Math.sin(x * 0.027 - time * 2.1) * 2
  const grad = ctx.createLinearGradient(0, level.deathY - 10, 0, level.deathY + 220)
  grad.addColorStop(0, '#9fc38a')
  grad.addColorStop(0.08, '#3d6b4a')
  grad.addColorStop(1, '#14291c')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.moveTo(left, Math.max(bottom, level.deathY + 40))
  const step = 24
  for (let x = Math.floor(left / step) * step; x <= right + step; x += step) ctx.lineTo(x, surface(x))
  ctx.lineTo(right + step, Math.max(bottom, level.deathY + 40))
  ctx.closePath()
  ctx.fill()

  // Streaks and leaves drift with the current
  const spacing = 180
  const drift = time * 70
  for (let i = Math.floor((left - drift) / spacing) - 1; i * spacing + drift < right; i++) {
    const x = i * spacing + drift + hash(i * 3.3) * spacing * 0.5
    const depth = 14 + hash(i * 1.9) * 60
    ctx.strokeStyle = 'rgba(200, 230, 190, 0.25)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x, surface(x) + depth)
    ctx.lineTo(x + 40 + hash(i * 6.1) * 40, surface(x) + depth)
    ctx.stroke()
    if (hash(i * 7.7) < 0.4) continue
    ctx.fillStyle = hash(i * 8.3) < 0.5 ? '#6cb83f' : '#b08040'
    ctx.beginPath()
    ctx.ellipse(x, surface(x) + 1, 7, 3, 0.3, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** A bumper's lit core, blazing white with a ring spreading from it just after it kicks the player. */
function drawBumperLight(ctx: CanvasRenderingContext2D, poly: Poly, bump: { time: number } | undefined, time: number) {
  const centre = scale(poly.pts.reduce(add), 1 / poly.pts.length)
  const flash = bump ? Math.max(0, 1 - (time - bump.time) / BUMP_FLASH_SECS) : 0
  ctx.fillStyle = BUMPER_LOOK.core
  ctx.globalAlpha = 0.55 + 0.45 * flash
  ctx.beginPath()
  poly.pts.forEach((p, i) => {
    const inner = add(centre, scale(sub(p, centre), 0.55 + 0.15 * flash))
    if (i === 0) ctx.moveTo(inner.x, inner.y)
    else ctx.lineTo(inner.x, inner.y)
  })
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 1
  if (!flash) return
  ctx.strokeStyle = `rgba(255, 240, 250, ${0.8 * flash})`
  ctx.lineWidth = 4
  ctx.beginPath()
  poly.pts.forEach((p, i) => {
    const outer = add(centre, scale(sub(p, centre), 1 + 0.6 * (1 - flash)))
    if (i === 0) ctx.moveTo(outer.x, outer.y)
    else ctx.lineTo(outer.x, outer.y)
  })
  ctx.closePath()
  ctx.stroke()
}

/** Each flipper as a rounded paddle at its current angle, with a cap over its pivot. */
function drawFlippers(ctx: CanvasRenderingContext2D, level: Level, sim: Sim) {
  ctx.lineCap = 'round'
  level.flippers.forEach((flipper, i) => {
    const angle = flipperAngle(flipper, sim.flips[i], sim.time)
    const tip = add(flipper.pivot, scale({ x: Math.cos(angle), y: Math.sin(angle) }, flipper.length))
    for (const [colour, width] of [[FLIPPER_LOOK.stroke, FLIPPER_RADIUS * 2 + 3], [FLIPPER_LOOK.fill, FLIPPER_RADIUS * 2 - 3]] as const) {
      ctx.strokeStyle = colour
      ctx.lineWidth = width
      ctx.beginPath()
      ctx.moveTo(flipper.pivot.x, flipper.pivot.y)
      ctx.lineTo(tip.x, tip.y)
      ctx.stroke()
    }
    ctx.fillStyle = '#ff2f9a'
    ctx.beginPath()
    ctx.arc(flipper.pivot.x, flipper.pivot.y, 4, 0, Math.PI * 2)
    ctx.fill()
  })
}

/**
 * Chevrons pointing the way each launcher fires, chasing outwards while it waits; while it holds the player they light
 * one by one as it charges, then all blaze as it fires.
 */
function drawLaunchers(ctx: CanvasRenderingContext2D, level: Level, sim: Sim, time: number) {
  level.launchers.forEach((launcher, i) => {
    const rest = launcherRest(launcher.at)
    const launch = sim.launch?.launcher === i ? sim.launch : null
    const held = launch ? sim.time - launch.caught : 0
    const chevrons = 5
    const charge = launch && !launch.fired ? held / LAUNCHER_HOLD_SECS : 0
    const blaze = launch?.fired ? Math.max(0, 1 - (held - LAUNCHER_HOLD_SECS) / LAUNCH_FLASH_SECS) : 0
    const across = { x: -launcher.aim.y, y: launcher.aim.x }
    ctx.lineWidth = 5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (let c = 0; c < chevrons; c++) {
      const chase = (time * 2.5 - c / chevrons) % 1 < 0.25 ? 1 : 0
      const lit = launch ? Math.max(charge * chevrons > c ? 1 : 0, blaze) : 0.25 + 0.6 * chase
      const at = add(rest, scale(launcher.aim, 70 + c * 34))
      const back = add(at, scale(launcher.aim, -16))
      ctx.strokeStyle = `rgba(255, ${Math.round(200 - 120 * lit)}, ${Math.round(80 + 100 * lit)}, ${0.25 + 0.75 * lit})`
      ctx.beginPath()
      ctx.moveTo(back.x + across.x * 11, back.y + across.y * 11)
      ctx.lineTo(at.x, at.y)
      ctx.lineTo(back.x - across.x * 11, back.y - across.y * 11)
      ctx.stroke()
    }
    // A glow in the cup, brightening as it charges
    const glow = ctx.createRadialGradient(rest.x, rest.y, 0, rest.x, rest.y, 50)
    glow.addColorStop(0, `rgba(255, 220, 100, ${0.25 + 0.6 * Math.max(charge, blaze)})`)
    glow.addColorStop(1, 'rgba(255, 120, 60, 0)')
    ctx.fillStyle = glow
    ctx.fillRect(rest.x - 50, rest.y - 50, 100, 100)
  })
}

/** Rows of round and arrow-shaped lamps set into the playfield behind everything, blinking in chases, with a little parallax. */
function drawPlayfieldLights(ctx: CanvasRenderingContext2D, cam: Camera, w: number, h: number, time: number) {
  const parallax = 0.35
  const halfW = w / 2 / cam.zoom
  const halfH = h / 2 / cam.zoom
  const spacing = 150
  const colours = ['255, 60, 200', '54, 224, 255', '255, 220, 80', '120, 255, 140']
  const shift = { x: cam.pos.x * parallax, y: cam.pos.y * parallax }
  for (let i = Math.floor((shift.x - halfW) / spacing) - 1; i * spacing < shift.x + halfW + spacing; i++) {
    for (let j = Math.floor((shift.y - halfH) / spacing) - 1; j * spacing < shift.y + halfH + spacing; j++) {
      const n = hash(i * 7.3 + j * 13.1)
      if (n < 0.55) continue
      const x = i * spacing + hash(i * 3.7 + j) * 60 - shift.x
      const y = j * spacing + hash(j * 5.9 + i) * 60 - shift.y
      const on = (time * 1.6 + i * 0.13 + j * 0.29) % 1 < 0.3
      ctx.fillStyle = `rgba(${colours[Math.floor(n * 97) % colours.length]}, ${on ? 0.45 : 0.1})`
      ctx.beginPath()
      if (n > 0.85) {
        ctx.moveTo(x, y - 14)
        ctx.lineTo(x + 10, y + 8)
        ctx.lineTo(x - 10, y + 8)
        ctx.closePath()
      } else {
        ctx.arc(x, y, 7 + n * 5, 0, Math.PI * 2)
      }
      ctx.fill()
    }
  }
}

/** For pinball levels: a dark drain across the bottom, its glowing edge marked with arrows that flash downwards. */
function drawDrain(ctx: CanvasRenderingContext2D, level: Level, cam: Camera, w: number, h: number, time: number) {
  const left = cam.pos.x - w / 2 / cam.zoom - 20
  const right = cam.pos.x + w / 2 / cam.zoom + 20
  const bottom = cam.pos.y + h / 2 / cam.zoom + 20
  if (bottom < level.deathY - 60) return
  const top = level.deathY
  const pit = ctx.createLinearGradient(0, top, 0, top + 200)
  pit.addColorStop(0, '#2a0630')
  pit.addColorStop(1, '#020006')
  ctx.fillStyle = pit
  ctx.fillRect(left, top, right - left, Math.max(bottom, top + 40) - top)
  ctx.strokeStyle = '#ff2f9a'
  ctx.shadowColor = '#ff2f9a'
  ctx.shadowBlur = 14
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(left, top)
  ctx.lineTo(right, top)
  ctx.stroke()
  ctx.shadowBlur = 0

  const spacing = 160
  for (let i = Math.floor(left / spacing); i * spacing < right; i++) {
    const x = i * spacing + spacing / 2
    for (let k = 0; k < 3; k++) {
      const lit = (time * 3 - k / 3) % 1 < 0.34
      const y = top - 70 + k * 18
      ctx.strokeStyle = `rgba(255, 80, 120, ${lit ? 0.75 : 0.15})`
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(x - 12, y)
      ctx.lineTo(x, y + 10)
      ctx.lineTo(x + 12, y)
      ctx.stroke()
    }
  }
}

function hash(n: number): number {
  const s = Math.sin(n * 12.9898) * 43758.5453
  return s - Math.floor(s)
}
