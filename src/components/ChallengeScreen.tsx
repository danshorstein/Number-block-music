/**
 * Playing one challenge.
 *
 * F14 sets the rules of engagement and they are worth stating plainly: a wrong answer
 * is never punished. The block simply does not land, the correct note is played so his
 * ear gets the answer rather than a scolding, and he tries again. There is no buzzer,
 * no timer, no score to lose, and no way to fail out of a round.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ROUNDS_PER_CHALLENGE,
  generateRound,
  isPlacementCorrect,
  isRoundSolved,
  nextBlankIndex,
  type ChallengeId,
  type Round,
} from '../challenges/generate'
import { isDegree, type Degree, type KeyName, type Slot } from '../music/scale'
import { playDegree, playSequence, stopSequence } from '../audio/engine'
import { BlockTower } from './BlockTower'
import { Palette } from './Palette'
import { StarRow } from './StarRow'

interface ChallengeScreenProps {
  id: ChallengeId
  musicKey: KeyName
  bpm: number
  earned: number
  onEarn: (stars: number) => void
  onBack: () => void
}

export function ChallengeScreen({
  id,
  musicKey,
  bpm,
  earned,
  onEarn,
  onBack,
}: ChallengeScreenProps) {
  const [round, setRound] = useState<Round>(() => generateRound(id))
  const [slots, setSlots] = useState<Slot[]>(() => [...round.given])
  /**
   * The authoritative placement. Two taps inside one render cycle would otherwise both
   * read the same `slots` snapshot, compute the same blank, and lose one of them —
   * which is exactly what a six-year-old mashing blocks produces.
   */
  const slotsRef = useRef<Slot[]>([...round.given])
  const [roundIndex, setRoundIndex] = useState(0)
  const [stars, setStars] = useState(earned)
  const [wrongAt, setWrongAt] = useState<number | null>(null)
  const [celebrating, setCelebrating] = useState(false)
  const [pulses, setPulses] = useState<Record<string, number>>({})
  const [busy, setBusy] = useState(false)
  const timers = useRef<number[]>([])

  const later = useCallback((work: () => void, delay: number) => {
    timers.current.push(window.setTimeout(work, delay))
  }, [])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(window.clearTimeout)
  }, [])

  const playPrompt = useCallback(
    (which: Round = round) => {
      if (which.prompt.length === 0) return
      setBusy(true)
      if (which.prompt.length === 1) {
        playDegree(which.prompt[0], musicKey)
        later(() => setBusy(false), 700)
        return
      }
      playSequence({
        slots: which.prompt,
        key: musicKey,
        bpm,
        onStep: () => undefined,
        onDone: () => setBusy(false),
      })
    },
    [bpm, later, musicKey, round],
  )

  // Ask the question as soon as the round opens.
  useEffect(() => {
    later(() => playPrompt(round), 350)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round])

  const startNextRound = useCallback(() => {
    const next = generateRound(id)
    setRound(next)
    slotsRef.current = [...next.given]
    setSlots([...next.given])
    setWrongAt(null)
    setCelebrating(false)
  }, [id])

  const handlePick = useCallback(
    (value: Degree | 'rest') => {
      if (celebrating || !isDegree(value)) return

      // Let him answer over the top of the question. Locking the palette until an
      // eight-note prompt finishes means four seconds of taps doing nothing, which to
      // a six-year-old is indistinguishable from the app being broken.
      if (busy) {
        stopSequence()
        setBusy(false)
      }

      const current = slotsRef.current
      const blank = nextBlankIndex(current, round.given)
      if (blank === -1) return

      const answerIndex = round.given.slice(0, blank).filter((slot) => slot === null).length

      setPulses((current) => ({ ...current, [value]: (current[value] ?? 0) + 1 }))

      if (!isPlacementCorrect(round, answerIndex, value)) {
        // Gentle correction: play what he chose, then the note that belongs there.
        playDegree(value, musicKey)
        setWrongAt(blank)
        later(() => playDegree(round.answer[answerIndex], musicKey), 520)
        later(() => setWrongAt(null), 900)
        return
      }

      playDegree(value, musicKey)
      const filled = [...current]
      filled[blank] = value
      slotsRef.current = filled
      setSlots(filled)

      if (!isRoundSolved(filled, round)) return

      setCelebrating(true)
      const nextStars = Math.min(ROUNDS_PER_CHALLENGE, Math.max(stars, roundIndex + 1))
      setStars(nextStars)
      onEarn(nextStars)

      later(() => {
        if (roundIndex + 1 >= ROUNDS_PER_CHALLENGE) {
          onBack()
        } else {
          setRoundIndex(roundIndex + 1)
          startNextRound()
        }
      }, 1500)
    },
    [
      busy,
      celebrating,
      later,
      musicKey,
      onBack,
      onEarn,
      round,
      roundIndex,
      stars,
      startNextRound,
    ],
  )

  return (
    // pt clears the fixed header, so the answer slots never sit under the stars.
    <div className="flex h-full w-full flex-col items-center justify-center gap-[2vh] px-3 pt-[8vh]">
      <div className="absolute top-2 right-3 left-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="Back to the challenge list"
          onPointerDown={(event) => {
            event.preventDefault()
            onBack()
          }}
          className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white/70"
          style={{ touchAction: 'manipulation' }}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
            <path
              d="M15 5l-7 7 7 7"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <StarRow earned={stars} />

        <button
          type="button"
          aria-label="Play it again"
          onPointerDown={(event) => {
            event.preventDefault()
            if (!busy) playPrompt()
          }}
          className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white"
          style={{ touchAction: 'manipulation' }}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
            <path d="M4 9v6h4l6 5V4L8 9H4z" fill="currentColor" />
            <path
              d="M17 8.5a5 5 0 0 1 0 7"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* The answer so far. Blanks are dashed; a wrong try shakes and stays empty. */}
      <div className="flex items-end justify-center gap-[1vw]">
        {round.given.map((given, index) => {
          const slot = slots[index]
          const isBlank = given === null
          return (
            <motion.div
              key={index}
              data-slot={index}
              data-filled={slot !== null}
              animate={wrongAt === index ? { x: [0, -8, 8, -5, 0] } : { x: 0 }}
              transition={{ duration: 0.35 }}
              className="flex h-[var(--challenge-slot-h)] flex-col justify-end rounded-xl border-2 px-1 pb-1"
              style={{
                minWidth: 'calc(var(--mini) * 4.5)',
                borderStyle: isBlank && slot === null ? 'dashed' : 'solid',
                borderColor:
                  wrongAt === index
                    ? 'rgba(255,140,140,0.9)'
                    : slot === null
                      ? 'rgba(255,255,255,0.25)'
                      : 'rgba(255,255,255,0.4)',
                background: 'rgba(255,255,255,0.06)',
              }}
            >
              {isDegree(slot) && (
                <div className="flex justify-center">
                  <BlockTower
                    degree={slot}
                    cubeSize="var(--mini)"
                    displayMode={round.letters ? 'letters' : 'numbers'}
                    musicKey={musicKey}
                    showFace={false}
                    pulse={celebrating ? index + 1 : 0}
                  />
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      <Palette
        displayMode={round.letters ? 'letters' : 'numbers'}
        musicKey={musicKey}
        pulses={pulses}
        disabled={celebrating}
        showRest={false}
        onPick={handlePick}
      />

      <AnimatePresence>
        {celebrating && (
          <motion.div
            // Decorative echo of the header, so it must not announce state twice.
            aria-hidden
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.4, opacity: 0 }}
            className="pointer-events-none absolute inset-0 grid place-items-center"
          >
            <StarRow earned={stars} size={64} announce={false} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
