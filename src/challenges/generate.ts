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

export type ChallengeId =
  | 'step-skip'
  | 'echo'
  | 'staircase'
  | 'which-one'
  | 'finish'
  | 'name-that'

// Steps and skips first: it is the entry point Kodaly uses, and it asks the child to
// hear *movement* rather than to identify a pitch, which comes earlier than either.
export const CHALLENGE_IDS: readonly ChallengeId[] = [
  'step-skip',
  'echo',
  'staircase',
  'which-one',
  'finish',
  'name-that',
]

/** Whether a two-note move is a step (next-door) or a skip (any further). */
export type Move = 'step' | 'skip'

export const moveBetween = (from: Degree, to: Degree): Move =>
  Math.abs(to - from) === 1 ? 'step' : 'skip'

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
  /**
   * Set for challenges answered by choosing rather than by placing blocks. The child
   * hears the two notes in `prompt` and says how the tune moved.
   */
  move?: Move
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)]
}

/**
 * Echo Me (F9), sequenced rather than random.
 *
 * Kodály starts with **so–mi** — the descending minor third, the interval young children
 * sing most accurately — then widens the pitch set a note at a time, and reaches the
 * full diatonic scale last. Drawing uniformly from all eight degrees, which is what this
 * used to do, can hand a six-year-old a phrase no six-year-old can sing, and teaches the
 * order of the scale to nobody.
 *
 * Each stage adds one pitch and, later, one more note to remember.
 */
export const ECHO_STAGES: readonly { pool: readonly Degree[]; length: number }[] = [
  { pool: [5, 3], length: 2 }, // so–mi
  { pool: [5, 3, 1], length: 3 }, // so–mi–do
  { pool: [5, 3, 1, 6], length: 3 }, // add la
  { pool: [5, 3, 1, 6, 2], length: 4 }, // the pentatonic set, complete
  { pool: DEGREES, length: 4 }, // everything
]

/**
 * Which stage a child is on. Stars are the only progress signal we keep (F14), so they
 * drive it; a tier-2 child starts partway up rather than being made to earn so–mi again.
 */
export function echoStageFor(stars: number, startAt = 0): number {
  return Math.min(ECHO_STAGES.length - 1, Math.max(0, startAt + stars))
}

function generateEcho(random: () => number, stage = 0): Round {
  const { pool, length } = ECHO_STAGES[Math.min(stage, ECHO_STAGES.length - 1)]

  // Draw freely from the stage's pool — the restricted pool is where the pedagogy
  // lives, so patterns can vary without ever leaving what the child can sing.
  const answer = Array.from({ length }, () => pick(pool, random))

  // One pitch repeated is not a pattern to echo, so guarantee a second one.
  if (answer.every((degree) => degree === answer[0])) {
    answer[answer.length - 1] = pool.find((degree) => degree !== answer[0]) ?? pool[1]
  }

  return {
    prompt: answer,
    answer,
    given: Array<Slot>(answer.length).fill(null),
    letters: false,
  }
}

/** Fill the Staircase (F10): the scale as an ordered object. */
function generateStaircase(degrees: readonly Degree[]): Round {
  const answer = [...degrees]
  return {
    prompt: answer,
    answer,
    given: Array<Slot>(answer.length).fill(null),
    letters: false,
  }
}

/** Which One Am I? (F11): one note, find its tower. */
function generateWhichOne(random: () => number, degrees: readonly Degree[]): Round {
  const degree = pick(degrees, random)
  return { prompt: [degree], answer: [degree], given: [null], letters: false }
}

/** Name That Block (F13): the same test, in his teacher's vocabulary. */
function generateNameThat(random: () => number, degrees: readonly Degree[]): Round {
  return { ...generateWhichOne(random, degrees), letters: true }
}

/**
 * Finish the Song (F12): a melody with its last note or two missing.
 *
 * Trailing rests are trimmed first — asking a six-year-old to supply a silence he
 * cannot hear is a puzzle with no fair answer.
 */
function generateFinish(random: () => number, degrees: readonly Degree[]): Round {
  // Only tunes the child's current palette can actually play. In pentatonic mode a
  // melody needing 4 or 7 is unanswerable, because the block simply is not there.
  const singable = MELODIES.filter((melody) =>
    melody.slots.every((slot) => !isDegree(slot) || degrees.includes(slot)),
  )
  const melody = pick(singable.length > 0 ? singable : MELODIES, random)

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

export interface GenerateOptions {
  random?: () => number
  /** Echo Me's position in the so-mi progression. Ignored by the other challenges. */
  stage?: number
  /** The child's active pitch set, so no challenge can ask for a missing block. */
  degrees?: readonly Degree[]
}

/**
 * Steps and Skips: does the tune move next door, or jump?
 *
 * Kodaly spends real time on how a melody *moves* before any pitch gets named, because
 * hearing direction and distance is what reading a melodic line actually requires. It is
 * nearly free in this grammar — a step is neighbouring towers, a skip is not.
 */
function generateStepSkip(random: () => number, degrees: readonly Degree[]): Round {
  const from = pick(degrees, random)

  // Both answers must be reachable, or the challenge quietly becomes one-sided.
  const steps = degrees.filter((d) => moveBetween(from, d) === 'step')
  const skips = degrees.filter((d) => d !== from && moveBetween(from, d) === 'skip')
  const wantStep = steps.length > 0 && (skips.length === 0 || random() < 0.5)
  const to = pick(wantStep ? steps : skips, random)

  return {
    prompt: [from, to],
    answer: [],
    given: [],
    letters: false,
    move: moveBetween(from, to),
  }
}

export function generateRound(id: ChallengeId, options: GenerateOptions = {}): Round {
  const { random = Math.random, stage = 0, degrees = DEGREES } = options

  switch (id) {
    case 'step-skip':
      return generateStepSkip(random, degrees)
    case 'echo':
      return generateEcho(random, stage)
    case 'staircase':
      return generateStaircase(degrees)
    case 'which-one':
      return generateWhichOne(random, degrees)
    case 'finish':
      return generateFinish(random, degrees)
    case 'name-that':
      return generateNameThat(random, degrees)
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
