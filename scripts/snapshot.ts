// Screenshots scripted game states (debug/scenario.html) at landscape phone sizes using the installed Chrome.
// Usage: npm run snapshot [-- <filter>]   e.g. `npm run snapshot -- bend` for just the bend scenarios
import { mkdir, readdir } from 'node:fs/promises'
import { withBrowser } from './browser.ts'

const OUT_DIR = 'snapshots'

const SCENARIOS = [
  { name: 'start', query: '' },
  { name: 'hook-flying', query: 'ang=-1.2&secs=0.08' },
  { name: 'swing', query: 'ang=-1.1&reel=-120&secs=2' },
  { name: 'bend', query: 'ang=-0.9&reel=-120&secs=8&until=bend' },
  ...(await levelIds()).map((id) => ({ name: `overview-${id}`, query: `level=${id}&overview` })),
]

const VIEWPORTS = [
  { name: 'phone', width: 844, height: 390 },
  { name: 'small-phone', width: 667, height: 375 },
]

const filter = process.argv[2] ?? ''
await mkdir(OUT_DIR, { recursive: true })

await withBrowser(async (browser, baseUrl) => {
  for (const scenario of SCENARIOS.filter((s) => s.name.includes(filter))) {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 })
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(e.message))
      await page.goto(`${baseUrl}debug/scenario.html?${scenario.query}`)
      await page.waitForFunction(() => document.body.dataset.summary, null, { timeout: 10_000 })
      const summary = await page.evaluate(() => document.body.dataset.summary)
      const file = `${OUT_DIR}/${scenario.name}-${vp.name}.png`
      await page.screenshot({ path: file })
      console.log(`${file}  ${summary}${errors.length ? `  ERRORS: ${errors.join('; ')}` : ''}`)
      await page.close()
    }
  }
})

/** Level ids from the level files' names, e.g. src/levels/1-2.ts → "1-2". */
async function levelIds() {
  const files = await readdir('src/levels')
  return files.filter((f) => /^\d+-\d+\.ts$/.test(f)).map((f) => f.replace('.ts', ''))
}
