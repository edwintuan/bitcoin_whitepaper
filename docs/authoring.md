# Authoring chapters, figures and term visuals

How to add or change a chapter of the explainer so that it matches the others.
Section 4 (Proof-of-Work) is the reference implementation: read its files
before writing anything, and copy its patterns rather than inventing new ones.

## What a chapter is made of

| File | What it holds | Reference |
| --- | --- | --- |
| `src/content/sections/NN-id.ts` | The chapter's copy in both languages: a default export of type `SectionContent` | `04-proof-of-work.ts` |
| `src/content/sources/NN-id.ts` | Source excerpts with our line notes: `SectionSources` | `04-proof-of-work.ts` |
| `src/content/whitepaper/NN-id.ts` | The paper's own text and its translation. Already written; do not edit | |
| `src/figures/<Name>.tsx` | The chapter's interactive figure, default export. Parts, styles, copy and tests go in `src/figures/<name>/` | `PowMiner.tsx`, `pow/` |
| `src/glossary/visuals/<term-id>.tsx` | The small live figure inside a term's card. The file name is the term id | `nonce.tsx`, `difficulty.tsx` |
| `src/components/site/paper-figures/<id>.tsx` | A static redraw of one of the paper's own diagrams | `pow-blocks.tsx`, `kit.tsx` |

Everything is picked up by file name. There is no index to edit. Types are in
`src/content/types.ts`.

Shared code is not yours to change while several people are writing chapters
at once: `src/lib`, `src/components/site`, `src/components/viz`,
`src/components/base`, `src/styles`, `src/glossary/terms.ts`, `src/content/ui.ts`,
`src/content/types.ts`, `package.json`. If you need something there, finish
without it and say so in your report.

## Copy

### Shape

- `tldr`: one or two sentences, about 40 words at most. The claim of the section in plain words.
- `analogy`: two to four sentences. One everyday picture, and it must be right about what stands for what.
- `body`: three to six paragraphs that follow the paper's own argument in the paper's order.
- `figure.steps`: three to six. A title of at most five words, then one to three short sentences telling the reader what to do and what to notice.
- `whoRuns`: two to four actors. For each: what it does at this step, and one concrete thing to hold on to (an RPC, a message, a file, a device, a standard). `snippet` is something a developer could type or would see.
- `paperVsToday`: three to six bullets. Each is one checkable fact about how the running system differs from the 2008 text.

### Markup

Copy is "rich text" (`src/text/richtext.ts`):

- `[[term-id]]` or `[[term-id|shown words]]` links a glossary term. The ids are in `src/glossary/terms.ts`.
- `{§4}` or `{§4|shown words}` links a section. `{§0}` is the Abstract.
- `**strong**`, `*emphasis*`, `` `code` ``, `[words](https://…)`, and `[words](#engineering-map)` for a place on this page.

Link a term the first time it matters in a block, not every time it appears.
Do not link inside figure step titles. Do not use `*` for multiplication; write ×.

### English

Plain, specific, calm. Short sentences. British spelling. No filler
("essentially", "simply", "basically"), no hype, no rhetorical questions, no
em dashes. Prefer a concrete verb to an abstraction.

### Traditional Chinese

Hong Kong written usage, formal register (書面語). Write it as Chinese, not as
a word-for-word rendering: the two languages must say the same thing, and each
should read as if written first.

- Use the glossary's Chinese names for terms; `src/glossary/terms.ts` is the source of truth. The binding vocabulary is in section 8 of the design spec (`docs/superpowers/specs/`).
- Full-width punctuation, 「」 for quotation, a space between Chinese and Latin letters or digits, none beside full-width punctuation.
- Code, hashes, RPC names and message names stay in English.
- `findZhProblems` in `src/content/zhChecks.ts` catches Taiwan and mainland renderings and stray simplified characters.

### Accuracy

- Every engineering fact must be checkable against the source mirrored in `reference/` (Bitcoin Core v32.1, the 2009 client at v0.1.5 and the Electrum protocol document, each pinned; run `npm run fetch-reference` if the folder is missing) or against a BIP. If you cannot check it, leave it out. A fact that rests on another document needs that document added to `scripts/fetch-reference.mjs`, pinned to a commit.
- No figures that drift: network hash rate, prices, device specifications, node counts.
- Where the paper and today's Bitcoin differ, the body follows the paper and `paperVsToday` states today's rule.

