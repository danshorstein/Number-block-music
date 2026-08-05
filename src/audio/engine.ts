/**
 * The audio shell. All musical decisions live in ../music; this file only makes sound.
 *
 * Three things here are non-negotiable and easy to get wrong:
 *   1. iOS Safari will not start audio without a user gesture, so `unlock()` must be
 *      called from inside a real pointer handler (§7). The splash screen exists for
 *      exactly this reason — skipping it is the single most common way a web audio app
 *      appears broken on an iPhone.
 *   2. Notes fire on pointerdown, and `lookAhead` is dropped to near zero, because a
 *      perceptible gap between finger and sound breaks the whole metaphor (§7).
 *   3. Playback highlights are scheduled through Tone.Draw, not setInterval, so the
 *      moving highlight cannot drift away from the sound it is supposed to be marking.
 */

import * as Tone from 'tone'
import {
  DEFAULT_KEY,
  degreeToNoteName,
  isDegree,
  type Degree,
  type KeyName,
  type Slot,
} from '../music/scale'

/**
 * Salamander Grand Piano, sampled every few semitones across the app's range so no
 * note is pitch-shifted more than about a minor third. See ATTRIBUTION.md.
 */
const SAMPLE_MAP: Record<string, string> = {
  C4: 'C4.mp3',
  'D#4': 'Ds4.mp3',
  'F#4': 'Fs4.mp3',
  A4: 'A4.mp3',
  C5: 'C5.mp3',
  'D#5': 'Ds5.mp3',
  'F#5': 'Fs5.mp3',
  A5: 'A5.mp3',
}

/** How long a tapped note rings, in seconds. Long enough to feel like a real piano. */
const TAP_DURATION = 1.6

let sampler: Tone.Sampler | null = null
let loading: Promise<void> | null = null

export function isReady(): boolean {
  return sampler !== null && sampler.loaded
}

/**
 * Start the audio context and decode every sample. Must be called from a user gesture.
 * Safe to call more than once — later calls join the first load.
 */
export function unlock(): Promise<void> {
  if (loading) return loading

  loading = (async () => {
    await Tone.start()

    // Trade scheduling headroom for immediacy. Taps are triggered directly rather than
    // scheduled ahead, so the default 100ms of lookAhead is pure latency here.
    Tone.getContext().lookAhead = 0.01

    await new Promise<void>((resolve, reject) => {
      sampler = new Tone.Sampler({
        urls: SAMPLE_MAP,
        baseUrl: `${import.meta.env.BASE_URL}audio/piano/`,
        release: 1,
        onload: () => resolve(),
        onerror: (error) => reject(error),
      }).toDestination()
    })
  })()

  return loading
}

/** Play a single degree right now — the tap path (F2). */
export function playDegree(degree: Degree, key: KeyName = DEFAULT_KEY): void {
  if (!sampler?.loaded) return
  sampler.triggerAttackRelease(degreeToNoteName(degree, key), TAP_DURATION)
}

export interface SequenceHandle {
  stop: () => void
}

export interface PlaySequenceOptions {
  slots: Slot[]
  key?: KeyName
  bpm: number
  /** Fired in visual sync with each step — index, then null when the run ends. */
  onStep: (index: number | null) => void
  onDone?: () => void
}

/**
 * Walk the strip left to right, sounding each degree and highlighting it (F4).
 * Empty slots and rests are silent beats, which is what keeps the grid honest.
 */
export function playSequence({
  slots,
  key = DEFAULT_KEY,
  bpm,
  onStep,
  onDone,
}: PlaySequenceOptions): SequenceHandle {
  const transport = Tone.getTransport()
  transport.stop()
  transport.cancel()
  transport.position = 0
  transport.bpm.value = bpm

  const beat = 60 / bpm

  slots.forEach((slot, index) => {
    transport.schedule((time) => {
      if (sampler?.loaded && isDegree(slot)) {
        sampler.triggerAttackRelease(degreeToNoteName(slot, key), beat * 0.9, time)
      }
      Tone.getDraw().schedule(() => onStep(index), time)
    }, index * beat)
  })

  // Let the last note ring a little before clearing the highlight.
  transport.schedule((time) => {
    Tone.getDraw().schedule(() => {
      onStep(null)
      onDone?.()
    }, time)
  }, slots.length * beat)

  transport.start()

  return {
    stop: () => {
      transport.stop()
      transport.cancel()
      transport.position = 0
      onStep(null)
    },
  }
}

export function stopSequence(): void {
  const transport = Tone.getTransport()
  transport.stop()
  transport.cancel()
  transport.position = 0
}

/** Master volume, 0–1 (§9: volume must stay reachable). */
export function setVolume(level: number): void {
  const clamped = Math.min(1, Math.max(0, level))
  const destination = Tone.getDestination()
  destination.mute = clamped === 0
  if (clamped > 0) destination.volume.value = Tone.gainToDb(clamped)
}
