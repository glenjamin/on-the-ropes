import { add, dist, len, scale, sub, type Vec } from './geom'
import { buildLevel, type Level } from './level'
import { LEVELS, SETS } from './levels'
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
/** After dying, the death plays out before its overlay appears, then the level restarts. */
const DEATH_CARD_DELAY = 1
const RESPAWN_DELAY = 2
const PLUMMET_GRAVITY = 4000
/** Pause after striking the gong before the result card appears, so the impact is seen. */
const WIN_CARD_DELAY = 1
/** Best time per level id; a level counts as completed once it has one. */
const PROGRESS_KEY = 'on-the-ropes:progress'
const LAST_LEVEL_KEY = 'on-the-ropes:last-level'
/** Matches the CSS that covers the game with a rotate prompt; play pauses while it shows. */
const PORTRAIT_TOUCH = matchMedia('(orientation: portrait) and (pointer: coarse)')

type Phase = 'play' | 'dead' | 'won' | 'menu'

const canvas = el('game', HTMLCanvasElement)
const ctx = canvas.getContext('2d')!
const timeEl = el('time', HTMLElement)
const bestEl = el('best', HTMLElement)
const overlay = el('overlay', HTMLElement)
const levelNameEl = el('level-name', HTMLElement)

const progress = loadProgress()
let levelIndex = 0
let level: Level = buildLevel(LEVELS[0])
let sim = new Sim(level)
const cam: Camera = { pos: { ...level.start }, zoom: 1 }
// Lets scripted browser checks (scripts/e2e.ts) read game state during development
if (import.meta.env.DEV) {
  window.game = {
    get sim() {
      return sim
    },
    cam,
  }
}

let phase: Phase = 'play'
let phaseTime = 0
let runTime = 0
let running = false
let clock = 0
/** The result card, waiting to be shown once the gong has had its moment. */
let pendingWinCard: string | null = null
/** Where the player fell into lava, for the splash and sinking animation. */
let lavaDeathAt: Vec | null = null
let accumulator = 0

/** Recent player positions, oldest first, for the motion trail. */
const trail: { p: Vec; t: number }[] = []
const tapRings: { at: Vec; t: number }[] = []
/** Zoom for this screen size before any speed-based zoom-out. */
let baseZoom = 1

resize()
addEventListener('resize', resize)
loadLevel(initialLevelIndex())

// Stops iOS treating presses as text selection (the magnifier) or double-tap zoom; pointer events still fire
canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false })

