// Plays the real game page with mouse input in the installed Chrome and checks the controls behave.
// Usage: npm run e2e
import assert from 'node:assert/strict'
import type { BrowserContextOptions, Page } from 'playwright-core'
import { withBrowser } from './browser.ts'

const LANDSCAPE: BrowserContextOptions = { viewport: { width: 844, height: 390 } }
const PORTRAIT_PHONE: BrowserContextOptions = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }

/** Name, check, and the device to run it on (a landscape desktop window by default). */
const CHECKS: [string, (page: Page) => Promise<void>, BrowserContextOptions?][] = [
  [
    'a tap fires towards the tapped point, and the rope stays after lifting the finger',
    async (page) => {
      const start = await state(page)
      await tap(page, start.screenX + 150, start.screenY - 150)
      await page.waitForTimeout(400)
      const after = await state(page)
      assert.ok(after.rope, 'rope should be attached')
      assert.ok(after.rope.anchor.y < start.pos.y, 'rope should grab above the player')
      assert.ok(after.rope.anchor.x > start.pos.x, 'rope should grab to the right')
    },
  ],
  [
    'tapping up and left fires up and to the left',
    async (page) => {
      const start = await state(page)
      await tap(page, start.screenX - 150, start.screenY - 150)
      await page.waitForTimeout(400)
      const after = await state(page)
      assert.ok(after.rope, 'rope should be attached')
      assert.ok(after.rope.anchor.y < start.pos.y, 'rope should grab above the player')
      assert.ok(after.rope.anchor.x < start.pos.x, 'rope should grab to the left')
    },
  ],
  [
    'tapping below the player fires downward',
    async (page) => {
      const start = await state(page)
      await tap(page, start.screenX + 60, start.screenY + 60)
      await page.waitForTimeout(200)
      const after = await state(page)
      assert.ok(after.rope, 'rope should grab the platform')
      assert.ok(after.rope.anchor.y > start.pos.y, 'rope should grab below the player')
    },
  ],
  [
    'the rope reels itself in, quickly at first then easing to a steady pull',
    async (page) => {
      // A full-length start leaves room to watch the whole ease before the rope bottoms out
      await page.evaluate(() => {
        if (window.game) window.game.sim.startLength = 1
      })
      const start = await state(page)
      await tap(page, start.screenX + 100, start.screenY - 150)
      const rate = async (gapMs: number) => {
        const a = await state(page)
        await page.waitForTimeout(gapMs)
        const b = await state(page)
        assert.ok(a.rope && b.rope, 'rope should stay attached')
        return (a.rope.length - b.rope.length) / (b.rope.age - a.rope.age)
      }
      await page.waitForTimeout(150)
      const early = await rate(150)
      await page.waitForTimeout(800)
      const late = await rate(300)
      assert.ok(late > 0, `rope should keep reeling in (late rate ${late.toFixed(0)})`)
      assert.ok(early > late * 1.2, `reeling should ease off (early ${early.toFixed(0)}, late ${late.toFixed(0)})`)
    },
  ],
  [
    'any press while roped lets go, even a long one, and the next tap fires again',
    async (page) => {
      const start = await state(page)
      await tap(page, start.screenX + 100, start.screenY - 150)
      await page.waitForTimeout(400)
      assert.ok((await state(page)).rope, 'rope should be attached')

      await page.mouse.down()
      await page.waitForTimeout(500)
      const held = await state(page)
      await page.mouse.up()
      assert.equal(held.rope, null, 'pressing should let go straight away')
      assert.equal(held.hookFlying, false, 'letting go should not fire a new rope')

      const free = await state(page)
      await tap(page, free.screenX - 100, free.screenY - 150)
      await page.waitForTimeout(400)
      assert.ok((await state(page)).rope, 'the next tap should fire a new rope')
    },
  ],
  [
    'a new player starts on 1-1; finishing it records a time and unlocks the next level',
    async (page) => {
      await page.evaluate(() => localStorage.clear())
      await page.goto(page.url().split('?')[0])
      await page.waitForFunction(() => window.game)
      assert.match(await page.textContent('#level-name') ?? '', /^1-1/)
      await page.click('#levels')
      assert.ok(await page.isDisabled('.level-btn[data-level="1"]'), '1-2 should start locked')
      await page.click('text=Back')

      // Drop the player onto the goal rather than playing the level through
      await page.evaluate(() => {
        if (window.game) window.game.sim.pos = { x: 5750, y: 560 }
      })
      await page.click('text=Next level')
      assert.match(await page.textContent('#level-name') ?? '', /^1-2/)
      await page.click('#levels')
      assert.ok(await page.isEnabled('.level-btn[data-level="1"]'), '1-2 should now be unlocked')
      assert.match(await page.textContent('.level-btn[data-level="0"]') ?? '', /\d+\.\d\ds/)
    },
  ],
  [
    'held in portrait, a phone shows the rotate prompt and taps do nothing',
    async (page) => {
      assert.ok(await page.isVisible('#rotate'), 'rotate prompt should show')
      await page.touchscreen.tap(195, 300)
      await page.waitForTimeout(300)
      const after = await state(page)
      assert.equal(after.rope, null, 'no rope should attach')
      assert.equal(after.hookFlying, false, 'no rope should fire')
      assert.equal(await page.textContent('#time'), '0.00', 'the timer should not start')
    },
    PORTRAIT_PHONE,
  ],
]

let failures = 0
await withBrowser(async (browser, baseUrl) => {
  for (const [name, check, device] of CHECKS) {
    const context = await browser.newContext(device ?? LANDSCAPE)
    const page = await context.newPage()
    // Checks tap relative to the player, so any level with ceiling and floor near the start works
    await page.goto(`${baseUrl}?level=1-2`)
    await page.waitForFunction(() => window.game)
    try {
      await check(page)
      console.log(`✓ ${name}`)
    } catch (e) {
      failures++
      console.log(`✗ ${name}\n    ${e instanceof Error ? e.message : String(e)}`)
    }
    await context.close()
  }
})
process.exitCode = failures ? 1 : 0

async function tap(page: Page, x: number, y: number) {
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.waitForTimeout(50)
  await page.mouse.up()
}

function state(page: Page) {
  return page.evaluate(() => {
    const game = window.game
    if (!game) throw new Error('window.game missing; is this a dev build?')
    const { sim, cam } = game
    const rope = sim.rope && { length: sim.rope.length, age: sim.rope.age, anchor: { ...sim.rope.anchors[0].p } }
    return {
      pos: { ...sim.pos },
      screenX: (sim.pos.x - cam.pos.x) * cam.zoom + innerWidth / 2,
      screenY: (sim.pos.y - cam.pos.y) * cam.zoom + innerHeight / 2,
      rope,
      hookFlying: sim.hook !== null,
    }
  })
}
