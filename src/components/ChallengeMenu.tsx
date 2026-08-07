/**
 * The challenge picker. Pictograms only — he reads numbers fluently and words
 * haltingly, so nothing here depends on reading (§2, §6).
 */

import { motion } from 'framer-motion'
import { CHALLENGE_IDS, type ChallengeId } from '../challenges/generate'
import { colorFor } from '../music/colors'
import { StarRow } from './StarRow'

interface ChallengeMenuProps {
  progress: Record<ChallengeId, number>
  onPick: (id: ChallengeId) => void
  onBack: () => void
}

const LABELS: Record<ChallengeId, string> = {
  'step-skip': 'Steps and Skips — did it move next door or jump?',
  echo: 'Echo Me — listen and rebuild',
  staircase: 'Fill the Staircase — put them in order',
  'which-one': 'Which One Am I? — find the note you hear',
  finish: 'Finish the Song — supply the missing blocks',
  'name-that': 'Name That Block — find it by letter',
}

export function ChallengeMenu({ progress, onPick, onBack }: ChallengeMenuProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-[2vh] px-4">
      <button
        type="button"
        aria-label="Back to free play"
        onPointerDown={(event) => {
          event.preventDefault()
          onBack()
        }}
        className="absolute top-2 left-2 grid h-11 w-11 place-items-center rounded-full
                   bg-white/10 text-white/70"
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

      <div className="flex flex-wrap items-stretch justify-center gap-[1.5vw]">
        {CHALLENGE_IDS.map((id, index) => (
          <motion.button
            key={id}
            type="button"
            aria-label={LABELS[id]}
            onPointerDown={(event) => {
              event.preventDefault()
              onPick(id)
            }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex w-[min(26vw,150px)] flex-col items-center gap-3 rounded-3xl
                       bg-white/10 p-4 shadow-[0_6px_0_rgba(0,0,0,0.28)]"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          >
            <Pictogram id={id} />
            <StarRow earned={progress[id] ?? 0} size={20} />
          </motion.button>
        ))}
      </div>
    </div>
  )
}

const block = (degree: 1 | 3 | 5 | 8) => colorFor(degree).fill

function Pictogram({ id }: { id: ChallengeId }) {
  const common = {
    viewBox: '0 0 64 64',
    style: { height: 'min(16vh, 62px)', width: 'auto' },
  } as const

  switch (id) {
    case 'step-skip':
      return (
        <svg {...common}>
          <Speaker />
          <rect x="34" y="30" width="11" height="14" rx="3" fill={block(3)} />
          <rect x="47" y="18" width="11" height="26" rx="3" fill={block(8)} />
          <path
            d="M40 26 Q46 12 52 14"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="4 3"
            fill="none"
          />
        </svg>
      )
    case 'echo':
      return (
        <svg {...common}>
          <Speaker />
          <rect x="34" y="30" width="12" height="14" rx="3" fill={block(3)} />
          <rect x="48" y="22" width="12" height="22" rx="3" fill={block(5)} />
        </svg>
      )
    case 'staircase':
      return (
        <svg {...common}>
          {[1, 3, 5, 8].map((degree, i) => (
            <rect
              key={degree}
              x={6 + i * 14}
              y={44 - (i + 1) * 8}
              width="11"
              height={(i + 1) * 8}
              rx="3"
              fill={block(degree as 1)}
            />
          ))}
        </svg>
      )
    case 'which-one':
      return (
        <svg {...common}>
          <Speaker />
          <text
            x="46"
            y="42"
            textAnchor="middle"
            fontSize="30"
            fontWeight="900"
            fill="#FBD24A"
          >
            ?
          </text>
        </svg>
      )
    case 'finish':
      return (
        <svg {...common}>
          <rect x="6" y="26" width="12" height="18" rx="3" fill={block(1)} />
          <rect x="21" y="22" width="12" height="22" rx="3" fill={block(3)} />
          <rect
            x="36"
            y="20"
            width="12"
            height="24"
            rx="3"
            fill="none"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="2.5"
            strokeDasharray="4 3"
          />
        </svg>
      )
    case 'name-that':
      return (
        <svg {...common}>
          <Speaker />
          <text
            x="46"
            y="42"
            textAnchor="middle"
            fontSize="26"
            fontWeight="900"
            fill="#FFFFFF"
          >
            C
          </text>
        </svg>
      )
  }
}

function Speaker() {
  return (
    <g fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinejoin="round">
      <path d="M6 26v12h6l8 7V19l-8 7H6z" fill="#FFFFFF" />
      <path d="M24 24a10 10 0 0 1 0 16" strokeLinecap="round" />
    </g>
  )
}
