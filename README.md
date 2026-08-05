# Music Blocks

A tower of N blocks is scale degree N.

Pitch re-encoded in the visual grammar a six-year-old already reads fluently — counted,
colored, stacked blocks — so he can enter music through a door that is already open.
Full rationale in [`requirements.md`](./requirements.md).

**This is Milestone 1: the sandbox.** It is the kill test from §8.3 — if it doesn't make
him smile in the first two minutes, the concept gets rethought before anything else is
built on top of it.

## What works

| | |
|---|---|
| F1 | Eight towers, degrees 1–8, rainbow-ordered from red |
| F2 | Tap a tower → real piano note, squash-and-stretch, the block sings |
| F3 | Tap-to-append into an 8-slot sequence strip |
| F4 | Play walks the strip left to right, highlighting each block in time |
| F5 | Tap a placed block to remove it; broom clears the strip |
| F6 | Three-speed tempo toggle — chevrons, not a BPM slider |
| F7 | Key selector (C, D, E♭, F, G) in the parent area; C by default |
| F8 | Surprise me — seven nursery melodies, in degrees |
| — | A rest pad, so silence is expressible and the tunes phrase correctly |
| — | PWA: installs to the home screen, plays offline, no network calls after load |

Not built yet: the challenges (F9–F14), the print-at-home piano stickers, and the
teacher one-pager. Those are Milestone 2 and 3, and they wait on him liking this.

## Running it

```bash
npm install
npm run dev
```

| Command | Does |
|---|---|
| `npm run build` | Typecheck and production build |
| `npm test` | Unit tests — scale math, colors, melody data |
| `npm run test:e2e` | Playwright smoke tests at three viewport shapes |
| `npm run icons` | Regenerate the PWA icons |

## Deploying

Pushes to `main` build and publish to GitHub Pages automatically.

**One-time setup:** repo **Settings → Pages → Source: GitHub Actions**. Until that
switch is flipped the workflow runs green and publishes nothing.

The live URL is then `https://danshorstein.github.io/Number-block-music/`. Vite's
`base`, and the PWA `scope` and `start_url`, are all pinned to that subpath — changing
the repo name without changing `BASE` in `vite.config.ts` ships a blank white screen.

## Notes for whoever touches this next

- **The rule is load-bearing.** Taller block = higher pitch, always. Anything that
  breaks the correspondence between height and pitch should be rejected, however
  convenient it looks.
- **`src/music/` is pure and tested; `src/audio/` is the imperative shell.** Keep new
  musical rules on the pure side so they can be tested without mocking Web Audio.
- **All eight colors live in `src/music/colors.ts`.** A full re-skin is a one-file
  change, which is deliberate — see §11 of the requirements.
- **Notes fire on `pointerdown`, never `click`,** and Tone's `lookAhead` is dropped to
  near zero. Latency here is not a polish item; it breaks the metaphor.
- **The tap-to-start splash is required,** not decorative. iOS Safari will not start an
  audio context outside a user gesture — and it must unlock on **`click`, never
  `pointerdown`**. iOS grants user activation when the finger *lifts*, so a pointerdown
  unlock leaves the context suspended and the entire app silent on iPhone while working
  fine in every other browser. `preventDefault()` there makes it worse by suppressing
  the click that would have granted activation. A source-level test guards this,
  because no browser available to CI reproduces it.
- **iOS mutes Web Audio when the ring/silent switch is on** (HTML `<audio>` is exempt,
  Web Audio is not), so the engine declares `navigator.audioSession.type = 'playback'`.
  That API is Safari 16.4+; below that, the switch has to be flipped by hand.
- **Keep the CSS reset inside `@layer base`.** Unlayered rules outrank every layered
  one, so an unlayered `button { background: none }` silently kills Tailwind's `bg-*`
  and `border-*` utilities and the buttons render invisible.
- CI runs Chromium only, so it confirms layout and logic but **not** the iOS audio
  unlock — that one only counts after a tap on a real iPhone.

Sample credits and IP notes: [`ATTRIBUTION.md`](./ATTRIBUTION.md).