// Taps alternate: fire at the tapped point, then let go
canvas.addEventListener('pointerdown', (e) => {
  enterFullscreen()
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
el('levels', HTMLElement).addEventListener('click', showMenu)
// Buttons on the win screen and level menu say what they do with data attributes
overlay.addEventListener('click', (e) => {
  const button = e.target instanceof HTMLElement ? e.target.closest('button') : null
  if (!button) return
  const { action, level: index } = button.dataset
  if (action === 'retry') restart()
  else if (action === 'next') loadLevel(levelIndex + 1)
  else if (action === 'menu') showMenu()
  else if (action === 'back') resume()
  else if (index !== undefined) loadLevel(Number(index))
})

requestAnimationFrame(frame)

function frame(now: number) {
  const t = now / 1000
  const dt = Math.min(MAX_FRAME, clock ? t - clock : 0)
  clock = t
  phaseTime += dt

  if (phase === 'play' && !PORTRAIT_TOUCH.matches) update(dt)
  else if (phase === 'won') {
    stepSim(dt)
    if (pendingWinCard && phaseTime > WIN_CARD_DELAY) {
      showOverlay(pendingWinCard, { dim: false })
      pendingWinCard = null
    }
  } else if (phase === 'dead') {
    // Falling into lava stops where it lands; falling out of the sky plummets away into the fog
    if (level.theme !== 'lava') plummet(dt)
    if (phaseTime > DEATH_CARD_DELAY && !overlay.classList.contains('show')) {
      showOverlay(level.theme === 'lava' ? '<h1>Toasted</h1>' : '<h1>Lost in the clouds</h1>')
    }
    if (phaseTime > RESPAWN_DELAY) respawn()
  }

  followCamera(dt)
  trail.push({ p: { ...sim.pos }, t })
  while (trail.length && t - trail[0].t > TRAIL_SECS) trail.shift()
  while (tapRings.length && t - tapRings[0].t > TAP_RING_SECS) tapRings.shift()
  const fx = {
    trail: trail.map((s) => s.p),
    tapRings: tapRings.map((r) => ({ at: r.at, age: t - r.t })),
    lavaDeath: lavaDeathAt ? { at: lavaDeathAt, age: phaseTime } : undefined,
  }
  render(ctx, canvas.width / devicePixelRatio, canvas.height / devicePixelRatio, cam, level, sim, fx, t)
  timeEl.textContent = runTime.toFixed(2)
  requestAnimationFrame(frame)
}

function update(dt: number) {
  stepSim(dt)
  if (running) runTime += dt

  if (sim.pos.y + RADIUS > level.deathY) die()
  else if (dist(sim.pos, level.goal.pos) < level.goal.radius + RADIUS) win()
}

function die() {
  phase = 'dead'
  phaseTime = 0
  sim.release()
  if (level.theme === 'lava') lavaDeathAt = { x: sim.pos.x, y: level.deathY - RADIUS }
}

function respawn() {
  sim.reset()
  pendingWinCard = null
  lavaDeathAt = null
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
  sim.catchOnGong()
  const previous = progress[level.id]
  const isBest = previous === undefined || runTime < previous
  if (isBest) {
    progress[level.id] = runTime
    writeStored(PROGRESS_KEY, JSON.stringify(progress))
    showBest()
  }
  const hasNext = levelIndex + 1 < LEVELS.length
  pendingWinCard = `<div>
    <h1>${runTime.toFixed(2)}s</h1>
    <p>${isBest ? 'New best!' : `Best ${progress[level.id].toFixed(2)}s`}</p>
    <div class="actions">
      <button class="btn" data-action="retry">Retry</button>
      ${hasNext ? '<button class="btn primary" data-action="next">Next level</button>' : '<button class="btn primary" data-action="menu">Levels</button>'}
    </div>
  </div>`
}

function loadLevel(index: number) {
  levelIndex = index
  level = buildLevel(LEVELS[index])
  sim = new Sim(level)
  writeStored(LAST_LEVEL_KEY, level.id)
  levelNameEl.textContent = `${level.id}  ${level.name}`
  showBest()
  restart()
}

/** Lists levels grouped into their sets; a level unlocks once the one before it is completed. */
function showMenu() {
  if (phase === 'play') running = false
  const resumable = phase === 'play'
  phase = 'menu'
  const rows = SETS.map((set) => {
    const buttons = set.levels.map((l) => {
      const i = LEVELS.indexOf(l)
      const best = progress[l.id]
      const locked = i > 0 && progress[LEVELS[i - 1].id] === undefined
      return `<button class="level-btn" data-level="${i}" ${locked ? 'disabled' : ''}>
        <strong>${l.id}</strong><span>${l.name}</span><small>${locked ? 'Locked' : best === undefined ? '—' : `${best.toFixed(2)}s`}</small>
      </button>`
    })
    return `<h2>${set.name}</h2><div class="set">${buttons.join('')}</div>`
  })
  const back = resumable ? '<div class="actions"><button class="btn" data-action="back">Back</button></div>' : ''
  showOverlay(`<div class="menu">${rows.join('')}${back}</div>`)
}

function resume() {
  phase = 'play'
  running = sim.rope !== null || runTime > 0
  hideOverlay()
}

function initialLevelIndex(): number {
  const wanted = new URLSearchParams(location.search).get('level') ?? readStored(LAST_LEVEL_KEY)
  const index = LEVELS.findIndex((l) => l.id === wanted)
  return index === -1 ? 0 : index
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
  target.y = Math.min(target.y, level.deathY + 120 - halfH)
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

/** After falling out of the sky: drop ever faster, past the speed limit and through anything below. */
function plummet(dt: number) {
  sim.vel.y += PLUMMET_GRAVITY * dt * TIME_SCALE
  sim.pos = add(sim.pos, scale(sim.vel, dt * TIME_SCALE))
}

function stepSim(dt: number) {
  accumulator += dt * TIME_SCALE
  while (accumulator >= SUBSTEP) {
    sim.step(SUBSTEP, -autoReelSpeed(sim.rope?.age ?? 0))
    accumulator -= SUBSTEP
  }
}

/** Covers the game with a message; `dim: false` leaves the game visible around a card instead. */
function showOverlay(html: string, { dim = true } = {}) {
  overlay.innerHTML = html
  overlay.classList.toggle('clear', !dim)
  overlay.classList.add('show')
}

function hideOverlay() {
  overlay.classList.remove('show')
}

function showBest() {
  const best = progress[level.id]
  bestEl.textContent = best === undefined ? '' : `Best ${best.toFixed(2)}`
}

function loadProgress(): Record<string, number> {
  try {
    const raw: unknown = JSON.parse(readStored(PROGRESS_KEY) ?? '{}')
    if (typeof raw !== 'object' || raw === null) return {}
    return Object.fromEntries(Object.entries(raw).filter((e): e is [string, number] => typeof e[1] === 'number'))
  } catch {
    return {}
  }
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
