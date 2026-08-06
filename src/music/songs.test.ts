import { describe, expect, it } from 'vitest'
import { SONGS, totalBeats } from './songs'
import { isDegree, REST } from './scale'

/**
 * These end up on a printed page that a piano teacher will look at, so a bar that does
 * not add up is a real defect rather than a cosmetic one.
 */
describe('songs', () => {
  it('fills every measure exactly', () => {
    for (const song of SONGS) {
      let beatsInMeasure = 0
      const measures: number[] = []

      for (const note of song.notes) {
        beatsInMeasure += note.beats
        if (beatsInMeasure >= song.beatsPerMeasure) {
          measures.push(beatsInMeasure)
          beatsInMeasure = 0
        }
      }

      expect(beatsInMeasure, `${song.title} has a partial trailing measure`).toBe(0)
      for (const measure of measures) {
        expect(measure, `${song.title} has a measure of ${measure} beats`).toBe(
          song.beatsPerMeasure,
        )
      }
    }
  })

  it('runs a whole number of measures', () => {
    for (const song of SONGS) {
      const beats = totalBeats(song)
      expect(beats % song.beatsPerMeasure, `${song.title} is ${beats} beats`).toBe(0)
    }
  })

  it('only uses degrees the blocks can show', () => {
    for (const song of SONGS) {
      for (const note of song.notes) {
        const playable = isDegree(note.value) || note.value === REST
        expect(playable, `${song.title} has an unplayable note: ${note.value}`).toBe(true)
      }
    }
  })

  it('only uses durations that notate cleanly', () => {
    const writable = [0.5, 1, 1.5, 2, 3, 4]
    for (const song of SONGS) {
      for (const note of song.notes) {
        expect(writable, `${song.title} has a ${note.beats}-beat note`).toContain(note.beats)
      }
    }
  })

  it('uses unique ids and non-empty titles', () => {
    const ids = SONGS.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const song of SONGS) expect(song.title.length).toBeGreaterThan(0)
  })
})
