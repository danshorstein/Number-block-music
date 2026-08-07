/**
 * App state: the strip, and the parent-area settings. Persisted to localStorage so his
 * last tune and Dan's settings survive a reload (§8.2 — no backend in v1).
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DEFAULT_KEY,
  REST,
  degreesFor,
  type Degree,
  type KeyName,
  type PitchSet,
  type Slot,
} from '../music/scale'
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

/**
 * Tier 1 is roughly six, tier 2 roughly eight. Set by a grown-up and never shown to the
 * child — nobody gets told they are on level 1.
 */
export type Tier = 1 | 2

export interface Settings {
  key: KeyName
  displayMode: DisplayMode
  tempo: TempoId
  volume: number
  voice: boolean
  tier: Tier
  pitchSet: PitchSet
  /** The keyboard bridge under the blocks (Phase 2 §4.1). */
  showKeyboard: boolean
}

const DEFAULT_SETTINGS: Settings = {
  key: DEFAULT_KEY,
  displayMode: 'numbers',
  tempo: 'medium',
  volume: 0.8,
  voice: false,
  tier: 1,
  // Pentatonic first: with 4 and 7 gone nothing can sound wrong, which is why Kodaly
  // sequences it ahead of the full scale.
  pitchSet: 'pentatonic',
  showKeyboard: true,
}

/**
 * Storage is namespaced per child. Two of them share one iPad, and a single shared blob
 * meant whoever played last overwrote the other's stars and settings.
 */
export interface Profile {
  id: string
  /** Parent-facing only; the child UI never renders it. */
  name: string
}

const PROFILES_KEY = 'music-blocks:profiles'
const ACTIVE_PROFILE_KEY = 'music-blocks:active-profile'

const DEFAULT_PROFILES: Profile[] = [{ id: 'one', name: 'Player 1' }]

const settingsKey = (profileId: string) => `music-blocks:${profileId}:settings`
const sequenceKey = (profileId: string) => `music-blocks:${profileId}:sequence`
const progressKey = (profileId: string) => `music-blocks:${profileId}:progress`

/** Stars earned per challenge (F14). Only ever goes up — nothing here can be lost. */
export type Progress = Record<ChallengeId, number>

const EMPTY_PROGRESS = Object.fromEntries(
  CHALLENGE_IDS.map((id) => [id, 0]),
) as Progress

const emptyStrip = (): Slot[] => Array<Slot>(STRIP_LENGTH).fill(null)

function loadList<T>(storageKey: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(storageKey)
    const parsed = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback
  } catch {
    return fallback
  }
}

function loadStrip(profileId: string): Slot[] {
  try {
    const raw = localStorage.getItem(sequenceKey(profileId))
    const parsed = raw ? (JSON.parse(raw) as Slot[]) : null
    return Array.isArray(parsed) && parsed.length === STRIP_LENGTH ? parsed : emptyStrip()
  } catch {
    return emptyStrip()
  }
}

function load<T>(storageKey: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(storageKey)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}

export function useAppState() {
  const [profiles, setProfiles] = useState<Profile[]>(() =>
    loadList(PROFILES_KEY, DEFAULT_PROFILES),
  )
  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    const stored = localStorage.getItem(ACTIVE_PROFILE_KEY)
    return stored ?? DEFAULT_PROFILES[0].id
  })

  const profileId =
    profiles.some((p) => p.id === activeProfileId) ? activeProfileId : profiles[0].id

  const [settings, setSettings] = useState<Settings>(() =>
    load(settingsKey(profileId), DEFAULT_SETTINGS),
  )
  const [slots, setSlots] = useState<Slot[]>(() => loadStrip(profileId))
  const [progress, setProgress] = useState<Progress>(() =>
    load(progressKey(profileId), EMPTY_PROGRESS),
  )

  // Switching child swaps the whole working set, rather than carrying one child's
  // stars and settings into the other's session.
  const switchProfile = useCallback((id: string) => {
    setActiveProfileId(id)
    setSettings(load(settingsKey(id), DEFAULT_SETTINGS))
    setSlots(loadStrip(id))
    setProgress(load(progressKey(id), EMPTY_PROGRESS))
    try {
      localStorage.setItem(ACTIVE_PROFILE_KEY, id)
    } catch {
      // As below.
    }
  }, [])

  const addProfile = useCallback((name: string) => {
    const id = `p${Date.now().toString(36)}`
    setProfiles((current) => {
      const next = [...current, { id, name: name.trim() || `Player ${current.length + 1}` }]
      try {
        localStorage.setItem(PROFILES_KEY, JSON.stringify(next))
      } catch {
        // As below.
      }
      return next
    })
    return id
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(settingsKey(profileId), JSON.stringify(settings))
    } catch {
      // Private-mode Safari throws here. Losing settings is not worth crashing over.
    }
  }, [profileId, settings])

  useEffect(() => {
    try {
      localStorage.setItem(sequenceKey(profileId), JSON.stringify(slots))
    } catch {
      // As above.
    }
  }, [profileId, slots])

  useEffect(() => {
    try {
      localStorage.setItem(progressKey(profileId), JSON.stringify(progress))
    } catch {
      // As above.
    }
  }, [profileId, progress])

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

  /** The degrees this child's palette offers right now. */
  const degrees = useMemo(() => degreesFor(settings.pitchSet), [settings.pitchSet])

  return {
    slots,
    settings,
    progress,
    profiles,
    profileId,
    degrees,
    bpm,
    isEmpty,
    isFull,
    append,
    removeAt,
    clear,
    setStrip,
    updateSettings,
    recordStars,
    switchProfile,
    addProfile,
  }
}
