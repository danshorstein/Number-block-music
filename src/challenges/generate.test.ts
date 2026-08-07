import { describe, expect, it } from 'vitest'
import {
  CHALLENGE_IDS,
  ECHO_STAGES,
  moveBetween,
  echoStageFor,
  generateRound,
  isPlacementCorrect,
  isRoundSolved,
  nextBlankIndex,
  type ChallengeId,
} from './generate'
import { DEGREES, PENTATONIC, isDegree, REST } from '../music/scale'

/** A deterministic stand-in for Math.random, so rounds are reproducible. */
function seeded(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

/**
 * Challenges answered by placing blocks. Steps and Skips is answered by choosing how
 * the tune moved, so the placement invariants below do not apply to it.
 */
const PLACEMENT_IDS = CHALLENGE_IDS.filter((id) => id !== 'step-skip')

/** Every placement id, many seeds — generation must never produce an unplayable round. */
function everyRound(callback: (id: ChallengeId, round: ReturnType<typeof generateRound>) => void) {
  for (const id of PLACEMENT_IDS) {
    for (let seed = 1; seed <= 60; seed++) {
      callback(id, generateRound(id, { random: seeded(seed) }))
    }
  }
}

describe('challenge generation', () => {
  it('always asks for at least one block', () => {
    everyRound((id, round) => {
      expect(round.answer.length, id).toBeGreaterThan(0)
    })
  })

  it('only ever asks for degrees the palette can supply', () => {
    everyRound((id, round) => {
      for (const degree of round.answer) {
        expect(DEGREES, id).toContain(degree)
      }
      for (const degree of round.prompt) {
        expect(DEGREES, id).toContain(degree)
      }
    })
  })

  it('leaves exactly as many blanks as there are answers', () => {
    everyRound((id, round) => {
      const blanks = round.given.filter((slot) => slot === null).length
      expect(blanks, id).toBe(round.answer.length)
    })
  })

  it('is solved by placing the answer, and only by that', () => {
    everyRound((id, round) => {
      const solved = [...round.given]
      let cursor = 0
      for (let i = 0; i < solved.length; i++) {
        if (solved[i] === null) solved[i] = round.answer[cursor++]
      }
      expect(isRoundSolved(solved, round), id).toBe(true)
      expect(isRoundSolved([...round.given], round), id).toBe(false)
    })
  })

  it('never asks him to supply a rest he cannot hear', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const round = generateRound('finish', { random: seeded(seed) })
      // The blanks are always at the end, and always real notes.
      const firstBlank = round.given.indexOf(null)
      expect(round.given.slice(firstBlank).every((slot) => slot === null)).toBe(true)
      expect(round.answer.every(isDegree)).toBe(true)
    }
  })

  it('keeps some of the tune visible in Finish the Song', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const round = generateRound('finish', { random: seeded(seed) })
      const shown = round.given.filter((slot) => slot !== null)
      expect(shown.length).toBeGreaterThan(0)
    }
  })

  it('echoes a phrase of two to four blocks', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const round = generateRound('echo', { random: seeded(seed) })
      expect(round.answer.length).toBeGreaterThanOrEqual(2)
      expect(round.answer.length).toBeLessThanOrEqual(4)
      expect(round.prompt).toEqual(round.answer)
    }
  })

  it('opens Echo Me on so-mi and nothing else', () => {
    // Kodaly's starting point: the descending minor third, degrees 5 and 3.
    for (let seed = 1; seed <= 40; seed++) {
      const round = generateRound('echo', { random: seeded(seed), stage: 0 })
      expect(round.answer).toEqual([5, 3])
    }
  })

  it('widens the Echo Me pool one pitch at a time, and never beyond it', () => {
    ECHO_STAGES.forEach((stageDef, stage) => {
      for (let seed = 1; seed <= 40; seed++) {
        const round = generateRound('echo', { random: seeded(seed), stage })
        expect(round.answer).toHaveLength(stageDef.length)
        for (const degree of round.answer) {
          expect(stageDef.pool, `stage ${stage}`).toContain(degree)
        }
      }
    })
  })

  it('reaches the whole pentatonic set before the full scale', () => {
    const pentatonicStage = ECHO_STAGES[ECHO_STAGES.length - 2]
    expect([...pentatonicStage.pool].sort()).toEqual([...PENTATONIC].sort())
  })

  it('never echoes a single pitch repeated, which is nothing to echo', () => {
    for (let stage = 0; stage < ECHO_STAGES.length; stage++) {
      for (let seed = 1; seed <= 60; seed++) {
        const round = generateRound('echo', { random: seeded(seed), stage })
        expect(new Set(round.answer).size).toBeGreaterThan(1)
      }
    }
  })

  it('advances the stage with stars, and clamps at both ends', () => {
    expect(echoStageFor(0)).toBe(0)
    expect(echoStageFor(2)).toBe(2)
    expect(echoStageFor(99)).toBe(ECHO_STAGES.length - 1)
    expect(echoStageFor(-5)).toBe(0)
    // A tier-2 child starts partway up rather than re-earning so-mi.
    expect(echoStageFor(1, 2)).toBe(3)
  })

  it('asks the staircase in order, all eight of it', () => {
    const round = generateRound('staircase', { random: seeded(7) })
    expect(round.answer).toEqual([...DEGREES])
  })

  it('never asks for a block the pentatonic palette does not have', () => {
    for (const id of CHALLENGE_IDS) {
      for (let seed = 1; seed <= 40; seed++) {
        const round = generateRound(id, { random: seeded(seed), degrees: PENTATONIC })
        for (const degree of [...round.answer, ...round.prompt]) {
          expect(PENTATONIC, `${id} asked for degree ${degree}`).toContain(degree)
        }
        for (const slot of round.given) {
          if (isDegree(slot)) expect(PENTATONIC, `${id} showed degree ${slot}`).toContain(slot)
        }
      }
    }
  })

  it('shortens the staircase to the active pitch set', () => {
    const round = generateRound('staircase', { degrees: PENTATONIC })
    expect(round.answer).toEqual([...PENTATONIC])
  })

  it('uses letters only for the transfer test', () => {
    expect(generateRound('name-that', { random: seeded(3) }).letters).toBe(true)
    expect(generateRound('which-one', { random: seeded(3) }).letters).toBe(false)
    expect(generateRound('echo', { random: seeded(3) }).letters).toBe(false)
  })

  it('plays a single note for the recognition challenges', () => {
    for (const id of ['which-one', 'name-that'] as const) {
      const round = generateRound(id, { random: seeded(11) })
      expect(round.prompt).toHaveLength(1)
      expect(round.answer).toHaveLength(1)
    }
  })
})

