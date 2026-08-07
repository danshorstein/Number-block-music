import { expect, test, type Page } from '@playwright/test'

/**
 * Fill the Staircase is the one challenge with a fixed answer — always 1 through 8 —
 * so it is the one that can be driven end to end without knowing the seed.
 *
 * The rules being pinned here are F14's: a wrong block never lands, a wrong answer
 * costs nothing, and stars only ever go up.
 */

/** The staircase asks for the active pitch set, which now defaults to the pentatonic. */
const STAIRCASE = [1, 2, 3, 5, 6]

async function openStaircase(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Tap to start' }).click()
  await expect(page.getByRole('button', { name: 'Tap to start' })).toBeHidden({ timeout: 30_000 })
  await page.getByRole('button', { name: 'Challenges' }).click()
  await page.getByRole('button', { name: /Fill the Staircase/ }).click()
  await expect(page.getByRole('button', { name: 'Play it again' })).toBeVisible()
}

const tapDegree = (page: Page, degree: number) =>
  page.getByRole('button', { name: `Degree ${degree}`, exact: true }).click()

test('a wrong block does not land on the strip', async ({ page }) => {
  await openStaircase(page)

  // The staircase starts at 1, so 5 is wrong and must be refused.
  await tapDegree(page, 5)
  await page.waitForTimeout(400)
  await expect(page.getByRole('button', { name: /degree 5/ })).toHaveCount(0)

  // And the round is still open for the right answer.
  await tapDegree(page, 1)
  await page.waitForTimeout(300)
  await expect(page.getByRole('button', { name: 'Degree 2', exact: true })).toBeVisible()
})

test('completing a round earns a star, and finishing three returns to the list', async ({
  page,
}) => {
  await openStaircase(page)

  for (let round = 1; round <= 3; round++) {
    for (const degree of STAIRCASE) {
      await tapDegree(page, degree)
      await page.waitForTimeout(90)
    }
    await expect(page.getByLabel(`${round} of 3 stars`)).toBeVisible({ timeout: 10_000 })
    await page.waitForTimeout(1700)
  }

  // Three rounds done, back to the challenge list with the stars kept.
  await expect(page.getByRole('button', { name: /Echo Me/ })).toBeVisible({ timeout: 10_000 })
})

test('stars survive a reload', async ({ page }) => {
  await openStaircase(page)
  for (const degree of STAIRCASE) {
    await tapDegree(page, degree)
    await page.waitForTimeout(90)
  }
  await expect(page.getByLabel('1 of 3 stars')).toBeVisible({ timeout: 10_000 })

  await page.reload()
  await page.getByRole('button', { name: 'Tap to start' }).click()
  await expect(page.getByRole('button', { name: 'Tap to start' })).toBeHidden({ timeout: 30_000 })
  await page.getByRole('button', { name: 'Challenges' }).click()

  await expect(page.getByRole('button', { name: /Fill the Staircase/ })).toBeVisible()
  await expect(page.getByLabel('1 of 3 stars')).toBeVisible()
})

test('challenges never show a rest pad, since a rest is never the answer', async ({ page }) => {
  await openStaircase(page)
  await expect(page.getByRole('button', { name: 'Rest', exact: true })).toHaveCount(0)
})
