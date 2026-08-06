/**
 * Printable key stickers — "the single highest-leverage deliverable in the whole
 * project" (§8.4). The moment the red key on the real piano is the same red as the
 * One block, the app stops being a game and becomes an interface to his instrument.
 *
 * Everything here is sized in millimetres, because these have to land on real keys.
 * A standard acoustic white key is about 23.5mm wide at the front, so the dots are
 * 18mm — big enough to see from playing position, small enough to sit clear of the
 * black keys. The sheet carries a calibration ruler: if that measures 100mm on paper,
 * the dots are right. If it doesn't, the print dialog scaled the page and the stickers
 * will not fit.
 */

import { colorFor, type BlockColor } from '../music/colors'
import { DEGREES, degreeToLetter, type Degree } from '../music/scale'

const DOT_MM = 18
/** White key width on a standard acoustic. Sets the spacing between dots. */
const KEY_MM = 23.5

function dot(degree: Degree, color: BlockColor): string {
  // Degree 8 wears One's red with a ring, matching the app and the caption below.
  const ring = color.glow ? `box-shadow: inset 0 0 0 1.6mm ${color.glow};` : ''
  return `
    <div class="sticker" style="--dot: ${color.fill}; --ink: ${color.ink}; ${ring}">
      <span class="sticker-degree">${degree}</span>
      <span class="sticker-letter">${degreeToLetter(degree, 'C')}</span>
    </div>`
}

export function renderStickers(container: HTMLElement): void {
  const octave = DEGREES.map((degree) => dot(degree, colorFor(degree))).join('')

  container.innerHTML = `
    <section class="page">
      <h1>Piano key stickers</h1>
      <p class="lede">
        Cut these out and stick one on each white key from any C up to the next C.
        The colors and numbers are the same ones the blocks use, so a “three” on the
        screen and a “three” under his finger are the same thing.
      </p>

      <div class="calibration">
        <div class="ruler"><span class="ruler-label">This line is exactly 100&nbsp;mm</span></div>
        <p class="warn">
          <strong>Before cutting:</strong> measure that line. If it is not 100&nbsp;mm,
          print again with scaling set to 100% or “Actual size” — otherwise the dots
          will not fit the keys.
        </p>
      </div>

      <h2>One octave, C to C</h2>
      <div class="sticker-row">${octave}</div>

      <h2>A second set, in case one goes astray</h2>
      <div class="sticker-row">${octave}</div>

      <p class="footnote">
        Dots are ${DOT_MM}&nbsp;mm across and spaced ${KEY_MM}&nbsp;mm apart, matching a
        standard acoustic white key. Degree 8 is the same red as degree 1 with a gold
        ring: it is One again, an octave higher — same name, same colour, higher sound.
      </p>
    </section>`
}
