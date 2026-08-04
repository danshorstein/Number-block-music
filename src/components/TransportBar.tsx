/**
 * Play, tempo, clear, surprise (F4, F6, F8, F5).
 *
 * Icons only — no text anywhere a child can see it (§6). Tempo is a turtle/rabbit/hare
 * cycle rather than a BPM slider, because a number of beats per minute means nothing
 * to a six-year-old.
 */

import { TEMPOS, type TempoId } from '../state/useAppState'

interface TransportBarProps {
  isPlaying: boolean
  canPlay: boolean
  tempo: TempoId
  onTogglePlay: () => void
  onCycleTempo: () => void
  onClear: () => void
  onSurprise: () => void
}

export function TransportBar({
  isPlaying,
  canPlay,
  tempo,
  onTogglePlay,
  onCycleTempo,
  onClear,
  onSurprise,
}: TransportBarProps) {
  return (
    <div className="flex w-full items-center justify-center gap-[2vw] px-3">
      <RoundButton label="Surprise me" onPress={onSurprise} tone="soft">
        <DiceIcon />
      </RoundButton>

      <RoundButton label="Slower or faster" onPress={onCycleTempo} tone="soft">
        <TempoIcon tempo={tempo} />
      </RoundButton>

      <RoundButton
        label={isPlaying ? 'Stop' : 'Play'}
        onPress={onTogglePlay}
        disabled={!canPlay && !isPlaying}
        tone="primary"
        big
      >
        {isPlaying ? <StopIcon /> : <PlayIcon />}
      </RoundButton>

      <RoundButton label="Clear" onPress={onClear} disabled={!canPlay} tone="soft">
        <BroomIcon />
      </RoundButton>
    </div>
  )
}

function RoundButton({
  children,
  label,
  onPress,
  disabled,
  tone,
  big,
}: {
  children: React.ReactNode
  label: string
  onPress: () => void
  disabled?: boolean
  tone: 'primary' | 'soft'
  big?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onPointerDown={(event) => {
        event.preventDefault()
        if (!disabled) onPress()
      }}
      className={[
        'grid place-items-center rounded-full transition active:scale-95 disabled:opacity-35',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70',
        big
          ? 'h-[var(--btn-lg-h)] w-[var(--btn-lg-w)]'
          : 'h-[var(--btn-h)] w-[var(--btn-w)]',
        tone === 'primary'
          ? 'bg-emerald-400 text-emerald-950 shadow-[0_6px_0_#0d7a52]'
          : 'bg-white/15 text-white shadow-[0_5px_0_rgba(0,0,0,0.3)]',
      ].join(' ')}
      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Explicit size, not a percentage: a percentage height has nothing to resolve
          against in an auto-sized grid row, and the SVG falls back to its intrinsic
          size and bursts out of the button. */}
      <span
        className="grid place-items-center"
        style={{
          width: big ? 'calc(var(--btn-lg-h) * 0.5)' : 'calc(var(--btn-h) * 0.5)',
          height: big ? 'calc(var(--btn-lg-h) * 0.5)' : 'calc(var(--btn-h) * 0.5)',
        }}
      >
        {children}
      </span>
    </button>
  )
}

const svg = {
  viewBox: '0 0 24 24',
  width: '100%',
  height: '100%',
  fill: 'none',
} as const

function PlayIcon() {
  return (
    <svg {...svg}>
      <path d="M7 4.5 20 12 7 19.5Z" fill="currentColor" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg {...svg}>
      <rect x="5" y="5" width="14" height="14" rx="3" fill="currentColor" />
    </svg>
  )
}

function BroomIcon() {
  return (
    <svg {...svg} stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
      <path d="M19 4 11 12" />
      <path d="M4.5 20.5c2-5 4.5-7.5 9.5-9.5l1.5 4c-2 5-4.5 7-9.5 9Z" strokeLinejoin="round" />
    </svg>
  )
}

function DiceIcon() {
  return (
    <svg {...svg}>
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="4"
        stroke="currentColor"
        strokeWidth={2.2}
      />
      <circle cx="9" cy="9" r="1.7" fill="currentColor" />
      <circle cx="15" cy="15" r="1.7" fill="currentColor" />
      <circle cx="15" cy="9" r="1.7" fill="currentColor" />
      <circle cx="9" cy="15" r="1.7" fill="currentColor" />
    </svg>
  )
}

/** One, two or three chevrons — speed without a number attached to it. */
function TempoIcon({ tempo }: { tempo: TempoId }) {
  const count = TEMPOS.findIndex((t) => t.id === tempo) + 1
  return (
    <svg {...svg} stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
      {Array.from({ length: count }, (_, i) => (
        <path key={i} d={`M${5 + i * 6} 6.5 L${11 + i * 6} 12 L${5 + i * 6} 17.5`} />
      ))}
    </svg>
  )
}
