// Plays each level with the human-like bot (src/bot.ts): ✓ beatable with slightly-off taps, ~ only with exact taps, ✗ no route found.
// Usage: npm run bot [-- <level id prefix>] [--trace]   e.g. `npm run bot -- 2-` for the cloud levels.
// --trace saves each route to snapshots/route-<id>.json; `npm run snapshot -- route` then draws it over the level.
import { mkdir, writeFile } from 'node:fs/promises'
import { runnerImport } from 'vite'
import type * as Bot from '../src/bot.ts'
import type * as LevelModule from '../src/level.ts'
import type * as Levels from '../src/levels/index.ts'

const WOBBLE = { aim: 25, timing: 0.05 }

const { module: bot } = await runnerImport<typeof Bot>('./src/bot.ts')
const { module: levelModule } = await runnerImport<typeof LevelModule>('./src/level.ts')
const { module: levels } = await runnerImport<typeof Levels>('./src/levels/index.ts')

const args = process.argv.slice(2)
const filter = args.find((a) => !a.startsWith('--')) ?? ''
const saveTraces = args.includes('--trace')
let failed = 0
for (const data of levels.LEVELS.filter((l) => l.id.startsWith(filter))) {
  const level = levelModule.buildLevel(data)
  const started = performance.now()
  const forgiving = bot.findRoute(level, WOBBLE)
  const exact = forgiving.solved ? forgiving : bot.findRoute(level)
  const secs = ((performance.now() - started) / 1000).toFixed(1)
  const label = `${data.id} ${data.name}`
  const solved = forgiving.solved ? forgiving : exact
  if (saveTraces && solved.solved) {
    await mkdir('snapshots', { recursive: true })
    const trace = bot.traceRoute(level, solved.moves)
    await writeFile(`snapshots/route-${data.id}.json`, JSON.stringify({ moves: solved.moves, ...trace }))
  }
  if (forgiving.solved) {
    console.log(`✓ ${label}: ${forgiving.moves.length} grabs, ${forgiving.duration.toFixed(1)}s, every move survives a little wobble (${secs}s)`)
  } else if (exact.solved) {
    console.log(`~ ${label}: only beatable with exact taps; ${exact.moves.length} grabs, ${exact.duration.toFixed(1)}s. With wobble, stuck near ${where(forgiving)} (${secs}s)`)
  } else {
    failed++
    console.log(`✗ ${label}: no route found; got within ${Math.round(exact.closest)} of the gong, stuck near ${where(exact)} (${secs}s)`)
  }
}
process.exitCode = failed ? 1 : 0

function where(route: Bot.Route) {
  return `${Math.round(route.stuckAt.x)},${Math.round(route.stuckAt.y)}`
}
