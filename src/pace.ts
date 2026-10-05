import type { Sim } from './sim'

/** The game's fixed physics step, in game seconds. */
export const SUBSTEP = 1 / 240
/** Game time runs slower than real time, giving players longer to read each swing. */
export const TIME_SCALE = 0.8

/** The rope always reels in while attached; with momentum kept, that is what builds a swing. */
const AUTO_REEL_SPEED = 200
/** Reeling starts this fast and eases down to the steady speed. */
const AUTO_REEL_BURST = 450
/** Seconds of game time to ease from the burst down to the steady speed. */
const AUTO_REEL_EASE = 1.5

/** Advances the sim by one physics step, reeling the rope in as play does. */
export function playStep(sim: Sim) {
  sim.step(SUBSTEP, -autoReelSpeed(sim.rope?.age ?? 0))
}

function autoReelSpeed(ropeAge: number): number {
  const remaining = 1 - Math.min(1, ropeAge / AUTO_REEL_EASE)
  return AUTO_REEL_SPEED + (AUTO_REEL_BURST - AUTO_REEL_SPEED) * remaining * remaining
}
