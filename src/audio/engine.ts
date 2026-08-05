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

/**
 * Safari-only, and not in lib.dom yet. iOS puts Web Audio in the "ambient" session by
 * default, which the ring/silent switch mutes — HTML <audio> is exempt, Web Audio is
 * not. Declaring "playback" is the supported way to stay audible with the switch on.
 */
interface AudioSession {
  type: 'auto' | 'playback' | 'transient' | 'transient-solo' | 'ambient' | 'play-and-record'
}

declare global {
  interface Navigator {
    audioSession?: AudioSession
  }
}

let sampler: Tone.Sampler | null = null
let loading: Promise<void> | null = null

export function isReady(): boolean {
  return sampler !== null && sampler.loaded
}

/** Nothing in the unlock path may await without a bound — see unlock(). */
const CONTEXT_TIMEOUT_MS = 4_000
const SAMPLE_TIMEOUT_MS = 25_000

function withTimeout<T>(work: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    work,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms),
    ),
  ])
}

/**
 * Safari shipped promise-based decodeAudioData late and still honours the older
 * callback form, so support both rather than betting on which one this phone has.
 */
function decodeAudio(bytes: ArrayBuffer): Promise<AudioBuffer> {
  const raw = Tone.getContext().rawContext as unknown as BaseAudioContext
  return new Promise<AudioBuffer>((resolve, reject) => {
    const maybePromise = raw.decodeAudioData(bytes, resolve, reject) as
      | Promise<AudioBuffer>
      | undefined
    if (maybePromise && typeof maybePromise.then === 'function') {
      maybePromise.then(resolve, reject)
    }
  })
}

/**
 * Fetch and decode each sample by hand rather than handing URLs to Tone.Sampler.
 * Sampler reports load failures through an onload/onerror pair that can leave the
 * caller waiting forever if neither fires; doing it here means every failure has a
 * message naming the file, which is the difference between a fixable bug report and
 * an infinite spinner on someone's phone.
 */
async function loadSamples(): Promise<Record<string, AudioBuffer>> {
  const baseUrl = `${import.meta.env.BASE_URL}audio/piano/`

  const entries = await Promise.all(
    Object.entries(SAMPLE_MAP).map(async ([note, file]) => {
      const url = baseUrl + file
      const response = await withTimeout(fetch(url), SAMPLE_TIMEOUT_MS, file).catch(() => {
        throw new Error(`Could not download ${url}`)
      })
      if (!response.ok) {
        throw new Error(`${url} returned HTTP ${response.status}`)
      }

      const bytes = await response.arrayBuffer()
      const buffer = await decodeAudio(bytes).catch(() => {
        throw new Error(`Could not decode ${file} — this browser may not accept the audio`)
      })

      return [note, buffer] as const
    }),
  )

  return Object.fromEntries(entries)
}

/**
 * Start the audio context and decode every sample. Must be called from a user gesture,
 * and specifically from one iOS counts as an activation — a click, not a pointerdown.
 * Safe to call more than once; later calls join the first load.
 *
 * Everything here is bounded. Tone builds its AudioContext at import time, before any
 * gesture exists, and on iOS resume() against such a context can stay pending forever
 * rather than rejecting — which strands the splash on its loading animation with no
 * way to tell what went wrong. A context that will not start is survivable; an
 * unbounded await is not.
 */
export function unlock(): Promise<void> {
  if (loading) return loading

  loading = (async () => {
    // Before starting the context, so the first note is already on the right session.
    // Absent on every browser except Safari 16.4+.
    if (navigator.audioSession) {
      navigator.audioSession.type = 'playback'
    }

    // Best effort. If the context refuses to start we still load the samples and let
    // the user in — a later tap often resumes it, and a visible app beats a spinner.
    await withTimeout(Tone.start(), CONTEXT_TIMEOUT_MS, 'Starting audio').catch(() => undefined)

    // Tone.start() can resolve with the context still parked. Nudge the raw context
    // directly — we are still inside the activation the click granted.
    const context = Tone.getContext()
    if (context.state !== 'running') {
      const raw = context.rawContext as unknown as BaseAudioContext & { resume?: () => Promise<void> }
      await withTimeout(
        Promise.resolve(raw.resume?.()),
        CONTEXT_TIMEOUT_MS,
        'Resuming audio',
      ).catch(() => undefined)
    }

    // Trade scheduling headroom for immediacy. Taps are triggered directly rather than
    // scheduled ahead, so the default 100ms of lookAhead is pure latency here.
    context.lookAhead = 0.01

    const buffers = await loadSamples()
    sampler = new Tone.Sampler({ urls: buffers, release: 1 }).toDestination()
  })()

  // A failed attempt must not poison every later one, or "tap to retry" can't work.
  loading.catch(() => {
    loading = null
  })

  return loading
}

/** Diagnostic for the error screen: did the context actually start? */
export function contextState(): string {
  try {
    return Tone.getContext().state
  } catch {
    return 'unavailable'
  }
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
