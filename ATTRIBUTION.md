# Attribution

## Piano samples

`public/audio/piano/*.mp3` are from the **Salamander Grand Piano** by Alexander Holm,
licensed **CC-BY 3.0**, obtained via
[nbrosowsky/tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments) (MIT).

Eight notes are vendored — C4, D#4, F#4, A4, C5, D#5, F#5, A5 — spaced so that
`Tone.Sampler` never pitch-shifts a note more than about a minor third, and so that
every key offered in the parent area stays inside the sampled range.

They are committed to the repo rather than fetched from a CDN because the app is
required to make no network calls after load, and to work offline once installed.

## Design influences

The pedagogy here — quantity and pitch encoded as counted, colored, ordinal blocks —
is influenced by *Numberblocks* (Alphablocks Ltd.), and the rainbow color ordering
agrees with the **Chroma-Notes** convention used by Boomwhackers and most color-coded
sheet music.

The character and block artwork in this repo is original. No *Numberblocks* character
designs, artwork, or names are reproduced. This is a personal project built for one
family's use; see §11 of `requirements.md` before it goes anywhere else.
