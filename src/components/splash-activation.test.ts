import { describe, expect, it } from 'vitest'
import splashSource from './StartSplash.tsx?raw'

/**
 * A source-level guard, which is unusual — but the thing it protects cannot be checked
 * any other way here.
 *
 * iOS grants user activation on finger-lift, not finger-down. Unlocking audio from
 * pointerdown therefore leaves the context suspended and the whole app silent on
 * iPhone. Every browser available to CI is permissive about this, so a browser test
 * would pass while real Safari stayed mute. The only place the constraint can be
 * enforced automatically is the source itself.
 */

/** Comments explain these very pitfalls by name, so only real code is inspected. */
const code = splashSource.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

describe('start splash activation', () => {
  it('does not unlock audio from a pointerdown handler', () => {
    expect(code).not.toMatch(/onPointerDown/)
  })

  it('unlocks from a click, which iOS treats as a user activation', () => {
    expect(code).toMatch(/onClick=/)
  })

  it('does not call preventDefault, which would suppress that activation', () => {
    expect(code).not.toMatch(/preventDefault/)
  })
})
