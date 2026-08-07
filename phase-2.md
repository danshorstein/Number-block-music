# Music Blocks — Phase 2 Spec

**Owner:** Dan Shorstein
**Date:** August 7, 2026
**Status:** Draft for review
**Supersedes:** parts of `requirements.md` §5.3–5.4 and §12 (see §7)

---

## 1. What changed

Two things since v1 shipped.

**The app works and he likes it.** The sandbox and challenges are live, the print pack
exists, and the metaphor holds up in use.

**The audience doubled.** It now has to be worth opening for a 6-year-old and an
8-year-old. Ages 9–12 are deliberately out of scope — see §3.

There is also a correction to make. When asked whether to add interval training, the
answer given was no. That answer was right for a six-year-old, and would have been wrong
for a ten-year-old; with the scope set at 8 and under it stands. §4.5 records why, since
the reasoning matters if the range ever widens.

---

## 2. What the evidence actually says

Four findings drive everything below.

**Sound before symbol, patterns before theory.** Gordon's Music Learning Theory
sequences audiation through tonal and rhythm *patterns* before notation and theory are
introduced at all. Children build the ear first and read second.

**Contour, then steps and skips, then names.** Kodály practice spends significant time
on melodic contour *before* children identify intervals formally, begins with **so–mi**
— the descending minor third, the interval young children sing most accurately — works
within a tiny pitch set, and teaches **pentatonic before diatonic**.

**Scale degrees beat context-free intervals, for beginners.** A sense of scale degree is
both easier to acquire and more useful than the ability to name intervals in isolation.
The app is already built on scale degrees, which turns out to be the right foundation
rather than a convenient one.

**Abstract reasoning arrives around age 7.** Notation, time signatures and chord
relationships become genuinely understandable rather than bewildering after that point.
This is the hinge the whole age question turns on.

And one finding that is not about music at all:

**Spacing is the strongest lever available, and it is not a feature.** Children aged 5–7
taught spaced once per day across four days substantially outperformed massed practice,
with effect sizes from d = 0.38 to d = 1.41. Retrieval with feedback beats re-exposure
in primary-age children. Five minutes daily beats twenty minutes on Saturday, and no
amount of app design substitutes for that.

---

## 3. Two children, and a deliberate ceiling at 8

Apps built for "kids 4–12" serve nobody, because 6–8 and 9–12 are different
developmental bands. A six-year-old needs pictograms and audio support; a ten-year-old
is ready for real complexity and reads a wordless, googly-eyed block interface as
something made for his little brother.

**So the ceiling is 8, on purpose.** 6–8 is one band, which means the block grammar, the
faces and the text-free UI stay coherent for both children instead of being apologised
for at the top end. Scope discipline here buys more than a third tier would.

**The design answer: one engine, two faces.**

The scale-degree grammar, the audio engine, the challenge generator and the colour
tokens are shared. What changes by tier is **what is on screen and how deep the material
goes** — not a difficulty multiplier on the same content.

| | Tier 1 | Tier 2 |
|---|---|---|
| Roughly | ~6 | ~8 |
| Pitch set | Pentatonic (1 2 3 5 6) | Full diatonic |
| Labels | Numbers | Numbers + letters |
| Reading | None | Colour-coded staff |
| Ear work | so–mi, steps vs skips | Longer patterns, contour |
| Rhythm | None | Duration blocks |
| Register | Middle C octave | Middle C octave |

**Tier is set in the parent area, never shown to the child.** Nobody is told they are on
level 1, and nobody is shown a locked door. This costs nothing and removes the
condescension risk entirely.

**New requirement that falls out of this: profiles.** Two children on one iPad currently
share one `localStorage` blob and will overwrite each other's progress. Tier and stars
must be per-child. Small now, painful later.

**Out of scope, and what would bring it back.** Named intervals, chords, bass clef and
plain uncoloured notation are all deferred with the 9–12 band. If the eldest ever asks
for it himself, §4.5 and §4.7 hold the reasoning — but building them speculatively
would compromise the design for the two children who actually use it.

---

## 4. What to build

Ordered by evidence-per-unit-of-work, not by what sounds most impressive.

### 4.1 The keyboard bridge — P1

The app teaches **block → sound**. The piano needs **block → key → sound**, and that
middle link currently exists only on the printed stickers.

- A keyboard strip showing one octave, C to C, in the same colours as the stickers.
- **Black keys drawn as landmarks**, even though the app is diatonic. The way a person
  actually finds C is "the white key left of the two black keys" — the single most
  transferable fact on the instrument, and nothing in v1 teaches it.
- The keyboard **lights up when a block sounds**. It is a display, not a second
  instrument: the blocks stay the interface, and the mapping is absorbed passively.
- Colours ride the existing display ladder and **end uncoloured**. The colour-notation
  literature is explicit that the useful version is staged — colour, then colour on
  standard notation, then no colour — precisely so the scaffold can be removed.

