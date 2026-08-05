import { expect, test } from '@playwright/test'

/**
 * The splash must never be a dead end.
 *
 * The original build awaited Tone.Sampler's onload/onerror pair and Tone.start() with
 * no timeout on either. When neither settled — which is what an iPhone did — the app
 * sat on its loading animation forever with nothing on screen to say why. These tests
 * pin the two properties that make that impossible: failures surface, and they name
 * what broke.
 */

test.describe('when the piano samples cannot load', () => {
  test('says so instead of animating forever', async ({ page }) => {
    await page.route('**/audio/piano/*.mp3', (route) => route.fulfill({ status: 404 }))

    await page.goto('/')
    await page.getByRole('button', { name: 'Tap to start' }).click()

    await expect(page.getByText(/Audio could not start/)).toBeVisible({ timeout: 30_000 })
  })

  test('names the file and the status code', async ({ page }) => {
    await page.route('**/audio/piano/*.mp3', (route) => route.fulfill({ status: 404 }))

    await page.goto('/')
    await page.getByRole('button', { name: 'Tap to start' }).click()

    await expect(page.getByText(/audio\/piano\/.*\.mp3 returned HTTP 404/)).toBeVisible({
      timeout: 30_000,
    })
  })

  test('lets you try again once the samples come back', async ({ page }) => {
    await page.route('**/audio/piano/*.mp3', (route) => route.fulfill({ status: 503 }))

    await page.goto('/')
    await page.getByRole('button', { name: 'Tap to start' }).click()
    await expect(page.getByText(/Audio could not start/)).toBeVisible({ timeout: 30_000 })

    // A failed attempt must not be cached as the permanent answer.
    await page.unroute('**/audio/piano/*.mp3')
    await page.getByRole('button', { name: 'Tap to start' }).click()

    await expect(page.getByRole('button', { name: 'Degree 1', exact: true })).toBeVisible({
      timeout: 30_000,
    })
  })
})
