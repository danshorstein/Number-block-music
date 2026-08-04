# Music Blocks — Product Requirements Document

**Working title:** Music Blocks (naming TBD — see §11)
**Owner:** Dan Shorstein
**Date:** August 4, 2026
**Status:** Draft v1 — for review

---

## 1. Problem

A six-year-old piano student, one year in, with a good teacher. Two failure modes, and the second is downstream of the first:

1. **Practice motivation.** He won't sit at the piano between lessons.
2. **Retention.** He forgets how to read music week over week.

This is not a capability problem. He processes numeric and visual systems fluently — he learned addition, subtraction, and early multiplication from *Numberblocks*, a show that encodes quantity as stacked, color-coded cubes. Standard notation offers his brain nothing to grab: five lines, abstract dots, letter names carrying no ordinal meaning, and no visual encoding of "higher."

**Hypothesis:** If pitch is re-encoded in the visual grammar he already reads fluently — counted, colored, stacked blocks — he can enter music through a door that is already open, then transfer to letter names and notation once the underlying structure is internalized.

---

## 2. Users

| User | Role | Key constraint |
|---|---|---|
| **Primary** — the 6-year-old | Plays it, daily | Reads numbers fluently, reads words haltingly. Design for **no text**. |
| **Secondary** — Dan | Sets it up, plays alongside, watches progress | Wants a 5-minute session, not a screen-time sink |
| **Tertiary** — the piano teacher | Could assign scales the app reinforces | Needs a one-page explainer, not a login |
| **Later** — older brother (bass + piano) | Possible second user | Bass clef / lower register mode is a natural extension |

---

## 3. Goals and non-goals

**Goals (v1)**

- **G1.** He *wants* to open it. Delight is the primary requirement, not curriculum coverage.
- **G2.** Internalize scale degrees 1–8 of a major scale as an ordinal, colored system.
- **G3.** Bind degrees to letter names (in C: C=1, D=2 … C=8) so both languages are acquired together.
- **G4.** Transfer to the physical acoustic piano in the house. **If this fails, the app failed.**
- **G5.** Rewarding in five minutes. Never a chore, never a streak-guilt mechanic.

**Non-goals (v1)** — explicitly deferred, not forgotten

- Standard staff notation (Phase 3)
- Rhythm and note duration as first-class concepts (Phase 2)
- Minor keys, accidentals, chords (Phase 2–3)
- Accounts, cloud sync, multiplayer, monetization, leaderboards
- MIDI input — acoustic piano only at home, so there is no device to connect (see §8.4)

---

## 4. Core concept: the block/pitch grammar

The entire app rests on one rule:

> **A tower of N blocks is scale degree N.**

*Numberblocks* encodes quantity as height plus color. We reuse that exact encoding for pitch — and it works because a major scale is genuinely ordinal. Degree 5 really *is* higher than degree 3, in a way that maps honestly onto physical height.

This is the most important design property in the document: **the metaphor is not decorative, it is literally true.** Taller block = higher pitch, every time, with no exceptions the child will later have to unlearn. Any feature that breaks this rule should be rejected.

Tap a tower → it plays its note, squashes, and sings.

### 4.1 Color mapping

*Numberblocks* canonical colors for 1–6 are the first six colors of the rainbow: red, orange, yellow, green, blue, indigo. Seven is violet/rainbow. Eight is magenta.

The dominant color convention in music education — **Chroma-Notes**, the system behind Boomwhackers, colored handbells, and most color-coded sheet music — is *also* rainbow-ordered starting from red at C. It was designed off the color wheel specifically to produce twelve colors for twelve chromatic notes.

**These two systems agree for degrees 1 through 6.** That is a genuine stroke of luck. It means his *Numberblocks* intuition is already aligned with the convention he will meet in any music classroom, in any color-coded songbook, on any set of Boomwhackers. Nothing has to be unlearned.

| Degree | Note (key of C) | Numberblocks color | Chroma-Notes color | Verdict |
|---|---|---|---|---|
| 1 | C | Red | Red | Match |
| 2 | D | Orange | Orange | Match |
| 3 | E | Yellow | Yellow | Match |
| 4 | F | Green | Green | Match |
| 5 | G | Blue / cyan | Blue-green → blue | Close enough |
| 6 | A | Indigo | Purple / indigo | Close enough |
| 7 | B | Violet / rainbow | Magenta-violet | Minor divergence |
| 8 | C (octave) | Magenta | **Red again** | **Conflict — see D1** |

**Recommendation:** use *Numberblocks* colors for 1–7 (his existing mental model wins), and treat degree 8 as a special case — see open decision **D1**.

### 4.2 The octave moment

Boomwhackers deliberately colors high C the same red as low C, to teach octave equivalence: same color, same name, higher sound. That is a beautiful lesson and it lands perfectly in this format — the eighth block "becomes One again, but bigger."

