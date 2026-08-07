/**
 * Steps and Skips.
 *
 * The child hears two notes and says how the tune moved: next door, or a jump. Kodály
 * puts this before naming any pitch, because hearing *movement* is what reading a
 * melodic line actually needs, and it arrives earlier than pitch identification does.
 *
 * Answered by choosing rather than by placing blocks, so it gets its own screen instead
 * of bending the placement flow out of shape. F14 still applies: a wrong answer replays
 * the two notes and costs nothing.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ROUNDS_PER_CHALLENGE,
  generateRound,
  type Move,
  type Round,
} from '../challenges/generate'
import { colorFor } from '../music/colors'
import type { Degree, KeyName } from '../music/scale'
import { playSequence, stopSequence } from '../audio/engine'
import { StarRow } from './StarRow'

interface StepSkipScreenProps {
  musicKey: KeyName
  bpm: number
  degrees: readonly Degree[]
  earned: number
  onEarn: (stars: number) => void
  onBack: () => void
}

export function StepSkipScreen({
  musicKey,
  bpm,
  degrees,
  earned,
  onEarn,
  onBack,
}: StepSkipScreenProps) {
  const [round, setRound] = useState<Round>(() => generateRound('step-skip', { degrees }))
  const [roundIndex, setRoundIndex] = useState(0)
  const [stars, setStars] = useState(earned)
  const [wrong, setWrong] = useState<Move | null>(null)
  const [celebrating, setCelebrating] = useState(false)
  const timers = useRef<number[]>([])

  const later = useCallback((work: () => void, delay: number) => {
    timers.current.push(window.setTimeout(work, delay))
  }, [])

  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach(window.clearTimeout)
      stopSequence()
    }
  }, [])

  const playPrompt = useCallback(
    (which: Round = round) => {
      playSequence({
        slots: which.prompt,
        key: musicKey,
        bpm,
        onStep: () => undefined,
      })
    },
    [bpm, musicKey, round],
  )

  useEffect(() => {
    later(() => playPrompt(round), 350)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round])

  const answer = useCallback(
    (choice: Move) => {
      if (celebrating) return

      if (choice !== round.move) {
        // Gentle: play it again so the ear gets another go, and take nothing away.
        setWrong(choice)
        later(() => playPrompt(), 250)
        later(() => setWrong(null), 900)
        return
      }

      setCelebrating(true)
      const nextStars = Math.min(ROUNDS_PER_CHALLENGE, Math.max(stars, roundIndex + 1))
      setStars(nextStars)
      onEarn(nextStars)

      later(() => {
        if (roundIndex + 1 >= ROUNDS_PER_CHALLENGE) {
          onBack()
          return
        }
        setRoundIndex(roundIndex + 1)
        setRound(generateRound('step-skip', { degrees }))
        setCelebrating(false)
      }, 1400)
    },
    [celebrating, degrees, later, onBack, onEarn, playPrompt, round.move, roundIndex, stars],
  )

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-[4vh] px-3 pt-[8vh]">
      <div className="absolute top-2 right-3 left-3 flex items-center justify-between">
        <IconButton label="Back to the challenge list" onPress={onBack}>
          <path
            d="M15 5l-7 7 7 7"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </IconButton>

        <StarRow earned={stars} />

        <IconButton label="Play it again" onPress={() => playPrompt()} bright>
          <path d="M4 9v6h4l6 5V4L8 9H4z" fill="currentColor" />
          <path
            d="M17 8.5a5 5 0 0 1 0 7"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        </IconButton>
      </div>

      <div className="flex items-end justify-center gap-[6vw]">
        <MoveChoice
          move="step"
          shaking={wrong === 'step'}
          disabled={celebrating}
          onSelect={() => answer('step')}
        />
        <MoveChoice
          move="skip"
          shaking={wrong === 'skip'}
          disabled={celebrating}
          onSelect={() => answer('skip')}
        />
      </div>

      <AnimatePresence>
        {celebrating && (
          <motion.div
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

/**
 * The two answers, drawn rather than written: neighbouring blocks for a step, blocks
 * with a gap between them for a skip.
 */
function MoveChoice({
  move,
  shaking,
  disabled,
  onSelect,
}: {
  move: Move
  shaking: boolean
  disabled?: boolean
  onSelect: () => void
}) {
  const low = colorFor(3)
  const high = colorFor(move === 'step' ? 4 : 6)

  return (
    <motion.button
      type="button"
      aria-label={move === 'step' ? 'Step — next door' : 'Skip — a jump'}
      disabled={disabled}
      onPointerDown={(event) => {
        event.preventDefault()
        if (!disabled) onSelect()
      }}
      animate={shaking ? { x: [0, -9, 9, -6, 0] } : { x: 0 }}
      transition={{ duration: 0.36 }}
      whileTap={{ scale: 0.95 }}
      className="flex flex-col items-center justify-end gap-3 rounded-3xl bg-white/10 p-4
                 shadow-[0_6px_0_rgba(0,0,0,0.28)] disabled:opacity-60"
      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Step: the two towers touch. Skip: they are visibly apart, and the second is
          much taller. The difference has to be legible without reading anything. */}
      <div
        className="flex items-end"
        style={{
          height: 'calc(var(--cube) * 6.4)',
          gap: move === 'step' ? '3px' : 'calc(var(--cube) * 1.3)',
        }}
      >
        <Bar height={3} color={low.fill} shade={low.side} />
        <Bar height={move === 'step' ? 4 : 6} color={high.fill} shade={high.side} />
      </div>
    </motion.button>
  )
}

function Bar({ height, color, shade }: { height: number; color: string; shade: string }) {
  return (
    <div
      style={{
        width: 'var(--cube)',
        height: `calc(var(--cube) * ${height})`,
        background: color,
        borderRadius: 'calc(var(--cube) * 0.22)',
        boxShadow: `inset 0 calc(var(--cube) * -0.16) 0 ${shade}`,
      }}
    />
  )
}

function IconButton({
  children,
  label,
  onPress,
  bright,
}: {
  children: React.ReactNode
  label: string
  onPress: () => void
  bright?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(event) => {
        event.preventDefault()
        onPress()
      }}
      className={`grid h-11 w-11 place-items-center rounded-full ${
        bright ? 'bg-white/15 text-white' : 'bg-white/10 text-white/70'
      }`}
      style={{ touchAction: 'manipulation' }}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        {children}
      </svg>
    </button>
  )
}
