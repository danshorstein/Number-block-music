/**
 * The composition strip (F3, F5).
 *
 * Slots hold scaled-down towers rather than flat chips, which means the melody's shape
 * is visible as a skyline — the tune's contour drawn in the same grammar as the notes.
 * Tap a placed block to take it back out.
 */

import { motion } from 'framer-motion'
import { isDegree, type Slot } from '../music/scale'
import { STRIP_LENGTH } from '../music/melodies'
import type { DisplayMode } from '../state/useAppState'
import { BlockTower } from './BlockTower'

interface SequenceStripProps {
  slots: Slot[]
  playingIndex: number | null
  displayMode: DisplayMode
  musicKey: 'C' | 'D' | 'Eb' | 'F' | 'G'
  onRemove: (index: number) => void
}

export function SequenceStrip({
  slots,
  playingIndex,
  displayMode,
  musicKey,
  onRemove,
}: SequenceStripProps) {
  return (
    <div className="flex w-full items-end justify-center gap-[0.8vw] px-2">
      {Array.from({ length: STRIP_LENGTH }, (_, index) => {
        const slot = slots[index] ?? null
        const isActive = playingIndex === index
        return (
          <motion.button
            key={index}
            type="button"
            aria-label={
              slot === null
                ? `Slot ${index + 1}, empty`
                : `Slot ${index + 1}, ${isDegree(slot) ? `degree ${slot}` : 'rest'} — tap to remove`
            }
            onPointerDown={(event) => {
              event.preventDefault()
              if (slot !== null) onRemove(index)
            }}
            animate={{ scale: isActive ? 1.12 : 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            className="flex h-[var(--strip-h)] max-w-[14vw] flex-1 flex-col justify-end
                       rounded-xl border-2 pb-1"
            style={{
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              borderStyle: slot === null ? 'dashed' : 'solid',
              borderColor: isActive
                ? 'rgba(255,255,255,0.9)'
                : slot === null
                  ? 'rgba(255,255,255,0.22)'
                  : 'rgba(255,255,255,0.35)',
              background: isActive ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.06)',
            }}
          >
            {slot !== null && (
              <div className="flex justify-center">
                <BlockTower
                  degree={isDegree(slot) ? slot : null}
                  cubeSize="var(--mini)"
                  displayMode={displayMode}
                  musicKey={musicKey}
                  showFace={false}
                  pulse={isActive ? index + 1 : 0}
                />
              </div>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
