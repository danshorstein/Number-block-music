import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Palette } from './components/Palette'
import { SequenceStrip } from './components/SequenceStrip'
import { TransportBar } from './components/TransportBar'
import { StartSplash } from './components/StartSplash'
import { RotateNudge } from './components/RotateNudge'
import { ParentArea } from './components/ParentArea'
import { TEMPOS, useAppState } from './state/useAppState'
import {
  contextState,
  playDegree,
  playSequence,
  setVolume,
  stopSequence,
  unlock,
  type SequenceHandle,
} from './audio/engine'
import { speakDegree, speakLetter } from './audio/voice'
import { pickMelody } from './music/melodies'
import { REST, degreeToLetter, isDegree, type Degree } from './music/scale'
import { Keyboard } from './components/Keyboard'
import { ChallengeMenu } from './components/ChallengeMenu'
import { ChallengeScreen } from './components/ChallengeScreen'
import { StepSkipScreen } from './components/StepSkipScreen'
import type { ChallengeId } from './challenges/generate'

export default function App() {
  const {
    slots,
    settings,
    progress,
    profiles,
    profileId,
    degrees,
    bpm,
    isEmpty,
    append,
    removeAt,
    clear,
    setStrip,
    updateSettings,
    recordStars,
    switchProfile,
    addProfile,
  } = useAppState()

  /** Free play, the challenge list, or one challenge in progress. */
  const [view, setView] = useState<'sandbox' | 'menu' | 'challenge'>('sandbox')
  const [activeChallenge, setActiveChallenge] = useState<ChallengeId | null>(null)

  const [started, setStarted] = useState(false)
  const [audioStatus, setAudioStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [audioError, setAudioError] = useState<string | undefined>(undefined)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [pulses, setPulses] = useState<Record<string, number>>({})
  /** Which key the bridge should light up. Cleared shortly after the note starts. */
  const [sounding, setSounding] = useState<Degree | null>(null)
  const soundingTimer = useRef<number | null>(null)
  const lastMelodyId = useRef<string | undefined>(undefined)
  const sequenceRef = useRef<SequenceHandle | null>(null)

  const isPlaying = playingIndex !== null

  useEffect(() => {
    setVolume(settings.volume)
  }, [settings.volume])

  const handleStart = useCallback(async () => {
    setAudioStatus('loading')
    try {
      await unlock()
      setVolume(settings.volume)
      setStarted(true)
      setAudioStatus('idle')
    } catch (error) {
      // Name the failure on screen. This runs on a phone with no console attached, so
      // an unlabelled failure is indistinguishable from a hang.
      const detail = error instanceof Error ? error.message : String(error)
      setAudioError(`${detail} (audio: ${contextState()})`)
      setAudioStatus('error')
    }
  }, [settings.volume])

  const bump = useCallback((id: string) => {
    setPulses((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }))
  }, [])

  /** Light the matching key, so block and key are seen as the same thing. */
  const light = useCallback((degree: Degree | null) => {
    if (soundingTimer.current) window.clearTimeout(soundingTimer.current)
    setSounding(degree)
    if (degree !== null) {
      soundingTimer.current = window.setTimeout(() => setSounding(null), 420)
    }
  }, [])

  /** Tapping a tower sounds it and drops it into the next free slot (F2, F3). */
  const handlePick = useCallback(
    (value: Degree | typeof REST) => {
      bump(String(value))

      if (isDegree(value)) {
        playDegree(value, settings.key)
        light(value)
        if (settings.voice) {
          if (settings.displayMode === 'letters') {
            speakLetter(degreeToLetter(value, settings.key))
          } else {
            speakDegree(value)
          }
        }
      }

      append(value)
    },
    [append, bump, light, settings.key, settings.voice, settings.displayMode],
  )

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      sequenceRef.current?.stop()
      sequenceRef.current = null
      setPlayingIndex(null)
      return
    }
    if (isEmpty) return

    sequenceRef.current = playSequence({
      slots,
      key: settings.key,
      bpm,
      onStep: (index) => {
        setPlayingIndex(index)
        const slot = index === null ? null : slots[index]
        light(isDegree(slot) ? slot : null)
      },
      onDone: () => {
        sequenceRef.current = null
      },
    })
  }, [bpm, isEmpty, isPlaying, light, settings.key, slots])

  const handleCycleTempo = useCallback(() => {
    const index = TEMPOS.findIndex((t) => t.id === settings.tempo)
    updateSettings({ tempo: TEMPOS[(index + 1) % TEMPOS.length].id })
  }, [settings.tempo, updateSettings])

  const handleSurprise = useCallback(() => {
    const melody = pickMelody(lastMelodyId.current)
    lastMelodyId.current = melody.id
    setStrip(melody.slots)
  }, [setStrip])

  const handleClear = useCallback(() => {
    sequenceRef.current?.stop()
    sequenceRef.current = null
    setPlayingIndex(null)
    clear()
  }, [clear])

  // Never leave the transport running behind a closed tab.
  useEffect(() => stopSequence, [])

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[#1b1136]">
      <RotateNudge />
      {view === 'sandbox' && (
        <ParentArea
          settings={settings}
          onChange={updateSettings}
          profiles={profiles}
          profileId={profileId}
          onSwitchProfile={switchProfile}
          onAddProfile={addProfile}
        />
      )}

      {/* The way in to the challenges: a star, no words (§6). */}
      {view === 'sandbox' && (
        <button
          type="button"
          aria-label="Challenges"
          onPointerDown={(event) => {
            event.preventDefault()
            setView('menu')
          }}
          className="absolute top-2 left-2 z-30 grid h-11 w-11 place-items-center rounded-full
                     bg-white/10 text-amber-300"
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6">
            <path
              d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.05 1.1-6.5-4.7-4.6 6.5-.95z"
              fill="currentColor"
            />
          </svg>
        </button>
      )}

      {view === 'menu' && (
        <ChallengeMenu
          progress={progress}
          onPick={(id) => {
            setActiveChallenge(id)
            setView('challenge')
          }}
          onBack={() => setView('sandbox')}
        />
      )}

      {view === 'challenge' && activeChallenge === 'step-skip' && (
        <StepSkipScreen
          musicKey={settings.key}
          bpm={bpm}
          degrees={degrees}
          earned={progress['step-skip'] ?? 0}
          onEarn={(stars) => recordStars('step-skip', stars)}
          onBack={() => setView('menu')}
        />
      )}

      {view === 'challenge' && activeChallenge && activeChallenge !== 'step-skip' && (
        <ChallengeScreen
          id={activeChallenge}
          musicKey={settings.key}
          bpm={bpm}
          degrees={degrees}
          tier={settings.tier}
          earned={progress[activeChallenge] ?? 0}
          onEarn={(stars) => recordStars(activeChallenge, stars)}
          onBack={() => setView('menu')}
        />
      )}

      {/* Centered rather than bottom-aligned: on a tablet the three rows only fill
          about two thirds of the height, and hugging the bottom looks like a bug. */}
      {view === 'sandbox' && (
      <main className="flex min-h-0 flex-1 flex-col justify-center gap-[1.6vh] pt-2 pb-[2.5vh]">
        <Palette
          degrees={degrees}
          displayMode={settings.displayMode}
          musicKey={settings.key}
          pulses={pulses}
          disabled={isPlaying}
          onPick={handlePick}
        />

        <SequenceStrip
          slots={slots}
          playingIndex={playingIndex}
          displayMode={settings.displayMode}
          musicKey={settings.key}
          onRemove={removeAt}
        />

        {settings.showKeyboard && (
          <Keyboard
            available={degrees}
            sounding={sounding}
            displayMode={settings.displayMode}
            musicKey={settings.key}
            colored={settings.displayMode !== 'letters'}
          />
        )}

        <TransportBar
          isPlaying={isPlaying}
          canPlay={!isEmpty}
          tempo={settings.tempo}
          onTogglePlay={handleTogglePlay}
          onCycleTempo={handleCycleTempo}
          onClear={handleClear}
          onSurprise={handleSurprise}
        />
      </main>
      )}

      <AnimatePresence>
        {!started && (
          <StartSplash status={audioStatus} errorDetail={audioError} onStart={handleStart} />
        )}
      </AnimatePresence>
    </div>
  )
}
