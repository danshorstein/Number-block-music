import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

// Some environments ship a preinstalled Chromium whose build number does not match the
// one this Playwright version expects. Point at it directly rather than downloading a
// second copy; fall back to Playwright's own resolution everywhere else.
const PREINSTALLED_CHROMIUM = '/opt/pw-browsers/chromium'
const launchOptions = existsSync(PREINSTALLED_CHROMIUM)
  ? { executablePath: PREINSTALLED_CHROMIUM }
  : {}

/**
 * The three shapes this actually gets used in. Landscape phone is the tightest — a
 * tower of eight cubes, the strip and the buttons all have to fit in ~390px of height.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'list' : 'html',
  use: {
    baseURL: 'http://localhost:4173/Number-block-music/',
    trace: 'on-first-retry',
    launchOptions,
  },
  // Chromium everywhere: it is the only engine installed here. That means these runs
  // confirm layout and logic but NOT the iOS audio unlock, which is a WebKit behavior
  // and can only really be trusted after a tap on an actual iPhone.
  projects: [
    {
      name: 'phone-landscape',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 844, height: 390 },
        hasTouch: true,
        isMobile: true,
        deviceScaleFactor: 3,
      },
    },
    {
      name: 'tablet-portrait',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
        hasTouch: true,
        deviceScaleFactor: 2,
      },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173',
    url: 'http://localhost:4173/Number-block-music/',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
