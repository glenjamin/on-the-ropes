// Screenshots scripted game states (debug/scenario.html) at phone sizes using the installed Chrome.
// Usage: npm run snapshot [-- <filter>]   e.g. `npm run snapshot -- bend` for just the bend scenarios
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright-core'
import { createServer } from 'vite'

const OUT_DIR = 'snapshots'

const SCENARIOS = [
  { name: 'start', query: '' },
  { name: 'hook-flying', query: 'ang=-1.2&secs=0.08' },
  { name: 'swing', query: 'ang=-1.1&pump=0.6&secs=1.2' },
  { name: 'bend', query: 'ang=-1&pump=1&secs=4&until=bend' },
]

const VIEWPORTS = [
  { name: 'landscape', width: 844, height: 390 },
  { name: 'portrait', width: 390, height: 844 },
]

const filter = process.argv[2] ?? ''
await mkdir(OUT_DIR, { recursive: true })

const server = await createServer({ server: { port: 0, host: '127.0.0.1' }, logLevel: 'error' })
await server.listen()
const base = server.resolvedUrls?.local[0]
if (!base) throw new Error('vite did not report a URL')

const browser = await chromium.launch({ channel: 'chrome' })
try {
  for (const scenario of SCENARIOS.filter((s) => s.name.includes(filter))) {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 })
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(e.message))
      await page.goto(`${base}debug/scenario.html?${scenario.query}`)
      await page.waitForFunction(() => document.body.dataset.summary, null, { timeout: 10_000 })
      const summary = await page.evaluate(() => document.body.dataset.summary)
      const file = `${OUT_DIR}/${scenario.name}-${vp.name}.png`
      await page.screenshot({ path: file })
      console.log(`${file}  ${summary}${errors.length ? `  ERRORS: ${errors.join('; ')}` : ''}`)
      await page.close()
    }
  }
} finally {
  await browser.close()
  await server.close()
}