Serves both tiers. This is the highest-value item in the document.

> **Why not make it playable?** Because the goal is transfer to the instrument in the
> room. A fully playable on-screen piano competes with the real one. Revisit only if
> watching them use it says otherwise.

### 4.2 Steps and skips — P1

Is the next block next door, or does it jump? This is Kodály's entry point to melodic
thinking and it is nearly free in our grammar: adjacent towers versus not.

Add as a challenge, and as a visible property during playback (neighbouring blocks
connect; jumps show a gap).

### 4.3 Sequenced Echo Me — P1, and the cheapest win here

Echo Me currently picks degrees **uniformly at random**. That ignores the pedagogical
sequence entirely and can hand a six-year-old a pattern no six-year-old can sing.

Replace with a weighted progression:

1. **5 → 3** (so–mi) — the pattern children sing most accurately
2. **5 → 3 → 1**
3. add **6**, then **2** — completing the pentatonic set
4. only then, the full diatonic

This is a change to one generator function and it moves the app from "random ear
training" to an actual teaching sequence.

### 4.4 Pentatonic mode — P1

Degrees 1-2-3-5-6. Nothing can sound wrong in any order, at any speed, so free play
cannot fail. Kodály sequences pentatonic before diatonic for exactly this reason.

Parent-area toggle; default on at Tier 1.

### 4.5 Named intervals — deferred with the 9–12 band

Abstract reasoning arrives around age 7, so interval naming becomes appropriate towards
8–10. At a ceiling of 8 it sits right at the boundary, and scale-degree function remains
the more useful system for both children we are actually building for.

Recorded here so the reasoning survives: if this ever extends upward, teach intervals as
distance between the degrees the app already uses (1→5 is a fifth), anchored to known
songs, on the keyboard where the distance is visible as physical space.

### 4.6 Duration blocks — P2

Wide block = long note, narrow = short. Dan's original idea from §5.3, held back from
v1. Rhythm is half of music and the app currently has none.

Preserves the "size means something real" rule, and the songbook data already carries
beats per note, so the model exists.

### 4.7 Bass clef and lower register — deferred

§5.4 filed this under Phase 3 for the older brother. Out of scope at a ceiling of 8, and
it only becomes worth building if he asks for it himself.

### 4.8 Chords — deferred

Blocks side by side in one slot sound together; 1-3-5 becomes visibly a shape. Belongs
with the 9–12 material.

### 4.9 Session shape — P1, and it is mostly not code

To exploit spacing without violating §10's ban on engagement mechanics:

- Open a session with a **retrieval** (a challenge), not a re-teach.
- Keep the default session short enough to end while he still wants more.
- **No streaks, no notifications, no daily-login pressure.** Spacing is a parenting
  cadence, and the app's job is to be worth five minutes, not to nag.

---

## 5. Explicitly not building

- **Named intervals.** Sideways into a less useful system for a six- or eight-year-old.
- **Anything aimed at 9–12.** Bass clef, chords, plain notation. Building them
  speculatively would compromise the design for the two children who do use it.
- **A single undifferentiated UI spanning 6–12.** It would serve nobody.
- **Streaks, notifications, leaderboards, daily goals.** §10 forbids them and the
  evidence does not need them.
- **Harder = more random notes.** A seven-degree random pattern is *worse* pedagogy
  than a two-note so–mi, however advanced it feels.
- **A fully playable on-screen piano** in this phase — see §4.1.

---

## 6. Open decisions

| ID | Decision | Recommendation |
|---|---|---|
| **D6** | ~~Does the 10-year-old want this?~~ | **Resolved: scope set at 8 and under.** Not building for him until he asks. |
| **D7** | Faces on blocks at Tier 2 | Keep them. At 8 they still read as characters rather than as babyish; revisit only if he says otherwise. |
| **D9** | Profiles: per-device or per-child | Per-child, before Tier 2, or two kids overwrite each other. |
| **D10** | Is the older brother a *user* or a *co-author*? | Still worth trying — letting him build challenges for his brother is a stronger motivator than being taught, and it needs no new tier. |

---

## 7. Phasing

| Phase | Scope |
|---|---|
| **2a** | Keyboard bridge, steps and skips, sequenced Echo Me, pentatonic mode, profiles |
| **2b** | Duration blocks, Tier 2 presentation, colour-coded staff reading |

2a serves both children. 2b is the eight-year-old's depth. There is no 2c — the 9–12
material stays unbuilt unless someone that age asks for it.

---

## 8. How we will know

Unchanged in spirit from §10, with one addition per child:

1. Does each of them ask for it, unprompted?
2. Does time at the real piano move?
3. Can the six-year-old answer "what's a five?" at the keyboard, without the app.
4. Can the eight-year-old find a note by letter name on the real piano.
5. Does the teacher notice a difference within 6–8 weeks.

Still not tracking session length, daily actives, or anything that would tempt the
design toward engagement mechanics.
