---
name: kids-audio-pwa
description: Build and ship a child-facing, offline-capable web app with real sampled audio — from a requirements doc through to a live URL on a phone. Use this whenever the user wants a learning app, music/ear-training app, or any touch-first web app aimed at young children; whenever Web Audio, Tone.js or sampled instruments are involved; whenever a PWA has to install to a home screen or work offline; whenever audio works on desktop but is silent or hangs on an iPhone; whenever a GitHub Pages deploy shows a blank white screen or silently serves an old build; and whenever a project needs printable real-world artifacts (key stickers, charts, notation) that must come out at true physical scale. Reach for it even if the user only describes the idea ("an app to teach my kid X") without naming any of this.
---

# Shipping an audio web app for a small child

The goal is a thing a child opens on a phone and enjoys within two minutes — not a
tech demo. That framing decides most arguments: latency matters more than features,
motion matters more than content, and an app that is silent on the one device in the
house is a total failure however good the code is.

This skill is the accumulated scar tissue from doing it. Most of the traps below are
invisible in development and only appear on a real iPhone or a real printer.

## Work in this order

1. **Read the spec for its load-bearing idea.** A good requirements doc usually has one
   claim everything else rests on. Find it, state it back, and let it settle design
   arguments later. Note the author's own kill criterion if they wrote one — building
   past it wastes work.
2. **Verify the risky assumptions before planning**, not after. Are the audio samples
   actually reachable and licensed? Does the toolchain install? Cheap to check, and it
   changes the plan when it fails.
3. **Ship the smallest thing a child can react to**, then stop and test on the child.
   Everything downstream is gated on that reaction.
4. **Look at the pixels.** Screenshot the built app at every viewport it will be used
   at. Tests pass while a UI is visibly broken — this happens constantly, and the only
   defense is looking.
5. **Deploy early.** A build that only runs on your machine hasn't been tested.

## The traps that cost the most time

### iOS Safari will not start audio from `pointerdown`

This is the single most expensive bug in this domain, and it presents as "works
everywhere except the iPhone."

iOS grants user activation when the finger **lifts**. `pointerdown` derives from
`touchstart` and does not qualify, so `AudioContext.resume()` (and therefore
`Tone.start()`) never settles — it does not reject, it just hangs. Calling
`preventDefault()` on that handler makes it worse by suppressing the click that would
have granted activation.

So: **unlock audio from a `click` handler.** Every *other* control should stay on
`pointerdown`, because a perceptible gap between finger and sound breaks the illusion —
and that is safe, since audio is already unlocked by then.

Read `references/web-audio-ios.md` before writing any audio startup code. It covers the
silent-switch problem, why every await in the startup path needs a timeout, and how to
make failures visible on a phone with no console attached.

### Never leave an unbounded `await` in a startup path

Audio libraries build their context at import time, before any gesture exists. On iOS,
`resume()` against such a context can stay pending forever rather than rejecting. Any
`await` that can hang will eventually strand a user on a loading animation with nothing
on screen explaining why, and no way forward.

Bound every await, surface the failure with the URL and status code that caused it, and
allow a retry. A context that will not start is survivable; an infinite spinner is not.

### Vendor the audio; do not load it from a CDN

Offline play and "no network calls after load" are normal requirements for a kid's app,
and they are incompatible with runtime CDN fetches. Commit the samples and let the
service worker precache them. A megabyte or two is fine for a one-time install.

Pitch-shifting from a handful of real samples beats a synth: sample every 3 semitones
or so, so nothing shifts more than a minor third and the tone stays honest.

### A CSS reset outside `@layer base` silently kills your utilities

In Tailwind v4 (and any layered-CSS setup) **unlayered rules outrank every layered
one.** A plain `button { background: none; border: 0 }` therefore beats `bg-*` and
`border-*` utilities, and buttons render invisible while every test still passes.

Put resets inside `@layer base`. If a background or border mysteriously does nothing,
check this first.

### `hidden` loses to any author `display`

