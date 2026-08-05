/**
 * Renders the app at the three shapes it gets used in, so the look can be judged
 * without running anything. Assumes `npm run preview` is already serving on :4173.
 */

import { chromium } from '@playwright/test'
import { existsSync, mkdirSync } from 'node:fs'

const URL = 'http://localhost:4173/Number-block-music/'
const OUT = 'screenshots'

const SHAPES = [
  { name: 'phone-landscape', width: 844, height: 390, scale: 2 },
  { name: 'tablet-portrait', width: 768, height: 1024, scale: 2 },
  { name: 'desktop', width: 1280, height: 800, scale: 1 },
  { name: 'phone-portrait', width: 390, height: 844, scale: 2 },
]

const preinstalled = '/opt/pw-browsers/chromium'
const browser = await chromium.launch(
  existsSync(preinstalled) ? { executablePath: preinstalled } : {},
)

mkdirSync(OUT, { recursive: true })

for (const shape of SHAPES) {
  const context = await browser.newContext({
    viewport: { width: shape.width, height: shape.height },
    deviceScaleFactor: shape.scale,
  })
  const page = await context.newPage()
  await page.goto(URL)

  // The splash is the first thing anyone sees, so capture it before dismissing.
  await page.waitForTimeout(700)
  await page.screenshot({ path: `${OUT}/${shape.name}-splash.png` })

  // A phone held upright gets the rotate nudge instead of the app — that IS the state
  // worth capturing, and it deliberately swallows taps, so stop here.
  if (await page.locator('.portrait-only').isVisible()) {
    await page.screenshot({ path: `${OUT}/${shape.name}.png` })
    await context.close()
    console.log(`captured ${shape.name} (rotate nudge)`)
    continue
  }

  const start = page.getByRole('button', { name: 'Tap to start' })
  if (await start.isVisible()) {
    await start.click()
    await page.waitForTimeout(2500)
  }

  // Put a real tune on the strip so the skyline reads the way it will in use.
  const surprise = page.getByRole('button', { name: 'Surprise me' })
  if (await surprise.isVisible()) {
    for (let attempt = 0; attempt < 12; attempt++) {
      await surprise.click()
      await page.waitForTimeout(120)
      if (await page.getByRole('button', { name: /Slot 8, degree 8/ }).isVisible()) break
    }
  }
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT}/${shape.name}.png` })

  await context.close()
  console.log(`captured ${shape.name}`)
}

await browser.close()