describe('steps and skips', () => {
  it('always plays exactly two notes', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const round = generateRound('step-skip', { random: seeded(seed) })
      expect(round.prompt).toHaveLength(2)
    }
  })

  it('labels the move correctly — next door is a step, anything further is a skip', () => {
    for (let seed = 1; seed <= 120; seed++) {
      const round = generateRound('step-skip', { random: seeded(seed) })
      const [from, to] = round.prompt
      expect(round.move).toBe(Math.abs(to - from) === 1 ? 'step' : 'skip')
    }
  })

  it('never plays the same note twice, which is neither', () => {
    for (let seed = 1; seed <= 120; seed++) {
      const round = generateRound('step-skip', { random: seeded(seed) })
      expect(round.prompt[0]).not.toBe(round.prompt[1])
    }
  })

  it('asks both questions rather than becoming one-sided', () => {
    const moves = new Set(
      Array.from({ length: 60 }, (_, i) => generateRound('step-skip', { random: seeded(i + 1) }).move),
    )
    expect(moves).toEqual(new Set(['step', 'skip']))
  })

  it('still offers both answers when the palette is pentatonic', () => {
    // 1-2-3-5-6 has neighbours (1-2, 2-3, 5-6) and jumps (3-5, 1-3), so both stay
    // reachable even with 4 and 7 removed.
    const moves = new Set(
      Array.from({ length: 60 }, (_, i) =>
        generateRound('step-skip', { random: seeded(i + 1), degrees: PENTATONIC }).move,
      ),
    )
    expect(moves).toEqual(new Set(['step', 'skip']))
  })

  it('classifies moves independent of direction', () => {
    expect(moveBetween(3, 4)).toBe('step')
    expect(moveBetween(4, 3)).toBe('step')
    expect(moveBetween(3, 5)).toBe('skip')
    expect(moveBetween(8, 1)).toBe('skip')
  })
})

describe('round progress', () => {
  it('points at the first unfilled blank', () => {
    const round = generateRound('echo', { random: seeded(5) })
    const slots = [...round.given]
    expect(nextBlankIndex(slots, round.given)).toBe(0)
    slots[0] = round.answer[0]
    expect(nextBlankIndex(slots, round.given)).toBe(1)
  })

  it('reports -1 once every blank is filled', () => {
    const round = generateRound('which-one', { random: seeded(9) })
    expect(nextBlankIndex([round.answer[0]], round.given)).toBe(-1)
  })

  it('checks a placement against the expected degree', () => {
    const round = generateRound('which-one', { random: seeded(4) })
    const right = round.answer[0]
    const wrong = right === 1 ? 2 : 1
    expect(isPlacementCorrect(round, 0, right)).toBe(true)
    expect(isPlacementCorrect(round, 0, wrong)).toBe(false)
  })

  it('does not count a rest as a placed answer', () => {
    const round = generateRound('echo', { random: seeded(2) })
    const slots: (typeof REST | null)[] = Array(round.given.length).fill(REST)
    expect(isRoundSolved(slots as never, round)).toBe(false)
  })
})
