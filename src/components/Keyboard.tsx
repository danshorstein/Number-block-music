/**
 * The keyboard bridge (Phase 2 §4.1).
 *
 * The app teaches block → sound. The piano needs block → key → sound, and that middle
 * link currently lives only on the printed stickers. This closes it.
 *
 * It is deliberately a **display, not an instrument**: it lights up when a block sounds
 * and cannot be played. A fully playable on-screen piano would compete with the real one
 * in the room, and transfer to that piano is the entire point of the project (§3 G4).
 *
 * The black keys are drawn even though the app is diatonic, because "the white key just
 * left of the two black keys" is how a person actually finds C. That single fact
 * transfers further than any amount of colour matching, and nothing else in the app
 * teaches it.
 */

import { motion } from 'framer-motion'
import { colorFor } from '../music/colors'
import { degreeToLetter, type Degree, type KeyName } from '../music/scale'
import type { DisplayMode } from '../state/useAppState'

/** White keys of one octave, C to C, as scale degrees in the current key. */
const WHITE_KEYS: readonly Degree[] = [1, 2, 3, 4, 5, 6, 7, 8]

/**
 * Which white keys have a black key to their right. In every octave the pattern is
 * two-then-three: gaps after E (degree 3) and after B (degree 7).
 */
const HAS_BLACK_KEY_AFTER = new Set<Degree>([1, 2, 4, 5, 6])

interface KeyboardProps {
  /** Degrees the child's palette currently offers; others render unlit and muted. */
  available: readonly Degree[]
  /** The degree sounding right now, if any. */
  sounding: Degree | null
  displayMode: DisplayMode
  musicKey: KeyName
  /** Colour is a scaffold meant to come off — see the display ladder in §4.3. */
  colored?: boolean
}

export function Keyboard({
  available,
  sounding,
  displayMode,
  musicKey,
  colored = true,
}: KeyboardProps) {
  return (
    <div
      className="relative mx-auto flex shrink-0 justify-center"
      style={{ height: 'var(--kbd-h)' }}
      aria-label="Piano keyboard, C to C"
    >
      {WHITE_KEYS.map((degree) => {
        const color = colorFor(degree)
        const isAvailable = available.includes(degree)
        const isSounding = sounding === degree

        return (
          <div key={degree} className="relative" style={{ width: 'var(--kbd-key-w)' }}>
            <motion.div
              animate={{
                y: isSounding ? 3 : 0,
                filter: isSounding ? 'brightness(1.25)' : 'brightness(1)',
              }}
              transition={{ type: 'spring', stiffness: 700, damping: 22 }}
              className="flex h-full w-full flex-col justify-end rounded-b-[4px] border border-black/25"
              style={{
                background: '#F7F5FB',
                opacity: isAvailable ? 1 : 0.45,
                boxShadow: isSounding
                  ? `inset 0 -6px 0 ${color.side}, 0 0 12px ${color.fill}`
                  : 'inset 0 -3px 0 rgba(0,0,0,0.18)',
              }}
            >
              {/* The sticker. Same colour as the one on the real piano. */}
              {isAvailable && (
                <span
                  className="mx-auto grid place-items-center rounded-full"
                  style={{
                    width: 'var(--kbd-dot)',
                    height: 'var(--kbd-dot)',
                    marginBottom: 'calc(var(--kbd-dot) * 0.2)',
                    background: colored ? color.fill : 'transparent',
                    border: colored ? 'none' : '1.5px solid rgba(0,0,0,0.35)',
                    color: colored ? color.ink : '#2A2438',
                    fontSize: 'calc(var(--kbd-dot) * 0.62)',
                    fontWeight: 900,
                    lineHeight: 1,
                    boxShadow: color.glow && colored ? `0 0 0 2px ${color.glow}` : undefined,
                  }}
                >
                  {displayMode === 'letters'
                    ? degreeToLetter(degree, musicKey)
                    : degree}
                </span>
              )}
            </motion.div>

            {/* Black keys sit between whites, overlapping the seam on the right. */}
            {HAS_BLACK_KEY_AFTER.has(degree) && (
              <div
                aria-hidden
                className="pointer-events-none absolute top-0 rounded-b-[3px]"
                style={{
                  left: 'calc(var(--kbd-key-w) * 0.66)',
                  width: 'calc(var(--kbd-key-w) * 0.62)',
                  height: '62%',
                  background: '#241C38',
                  boxShadow: 'inset 0 -3px 0 rgba(255,255,255,0.14)',
                  zIndex: 2,
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
