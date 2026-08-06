/**
 * The print pack: stickers, chart, teacher sheet, songbook.
 *
 * Built as a second Vite entry rather than static HTML so it can import the app's own
 * colour tokens and scale maths. If the palette ever changes, the paper changes with
 * it — a sticker that no longer matches the screen would break the one link (§8.4)
 * this whole pack exists to create.
 */

import './print.css'
import { renderStickers } from './stickers'
import { renderChart, renderTeacherSheet } from './reference'
import { renderSong } from './notation'
import { SONGS } from '../music/songs'

const pack = document.getElementById('pack')!

function section(): HTMLElement {
  const element = document.createElement('div')
  pack.appendChild(element)
  return element
}

renderStickers(section())
renderChart(section())
renderTeacherSheet(section())

// One song per page, so a single tune can be torn off for the music stand.
const songbook = section()
songbook.innerHTML = `
  <section class="page">
    <h1>Songs to play</h1>
    <p class="lede">
      The same eight colours, on a real staff. Each notehead is coloured by its scale
      degree, and the chip underneath repeats that colour with its number and letter —
      so the colour he taps on the screen is the colour he reads on the page.
    </p>
    <p class="footnote">
      Everything here is in C major, matching the key stickers. Play the numbers, sing
      the words, then look at where the notes sit on the staff: the higher the note
      sounds, the higher it is printed.
    </p>
  </section>`

for (const song of SONGS) {
  const page = document.createElement('section')
  page.className = 'page song'
  page.innerHTML = `<h2 class="song-title">${song.title}</h2>`
  songbook.appendChild(page)

  const staves = document.createElement('div')
  staves.className = 'staves'
  page.appendChild(staves)

  renderSong(staves, song, 620)
}

document.getElementById('print')!.addEventListener('click', () => window.print())
