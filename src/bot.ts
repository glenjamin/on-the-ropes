// A bot that plays levels the way a person could: it taps points on terrain it can see, with human reaction
// gaps and coarse timing, and searches for a route by keeping a few promising positions after each move.
import { add, dist, dot, norm, sub, type Vec } from './geom'
import type { Level } from './level'
import { playStep, SUBSTEP, TIME_SCALE } from './pace'
import { HOOK_RANGE, RADIUS, Sim } from './sim'

/** One tap to fire at `target`, a tap to let go after `hold`, then `fly` before the next tap. Real seconds. */
export type Move = { target: Vec; hold: number; fly: number }

export type Route = {
  solved: boolean
  moves: Move[]
  /** Real seconds the route takes to play. */
  duration: number
  /** For an unsolved level, how close the bot got to the gong, and where it was. */
  closest: number
  stuckAt: Vec
}

const HOLDS = [0.2, 0.4, 0.6, 0.9, 1.2, 1.6, 2.1]
/** Gaps between letting go and the next tap; the shortest is about as quick as a person re-taps. */
const FLIES = [0.15, 0.35, 0.6]
const TARGETS_PER_MOVE = 6
const BEAM_WIDTH = 8
const MAX_MOVES = 60
/** Roughly what's on screen around the player in landscape, given the camera framing. */
const VIEW = { side: 680, above: 480, below: 170 }

type Outcome = 'won' | 'dead' | 'playing'
type Node = { sim: Sim; moves: Move[]; duration: number; score: number }

/** How far off a person's taps can be: aim in world units, timing in seconds. */
export type Wobble = { aim: number; timing: number }

/** Each candidate move is also tried this many times with wobble, and kept only if every try survives. */
const WOBBLY_TRIES = 3

/**
 * Searches for a route to the gong. With `wobble`, every move must still work when the taps are a little off,
 * as a person's would be; without it, the route may rely on exact taps.
 */
export function findRoute(level: Level, wobble?: Wobble): Route {
  const random = seeded(1)
  let beam: Node[] = [{ sim: new Sim(level), moves: [], duration: 0, score: progress(new Sim(level), level) }]
  let best = beam[0]
  for (let depth = 0; depth < MAX_MOVES && beam.length; depth++) {
    const next: Node[] = []
    for (const node of beam) {
      for (const target of targetsInView(node.sim, level)) {
        for (const hold of HOLDS) {
          const held = node.sim.clone()
          held.fire(sub(target, held.pos))
          const afterHold = advance(held, level, hold)
          if (afterHold === 'dead') continue
          held.release()
          for (const fly of FLIES) {
            const move = { target, hold, fly }
            const sim = afterHold === 'won' ? held : held.clone()
            const outcome = afterHold === 'won' ? 'won' : advance(sim, level, fly)
            if (outcome === 'dead') continue
            let score = progress(sim, level)
            if (wobble) {
              const tries = Array.from({ length: WOBBLY_TRIES }, () => tryMove(node.sim.clone(), level, wobbled(move, wobble, random)))
              if (tries.some((t) => t.outcome === 'dead')) continue
              score = (score + tries.reduce((sum, t) => sum + t.score, 0)) / (WOBBLY_TRIES + 1)
            }
            const child = { sim, moves: [...node.moves, move], duration: node.duration + hold + fly, score }
            if (outcome === 'won') return route(child, level, true)
            next.push(child)
          }
        }
      }
    }
    beam = mostPromising(next)
    if (beam.length && beam[0].score > best.score) best = beam[0]
  }
  return route(best, level, false)
}

/** Where a route goes when played exactly: the path flown, each rope's firing point and catch, and each let-go. */
export type Trace = { path: Vec[]; grabs: { from: Vec; anchor: Vec | null }[]; releases: Vec[] }

export function traceRoute(level: Level, moves: Move[]): Trace {
  const sim = new Sim(level)
  const trace: Trace = { path: [{ ...sim.pos }], grabs: [], releases: [] }
  const record = (s: Sim) => trace.path.push({ ...s.pos })
  for (const { target, hold, fly } of moves) {
    const from = { ...sim.pos }
    sim.fire(sub(target, sim.pos))
    const afterHold = advance(sim, level, hold, record)
    trace.grabs.push({ from, anchor: sim.rope ? { ...sim.rope.anchors[0].p } : null })
    if (afterHold !== 'playing') return trace
    sim.release()
    trace.releases.push({ ...sim.pos })
    if (advance(sim, level, fly, record) !== 'playing') return trace
  }
  advance(sim, level, 1, record)
  return trace
}

