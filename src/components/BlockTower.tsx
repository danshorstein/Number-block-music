/**
 * A tower of N cubes — scale degree N made visible.
 *
 * Height is the whole argument: degree 5 is drawn taller than degree 3 because it
 * genuinely sounds higher. Nothing here may break that correspondence.
 */

import { useEffect, useState } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { colorFor, REST_COLOR, type BlockColor } from '../music/colors'
import { degreeToLetter, type Degree, type KeyName } from '../music/scale'
import type { DisplayMode } from '../state/useAppState'

interface BlockTowerProps {
  /** null renders the rest pad — one flat, colorless cube. */
  degree: Degree | null
  cubeSize: string
  displayMode?: DisplayMode
  musicKey?: KeyName
  showFace?: boolean
  /** Bump this number to make the tower squash and sing. */
  pulse?: number
  dimmed?: boolean
}

export function BlockTower({
  degree,
  cubeSize,
  displayMode = 'numbers',
  musicKey = 'C',
  showFace = true,
  pulse = 0,
  dimmed = false,
}: BlockTowerProps) {
  const controls = useAnimationControls()
  const [isSinging, setIsSinging] = useState(false)
  const color: BlockColor = degree === null ? REST_COLOR : colorFor(degree)
  const height = degree ?? 1
  // Degree 1 is a single cube, so its face and its numeral have to share one square.
  // Both get pushed apart rather than overlapping into a smudge.
  const isSingleCube = height === 1 && showFace

  useEffect(() => {
    if (pulse === 0) return

    setIsSinging(true)
    controls.start({
      scaleY: [1, 0.82, 1.06, 1],
      scaleX: [1, 1.14, 0.96, 1],
      transition: { duration: 0.42, times: [0, 0.18, 0.5, 1], ease: 'easeOut' },
    })

    const timer = window.setTimeout(() => setIsSinging(false), 420)
    return () => window.clearTimeout(timer)
  }, [pulse, controls])

  return (
    <motion.div
      animate={controls}
      className="flex flex-col-reverse items-center justify-start"
      style={{
        transformOrigin: 'bottom center',
        opacity: dimmed ? 0.55 : 1,
        filter: color.glow ? `drop-shadow(0 0 ${cubeSize} ${color.glow}66)` : undefined,
      }}
    >
      {Array.from({ length: height }, (_, index) => {
        const isTop = index === height - 1
        const isBottom = index === 0
        return (
          <div
            key={index}
            style={{
              width: cubeSize,
              height: cubeSize,
              background: color.fill,
              borderRadius: `calc(${cubeSize} * 0.22)`,
              // A fake bevel: lit top edge, shaded bottom lip. Cheaper than real 3D and
              // it survives being scaled down into the sequence strip.
              boxShadow: [
                `inset 0 calc(${cubeSize} * -0.16) 0 ${color.side}`,
                `inset 0 calc(${cubeSize} * 0.1) 0 ${color.top}`,
                color.glow
                  ? `0 0 0 calc(${cubeSize} * 0.07) ${color.glow}`
                  : `0 calc(${cubeSize} * 0.04) 0 rgba(0,0,0,0.22)`,
              ].join(', '),
              marginTop: `calc(${cubeSize} * -0.02)`,
              position: 'relative',
            }}
          >
            {isTop && showFace && (
              <Face singing={isSinging} ink={color.ink} compact={isSingleCube} />
            )}
            {isBottom && degree !== null && (
              <Glyph
                cubeSize={cubeSize}
                ink={color.ink}
                compact={isSingleCube}
                text={
                  displayMode === 'letters'
                    ? degreeToLetter(degree, musicKey)
                    : String(degree)
                }
              />
            )}
            {isBottom && degree === null && <RestGlyph cubeSize={cubeSize} ink={color.ink} />}
          </div>
        )
      })}

      {/* The bridge rung of §4.3: the letter rides under the numeral, small. */}
      {degree !== null && displayMode === 'both' && (
        <div
          aria-hidden
          style={{
            color: '#F4F1FF',
            fontSize: `calc(${cubeSize} * 0.36)`,
            fontWeight: 800,
            lineHeight: 1,
            marginBottom: `calc(${cubeSize} * 0.12)`,
          }}
        >
          {degreeToLetter(degree, musicKey)}
        </div>
      )}
    </motion.div>
  )
}

function Glyph({
  cubeSize,
  ink,
  text,
  compact,
}: {
  cubeSize: string
  ink: string
  text: string
  compact?: boolean
}) {
  return (
    <span
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: compact ? 'end center' : 'center',
        color: ink,
        fontSize: `calc(${cubeSize} * ${compact ? 0.38 : 0.52})`,
        fontWeight: 900,
        lineHeight: 1,
        paddingBottom: `calc(${cubeSize} * ${compact ? 0.1 : 0.08})`,
      }}
    >
      {text}
    </span>
  )
}

/** Two dots and a pause bar: silence, drawn so it can never read as a pitch. */
function RestGlyph({ cubeSize, ink }: { cubeSize: string; ink: string }) {
  return (
    <span
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        paddingBottom: `calc(${cubeSize} * 0.08)`,
      }}
    >
      <svg
        width={`calc(${cubeSize} * 0.5)`}
        height={`calc(${cubeSize} * 0.5)`}
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M4 9h16"
          stroke={ink}
          strokeWidth={3.5}
          strokeLinecap="round"
        />
        <circle cx="8" cy="16" r="2" fill={ink} />
        <circle cx="16" cy="16" r="2" fill={ink} />
      </svg>
    </span>
  )
}

/** Eyes on the top cube — D2. Character is why the show works. */
function Face({
  singing,
  ink,
  compact,
}: {
  singing: boolean
  ink: string
  compact?: boolean
}) {
  // On a single-cube tower the face lifts into the top half to clear the numeral.
  const eyeY = compact ? 26 : 34
  const mouthY = compact ? 44 : 58
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 100"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      <ellipse cx="34" cy={eyeY} rx="13" ry={singing ? 15 : 13} fill="#FFFFFF" />
      <ellipse cx="66" cy={eyeY} rx="13" ry={singing ? 15 : 13} fill="#FFFFFF" />
      <circle cx="35" cy={eyeY + 2} r="6.5" fill="#20182E" />
      <circle cx="67" cy={eyeY + 2} r="6.5" fill="#20182E" />
      <circle cx="37.5" cy={eyeY - 1} r="2.2" fill="#FFFFFF" />
      <circle cx="69.5" cy={eyeY - 1} r="2.2" fill="#FFFFFF" />
      {singing ? (
        <ellipse cx="50" cy={mouthY + 4} rx="9" ry={compact ? 8 : 11} fill="#20182E" opacity={0.85} />
      ) : (
        <path
          d={`M40 ${mouthY} Q50 ${mouthY + 10} 60 ${mouthY}`}
          stroke={ink === '#FFFFFF' ? '#20182E' : '#5A3E00'}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
          opacity={0.75}
        />
      )}
    </svg>
  )
}
