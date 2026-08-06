/**
 * The tap-to-start gate (§7).
 *
 * This screen is not decoration. iOS Safari refuses to start an audio context outside a
 * user gesture, and every sample must finish decoding before the first tap — otherwise
 * the app looks broken in exactly the way the requirements warn about. It also satisfies
 * §9's "audio never autoplays on load".
 *
 * Textless: a staircase that bounces, and a big green play button.
 */

import { motion } from 'framer-motion'
import { DEGREES } from '../music/scale'
import { colorFor } from '../music/colors'

interface StartSplashProps {
  status: 'idle' | 'loading' | 'error'
  /** Parent-facing detail, shown only when something actually broke. */
  errorDetail?: string
  onStart: () => void
}

export function StartSplash({ status, errorDetail, onStart }: StartSplashProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-[#1b1136]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.35 }}
    >
      <button
        type="button"
        aria-label="Tap to start"
        // This is the ONE control in the app that must not unlock on pointerdown.
        // On iOS, pointerdown comes from touchstart, which does not grant user
        // activation — WebKit only grants it when the finger lifts. Calling
        // preventDefault() there also suppresses the click that would have granted it,
        // so the audio context never resumes and every later tap is silent.
        // Everything else stays on pointerdown for latency; by then audio is unlocked.
        onClick={() => {
          if (status !== 'loading') onStart()
        }}
        className="flex flex-col items-center gap-[4vh] p-8 focus-visible:outline
                   focus-visible:outline-2 focus-visible:outline-white/70"
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
      >
        <div className="flex items-end gap-[1.2vw]">
          {DEGREES.map((degree) => (
            <motion.div
              key={degree}
              className="rounded-[22%]"
              style={{
                width: 'var(--splash-cube)',
                height: `calc(var(--splash-cube) * ${degree})`,
                background: colorFor(degree).fill,
                boxShadow: `inset 0 -6px 0 ${colorFor(degree).side}`,
              }}
              animate={
                status === 'loading'
                  ? { y: [0, -10, 0], opacity: [0.55, 1, 0.55] }
                  : { y: [0, -14, 0] }
              }
              transition={{
                duration: status === 'loading' ? 0.7 : 1.6,
                repeat: Infinity,
                delay: degree * 0.09,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {status !== 'loading' && (
          <motion.span
            className="grid h-[var(--btn-lg-h)] w-[var(--btn-lg-w)] place-items-center rounded-full
                       bg-emerald-400 text-emerald-950 shadow-[0_6px_0_#0d7a52]"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg
              viewBox="0 0 24 24"
              style={{
                width: 'calc(var(--btn-lg-h) * 0.45)',
                height: 'calc(var(--btn-lg-h) * 0.45)',
              }}
            >
              <path d="M7 4.5 20 12 7 19.5Z" fill="currentColor" />
            </svg>
          </motion.span>
        )}

        {status === 'error' && (
          <span className="max-w-xs text-center text-sm text-white/70">
            Audio could not start. Tap to try again.
            {errorDetail && (
              <span className="mt-2 block font-mono text-xs break-words text-white/45">
                {errorDetail}
              </span>
            )}
          </span>
        )}
      </button>
    </motion.div>
  )
}
