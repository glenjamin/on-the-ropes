import { add, dist, len, scale, sub, type Vec } from './geom'
import { buildLevel } from './level'
import { cameraFocus, render, TAP_RING_SECS, zoomFor, type Camera } from './render'
import { RADIUS, Sim } from './sim'

const SUBSTEP = 1 / 240
/** Game time runs slower than real time, giving players longer to read each swing. */
const TIME_SCALE = 0.8
const MAX_FRAME = 0.1
/** The rope always reels in while attached; with momentum kept, that is what builds a swing. */
const AUTO_REEL_SPEED = 200
/** Reeling starts this fast and eases down to the steady speed. */
const AUTO_REEL_BURST = 450
/** Seconds of game time to ease from the burst down to the steady speed. */
const AUTO_REEL_EASE = 1.5
const TRAIL_SECS = 1.8
/** The camera zooms out by up to this fraction as the player speeds up, so fast flights show more ahead. */
const SPEED_ZOOM_OUT = 0.13
/** Speed (game units/s) at which the camera is fully zoomed out. */
const SPEED_ZOOM_FULL = 700
const RESPAWN_DELAY = 0.7
const BEST_KEY = 'on-the-ropes:best'
/** Matches the CSS that covers the game with a rotate prompt; play pauses while it shows. */
const PORTRAIT_TOUCH = matchMedia('(orientation: portrait) and (pointer: coarse)')

type Phase = 'play' | 'dead' | 'won'

const canvas = el('game', HTMLCanvasElement)
const ctx = canvas.getContext('2d')!
const timeEl = el('time', HTMLElement)
const bestEl = el('best', HTMLElement)
const overlay = el('overlay', HTMLElement)

const level = buildLevel()
const sim = new Sim(level)
const cam: Camera = { pos: { ...level.start }, zoom: 1 }
// Lets scripted browser checks (scripts/e2e.ts) read game state during development
if (import.meta.env.DEV) window.game = { sim, cam }

let phase: Phase = 'play'
let phaseTime = 0
let runTime = 0
let running = false
let best = loadBest()
let clock = 0
let accumulator = 0

/** Recent player positions, oldest first, for the motion trail. */
const trail: { p: Vec; t: number }[] = []
const tapRings: { at: Vec; t: number }[] = []
/** Zoom for this screen size before any speed-based zoom-out. */
let baseZoom = 1

resize()
cam.pos = cameraFocus(level.start, innerHeight, cam.zoom)
addEventListener('resize', resize)
showBest()

// Stops iOS treating presses as text selection (the magnifier) or double-tap zoom; pointer events still fire
canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false })

// Taps alternate: fire at the tapped point, then let go
canvas.addEventListener('pointerdown', (e) => {
  enterFullscreen()
  if (phase === 'won') {
    if (phaseTime > 0.6) restart()
    return
  }
  if (phase !== 'play') return
  tapRings.push({ at: screenToWorld(e.clientX, e.clientY), t: performance.now() / 1000 })
  if (sim.rope || sim.hook) {
    sim.release()
    return
  }
  sim.fire(sub(screenToWorld(e.clientX, e.clientY), sim.pos))
  running = true
})

addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'r') restart()
})
el('restart', HTMLElement).addEventListener('click', restart)

requestAnimationFrame(frame)

function frame(now: number) {
  const t = now / 1000
  const dt = Math.min(MAX_FRAME, clock ? t - clock : 0)
  clock = t
  phaseTime += dt

  if (phase === 'play' && !PORTRAIT_TOUCH.matches) update(dt)
  else if (phase === 'dead' && phaseTime > RESPAWN_DELAY) respawn()

  followCamera(dt)
  trail.push({ p: { ...sim.pos }, t })
  while (trail.length && t - trail[0].t > TRAIL_SECS) trail.shift()
  while (tapRings.length && t - tapRings[0].t > TAP_RING_SECS) tapRings.shift()
  const fx = { trail: trail.map((s) => s.p), tapRings: tapRings.map((r) => ({ at: r.at, age: t - r.t })) }
  render(ctx, canvas.width / devicePixelRatio, canvas.height / devicePixelRatio, cam, level, sim, fx, t)
  timeEl.textContent = runTime.toFixed(2)
  requestAnimationFrame(frame)
}

