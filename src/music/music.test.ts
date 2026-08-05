import { describe, expect, it } from 'vitest'
import {
  DEGREES,
  KEY_NAMES,
  KEYS,
  MAJOR_STEPS,
  degreeToLetter,
  degreeToMidi,
  degreeToNoteName,
  isDegree,
  midiToNoteName,
  REST,
} from './scale'
import { BLOCK_COLORS, colorFor } from './colors'
import { MELODIES, STRIP_LENGTH, pickMelody } from './melodies'

describe('scale', () => {
  it('maps the degrees of C major onto the white keys', () => {
    const names = DEGREES.map((d) => degreeToNoteName(d, 'C'))
    expect(names).toEqual(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'])
  })

  it('keeps taller strictly higher, which is the rule the whole app rests on', () => {
    for (const key of KEY_NAMES) {
      const pitches = DEGREES.map((d) => degreeToMidi(d, key))
      for (let i = 1; i < pitches.length; i++) {
        expect(pitches[i]).toBeGreaterThan(pitches[i - 1])
      }
    }
  })

  it('makes degree 8 an octave above degree 1 in every key', () => {
    for (const key of KEY_NAMES) {
      expect(degreeToMidi(8, key) - degreeToMidi(1, key)).toBe(12)
      expect(degreeToLetter(8, key)).toBe(degreeToLetter(1, key))
    }
  })

  it('keeps every reachable note inside the sampled range (C4-A5)', () => {
    for (const key of KEY_NAMES) {
      for (const degree of DEGREES) {
        const midi = degreeToMidi(degree, key)
        expect(midi).toBeGreaterThanOrEqual(60)
        expect(midi).toBeLessThanOrEqual(81)
      }
    }
  })

  it('spells MIDI numbers as scientific pitch names', () => {
    expect(midiToNoteName(60)).toBe('C4')
    expect(midiToNoteName(69)).toBe('A4')
    expect(midiToNoteName(72)).toBe('C5')
    expect(midiToNoteName(63)).toBe('D#4')
  })

  it('uses the standard major-scale step pattern', () => {
    expect(MAJOR_STEPS).toEqual([0, 2, 4, 5, 7, 9, 11, 12])
    expect(KEYS.C).toBe(60)
  })

  it('tells degrees apart from rests and empty slots', () => {
    expect(isDegree(1)).toBe(true)
    expect(isDegree(8)).toBe(true)
    expect(isDegree(REST)).toBe(false)
    expect(isDegree(null)).toBe(false)
  })
})

describe('colors', () => {
  it('defines a color for all eight degrees', () => {
    for (const degree of DEGREES) {
      const color = colorFor(degree)
      expect(color.fill).toMatch(/^#[0-9A-F]{6}$/i)
      expect(color.ink).toMatch(/^#[0-9A-F]{6}$/i)
    }
    expect(Object.keys(BLOCK_COLORS)).toHaveLength(8)
  })

  it('gives degree 8 One\'s red plus a glow, because it is One again but higher', () => {
    expect(colorFor(8).fill).toBe(colorFor(1).fill)
    expect(colorFor(8).glow).toBeDefined()
    expect(colorFor(7).glow).toBeUndefined()
  })
})

describe('melodies', () => {
  it('sizes every phrase to the strip', () => {
    for (const melody of MELODIES) {
      expect(melody.slots, melody.title).toHaveLength(STRIP_LENGTH)
    }
  })

  it('only contains playable degrees and rests', () => {
    for (const melody of MELODIES) {
      for (const slot of melody.slots) {
        const playable = isDegree(slot) || slot === REST
        expect(playable, `${melody.title} has an unplayable slot: ${slot}`).toBe(true)
      }
    }
  })

  it('gives Hot Cross Buns its rests, so the two halves stay apart', () => {
    const hotCrossBuns = MELODIES.find((m) => m.id === 'hot-cross-buns')!
    expect(hotCrossBuns.slots).toEqual([3, 2, 1, REST, 3, 2, 1, REST])
  })

  it('never hands back the melody that is already on the strip', () => {
    for (let i = 0; i < 50; i++) {
      expect(pickMelody('twinkle').id).not.toBe('twinkle')
    }
  })

  it('uses unique ids', () => {
    const ids = MELODIES.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
