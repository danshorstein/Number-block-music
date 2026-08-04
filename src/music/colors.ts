/**
 * The eight color tokens — the single source of truth for the palette.
 *
 * Rainbow-ordered from red at degree 1. That ordering is the part that matters
 * pedagogically: it is what Chroma-Notes (Boomwhackers, colored handbells, most
 * color-coded sheet music) already uses, so the mapping he learns here is the one
 * he will meet in a classroom. The specific hues are ours.
 *
 * Everything visual reads from this file, so a re-skin stays a one-file change.
 */

import type { Degree } from './scale'

export interface BlockColor {
  /** Front face. */
  fill: string
  /** Top face — same hue, lifted, for the chunky 3D read. */
  top: string
  /** Right face — same hue, dropped. */
  side: string
  /** Numeral and letter color; degree 3 is too light for white. */
  ink: string
  /**
   * Degree 8 only: the octave glow (D1). Eight is One again but higher, so it wears
   * One's red with a bright outline rather than a color of its own (§4.2).
   */
  glow?: string
}

export const BLOCK_COLORS: Record<Degree, BlockColor> = {
  1: { fill: '#E23B34', top: '#F0655E', side: '#B62B26', ink: '#FFFFFF' },
  2: { fill: '#F5872E', top: '#FBA55B', side: '#C86A1E', ink: '#FFFFFF' },
  3: { fill: '#FBD24A', top: '#FFE480', side: '#D9AE28', ink: '#5A3E00' },
  4: { fill: '#4FAE4F', top: '#77C877', side: '#3B8A3B', ink: '#FFFFFF' },
  5: { fill: '#2FA8DC', top: '#5FC3EC', side: '#2183AE', ink: '#FFFFFF' },
  6: { fill: '#5A63BE', top: '#7F87D6', side: '#454D99', ink: '#FFFFFF' },
  7: { fill: '#8E52B8', top: '#AC77D1', side: '#6E3E90', ink: '#FFFFFF' },
  8: { fill: '#E23B34', top: '#F0655E', side: '#B62B26', ink: '#FFFFFF', glow: '#FFF3B0' },
}

/** The rest pad — deliberately colorless, so it never reads as a pitch. */
export const REST_COLOR: BlockColor = {
  fill: '#5A6072',
  top: '#767D91',
  side: '#454A59',
  ink: '#E8EAF0',
}

export const colorFor = (degree: Degree): BlockColor => BLOCK_COLORS[degree]
