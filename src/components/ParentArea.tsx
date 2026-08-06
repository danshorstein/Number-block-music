/**
 * The grown-up panel (§6). Gated behind a press-and-hold so it can't be opened by an
 * accidental tap — trivially defeatable is fine, it only has to survive a six-year-old
 * exploring the screen with his thumbs.
 *
 * Text is allowed in here and nowhere else.
 */

import { useCallback, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { KEY_NAMES, type KeyName } from '../music/scale'
import { isSpeechAvailable } from '../audio/voice'
import type { DisplayMode, Settings } from '../state/useAppState'

const HOLD_MS = 800

const DISPLAY_MODES: { id: DisplayMode; label: string; hint: string }[] = [
  { id: 'numbers', label: '1', hint: 'Numbers only — the entry point' },
  { id: 'both', label: '1 C', hint: 'Numbers with letters — the bridge' },
  { id: 'letters', label: 'C', hint: 'Letters only — his teacher’s vocabulary' },
]

interface ParentAreaProps {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
}

export function ParentArea({ settings, onChange }: ParentAreaProps) {
  const [open, setOpen] = useState(false)
  const [holdProgress, setHoldProgress] = useState(0)
  const holdTimer = useRef<number | null>(null)
  const rafId = useRef<number | null>(null)

  const cancelHold = useCallback(() => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current)
    if (rafId.current) cancelAnimationFrame(rafId.current)
    holdTimer.current = null
    rafId.current = null
    setHoldProgress(0)
  }, [])

  const beginHold = useCallback(() => {
    const startedAt = performance.now()
    const tick = () => {
      const elapsed = performance.now() - startedAt
      setHoldProgress(Math.min(1, elapsed / HOLD_MS))
      if (elapsed < HOLD_MS) rafId.current = requestAnimationFrame(tick)
    }
    rafId.current = requestAnimationFrame(tick)
    holdTimer.current = window.setTimeout(() => {
      cancelHold()
      setOpen(true)
    }, HOLD_MS)
  }, [cancelHold])

  return (
    <>
      <button
        type="button"
        aria-label="Grown-ups — press and hold"
        onPointerDown={beginHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        className="absolute top-2 right-2 z-30 grid h-11 w-11 place-items-center rounded-full
                   text-white/25 transition hover:text-white/60"
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth={2} />
          <path
            d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M18 6l-1.6 1.6M7.6 16.4 6 18M18 18l-1.6-1.6M7.6 7.6 6 6"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </svg>
        {holdProgress > 0 && (
          <svg viewBox="0 0 40 40" className="absolute inset-0 h-full w-full -rotate-90">
            <circle
              cx="20"
              cy="20"
              r="17"
              fill="none"
              stroke="rgba(255,255,255,0.8)"
              strokeWidth={3}
              strokeDasharray={107}
              strokeDashoffset={107 * (1 - holdProgress)}
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onPointerDown={() => setOpen(false)}
          >
            <motion.div
              className="max-h-full w-full max-w-md overflow-y-auto rounded-3xl bg-[#251a45]
                         p-6 text-white shadow-2xl"
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-bold">Grown-ups</h2>
                <button
                  type="button"
                  onPointerDown={() => setOpen(false)}
                  className="rounded-full px-3 py-1 text-sm text-white/70 hover:bg-white/10"
                >
                  Done
                </button>
              </div>

              <Field label="What the blocks say">
                <div className="flex gap-2">
                  {DISPLAY_MODES.map((mode) => (
                    <Choice
                      key={mode.id}
                      active={settings.displayMode === mode.id}
                      onSelect={() => onChange({ displayMode: mode.id })}
                    >
                      {mode.label}
                    </Choice>
                  ))}
                </div>
                <p className="mt-2 text-xs text-white/50">
                  {DISPLAY_MODES.find((m) => m.id === settings.displayMode)?.hint}
                </p>
              </Field>

              <Field label="Key">
                <div className="flex flex-wrap gap-2">
                  {KEY_NAMES.map((key) => (
                    <Choice
                      key={key}
                      active={settings.key === key}
                      onSelect={() => onChange({ key: key as KeyName })}
                    >
                      {key}
                    </Choice>
                  ))}
                </div>
                <p className="mt-2 text-xs text-white/50">
                  Blocks are scale degrees, so the colors and numbers mean the same thing
                  in every key. Start in C to match the piano stickers.
                </p>
              </Field>

              <Field label="Volume">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.volume}
                  onChange={(event) => onChange({ volume: Number(event.target.value) })}
                  className="w-full accent-emerald-400"
                />
              </Field>

              <Field label="Take it to the real piano">
                <a
                  href={`${import.meta.env.BASE_URL}print/`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block rounded-xl bg-emerald-400 px-4 py-2 text-sm
                             font-bold text-emerald-950"
                >
                  Open the print pack
                </a>
                <p className="mt-2 text-xs text-white/50">
                  Key stickers at true scale, a music-stand chart, a one-page note for his
                  teacher, and six songs in real notation with the noteheads coloured to
                  match the blocks. Print at 100% scale or the stickers won’t fit the keys.
                </p>
              </Field>

              {isSpeechAvailable() && (
                <Field label="Say the name out loud">
                  <div className="flex gap-2">
                    <Choice active={!settings.voice} onSelect={() => onChange({ voice: false })}>
                      Off
                    </Choice>
                    <Choice active={settings.voice} onSelect={() => onChange({ voice: true })}>
                      On
                    </Choice>
                  </div>
                  <p className="mt-2 text-xs text-white/50">
                    Off by default — a spoken “three” competes with the note it is naming.
                  </p>
                </Field>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="mb-2 text-sm font-semibold text-white/80">{label}</div>
      {children}
    </div>
  )
}

function Choice({
  children,
  active,
  onSelect,
}: {
  children: React.ReactNode
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onPointerDown={onSelect}
      className={[
        'min-w-11 rounded-xl px-3 py-2 text-sm font-bold transition',
        active ? 'bg-emerald-400 text-emerald-950' : 'bg-white/10 text-white/80 hover:bg-white/20',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
