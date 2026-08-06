import { describe, expect, it } from 'vitest'
import {
  CHALLENGE_IDS,
  generateRound,
  isPlacementCorrect,
  isRoundSolved,
  nextBlankIndex,
  type ChallengeId,
} from './generate'
import { DEGREES, isDegree, REST } from '../music/scale'

/** A deterministic stand-in for Math.random, so rounds are reproducible. */
function seeded(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

/** Every id, many seeds — generation must never produce an unplayable round. */
function everyRound(callback: (id: ChallengeId, round: ReturnType<typeof generateRound>) => void) {
  for (const id of CHALLENGE_IDS) {
    for (let seed = 1; seed <= 60; seed++) {
      callback(id, generateRound(id, seeded(seed)))
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
      const round = generateRound('finish', seeded(seed))
      // The blanks are always at the end, and always real notes.
      const firstBlank = round.given.indexOf(null)
      expect(round.given.slice(firstBlank).every((slot) => slot === null)).toBe(true)
      expect(round.answer.every(isDegree)).toBe(true)
    }
  })

  it('keeps some of the tune visible in Finish the Song', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const round = generateRound('finish', seeded(seed))
      const shown = round.given.filter((slot) => slot !== null)
      expect(shown.length).toBeGreaterThan(0)
    }
  })

  it('echoes a phrase of two to four blocks', () => {
    for (let seed = 1; seed <= 80; seed++) {
      const round = generateRound('echo', seeded(seed))
      expect(round.answer.length).toBeGreaterThanOrEqual(2)
      expect(round.answer.length).toBeLessThanOrEqual(4)
      expect(round.prompt).toEqual(round.answer)
    }
  })

  it('asks the staircase in order, all eight of it', () => {
    const round = generateRound('staircase', seeded(7))
    expect(round.answer).toEqual([...DEGREES])
  })

  it('uses letters only for the transfer test', () => {
    expect(generateRound('name-that', seeded(3)).letters).toBe(true)
    expect(generateRound('which-one', seeded(3)).letters).toBe(false)
    expect(generateRound('echo', seeded(3)).letters).toBe(false)
  })

  it('plays a single note for the recognition challenges', () => {
    for (const id of ['which-one', 'name-that'] as const) {
      const round = generateRound(id, seeded(11))
      expect(round.prompt).toHaveLength(1)
      expect(round.answer).toHaveLength(1)
    }
  })
})

describe('round progress', () => {
  it('points at the first unfilled blank', () => {
    const round = generateRound('echo', seeded(5))
    const slots = [...round.given]
    expect(nextBlankIndex(slots, round.given)).toBe(0)
    slots[0] = round.answer[0]
    expect(nextBlankIndex(slots, round.given)).toBe(1)
  })

  it('reports -1 once every blank is filled', () => {
    const round = generateRound('which-one', seeded(9))
    expect(nextBlankIndex([round.answer[0]], round.given)).toBe(-1)
  })

  it('checks a placement against the expected degree', () => {
    const round = generateRound('which-one', seeded(4))
    const right = round.answer[0]
    const wrong = right === 1 ? 2 : 1
    expect(isPlacementCorrect(round, 0, right)).toBe(true)
    expect(isPlacementCorrect(round, 0, wrong)).toBe(false)
  })

  it('does not count a rest as a placed answer', () => {
    const round = generateRound('echo', seeded(2))
    const slots: (typeof REST | null)[] = Array(round.given.length).fill(REST)
    expect(isRoundSolved(slots as never, round)).toBe(false)
  })
})