## Source excerpts

- Extract with `node scripts/excerpt.mjs <tag> <path> <firstLine> <lastLine>` and paste the output. Never retype or reflow code.
- `startLine` is the line number of the first line in the file at that tag. Annotation `lines` are absolute line numbers in the same file.
- Notes are ours and are shown as such. Keep each to one or two sentences that say what the lines do and why it matters for this section.
- Two or three excerpts per chapter is enough. Prefer short ones (10 to 40 lines).

## Figures

### Contract

```tsx
import { useFigure } from '@/components/site/FigureFrame';

export default function MyFigure() {
  const { step, goTo, active, reducedMotion } = useFigure();
  …
}
```

- `step` is the index of the guided step on screen, or `null` once the reader explores freely. React to it by putting the figure in that step's state and pointing at the relevant part with the class `fig-pointed` (see `pow/MineScene.tsx`). Controls stay usable in every step.
- If the reader changes scene or state by hand, keep the walkthrough in step with `goTo`.
- Stop all timers, animation frames and computation while `active` is false.
- With `reducedMotion`, replace travel with instant changes and offer a button for anything that would otherwise play by itself.

### Substance

- Nothing is faked. Hashes, signatures, proofs, probabilities and mining all come from the engine in `src/lib`. Read the module's JSDoc before using it.
- Randomness that drives a simulation comes from `mulberry32` in `src/lib/rng.ts` so that it can be tested and replayed.
- Logic that lives in the figure's folder gets a unit test, written first (`pow/toyChain.test.ts`).
- A figure's folder is its own. A term visual may reuse parts of its chapter's figure; anything two figures share belongs in `src/components/viz` (drawing parts), `src/state` (hooks) or `src/lib` (computation).
- Keys made in the page are throwaway. Where a key or address is shown, say so (`UI.demoKeysWarning`).

### Look

The stage is about 560 px wide beside the text on a desktop and about 358 px
on a phone. It must work at both without horizontal scrolling, except inside
code and byte views.

**One frame, nothing boxed inside it.** The frame `FigureFrame` draws is the
figure's only border. Inside the stage:

- Tell things apart with space, a label, a 1 px rule (`fig-group`) or the one
  tint (`fig-band`). Do not put a border around a group, a readout, a list, a
  legend or a set of controls.
- An object of the story (a block, a transaction, a coin, a message) is a solid
  shape, filled, with no outline, and it never contains another bordered box.
  Fields inside it are lines of text separated by hairlines.