The `hidden` attribute is only a rule in the browser's own stylesheet, so
`display: flex` from your CSS outranks it and the element stays visible. A splash you
"hid" renders anyway, and every test still passes because the element is genuinely in
the DOM with the attribute set. Conditionally render it, or set `display: none`
yourself.

This is the same failure as the layer problem above, and worth internalising as one
idea: **specificity and cascade order beat intent, silently.** When something visual
does nothing and the code looks right, suspect the cascade before the logic.

### SVG `width`/`height` attributes reject `calc()`

They take plain lengths. Size SVGs through `style` instead. The failure is silent
except for a console warning, and the element renders at its intrinsic size — which
usually means an icon bursting out of its button.

### Touch-target arithmetic decides the layout

Six-year-old fingers want ~60px, not the adult 44px. Do the multiplication early:
*N items × 60px* against the actual viewport width. Eight items need 480px, and a phone
in portrait has ~390px.

When it doesn't fit, prefer **landscape-first with a wordless rotate nudge** over
breaking a meaningful row into two. Splitting a sequence into two rows usually destroys
whatever the row was teaching. Also give every item an equally large hit area — the
smallest item is often the one tapped most.

### Design for no reading at all

If the child reads haltingly, every control is a pictogram and all text lives in a
gated grown-up area. Gate it behind press-and-hold: trivially defeatable is fine, it
only has to survive an exploring thumb.

## Making it feel alive

Motion is the retention mechanic, not decoration. Squash on tap, spring on land, a
reaction when a thing sounds. Be generous — for this audience juice *is* the product.
Respect `prefers-reduced-motion` by calming animation rather than removing it.

Keep visual state honest: if a thing "sings" while playing, make sure the singing stops.
Latching a transient state on forever is an easy bug to write and an easy one to miss.

## Structure that keeps this testable

Split **pure rules** from the **imperative shell**:

- Pure modules hold the domain logic — scales, colors, generated puzzles, layout maths.
  Fast to test, no mocking.
- A thin audio/DOM shell does the side effects.

Seed any randomness through an injected function so generated content is reproducible in
tests.

Some constraints cannot be checked by any browser available to CI — the iOS activation
rule above is the canonical example, since Chromium accepts `pointerdown` happily and a
browser test would pass while real Safari stayed mute. A small **source-level test**
asserting the constraint is justified there. Use this sparingly and explain why in the
test, or it reads as brittle nonsense to the next person.

Also test the things a domain expert would notice: that generated music divides into
whole measures, that a puzzle is solvable, that a printed artifact's dimensions are
right. Those are real defects, not cosmetics.

## Deploying, and the two failure modes

Read `references/pwa-deploy.md` before configuring the build. In short:

- For a project site the app lives at a **subpath**, and the bundler `base`, the PWA
  `scope`, and `start_url` must all agree on it. Disagreement ships a blank white page.
- The service worker will serve the previous build once after an update. When a user
  says "I don't see my changes," check the deploy actually ran *before* blaming cache.
- CI can stop running entirely — no runs of any kind, no failure to notice. Merges then
  land and never publish. `scripts/publish.sh` is a bundled fallback that builds and
  pushes to a `gh-pages` branch without CI.

## Real-world artifacts

For a learning tool, the printed bridge to the physical object is often the highest-
leverage deliverable in the whole project — it is what turns an app into an interface
to the real instrument or thing.

Anything that must match a physical object has to print at true scale, which browsers
will happily ruin. Read `references/print-at-true-scale.md` for the calibration-ruler
technique and the print CSS that survives a print dialog.

Build print pages as a **second entry point in the same project**, not as separate
static files, so they import the same tokens as the app. If the palette changes, the
paper changes with it — a sticker that no longer matches the screen breaks the exact
link it existed to create.

## Bundled resources

- `references/web-audio-ios.md` — audio startup that survives iOS: activation, the
  silent switch, bounded awaits, visible diagnostics. Read before writing audio code.
- `references/pwa-deploy.md` — base paths, service-worker staleness, GitHub Pages, and
  what to do when CI stops running.
- `references/print-at-true-scale.md` — millimetre-accurate print output and calibration.
- `scripts/publish.sh` — build and publish to `gh-pages` without CI.
