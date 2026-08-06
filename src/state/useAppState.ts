/**
 * App state: the strip, and the parent-area settings. Persisted to localStorage so his
 * last tune and Dan's settings survive a reload (§8.2 — no backend in v1).
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DEFAULT_KEY, REST, type Degree, type KeyName, type Slot } from '../music/scale'
import { STRIP_LENGTH } from '../music/melodies'
import { CHALLENGE_IDS, type ChallengeId } from '../challenges/generate'

/** The §4.3 ladder: numbers, then numbers with letters, then letters alone. */
export type DisplayMode = 'numbers' | 'both' | 'letters'

/** Turtle / rabbit / hare, not a BPM slider (F6). */
export const TEMPOS = [
  { id: 'slow', bpm: 72 },
  { id: 'medium', bpm: 104 },
  { id: 'fast', bpm: 144 },
] as const

export type TempoId = (typeof TEMPOS)[number]['id']

export interface Settings {
  key: KeyName
  displayMode: DisplayMode
  tempo: TempoId
  volume: number
  voice: boolean
}

const DEFAULT_SETTINGS: Settings = {
  key: DEFAULT_KEY,
  displayMode: 'numbers',
  tempo: 'medium',
  volume: 0.8,
  voice: false,
}

const SETTINGS_KEY = 'music-blocks:settings'
const SEQUENCE_KEY = 'music-blocks:sequence'
const PROGRESS_KEY = 'music-blocks:progress'

/** Stars earned per challenge (F14). Only ever goes up — nothing here can be lost. */
export type Progress = Record<ChallengeId, number>

const EMPTY_PROGRESS = Object.fromEntries(
  CHALLENGE_IDS.map((id) => [id, 0]),
) as Progress

const emptyStrip = (): Slot[] => Array<Slot>(STRIP_LENGTH).fill(null)

function load<T>(storageKey: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(storageKey)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}

export function useAppState() {
  const [settings, setSettings] = useState<Settings>(() =>
    load(SETTINGS_KEY, DEFAULT_SETTINGS),
  )
  const [slots, setSlots] = useState<Slot[]>(() => {
    try {
      const raw = localStorage.getItem(SEQUENCE_KEY)
      const parsed = raw ? (JSON.parse(raw) as Slot[]) : null
      return Array.isArray(parsed) && parsed.length === STRIP_LENGTH ? parsed : emptyStrip()
    } catch {
      return emptyStrip()
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    } catch {
      // Private-mode Safari throws here. Losing settings is not worth crashing over.
    }
  }, [settings])

  useEffect(() => {
    try {
      localStorage.setItem(SEQUENCE_KEY, JSON.stringify(slots))
    } catch {
      // As above.
    }
  }, [slots])

  const [progress, setProgress] = useState<Progress>(() => load(PROGRESS_KEY, EMPTY_PROGRESS))

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
    } catch {
      // As above.
    }
  }, [progress])

  /** Stars only ever climb — a worse run never takes a star away (F14). */
  const recordStars = useCallback((id: ChallengeId, stars: number) => {
    setProgress((current) => ({ ...current, [id]: Math.max(current[id] ?? 0, stars) }))
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => ({ ...current, ...patch }))
  }, [])

  /** Tap-to-append: the block flies into the next free slot (F3). */
  const append = useCallback((value: Degree | typeof REST) => {
    setSlots((current) => {
      const index = current.indexOf(null)
      if (index === -1) return current
      const next = [...current]
      next[index] = value
      return next
    })
  }, [])

  /** Tap a placed block to take it out, and close the gap behind it (F5). */
  const removeAt = useCallback((index: number) => {
    setSlots((current) => {
      const next = current.filter((_, i) => i !== index)
      next.push(null)
      return next
    })
  }, [])

  const clear = useCallback(() => setSlots(emptyStrip()), [])

  const setStrip = useCallback((next: Slot[]) => {
    setSlots([...next].slice(0, STRIP_LENGTH))
  }, [])

  const isEmpty = useMemo(() => slots.every((slot) => slot === null), [slots])
  const isFull = useMemo(() => slots.every((slot) => slot !== null), [slots])
  const bpm = useMemo(
    () => TEMPOS.find((t) => t.id === settings.tempo)!.bpm,
    [settings.tempo],
  )

  return {
    slots,
    settings,
    progress,
    bpm,
    isEmpty,
    isFull,
    append,
    removeAt,
    clear,
    setStrip,
    updateSettings,
    recordStars,
  }
}