But he knows Eight is magenta. Proposed resolution: **degree 8 is a red block with a glowing outline**, introduced with a small animated moment ("One again — but higher!"). This borrows the show's own visual logic, where Ten is white with red borders.

### 4.3 Dual labeling

Each block face shows its degree numeral. A display-mode toggle progresses through three states:

1. **Numbers only** — the entry point
2. **Numbers + letters** — the bridge (small letter under the numeral)
3. **Letters only** — the exit, into his teacher's vocabulary

Mode 1 is the default. Modes 2 and 3 unlock by progress or parent toggle. This ladder *is* the pedagogical product.

---

## 5. Feature requirements

### 5.1 Sandbox — ships first

The free-play mode. No scoring, no failure, no timer.

- **F1.** A palette of eight towers (degrees 1–8) rendered as Numberblocks-style stacked cubes with faces.
- **F2.** Tap a tower → plays the corresponding piano note with a squash-and-stretch animation.
- **F3.** A **sequence strip** below: drag or tap towers into a row of up to 8–12 slots to compose a melody.
- **F4.** **Play button** — walks the sequence left to right at a steady tempo, highlighting each block as it sounds.
- **F5.** Tap a placed block to remove it. Long-press or a clear button to reset.
- **F6.** Tempo control as a simple two- or three-speed toggle (turtle / rabbit), not a BPM slider.
- **F7.** Key selector — hidden in a parent area for v1, default C major. Everything is relative degrees, so transposition is nearly free.
- **F8.** A "surprise me" button that fills the strip with a known nursery melody in degrees (Hot Cross Buns = 3-2-1, Twinkle = 1-1-5-5-6-6-5, Ode to Joy = 3-3-4-5-5-4-3-2-1).

### 5.2 Challenges — ships second, same release

Light structure layered on the sandbox. Roughly 5–8 challenges to start.

- **F9. Echo Me.** App plays a 2–4 block phrase; he rebuilds it. Ear training.
- **F10. Fill the Staircase.** Blocks appear scrambled; order them 1→8. Teaches the scale as an ordered object.
- **F11. Which One Am I?** App plays a single note; he taps the matching tower. Degree recognition.
- **F12. Finish the Song.** Melody plays with the last 1–2 blocks missing; he supplies them.
- **F13. Name That Block.** Same as F11 but in letter mode — the transfer test.
- **F14.** Three-star or three-badge completion per challenge. **No streaks, no daily-login pressure, no loss states.** Wrong answers get a gentle "try again" and the correct note played, never a buzzer.

### 5.3 Phase 2 candidates

