import { motion } from 'framer-motion'
import { ROUNDS_PER_CHALLENGE } from '../challenges/generate'

/**
 * Three stars, filled by rounds finished (F14).
 *
 * They count completion, never correctness — a round he needed three tries on earns
 * the same star as one he got first time. There is nothing here to lose.
 */
export function StarRow({
  earned,
  size = 26,
  /** Decorative copies must stay silent, or the count gets announced twice. */
  announce = true,
}: {
  earned: number
  size?: number
  announce?: boolean
}) {
  return (
    <div
      className="flex gap-1"
      aria-hidden={!announce}
      aria-label={announce ? `${earned} of ${ROUNDS_PER_CHALLENGE} stars` : undefined}
    >
      {Array.from({ length: ROUNDS_PER_CHALLENGE }, (_, index) => {
        const filled = index < earned
        return (
          <motion.svg
            key={index}
            viewBox="0 0 24 24"
            width={size}
            height={size}
            initial={false}
            animate={filled ? { scale: [1, 1.45, 1], rotate: [0, 12, 0] } : { scale: 1 }}
            transition={{ duration: 0.45, delay: index * 0.06 }}
          >
            <path
              d="M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.05 1.1-6.5-4.7-4.6 6.5-.95z"
              fill={filled ? '#FBD24A' : 'rgba(255,255,255,0.13)'}
              stroke={filled ? '#D9AE28' : 'rgba(255,255,255,0.28)'}
              strokeWidth={1.4}
              strokeLinejoin="round"
            />
          </motion.svg>
        )
      })}
    </div>
  )
}