- The walkthrough points at a part with `fig-pointed`, an orange bar in the
  gutter beside it. Never an outline around it. The bar is the element's
  `::before`, so it cannot go on an element that has one of its own, and a
  parent with `overflow: hidden` (a tile's rows) clips it: point at the row's
  container instead.
- A state such as "not checked" is words (`tag-line`), not a boxed pill. Only
  results that matter get a filled tag (`tag-valid`, `tag-invalid`, `tag`).
- No element whose only job is to wrap one other element. If a `div` has no
  class that changes how something looks or works, delete it.

Section 4 after this rule is the model: a ruled list under one heavy line, a
tinted band for the hash, and a list of actors with hairlines between them.

- Use the shared parts: `BlockTile`, `ChainRow`, `HashText`, `Counter`, `HexView` from `src/components/viz`.
- Use the shared classes from `src/styles`: `fig-stack`, `fig-row`, `fig-group`, `fig-band`, `fig-pointed`, `fig-note`, `fig-status`, `stat`, `label`, `mono`, `ui`, `poster`, `tag`, `tag-orange`, `tag-line`, `tag-valid`, `tag-invalid`, `btn`, `btn-dark`, `btn-line`, `btn-sm`.
- Controls: `Slider`, `SegmentedControl`, `Switch` from `src/components/base`; plain `<button className="btn …">` for actions; every input has a visible label.
- Colours only through the tokens: `--color-orange`, `--color-orange-ink`, `--color-orange-soft`, `--color-ink`, `--color-ink-2`, `--color-ink-3`, `--color-ink-4`, `--color-cream`, `--color-cream-2`, `--color-cream-3`, `--color-paper`, `--color-rule`, `--color-valid`, `--color-invalid`. No new colours, no gradients, no rounded corners, no soft shadows.
- Orange is the one accent: what is live, selected or newly valid. Green and red are only for the outcome of a check, and never the only signal: pair them with a word or a mark.
- Rules, not boxes: a 3 px ink line above a list or a result, 1 px `--color-rule` between rows and groups. Borders on all four sides belong to the figure's frame and to form controls only.
- Figure styles go in a plain CSS file beside the figure, with a class prefix of its own.

### Motion

Only the tokens and recipes in `src/styles/motion.css` (`t-slam`, `t-shift`,
`t-pop`, `t-rise`, `t-reveal`, `t-shake`, `t-cascade`, `t-draw`, `t-shimmer`,
`t-swap-soft`, the accordion and the sliding pill). Animate `transform`,
`opacity` and small `filter` only; name the properties you transition; add a
`prefers-reduced-motion` branch for anything you write.

### Accessibility

Everything works from the keyboard. Focus is visible. A live result is
announced with `role="status"`. Decorative drawings are `aria-hidden`; a
drawing that carries information has a text alternative. Text contrast meets
WCAG AA.

Three things the reviews of the first chapters kept finding:

- Do not set `outline` on anything that can take the focus. Figure styles are
  not in a cascade layer and the site's focus ring is, so your outline wins
  and the focused button looks like any other. To point at a control during a
  walkthrough, put `fig-pointed` on the row or group it sits in.
- A button that changes state when pressed must not use the `disabled`
  attribute: the browser takes the focus away and a keyboard reader is back at
  the top of the page. Use `aria-disabled="true"` and a handler that does
  nothing. `.btn[aria-disabled='true']` is styled like a disabled button. If
  pressing a button removes it, move the focus to what replaces it.
- No text under 11 px (superscripts may go down to 9 px). Words in a drawing
  are set at the size they are shown, not scaled with it.

## Term visuals

A default export with no props, drawn on the black card: cream and orange
only, at most about 300 px wide and 130 px tall, importing `./visuals.css`.
Use real values from the engine. Keep motion gentle, stop timers on unmount,
and show a still frame under reduced motion. Its caption is one sentence.

## The paper's diagrams

Redraw with `Diagram`, `Box`, `Label` and `Arrow` from `paper-figures/kit.tsx`.
Stay faithful to the page (`reference/bitcoin.pdf`): same boxes, same labels in
English, same arrows. Give the diagram an `aria-label` that says what it shows.
Draw arrows after boxes so their heads are not painted over.

## Checking your work

- `npx vitest run <your test files>` and `npx tsc -b --noEmit`.
- Look at it. A dev server is normally running at `http://localhost:5199/`; `node scripts/shots.mjs` drives the installed Chrome and saves screenshots:

  ```bash
  node scripts/shots.mjs --out /tmp/shots --width 1360 --height 900 --depth developer \
    --do 'goto:#network' --do 'wait:800' --do 'shot:network-desktop' \
    --do 'click:.figure-step-nav >> text=Next' --do 'wait:600' --do 'el:.section-figure|network-step-2'
  node scripts/shots.mjs --out /tmp/shots --width 390 --height 844 --lang zh \
    --do 'goto:#network' --do 'wait:800' --do 'full:network-phone-zh'
  ```

  A keyword is a `span` with the class `kw` and the button role. To look at a term's card and its visual: `--do 'goto:#term-nonce' --do 'wait:500' --do 'click:#term-nonce .kw' --do 'wait:700' --do 'shot:card-nonce'`. Go to the entry and let the page come to rest first: a card closes if the page scrolls under it.

  Open the images and fix what is wrong: overflow, overlap, clipped text, poor contrast, misalignment, a walkthrough step that does not show what it says. Check both languages, all three reading depths (`--depth starter|curious|developer`), and `--reduced`.
