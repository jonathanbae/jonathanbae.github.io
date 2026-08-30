# Form fill engine

Fills the Pilgrim Community Church Payment Request Form (page 1) for Chara EM.

- `template-p1.pdf` — blank form, page 1 only, page 2 (church-wide code table) dropped.
- `layout.mjs` — coordinate map. Every value was read out of the PDF's own vector grid,
  not eyeballed: column rules at x = 59.2 / 231.2 / 342.0 / 449.1 / 537.2, four body rows
  between y = 587.3 and 477.2, and the four 10.3pt checkbox squares.
- `fill.mjs` — `fillForm(templateBytes, request)`. Emits one page per 4 line items; each
  page is a **standalone form** with its own header, payee and its own total.
- `calibrate.mjs` — renders known cases to PNG so coordinate changes can be eyeballed.

## Gotcha: annotations paint over page content

The blank form ships with four markup annotations by author `leeju` — two `/Square`
white-outs hiding the stale preprinted "2020" years, plus their `/Popup`s. Annotations
render *above* the page content stream, so anything drawn under them is invisible in the
output. `fillForm` deletes `/Annots` on each copied page and re-does the masking itself.
If the Requested Date ever comes out clipped again, this is why.

## Checked against reality

`node form/calibrate.mjs` reproduces the hand-filled scan we calibrated from.
`node form/calibrate.mjs overflow` must produce 2 pages totalling 237.45 and 1327.75.
