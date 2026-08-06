/**
 * Real staff notation with the noteheads colored by scale degree.
 *
 * This is the bridge §5.4 files under Phase 3 — blocks becoming noteheads, same colors
 * retained — reached as a printed page rather than as app UI. On paper it costs a
 * afternoon instead of a phase, and it is the artifact a piano teacher can actually
 * put on the music stand.
 *
 * Under every note sits the same color as a small numbered chip, so the eye can walk
 * colour → notehead → number → key without anyone having to explain the mapping.
 */

import { Beam, Dot, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow'
import { colorFor } from '../music/colors'
import { degreeToLetter, degreeToNoteName, isDegree, type Degree } from '../music/scale'
import type { Song, SongNote } from '../music/songs'

/**
 * Two measures per line. Four fits, but every note carries a colour chip, a letter and
 * often a lyric syllable underneath, and eighth notes at four-to-a-line collide.
 */
const MEASURES_PER_SYSTEM = 2
const SYSTEM_HEIGHT = 200
const STAVE_TOP = 10
/**
 * Chip row, measured from the y handed to Stave — not from the top line. VexFlow
 * reserves about 40px above the first line, so the staff runs roughly y+40 to y+80 and
 * a middle-C ledger line sits near y+100. Anything less than ~115 lands on the notes.
 */
const CHIP_OFFSET = 118
const CHIP_SIZE = 20

/** Beats → a VexFlow duration code plus how many dots it needs. */
function durationFor(beats: number): { duration: string; dots: number } {
  switch (beats) {
    case 0.5:
      return { duration: '8', dots: 0 }
    case 1:
      return { duration: 'q', dots: 0 }
    case 1.5:
      return { duration: 'q', dots: 1 }
    case 2:
      return { duration: 'h', dots: 0 }
    case 3:
      return { duration: 'h', dots: 1 }
    case 4:
      return { duration: 'w', dots: 0 }
    default:
      throw new Error(`No notation for a ${beats}-beat note`)
  }
}

/** "C4" → "c/4", which is how VexFlow wants its keys. */
function toVexKey(degree: Degree): string {
  const name = degreeToNoteName(degree, 'C')
  const letter = name.slice(0, -1).toLowerCase()
  const octave = name.slice(-1)
  return `${letter}/${octave}`
}

interface Measure {
  notes: SongNote[]
}

/** Split a flat note list on the bar lines the beat count implies. */
export function intoMeasures(song: Song): Measure[] {
  const measures: Measure[] = []
  let current: SongNote[] = []
  let beats = 0

  for (const note of song.notes) {
    current.push(note)
    beats += note.beats
    if (beats >= song.beatsPerMeasure) {
      measures.push({ notes: current })
      current = []
      beats = 0
    }
  }
  if (current.length > 0) measures.push({ notes: current })

  return measures
}

function buildNote(note: SongNote): StaveNote {
  const { duration, dots } = durationFor(note.beats)

  if (!isDegree(note.value)) {
    const rest = new StaveNote({ keys: ['b/4'], duration: `${duration}r` })
    for (let i = 0; i < dots; i++) Dot.buildAndAttach([rest])
    return rest
  }

  const staveNote = new StaveNote({ keys: [toVexKey(note.value)], duration })
  for (let i = 0; i < dots; i++) Dot.buildAndAttach([staveNote])

  // Color the head only. A colored stem reads as an error to anyone who reads music,
  // and the head is where the pitch actually lives.
  const color = colorFor(note.value)
  staveNote.setKeyStyle(0, { fillStyle: color.fill, strokeStyle: color.side })

  return staveNote
}

/** A colored chip carrying the degree numeral, drawn under its note. */
function drawChip(svg: SVGSVGElement, x: number, y: number, note: SongNote): void {
  const ns = 'http://www.w3.org/2000/svg'
  if (!isDegree(note.value)) return

  const color = colorFor(note.value)

  const rect = document.createElementNS(ns, 'rect')
  rect.setAttribute('x', String(x - CHIP_SIZE / 2))
  rect.setAttribute('y', String(y))
  rect.setAttribute('width', String(CHIP_SIZE))
  rect.setAttribute('height', String(CHIP_SIZE))
  rect.setAttribute('rx', '5')
  rect.setAttribute('fill', color.fill)
  svg.appendChild(rect)

  const numeral = document.createElementNS(ns, 'text')
  numeral.setAttribute('x', String(x))
  numeral.setAttribute('y', String(y + CHIP_SIZE - 5))
  numeral.setAttribute('text-anchor', 'middle')
  numeral.setAttribute('font-size', '14')
  numeral.setAttribute('font-weight', '800')
  numeral.setAttribute('fill', color.ink)
  numeral.textContent = String(note.value)
  svg.appendChild(numeral)

  const letter = document.createElementNS(ns, 'text')
  letter.setAttribute('x', String(x))
  letter.setAttribute('y', String(y + CHIP_SIZE + 15))
  letter.setAttribute('text-anchor', 'middle')
  letter.setAttribute('font-size', '12')
  letter.setAttribute('font-weight', '700')
  letter.setAttribute('fill', '#333')
  letter.textContent = degreeToLetter(note.value, 'C')
  svg.appendChild(letter)
}

function drawLyric(svg: SVGSVGElement, x: number, y: number, text: string): void {
  const ns = 'http://www.w3.org/2000/svg'
  const node = document.createElementNS(ns, 'text')
  node.setAttribute('x', String(x))
  node.setAttribute('y', String(y))
  node.setAttribute('text-anchor', 'middle')
  node.setAttribute('font-size', '12')
  node.setAttribute('fill', '#444')
  node.textContent = text
  svg.appendChild(node)
}

/** Render one song into `container` as printable SVG systems. */
export function renderSong(container: HTMLElement, song: Song, width: number): void {
  const measures = intoMeasures(song)

  for (let start = 0; start < measures.length; start += MEASURES_PER_SYSTEM) {
    const system = measures.slice(start, start + MEASURES_PER_SYSTEM)
    const isFirstSystem = start === 0

    const host = document.createElement('div')
    host.className = 'system'
    container.appendChild(host)

    const renderer = new Renderer(host, Renderer.Backends.SVG)
    renderer.resize(width, SYSTEM_HEIGHT)
    const context = renderer.getContext()

    // Clef and time signature eat horizontal space on the opening stave only.
    const leadIn = isFirstSystem ? 60 : 0
    const available = width - 20 - leadIn

    // Share the line out by note count, so a measure of eight eighths is not squeezed
    // into the same span as one holding three notes.
    const totalNotes = system.reduce((sum, measure) => sum + measure.notes.length, 0)

    let x = 10
    system.forEach((measure, index) => {
      const share = available * (measure.notes.length / totalNotes)
      const staveWidth = share + (index === 0 ? leadIn : 0)

      const stave = new Stave(x, STAVE_TOP, staveWidth)
      if (isFirstSystem && index === 0) {
        stave.addClef('treble').addTimeSignature(`${song.beatsPerMeasure}/4`)
      }
      stave.setContext(context).draw()

      const staveNotes = measure.notes.map(buildNote)
      const voice = new Voice({
        numBeats: song.beatsPerMeasure,
        beatValue: 4,
      }).setStrict(false)
      voice.addTickables(staveNotes)

      const beams = Beam.generateBeams(staveNotes)
      // formatToStave, not format(width): it measures the real note area, so notes
      // start after the clef instead of underneath it.
      new Formatter().joinVoices([voice]).formatToStave([voice], stave)
      voice.draw(context, stave)
      beams.forEach((beam) => beam.setContext(context).draw())

      // Chips and lyrics go on after formatting, when the notes know where they are.
      const svg = host.querySelector('svg') as SVGSVGElement
      staveNotes.forEach((staveNote, noteIndex) => {
        const source = measure.notes[noteIndex]
        const noteX = staveNote.getAbsoluteX()
        drawChip(svg, noteX, STAVE_TOP + CHIP_OFFSET, source)
        if (source.lyric) {
          drawLyric(svg, noteX, STAVE_TOP + CHIP_OFFSET + CHIP_SIZE + 36, source.lyric)
        }
      })

      x += staveWidth
    })
  }
}
