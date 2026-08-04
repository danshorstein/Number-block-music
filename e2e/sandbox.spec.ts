import { expect, test, type Page } from '@playwright/test'

/**
 * The path a six-year-old takes: open it, tap the green button, tap a block, hear it,
 * press play. If any link in that chain breaks the app is dead on arrival, so this is
 * the chain the smoke test walks.
 *
 * Headless Chromium has no audio output, but the sampler still has to load and the
 * transport still has to run — a failure in either surfaces here.
 */

async function start(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Tap to start' }).click()
  await expect(page.getByRole('button', { name: 'Tap to start' })).toBeHidden({ timeout: 30_000 })
}

test('the staircase is all there, degree 1 through degree 8', async ({ page }) => {
  await start(page)
  for (let degree = 1; degree <= 8; degree++) {
    await expect(page.getByRole('button', { name: `Degree ${degree}`, exact: true })).toBeVisible()
  }
  await expect(page.getByRole('button', { name: 'Rest', exact: true })).toBeVisible()
})

test('tapping a tower drops it into the strip, and tapping it again takes it out', async ({
  page,
}) => {
  await start(page)

  await page.getByRole('button', { name: 'Degree 5', exact: true }).click()
  await expect(page.getByRole('button', { name: /Slot 1, degree 5/ })).toBeVisible()

  await page.getByRole('button', { name: 'Degree 3', exact: true }).click()
  await expect(page.getByRole('button', { name: /Slot 2, degree 3/ })).toBeVisible()

  await page.getByRole('button', { name: /Slot 1, degree 5/ }).click()
  // Removing closes the gap, so what was in slot 2 slides down to slot 1.
  await expect(page.getByRole('button', { name: /Slot 1, degree 3/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Slot 2, empty' })).toBeVisible()
})

test('the rest pad puts a silent beat on the strip', async ({ page }) => {
  await start(page)
  await page.getByRole('button', { name: 'Rest', exact: true }).click()
  await expect(page.getByRole('button', { name: /Slot 1, rest/ })).toBeVisible()
})

test('surprise me fills the strip, and play walks it', async ({ page }) => {
  await start(page)

  await page.getByRole('button', { name: 'Surprise me' }).click()
  await expect(page.getByRole('button', { name: 'Slot 1, empty' })).toBeHidden()

  await page.getByRole('button', { name: 'Play' }).click()
  await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible()
  // The run ends on its own and the button goes back to Play.
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible({ timeout: 20_000 })
})

test('clear empties the strip', async ({ page }) => {
  await start(page)
  await page.getByRole('button', { name: 'Surprise me' }).click()
  await page.getByRole('button', { name: 'Clear' }).click()
  await expect(page.getByRole('button', { name: 'Slot 1, empty' })).toBeVisible()
})

test('every control is fully on screen', async ({ page }) => {
  await start(page)
  await page.getByRole('button', { name: 'Surprise me' }).click()

  // Checking real box geometry, not scrollHeight: the root is overflow-hidden, so a
  // control clipped by the bottom edge would still report a clean scrollHeight.
  const clipped = await page.evaluate(() => {
    const offenders: string[] = []
    for (const element of document.querySelectorAll('button, svg')) {
      const box = element.getBoundingClientRect()
      if (box.width === 0 && box.height === 0) continue
      if (
        box.bottom > window.innerHeight + 1 ||
        box.right > window.innerWidth + 1 ||
        box.top < -1 ||
        box.left < -1
      ) {
        const label = element.getAttribute('aria-label') ?? element.tagName
        offenders.push(`${label} @ ${Math.round(box.top)}..${Math.round(box.bottom)}`)
      }
    }
    return offenders
  })
  expect(clipped).toEqual([])
})
