import { chromium, type Browser } from 'playwright-core'
import { createServer } from 'vite'

/** Runs `fn` against a fresh Vite dev server and the installed Chrome, tearing both down after. */
export async function withBrowser(fn: (browser: Browser, baseUrl: string) => Promise<void>) {
  const server = await createServer({ server: { port: 0, host: '127.0.0.1' }, logLevel: 'error' })
  await server.listen()
  const baseUrl = server.resolvedUrls?.local[0]
  if (!baseUrl) throw new Error('vite did not report a URL')
  const browser = await chromium.launch({ channel: 'chrome' })
  try {
    await fn(browser, baseUrl)
  } finally {
    await browser.close()
    await server.close()
  }
}
