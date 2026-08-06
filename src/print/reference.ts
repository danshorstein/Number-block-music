/**
 * The music-stand chart and the teacher one-pager (§8.4).
 *
 * The chart is for the piano; the explainer is so his teacher can say "play me a three"
 * and have it mean something. §2 asks for a one-page explainer, not a login.
 */

import { colorFor } from '../music/colors'
import { DEGREES, degreeToLetter } from '../music/scale'

export function renderChart(container: HTMLElement): void {
  const rows = DEGREES.map((degree) => {
    const color = colorFor(degree)
    const blocks = Array.from(
      { length: degree },
      () => `<i style="background:${color.fill};border-bottom:3px solid ${color.side}"></i>`,
    ).join('')

    return `
      <tr>
        <td><span class="swatch" style="background:${color.fill};color:${color.ink};${
          color.glow ? `box-shadow:0 0 0 3px ${color.glow}` : ''
        }">${degree}</span></td>
        <td class="letter">${degreeToLetter(degree, 'C')}</td>
        <td><div class="tower">${blocks}</div></td>
      </tr>`
  }).join('')

  container.innerHTML = `
    <section class="page">
      <h1>The eight blocks</h1>
      <p class="lede">Tape this to the music stand. Taller block, higher note — always.</p>
      <table class="chart">
        <thead><tr><th>Block</th><th>Note</th><th>How tall</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="footnote">
        In the key of C, block 1 is middle C and block 8 is the C above it.
        Eight wears One's red with a gold ring, because it <em>is</em> One again —
        same letter, same colour, an octave higher.
      </p>
    </section>`
}

export function renderTeacherSheet(container: HTMLElement): void {
  container.innerHTML = `
    <section class="page">
      <h1>A one-page note for the teacher</h1>

      <p class="lede">
        He has been playing with an app at home that encodes the major scale as counted,
        coloured blocks: <strong>a tower of N blocks is scale degree N</strong>. This
        sheet is so the vocabulary carries into lessons — no login, nothing to install.
      </p>

      <h2>Why blocks</h2>
      <p>
        He learned to count from <em>Numberblocks</em>, so stacked colored cubes are a
        symbol system he already reads fluently. A major scale is genuinely ordinal, so
        the metaphor is honest rather than decorative: degree 5 is drawn taller than
        degree 3 because it really does sound higher. There is nothing here he has to
        unlearn later.
      </p>

      <h2>The colours are not arbitrary</h2>
      <p>
        They run in rainbow order from red at the tonic, which is the same ordering used
        by <strong>Chroma-Notes</strong> — Boomwhackers, coloured handbells, and most
        colour-coded sheet music. If you already use any of those, this matches.
      </p>

      <h2>What you can say</h2>
      <ul>
        <li>“Play me a three.” In C, that is E. He should be able to find it without counting up.</li>
        <li>“What number is this?” — pointing at a key, or playing it.</li>
        <li>“Start on one and walk up to eight.” The scale as an ordered object.</li>
        <li>“Eight is one again, but higher.” Octave equivalence, in his own words.</li>
      </ul>

      <h2>Where it is heading</h2>
      <p>
        The app shows numbers first, then numbers with letter names, then letters alone —
        so the degree system is a ladder into your vocabulary, not a competing one. The
        printed songs in this pack put coloured noteheads on a real staff, so the same
        colour he taps is the colour on the page.
      </p>

      <h2>What it deliberately does not do</h2>
      <p>
        No streaks, no timers, no scores to chase, no losing. If it ever starts competing
        with practice rather than feeding it, it has failed and we will stop.
      </p>

      <p class="footnote">
        Questions, or something you would rather he practised instead? Tell Dan — the app
        is built at home and can be changed in an evening.
      </p>
    </section>`
}