- **Duration.** Wide blocks = long notes, narrow = short. Preserves the "size means something real" rule. *(Dan's original idea — deliberately held back so v1 stays simple.)*
- **Black keys.** Half-blocks wedged between towers, mapping visually to the actual piano keyboard. *(Also Dan's — same reason.)*
- **Chords.** Blocks placed side-by-side in one slot sound together. 1-3-5 becomes visibly a shape.
- **Free recording** and playback of his own compositions.

### 5.4 Phase 3 candidates

- Staff notation overlay — blocks morph into noteheads on a staff, same colors retained
- Minor scales, other keys surfaced to the child
- Bass clef mode for his brother
- Mic-based pitch detection so the app can hear the acoustic piano

---

## 6. Visual and interaction design

- **Aesthetic:** cheerful, chunky, high-contrast, soft-shadowed 3D-ish cubes. Faces with eyes on the top block of each tower — the characters should feel *alive*.
- **Motion is the reward.** Squash on tap, bounce on land, a little wiggle-and-sing when a tower plays. Reach for Framer Motion and be generous. For a six-year-old, juice *is* the retention mechanic.
- **Zero text in the child-facing UI.** All controls are icons. Any text lives in the parent area.
- **Touch targets ≥ 60px.** Bigger than the adult 44px standard — six-year-old fingers, and he'll be on a phone sometimes.
- **Responsive across phone, tablet, and desktop browser** (mixed device use). Portrait-first on phone; the sequence strip may wrap to two rows on narrow screens.
- **Parent area** gated behind a hold-to-enter or simple arithmetic gate — trivially defeatable is fine, it just needs to not be tapped by accident.

---

## 7. Audio

- Real sampled piano, not a synth beep. A sampler with a handful of real piano samples pitch-shifted across the range is sufficient and keeps the payload small.
- **Latency is a hard requirement.** Note must fire on touch-down, not touch-up, with no perceptible delay. Preload and warm all samples before the first interaction.
- **iOS audio unlock:** Safari requires a user gesture before audio can start. The app must have an explicit "tap to start" splash — do not skip this, it is the single most common way a web audio app appears broken on an iPhone.
- Optional voice: each block says its own number when tapped in Numbers mode, its letter in Letters mode. Adds significant charm; adds recording or TTS work. Defer to Phase 2 unless cheap.

---

## 8. Technical architecture

### 8.1 Recommendation: web app, not a game engine

Unity and Unreal are the wrong tool here. They're built for 3D worlds and physics simulation; this is a 2D touch interface with eight interactive objects. Choosing an engine buys a heavy toolchain, slow iteration, an app-store or build-and-install step for every change, and — critically — a workflow where I can write C# but you'd be hand-wiring scenes in a GUI I can't drive.

A web app inverts all of that: full end-to-end authorship, instant iteration, a link you can open on any device in the house, and installability to the home screen where it's indistinguishable from a native app. If it earns a native build later, the concept ports cleanly.

### 8.2 Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React + Vite + TypeScript | Fast iteration, types matter once challenge logic grows |
| Audio | Tone.js (`Tone.Sampler`) | Handles scheduling, pitch-shifting, and the iOS unlock dance |
| Animation | Framer Motion | Springy physics with almost no code; motion is the product |
| Styling | Tailwind | Fast, responsive, no CSS architecture decisions |
| State | React state + `localStorage` | No backend needed in v1 |
| Delivery | PWA — manifest + service worker | Home-screen install, offline play, no app store |
| Hosting | Vercel or Netlify free tier | Push to deploy, a URL that works on every device |

### 8.3 Build path

1. **Prototype as a Claude artifact** — single-file React, in-memory state. Playable within one session so you can put it in front of him this weekend and see if the core idea lands *before* investing in a repo.
2. **If it lands, graduate to a real Vite repo** built through Claude Code on your Mac — persistence, PWA install, proper asset pipeline. This fits your existing spec → review → build workflow cleanly.
3. Deploy to a URL, add to home screen on each device.

**Kill criterion:** if the artifact prototype doesn't make him smile in the first two minutes, stop and rethink the concept rather than building the repo. That test is cheap and it's the whole point of doing step 1 first.

### 8.4 On the acoustic piano

No MIDI, so the app cannot hear or connect to the instrument. The transfer to the real piano has to be carried by physical artifacts instead:

- **Printable key stickers** — colored dots for C–C in the same palette, applied to the actual piano keys. This is the single highest-leverage deliverable in the whole project. The moment the red key on the real piano is the same red as the One block, the app stops being a game and becomes an interface to his instrument.
- **A printed degree/letter chart** for the music stand.
- **A one-page teacher explainer** so his teacher can say "play me a three" and have it mean something.

---

## 9. Accessibility and kid-proofing

- No text dependency anywhere in the child UI
- No timers, no loss states, no punitive feedback
- No external links, no ads, no purchases, no chat, no network calls after load
- Color is never the *only* signal — the numeral and the tower height always carry the same information, which also covers color vision deficiency
- Volume control accessible; audio never autoplays on load

---

## 10. Success metrics

Deliberately human, deliberately few:

1. **Does he ask for it?** Unprompted requests per week. This is the real metric.
2. **Does practice time move?** Minutes at the actual piano, before vs. after.
3. **Can he answer "what's a five?"** at the real keyboard, without the app in front of him.
4. **Does his teacher notice a difference** in reading fluency within 6–8 weeks.

Explicitly *not* tracking: session length, daily active use, or anything that would tempt the design toward engagement mechanics.

---

## 11. Naming and IP risk

*Numberblocks* is owned by Alphablocks Ltd. Building an inspired-by app for your own kids is fine. **Publishing one is not** — the visual language, the stacked-cube character design, and any name in the "-blocks" family all carry real trademark and trade-dress exposure.

If this ever moves past the family, it needs: a distinct name, a visual identity that borrows the *pedagogy* (counted, colored, ordinal blocks) without the *characters*, and a proper knockout search before a dollar is spent. Worth deciding early, since it's much cheaper to design around than to retrofit.

---

## 12. Open decisions

| ID | Decision | Recommendation |
|---|---|---|
| **D1** | Degree 8 color: magenta (show-accurate) vs. red-with-glow (music-accurate) | Red with glow — teaches octave equivalence, and the "One again, but higher" moment is a genuinely great beat |
| **D2** | Do the blocks have faces and eyes? | Yes. Character is why the show works |
| **D3** | Voice-over on tap in v1? | Defer to Phase 2 unless a good TTS route is cheap |
| **D4** | Sequence strip length | Start at 8 slots; extend if he outgrows it |
| **D5** | Does the teacher get looped in before or after the prototype? | After — bring him something working rather than a concept |

---

## 13. Phasing

| Phase | Scope | Target |
|---|---|---|
| **0** | Artifact prototype: 8 towers, tap-to-play, sequence strip, play button | This weekend |
| **1** | Full v1 — sandbox + 5–8 challenges, PWA, number/letter modes, printable stickers | 2–4 weeks of evenings |
| **2** | Duration blocks, black keys, chords, voice-over | If Phase 1 sticks |
| **3** | Staff notation bridge, other keys, bass clef, mic pitch detection | Only if he's still asking for it |
