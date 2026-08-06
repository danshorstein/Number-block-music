/**
 * Challenge generation (F9–F13). Pure, and seeded through an injected random source,
 * so every rule here is testable without a browser.
 *
 * F14 governs the feel: three stars per challenge, a gentle "try again" with the
 * correct note played, and no loss states anywhere. Stars count rounds finished, not
 * rounds got right first time — they are a progress meter, never a grade.
 */

import { DEGREES, isDegree, REST, type Degree, type Slot } from '../music/scale'
import { MELODIES } from '../music/melodies'

export type ChallengeId = 'echo' | 'staircase' | 'which-one' | 'finish' | 'name-that'

export const CHALLENGE_IDS: readonly ChallengeId[] = [
  'echo',
  'staircase',
  'which-one',
  'finish',
  'name-that',
]

export const ROUNDS_PER_CHALLENGE = 3

export interface Round {
  /** Degrees the app plays as the question. Empty when there is nothing to hear. */
  prompt: Degree[]
  /** The degrees he has to place, in order. */
  answer: Degree[]
  /** What is already on the strip when the round opens. */
  given: Slot[]
  /** Letters rather than numerals — F13, the transfer test. */
  letters: boolean
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)]
}

function randomDegree(random: () => number): Degree {
  return pick(DEGREES, random)
}

/** Echo Me (F9): a short phrase to hear and rebuild. */
function generateEcho(random: () => number): Round {
  const length = 2 + Math.floor(random() * 3) // 2, 3 or 4
  const answer = Array.from({ length }, () => randomDegree(random))
  return {
    prompt: answer,
    answer,
    given: Array<Slot>(length).fill(null),
    letters: false,
  }
}

/** Fill the Staircase (F10): the scale as an ordered object. */
function generateStaircase(): Round {
  const answer = [...DEGREES]
  return {
    prompt: answer,
    answer,
    given: Array<Slot>(answer.length).fill(null),
    letters: false,
  }
}

/** Which One Am I? (F11): one note, find its tower. */
function generateWhichOne(random: () => number): Round {
  const degree = randomDegree(random)
  return { prompt: [degree], answer: [degree], given: [null], letters: false }
}

/** Name That Block (F13): the same test, in his teacher's vocabulary. */
function generateNameThat(random: () => number): Round {
  return { ...generateWhichOne(random), letters: true }
}

/**
 * Finish the Song (F12): a melody with its last note or two missing.
 *
 * Trailing rests are trimmed first — asking a six-year-old to supply a silence he
 * cannot hear is a puzzle with no fair answer.
 */
function generateFinish(random: () => number): Round {
  const melody = pick(MELODIES, random)

  const core = [...melody.slots]
  while (core.length > 0 && (core[core.length - 1] === null || core[core.length - 1] === REST)) {
    core.pop()
  }

  const missing = Math.min(1 + Math.floor(random() * 2), core.length - 1)
  const answer = core.slice(core.length - missing).filter(isDegree)
  const given: Slot[] = [
    ...core.slice(0, core.length - missing),
    ...Array<Slot>(missing).fill(null),
  ]

  return { prompt: core.filter(isDegree), answer, given, letters: false }
}

export function generateRound(id: ChallengeId, random: () => number = Math.random): Round {
  switch (id) {
    case 'echo':
      return generateEcho(random)
    case 'staircase':
      return generateStaircase()
    case 'which-one':
      return generateWhichOne(random)
    case 'finish':
      return generateFinish(random)
    case 'name-that':
      return generateNameThat(random)
  }
}

/** Where in the round the next answer goes, or -1 when it is already complete. */
export function nextBlankIndex(slots: Slot[], given: Slot[]): number {
  for (let i = 0; i < given.length; i++) {
    if (given[i] === null && slots[i] === null) return i
  }
  return -1
}

/** Has he placed the whole answer correctly? */
export function isRoundSolved(slots: Slot[], round: Round): boolean {
  const placed = round.given
    .map((slot, index) => (slot === null ? slots[index] : null))
    .filter(isDegree)
  return (
    placed.length === round.answer.length &&
    placed.every((degree, index) => degree === round.answer[index])
  )
}

/**
 * Is this placement right so far? Used for immediate, gentle correction — a wrong
 * block never lands, so the strip can't drift away from the answer.
 */
export function isPlacementCorrect(round: Round, answerIndex: number, degree: Degree): boolean {
  return round.answer[answerIndex] === degree
}
