/**
 * Eight towers at a comfortable size need more width than a phone has in portrait
 * (8 × 60px = 480px against roughly 390px). Rather than break the staircase into two
 * rows — which would cost the "taller is higher" reading the whole app depends on —
 * a phone in portrait gets asked, wordlessly, to turn sideways.
 *
 * Tablets and desktops never see this.
 */

import { motion } from 'framer-motion'
import { colorFor } from '../music/colors'

export function RotateNudge() {
  return (
    // Above the splash (z-50): there is no point unlocking audio in an orientation the
    // app cannot be played in. Turn the phone first, then start.
    <div className="portrait-only fixed inset-0 z-60 bg-[#1b1136]">
      <motion.div
        className="flex flex-col items-center gap-8"
        animate={{ rotate: [0, 0, 90, 90, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, times: [0, 0.25, 0.55, 0.85, 1] }}
      >
        <div className="flex items-end gap-2">
          {[1, 3, 5, 8].map((degree) => (
            <div
              key={degree}
              className="w-9 rounded-[22%]"
              style={{
                height: `${degree * 18}px`,
                background: colorFor(degree as 1).fill,
                boxShadow: `inset 0 -5px 0 ${colorFor(degree as 1).side}`,
              }}
            />
          ))}
        </div>
        <svg viewBox="0 0 24 24" className="h-12 w-12 text-white/80" fill="none">
          <path
            d="M4 12a8 8 0 1 1 2.5 5.8"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
          />
          <path d="M3 8.5V13h4.5" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
    </div>
  )
}
