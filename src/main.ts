import { add, dist, len, scale, sub, type Vec } from './geom'
import { buildLevel } from './level'
import { render, zoomFor, type Camera } from './render'
import { RADIUS, Sim } from './sim'

const SUBSTEP = 1 / 240
const MAX_FRAME = 0.1
const DRAG_REEL = 1.5
const PUMP_DEADZONE = 14
const PUMP_FULL = 70
const KEY_REEL_SPEED = 450
const RESPAWN_DELAY = 0.7
const BEST_KEY = 'on-the-ropes:best'

type Phase = 'play' | 'dead' | 'won'

const canvas = el('game', HTMLCanvasElement)
const ctx = canvas.getContext('2d')!
const timeEl = el('time', HTMLElement)
const bestEl = el('best', HTMLElement)
const overlay = el('overlay', HTMLElement)

const level = buildLevel()
const sim = new Sim(level)
const cam: Camera = { pos: { ...level.start }, zoom: 1 }

let phase: Phase = 'play'
let phaseTime = 0
let runTime = 0
let running = false
let best = loadBest()
let clock = 0
let accumulator = 0

const pointer = { id: null as number | null, lastY: 0, startX: 0, pump: 0, reel: 0 }
const keys = new Set<string>()

resize()
addEventListener('resize', resize)
showBest()

canvas.addEventListener('pointerdown', (e) => {
  if (pointer.id !== null) return
  if (phase === 'won') {
    if (phaseTime > 0.6) restart()
    return
  }
  if (phase !== 'play') return
  pointer.id = e.pointerId
  pointer.lastY = e.clientY
  pointer.startX = e.clientX
  pointer.pump = 0
  canvas.setPointerCapture(e.pointerId)
  sim.fire(sub(screenToWorld(e.clientX, e.clientY), sim.pos))
  running = true
})

canvas.addEventListener('pointermove', (e) => {
  if (e.pointerId !== pointer.id) return
  pointer.reel += ((e.clientY - pointer.lastY) / cam.zoom) * DRAG_REEL
  pointer.lastY = e.clientY
  const dx = e.clientX - pointer.startX
  pointer.pump = Math.abs(dx) < PUMP_DEADZONE ? 0 : Math.max(-1, Math.min(1, (dx - Math.sign(dx) * PUMP_DEADZONE) / PUMP_FULL))
})

for (const type of ['pointerup', 'pointercancel'] as const) {
  canvas.addEventListener(type, (e) => {
    if (e.pointerId !== pointer.id) return
    pointer.id = null
    pointer.pump = 0
    sim.release()
  })
}

addEventListener('keydown', (e) => {
  keys.add(e.key.toLowerCase())
  if (e.key.toLowerCase() === 'r') restart()
})
addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()))
el('restart', HTMLElement).addEventListener('click', restart)

requestAnimationFrame(frame)

function frame(now: number) {
  const t = now / 1000
  const dt = Math.min(MAX_FRAME, clock ? t - clock : 0)
  clock = t
  phaseTime += dt

  if (phase === 'play') update(dt)
  else if (phase === 'dead' && phaseTime > RESPAWN_DELAY) respawn()

  followCamera(dt)
  render(ctx, canvas.width / devicePixelRatio, canvas.height / devicePixelRatio, cam, level, sim, t)
  timeEl.textContent = runTime.toFixed(2)
  requestAnimationFrame(frame)
}

function update(dt: number) {
  const keyPump = (keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0)
  const keyReel = (keys.has('s') || keys.has('arrowdown') ? 1 : 0) - (keys.has('w') || keys.has('arrowup') ? 1 : 0)
  sim.reel(pointer.reel + keyReel * KEY_REEL_SPEED * dt)
  pointer.reel = 0
  const pump = Math.max(-1, Math.min(1, pointer.pump + keyPump))

  accumulator += dt
  while (accumulator >= SUBSTEP) {
    sim.step(SUBSTEP, pump)
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
  pointer.id = null
  pointer.pump = 0
  respawn()
  cam.pos = { ...level.start }
}

function followCamera(dt: number) {
  const lead = scale(sim.vel, 0.25)
  const leadLen = len(lead)
  const target = add(sim.pos, leadLen > 220 ? scale(lead, 220 / leadLen) : lead)
  const halfH = canvas.height / devicePixelRatio / 2 / cam.zoom
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
  cam.zoom = zoomFor(w, h)
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
  try {
    const v = parseFloat(localStorage.getItem(BEST_KEY) ?? '')
    return Number.isFinite(v) ? v : null
  } catch {
    return null
  }
}

function saveBest(v: number) {
  try {
    localStorage.setItem(BEST_KEY, String(v))
  } catch {
    // Storage unavailable (private mode etc.); best only lasts this session.
  }
}

function el<T extends HTMLElement>(id: string, type: new () => T): T {
  const node = document.getElementById(id)
  if (!(node instanceof type)) throw new Error(`missing #${id}`)
  return node
}
