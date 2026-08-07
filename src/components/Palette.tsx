/**
 * The staircase: degrees 1–8 left to right, plus the rest pad (F1).
 *
 * Every tower sits in a column of identical height, and the whole column is the tap
 * target. Without that, degree 1 — the shortest tower and the one he taps most — would
 * have the smallest hit area on the screen.
 */

import type { CSSProperties } from 'react'
import { DEGREES, REST, type Degree } from '../music/scale'
import type { DisplayMode } from '../state/useAppState'
import { BlockTower } from './BlockTower'

interface PaletteProps {
  /** Which towers to offer. Pentatonic drops 4 and 7, so nothing can sound wrong. */
  degrees?: readonly Degree[]
  displayMode: DisplayMode
  musicKey: 'C' | 'D' | 'Eb' | 'F' | 'G'
  pulses: Record<string, number>
  disabled?: boolean
  /** Challenges never ask for a rest, so the pad would only be a dead end there. */
  showRest?: boolean
  onPick: (value: Degree | typeof REST) => void
}

export function Palette({
  degrees = DEGREES,
  displayMode,
  musicKey,
  pulses,
  disabled,
  showRest = true,
  onPick,
}: PaletteProps) {
  // Reserve height for the tallest tower actually on offer, not always for eight. In
  // pentatonic the top of the staircase is 6, and holding two cubes of empty air above
  // it pushes everything else down for nothing.
  const tallest = degrees.reduce<number>((max, degree) => Math.max(max, degree), 1)

  return (
    <div
      className="flex w-full items-end justify-center gap-[0.6vw] px-2"
      style={{ '--palette-h': `calc(var(--cube) * ${tallest + 0.6})` } as CSSProperties}
    >
      {degrees.map((degree) => (
        <PaletteColumn
          key={degree}
          label={`Degree ${degree}`}
          disabled={disabled}
          onPick={() => onPick(degree)}
        >
          <BlockTower
            degree={degree}
            cubeSize="var(--cube)"
            displayMode={displayMode}
            musicKey={musicKey}
            pulse={pulses[String(degree)] ?? 0}
          />
        </PaletteColumn>
      ))}

      {/* Set apart from the staircase, because silence is not a pitch. */}
      {showRest && (
        <div className="ml-[1.5vw] flex h-full items-end">
          <PaletteColumn label="Rest" disabled={disabled} onPick={() => onPick(REST)}>
            <BlockTower
              degree={null}
              cubeSize="var(--cube)"
              showFace={false}
              pulse={pulses[REST] ?? 0}
            />
          </PaletteColumn>
        </div>
      )}
    </div>
  )
}

function PaletteColumn({
  children,
  label,
  disabled,
  onPick,
}: {
  children: React.ReactNode
  label: string
  disabled?: boolean
  onPick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      // pointerdown, not click: §7 requires the note on touch-down.
      onPointerDown={(event) => {
        event.preventDefault()
        if (!disabled) onPick()
      }}
      className="flex h-[var(--palette-h)] min-w-[var(--tap)] flex-col justify-end rounded-2xl
                 transition-colors disabled:opacity-60
                 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70"
      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
    >
      {children}
    </button>
  )
}
