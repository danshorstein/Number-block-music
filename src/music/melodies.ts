/**
 * Nursery tunes as scale degrees, for the "surprise me" button (F8).
 *
 * Each phrase is exactly STRIP_LENGTH slots so it drops straight into the sequence
 * strip. Rests are load-bearing here, not decoration: "Hot Cross Buns" is 3-2-1-rest,
 * and without the rest the two halves of the phrase run together and it stops sounding
 * like the tune he already knows.
 */

import { REST, type Slot } from './scale'

/** D4: start at 8 slots; extend if he outgrows it. */
export const STRIP_LENGTH = 8

export interface Melody {
  id: string
  /** Parent-facing only — the child UI stays text-free (§6). */
  title: string
  slots: Slot[]
}

export const MELODIES: readonly Melody[] = [
  { id: 'hot-cross-buns', title: 'Hot Cross Buns', slots: [3, 2, 1, REST, 3, 2, 1, REST] },
  { id: 'twinkle', title: 'Twinkle, Twinkle, Little Star', slots: [1, 1, 5, 5, 6, 6, 5, REST] },
  { id: 'ode-to-joy', title: 'Ode to Joy', slots: [3, 3, 4, 5, 5, 4, 3, 2] },
  { id: 'mary', title: 'Mary Had a Little Lamb', slots: [3, 2, 1, 2, 3, 3, 3, REST] },
  { id: 'frere-jacques', title: 'Frère Jacques', slots: [1, 2, 3, 1, 1, 2, 3, 1] },
  { id: 'london-bridge', title: 'London Bridge', slots: [5, 6, 5, 4, 3, 4, 5, REST] },
  { id: 'staircase', title: 'The Whole Staircase', slots: [1, 2, 3, 4, 5, 6, 7, 8] },
]

/** Pick a melody, avoiding an immediate repeat so the button always feels alive. */
export function pickMelody(previousId?: string): Melody {
  const pool = MELODIES.filter((m) => m.id !== previousId)
  const candidates = pool.length > 0 ? pool : MELODIES
  return candidates[Math.floor(Math.random() * candidates.length)]
}