function tryMove(sim: Sim, level: Level, { target, hold, fly }: Move): { outcome: Outcome; score: number } {
  sim.fire(sub(target, sim.pos))
  let outcome = advance(sim, level, hold)
  if (outcome === 'playing') {
    sim.release()
    outcome = advance(sim, level, fly)
  }
  return { outcome, score: outcome === 'won' ? 0 : progress(sim, level) }
}

function wobbled({ target, hold, fly }: Move, wobble: Wobble, random: () => number): Move {
  const angle = random() * Math.PI * 2
  const r = random() * wobble.aim
  const jitter = (t: number) => Math.max(0.12, t + (random() * 2 - 1) * wobble.timing)
  return { target: { x: target.x + Math.cos(angle) * r, y: target.y + Math.sin(angle) * r }, hold: jitter(hold), fly: jitter(fly) }
}

/** Advances by real seconds at the game's pace, stopping early on reaching the gong or dying. */
function advance(sim: Sim, level: Level, seconds: number, onStep?: (sim: Sim) => void): Outcome {
  const steps = Math.round((seconds * TIME_SCALE) / SUBSTEP)
  for (let i = 0; i < steps; i++) {
    playStep(sim)
    onStep?.(sim)
    if (dist(sim.pos, level.goal.pos) < level.goal.radius + RADIUS) return 'won'
    if (sim.pos.y + RADIUS > level.deathY) return 'dead'
  }
  return 'playing'
}

/** Points on visible terrain within the rope's reach, favouring ones towards the gong and above the player. */
function targetsInView(sim: Sim, level: Level): Vec[] {
  const { pos } = sim
  const towardGoal = norm(sub(level.goal.pos, pos))
  const candidates: { p: Vec; appeal: number }[] = []
  for (const poly of level.polys) {
    poly.pts.forEach((a, i) => {
      const b = poly.pts[(i + 1) % poly.pts.length]
      const steps = Math.max(1, Math.ceil(dist(a, b) / 70))
      for (let s = 0; s < steps; s++) {
        const p = add(a, { x: ((b.x - a.x) * s) / steps, y: ((b.y - a.y) * s) / steps })
        const d = sub(p, pos)
        if (Math.abs(d.x) > VIEW.side || d.y < -VIEW.above || d.y > VIEW.below || dist(p, pos) > HOOK_RANGE) continue
        candidates.push({ p, appeal: dot(norm(d), towardGoal) + (d.y < 0 ? 0.4 : 0) })
      }
    })
  }
  candidates.sort((x, y) => y.appeal - x.appeal)
  const chosen: Vec[] = []
  for (const { p } of candidates) {
    if (chosen.length === TARGETS_PER_MOVE) break
    if (chosen.every((c) => dist(c, p) > 150)) chosen.push(p)
  }
  return chosen
}

/** Closer to the gong (allowing for where momentum is taking the player) is better; skimming the death line is not. */
function progress(sim: Sim, level: Level): number {
  const heading = add(sim.pos, { x: sim.vel.x * 0.3, y: sim.vel.y * 0.3 })
  const danger = sim.pos.y > level.deathY - 250 ? 300 : 0
  return -dist(heading, level.goal.pos) - danger
}

/** The best few positions, at most one per patch of the level so the search doesn't crowd into one spot. */
function mostPromising(nodes: Node[]): Node[] {
  nodes.sort((a, b) => b.score - a.score)
  const kept: Node[] = []
  for (const node of nodes) {
    if (kept.length === BEAM_WIDTH) break
    if (kept.every((k) => dist(k.sim.pos, node.sim.pos) > 80)) kept.push(node)
  }
  return kept
}

function route(node: Node, level: Level, solved: boolean): Route {
  return { solved, moves: node.moves, duration: node.duration, closest: dist(node.sim.pos, level.goal.pos), stuckAt: { ...node.sim.pos } }
}

function seeded(seed: number): () => number {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}
