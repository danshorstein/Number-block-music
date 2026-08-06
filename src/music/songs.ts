/**
 * Full tunes, with rhythm, for the printed songbook.
 *
 * The app's `melodies.ts` holds eight-slot phrases shaped to the sequence strip; these
 * are the whole songs, because a printed page has no such limit and a teacher will
 * notice a truncated melody. Durations are in beats, which is also the groundwork for
 * the Phase 2 duration blocks (§5.3).
 *
 * Everything is in C major so the degrees line up with the printed key stickers.
 */

import { REST, type Degree, type Rest } from './scale'

export interface SongNote {
  /** Scale degree, or a rest. */
  value: Degree | Rest
  /** Length in beats: 0.5 eighth, 1 quarter, 1.5 dotted quarter, 2 half, 4 whole. */
  beats: number
  /** Syllable printed under the note, where the song has words. */
  lyric?: string
}

export interface Song {
  id: string
  title: string
  /** Beats per measure. Everything here is in 4/4. */
  beatsPerMeasure: number
  notes: SongNote[]
}

const q = 1
const h = 2
const e = 0.5
const w = 4

export const SONGS: readonly Song[] = [
  {
    id: 'hot-cross-buns',
    title: 'Hot Cross Buns',
    beatsPerMeasure: 4,
    notes: [
      { value: 3, beats: q, lyric: 'Hot' },
      { value: 2, beats: q, lyric: 'cross' },
      { value: 1, beats: h, lyric: 'buns!' },
      { value: 3, beats: q, lyric: 'Hot' },
      { value: 2, beats: q, lyric: 'cross' },
      { value: 1, beats: h, lyric: 'buns!' },
      { value: 1, beats: e, lyric: 'One' },
      { value: 1, beats: e, lyric: 'a' },
      { value: 1, beats: e, lyric: 'pen-' },
      { value: 1, beats: e, lyric: 'ny,' },
      { value: 2, beats: e, lyric: 'two' },
      { value: 2, beats: e, lyric: 'a' },
      { value: 2, beats: e, lyric: 'pen-' },
      { value: 2, beats: e, lyric: 'ny,' },
      { value: 3, beats: q, lyric: 'hot' },
      { value: 2, beats: q, lyric: 'cross' },
      { value: 1, beats: h, lyric: 'buns!' },
    ],
  },
  {
    id: 'twinkle',
    title: 'Twinkle, Twinkle, Little Star',
    beatsPerMeasure: 4,
    notes: [
      { value: 1, beats: q, lyric: 'Twin-' },
      { value: 1, beats: q, lyric: 'kle,' },
      { value: 5, beats: q, lyric: 'twin-' },
      { value: 5, beats: q, lyric: 'kle,' },
      { value: 6, beats: q, lyric: 'lit-' },
      { value: 6, beats: q, lyric: 'tle' },
      { value: 5, beats: h, lyric: 'star,' },
      { value: 4, beats: q, lyric: 'how' },
      { value: 4, beats: q, lyric: 'I' },
      { value: 3, beats: q, lyric: 'won-' },
      { value: 3, beats: q, lyric: 'der' },
      { value: 2, beats: q, lyric: 'what' },
      { value: 2, beats: q, lyric: 'you' },
      { value: 1, beats: h, lyric: 'are.' },
    ],
  },
  {
    id: 'mary',
    title: 'Mary Had a Little Lamb',
    beatsPerMeasure: 4,
    notes: [
      { value: 3, beats: q, lyric: 'Ma-' },
      { value: 2, beats: q, lyric: 'ry' },
      { value: 1, beats: q, lyric: 'had' },
      { value: 2, beats: q, lyric: 'a' },
      { value: 3, beats: q, lyric: 'lit-' },
      { value: 3, beats: q, lyric: 'tle' },
      { value: 3, beats: h, lyric: 'lamb,' },
      { value: 2, beats: q, lyric: 'lit-' },
      { value: 2, beats: q, lyric: 'tle' },
      { value: 2, beats: h, lyric: 'lamb,' },
      { value: 3, beats: q, lyric: 'lit-' },
      { value: 5, beats: q, lyric: 'tle' },
      { value: 5, beats: h, lyric: 'lamb.' },
      { value: 3, beats: q, lyric: 'Ma-' },
      { value: 2, beats: q, lyric: 'ry' },
      { value: 1, beats: q, lyric: 'had' },
      { value: 2, beats: q, lyric: 'a' },
      { value: 3, beats: q, lyric: 'lit-' },
      { value: 3, beats: q, lyric: 'tle' },
      { value: 3, beats: q, lyric: 'lamb,' },
      { value: 3, beats: q, lyric: 'its' },
      { value: 2, beats: q, lyric: 'fleece' },
      { value: 2, beats: q, lyric: 'was' },
      { value: 3, beats: q, lyric: 'white' },
      { value: 2, beats: q, lyric: 'as' },
      { value: 1, beats: w, lyric: 'snow.' },
    ],
  },
  {
    id: 'ode-to-joy',
    title: 'Ode to Joy',
    beatsPerMeasure: 4,
    notes: [
      { value: 3, beats: q },
      { value: 3, beats: q },
      { value: 4, beats: q },
      { value: 5, beats: q },
      { value: 5, beats: q },
      { value: 4, beats: q },
      { value: 3, beats: q },
      { value: 2, beats: q },
      { value: 1, beats: q },
      { value: 1, beats: q },
      { value: 2, beats: q },
      { value: 3, beats: q },
      { value: 3, beats: 1.5 },
      { value: 2, beats: e },
      { value: 2, beats: h },
    ],
  },
  {
    id: 'frere-jacques',
    title: 'Frère Jacques',
    beatsPerMeasure: 4,
    notes: [
      { value: 1, beats: q, lyric: 'Frè-' },
      { value: 2, beats: q, lyric: 're' },
      { value: 3, beats: q, lyric: 'Jac-' },
      { value: 1, beats: q, lyric: 'ques,' },
      { value: 1, beats: q, lyric: 'Frè-' },
      { value: 2, beats: q, lyric: 're' },
      { value: 3, beats: q, lyric: 'Jac-' },
      { value: 1, beats: q, lyric: 'ques,' },
      { value: 3, beats: q, lyric: 'Dor-' },
      { value: 4, beats: q, lyric: 'mez' },
      { value: 5, beats: h, lyric: 'vous?' },
      { value: 3, beats: q, lyric: 'Dor-' },
      { value: 4, beats: q, lyric: 'mez' },
      { value: 5, beats: h, lyric: 'vous?' },
    ],
  },
  {
    id: 'london-bridge',
    title: 'London Bridge',
    beatsPerMeasure: 4,
    notes: [
      { value: 5, beats: q, lyric: 'Lon-' },
      { value: 6, beats: q, lyric: 'don' },
      { value: 5, beats: q, lyric: 'Bridge' },
      { value: 4, beats: q, lyric: 'is' },
      { value: 3, beats: q, lyric: 'fall-' },
      { value: 4, beats: q, lyric: 'ing' },
      { value: 5, beats: h, lyric: 'down,' },
      { value: 2, beats: q, lyric: 'fall-' },
      { value: 3, beats: q, lyric: 'ing' },
      { value: 4, beats: h, lyric: 'down,' },
      { value: 3, beats: q, lyric: 'fall-' },
      { value: 4, beats: q, lyric: 'ing' },
      { value: 5, beats: h, lyric: 'down.' },
    ],
  },
]

export const isRest = (note: SongNote): note is SongNote & { value: Rest } =>
  note.value === REST

/** Total beats, used to check each song divides cleanly into measures. */
export function totalBeats(song: Song): number {
  return song.notes.reduce((sum, note) => sum + note.beats, 0)
}
