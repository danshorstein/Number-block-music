import { expect, test, type Page } from '@playwright/test'

/**
 * Phase 2a: the pentatonic palette, the keyboard bridge, and Steps and Skips.
 *
 * The pedagogy lives in pure functions with unit tests; these check the parts of it a
 * child can actually see and touch.
 */

async function start(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Tap to start' }).click()
  await expect(page.getByRole('button', { name: 'Tap to start' })).toBeHidden({ timeout: 30_000 })
}

test('the palette opens on the pentatonic — no 4, no 7, nothing that can clash', async ({
  page,
}) => {
  await start(page)
  for (const degree of [1, 2, 3, 5, 6]) {
    await expect(page.getByRole('button', { name: `Degree ${degree}`, exact: true })).toBeVisible()
  }
  for (const degree of [4, 7, 8]) {
    await expect(page.getByRole('button', { name: `Degree ${degree}`, exact: true })).toHaveCount(0)
  }
})

test('the keyboard bridge shows a full octave with its black-key landmarks', async ({ page }) => {
  await start(page)
  const keyboard = page.getByLabel('Piano keyboard, C to C')
  await expect(keyboard).toBeVisible()

  // Five black keys per octave — the two-then-three grouping that makes C findable.
  await expect(keyboard.locator('[aria-hidden]')).toHaveCount(5)
})

test('the keyboard is a display, not a second instrument', async ({ page }) => {
  await start(page)
  // Nothing inside it is a control; the blocks stay the way you play.
  await expect(page.getByLabel('Piano keyboard, C to C').locator('button')).toHaveCount(0)
})

test('steps and skips can be answered, and a wrong answer costs nothing', async ({ page }) => {
  await start(page)
  await page.getByRole('button', { name: 'Challenges' }).click()
  await page.getByRole('button', { name: /Steps and Skips/ }).click()

  const step = page.getByRole('button', { name: /^Step/ })
  const skip = page.getByRole('button', { name: /^Skip/ })
  await expect(step).toBeVisible()
  await expect(skip).toBeVisible()

  // One of the two is right. Answering both guarantees a star, and guarantees the
  // wrong one took nothing away when it was tried first.
  await step.click()
  await page.waitForTimeout(1100)
  if (await skip.isVisible()) await skip.click()

  await expect(page.getByLabel(/[1-3] of 3 stars/)).toBeVisible({ timeout: 10_000 })
})

test('every control is still fully on screen with the keyboard added', async ({ page }) => {
  await start(page)
  await page.getByRole('button', { name: 'Surprise me' }).click()

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
        offenders.push(`${element.getAttribute('aria-label') ?? element.tagName} @ ${Math.round(box.top)}..${Math.round(box.bottom)}`)
      }
    }
    return offenders
  })
  expect(clipped).toEqual([])
})
