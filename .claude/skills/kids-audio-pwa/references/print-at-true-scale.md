# Printing things that have to match a physical object

When a printed artifact must line up with something real — stickers on piano keys, a
cut-out template, a measuring guide — the page has one hard requirement that ordinary
web design never has: **it must come out the size you specified.**

Browsers and print dialogs will happily scale a page to fit, silently, and the user
finds out only after cutting.

## Use physical units, and prove the scale

Specify anything that touches the real object in millimetres, not pixels:

```css
@page { size: letter portrait; margin: 14mm; }
.sticker { width: 18mm; height: 18mm; }
.sticker-row { gap: 5.5mm; }   /* key pitch (23.5mm) minus the dot width */
```

Then put a **calibration ruler** on the page — a box of a known width with its length
printed inside it, and an instruction to measure it before cutting:

```html
<div class="ruler"><span>This line is exactly 100 mm</span></div>
```

```css
.ruler { width: 100mm; height: 10mm; border: 1.5pt solid #000; border-top: 0; }
```

If it doesn't measure 100mm, the print dialog scaled the page and everything else on it
is wrong too. This one element converts a silent, expensive failure into an obvious,
free one. It is worth more than any amount of CSS care.

Look up the real dimension rather than guessing: a standard acoustic piano white key is
about 23.5mm wide at the front, so an 18mm dot sits comfortably without fouling the
black keys.

## Print CSS that survives the dialog

```css
@media print {
  body { background: #fff; }
  .toolbar { display: none; }              /* screen-only chrome */
  .page {
    width: auto; margin: 0; padding: 0; box-shadow: none;
    break-after: page; page-break-after: always;
  }
  .page:last-child { break-after: auto; page-break-after: auto; }
}
```

Backgrounds and colored fills are stripped by default, which for a color-coded artifact
destroys the entire point. Opt in explicitly on any element whose color carries meaning:

```css
.sticker, .swatch { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
```

Add a cutting guide that survives a monochrome printer — a dashed outline offset from
the shape works, since a colored edge alone disappears in greyscale.

Tell the user the two settings that matter: **100% / "Actual size"** scaling, and
**background graphics on**.

## Build print pages inside the app, not beside it

Add a second entry point to the same project rather than writing standalone HTML. The
print pages then import the same design tokens and domain logic as the app, so the
paper cannot drift away from the screen. For an artifact whose whole job is to make the
physical object and the app *the same thing*, a sticker that no longer matches the
screen is not a cosmetic bug — it breaks the link the artifact exists to create.

A single page with sections and page breaks is usually kinder than many separate files:
one link, and the user prints the range they want.

## Rendering domain graphics

For specialist output — music notation, diagrams, charts — use a real library rather
than hand-rolling glyphs. Amateur output undermines the credibility of an artifact that
a professional will look at, and the hard parts (clefs, stems, beams, ledger lines) are
exactly where hand-rolling fails.

Two things worth knowing when overlaying your own annotations on a rendered layout:

- Ask the library where things ended up **after formatting** (each element's resolved
  x position), rather than computing positions yourself.
- Layout libraries often reserve space above their content, so the coordinate you pass
  as "top" is not where the first visible line lands. Measure before choosing offsets,
  or annotations land on top of the content.

Verify by rendering and **looking at it at high zoom**. Notation and measurement errors
are invisible in a thumbnail and obvious to the expert you are handing it to.
