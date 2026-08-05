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

export default function App() {
  const { slots, settings, bpm, isEmpty, append, removeAt, clear, setStrip, updateSettings } =
    useAppState()

  const [started, setStarted] = useState(false)
  const [audioStatus, setAudioStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [audioError, setAudioError] = useState<string | undefined>(undefined)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [pulses, setPulses] = useState<Record<string, number>>({})
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

  /** Tapping a tower sounds it and drops it into the next free slot (F2, F3). */
  const handlePick = useCallback(
    (value: Degree | typeof REST) => {
      bump(String(value))

      if (isDegree(value)) {
        playDegree(value, settings.key)
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
    [append, bump, settings.key, settings.voice, settings.displayMode],
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
      onStep: setPlayingIndex,
      onDone: () => {
        sequenceRef.current = null
      },
    })
  }, [bpm, isEmpty, isPlaying, settings.key, slots])

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
      <ParentArea settings={settings} onChange={updateSettings} />

      {/* Centered rather than bottom-aligned: on a tablet the three rows only fill
          about two thirds of the height, and hugging the bottom looks like a bug. */}
      <main className="flex min-h-0 flex-1 flex-col justify-center gap-[1.6vh] pt-2 pb-[2.5vh]">
        <Palette
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

      <AnimatePresence>
        {!started && (
          <StartSplash status={audioStatus} errorDetail={audioError} onStart={handleStart} />
        )}
      </AnimatePresence>
    </div>
  )
}