function update(dt: number) {
  accumulator += dt * TIME_SCALE
  while (accumulator >= SUBSTEP) {
    sim.step(SUBSTEP, -autoReelSpeed(sim.rope?.age ?? 0))
    accumulator -= SUBSTEP
  }
  if (running) runTime += dt

  if (sim.pos.y + RADIUS > level.lavaY) die()
  else if (dist(sim.pos, level.goal.pos) < level.goal.radius + RADIUS) win()
}

function die() {
  phase = 'dead'
  phaseTime = 0
  sim.release()
  showOverlay('<h1>Toasted</h1>')
}

function respawn() {
  sim.reset()
  trail.length = 0
  phase = 'play'
  phaseTime = 0
  runTime = 0
  running = false
  accumulator = 0
  hideOverlay()
}

function win() {
  phase = 'won'
  phaseTime = 0
  running = false
  sim.release()
  const isBest = best === null || runTime < best
  if (isBest) {
    best = runTime
    saveBest(runTime)
    showBest()
  }
  showOverlay(`<div><h1>${runTime.toFixed(2)}s</h1><p>${isBest ? 'New best!' : `Best ${best!.toFixed(2)}s`}</p><p>Tap to go again</p></div>`)
}

function restart() {
  respawn()
  cam.pos = cameraFocus(level.start, innerHeight, cam.zoom)
}

function followCamera(dt: number) {
  const zoomOut = SPEED_ZOOM_OUT * Math.min(1, len(sim.vel) / SPEED_ZOOM_FULL)
  cam.zoom += (baseZoom * (1 - zoomOut) - cam.zoom) * (1 - Math.exp(-dt / 0.35))
  const lead = scale(sim.vel, 0.25)
  const leadLen = len(lead)
  const viewH = canvas.height / devicePixelRatio
  const target = cameraFocus(add(sim.pos, leadLen > 220 ? scale(lead, 220 / leadLen) : lead), viewH, cam.zoom)
  const halfH = viewH / 2 / cam.zoom
  target.y = Math.min(target.y, level.lavaY + 120 - halfH)
  const k = 1 - Math.exp(-5 * dt)
  cam.pos = add(cam.pos, scale(sub(target, cam.pos), k))
}

function resize() {
  const w = innerWidth
  const h = innerHeight
  canvas.width = Math.round(w * devicePixelRatio)
  canvas.height = Math.round(h * devicePixelRatio)
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
  baseZoom = zoomFor(w, h)
  cam.zoom = baseZoom
}

/** Hides browser UI and locks landscape where supported (Android); iPhone needs Add to Home Screen instead. */
function enterFullscreen() {
  if (!document.fullscreenEnabled || document.fullscreenElement) return
  document.documentElement
    .requestFullscreen({ navigationUI: 'hide' })
    .then(() => lockLandscape())
    .catch(() => {})
}

function lockLandscape() {
  // Some browsers allow fullscreen but don't implement orientation locking
  try {
    screen.orientation.lock('landscape').catch(() => {})
  } catch {}
}

function autoReelSpeed(ropeAge: number): number {
  const remaining = 1 - Math.min(1, ropeAge / AUTO_REEL_EASE)
  return AUTO_REEL_SPEED + (AUTO_REEL_BURST - AUTO_REEL_SPEED) * remaining * remaining
}

function screenToWorld(x: number, y: number): Vec {
  return {
    x: cam.pos.x + (x - innerWidth / 2) / cam.zoom,
    y: cam.pos.y + (y - innerHeight / 2) / cam.zoom,
  }
}

function showOverlay(html: string) {
  overlay.innerHTML = html
  overlay.classList.add('show')
}

function hideOverlay() {
  overlay.classList.remove('show')
}

function showBest() {
  bestEl.textContent = best === null ? '' : `Best ${best.toFixed(2)}`
}

function loadBest(): number | null {
  const v = parseFloat(readStored(BEST_KEY) ?? '')
  return Number.isFinite(v) ? v : null
}

function saveBest(v: number) {
  writeStored(BEST_KEY, String(v))
}

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage unavailable (private mode etc.); the value only lasts this session.
  }
}

declare global {
  interface Window {
    game?: { sim: Sim; cam: Camera }
  }
}

function el<T extends HTMLElement>(id: string, type: new () => T): T {
  const node = document.getElementById(id)
  if (!(node instanceof type)) throw new Error(`missing #${id}`)
  return node
}
