/**
 * The one rule the whole app rests on: a tower of N blocks is scale degree N.
 *
 * A major scale is genuinely ordinal — degree 5 really is higher than degree 3 — so
 * height maps onto pitch honestly, with nothing to unlearn later. Everything here is
 * pure so the musical rules can be tested without touching Web Audio.
 */

/** Semitones above the tonic for degrees 1–8 of a major scale. */
export const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11, 12] as const

export type Degree = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export const DEGREES: readonly Degree[] = [1, 2, 3, 4, 5, 6, 7, 8]

/**
 * The major pentatonic: the scale with 4 and 7 taken out.
 *
 * Those two degrees are where every semitone clash in a major scale comes from, so with
 * them gone no combination of blocks in any order at any speed can sound wrong. Kodály
 * teaches pentatonic before diatonic for exactly that reason — the child gets to
 * improvise freely before there is any way to be out of tune.
 *
 * The heights stay honest (1, 2, 3, 5, 6): the missing towers are notes that are not in
 * this scale, not gaps in the counting.
 */
export const PENTATONIC: readonly Degree[] = [1, 2, 3, 5, 6]

/** Which pitches the palette offers. Set per child in the parent area. */
export type PitchSet = 'pentatonic' | 'diatonic'

export const degreesFor = (pitchSet: PitchSet): readonly Degree[] =>
  pitchSet === 'pentatonic' ? PENTATONIC : DEGREES

/** A silent beat. Not in the requirements doc, but F8's own melodies need it. */
export const REST = 'rest' as const
export type Rest = typeof REST

/** One cell of the sequence strip: a degree, a deliberate rest, or still empty. */
export type Slot = Degree | Rest | null

export const isDegree = (slot: Slot): slot is Degree =>
  typeof slot === 'number' && slot >= 1 && slot <= 8

/**
 * Tonics available in the parent area (F7). Kept between C4 and G4 so every note the
 * app can produce (tonic..tonic+12, i.e. MIDI 60–79) sits inside the sampled range and
 * no note is pitch-shifted far enough to sound like a chipmunk.
 */
export const KEYS = {
  C: 60,
  D: 62,
  Eb: 63,
  F: 65,
  G: 67,
} as const

export type KeyName = keyof typeof KEYS
export const KEY_NAMES = Object.keys(KEYS) as KeyName[]
export const DEFAULT_KEY: KeyName = 'C'

const PITCH_CLASSES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
] as const

/** MIDI note number for a scale degree in a given key. */
export function degreeToMidi(degree: Degree, key: KeyName = DEFAULT_KEY): number {
  return KEYS[key] + MAJOR_STEPS[degree - 1]
}

/** Scientific pitch name (e.g. 60 → "C4"), which is what Tone.Sampler wants. */
export function midiToNoteName(midi: number): string {
  const pitchClass = PITCH_CLASSES[((midi % 12) + 12) % 12]
  const octave = Math.floor(midi / 12) - 1
  return `${pitchClass}${octave}`
}

/** Note name for a degree — the string handed to the sampler. */
export function degreeToNoteName(degree: Degree, key: KeyName = DEFAULT_KEY): string {
  return midiToNoteName(degreeToMidi(degree, key))
}

/**
 * The letter the child is learning to say for this block (§4.3, G3). In C these are
 * C D E F G A B C; degree 8 deliberately returns the same letter as degree 1, because
 * that is the octave lesson — same name, same color, higher sound (§4.2).
 */
export function degreeToLetter(degree: Degree, key: KeyName = DEFAULT_KEY): string {
  const name = degreeToNoteName(degree, key)
  return name.replace(/\d+$/, '')
}
