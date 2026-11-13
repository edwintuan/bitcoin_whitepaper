# Bitcoin, explained block by block

An interactive walkthrough of *Bitcoin: A Peer-to-Peer Electronic Cash System*
(Satoshi Nakamoto, 2008), in English, Traditional Chinese (Hong Kong usage)
and Simplified Chinese.
Provided by Animus Laboratories.

The paper's abstract and twelve sections are laid out as one long page, in the
paper's own order. Each section has:

- a two-sentence summary and one everyday comparison;
- an explanation that follows the paper's argument;
- an interactive figure with a guided walkthrough. Nothing in it is faked:
  hashes, signatures, Merkle proofs, mining and the attack probabilities are
  computed in the browser;
- the paper's own words, with a translation set beside them;
- "who runs this": which wallet, node, pool or device carries the step out
  today, and through which RPC, message, file or standard;
- annotated excerpts from Bitcoin Core and from the 2009 client;
- where the 2008 text and today's network differ.

Every keyword opens a card with a plain definition, a more exact one for
developers, and for 29 of the 94 terms a small live figure. Three reading
depths (Starter, Curious, Developer) decide which of these blocks start open.

## Run it

Needs Node 20.19 or newer (22.12 or newer on the 22 line).

```bash
npm install
npm run dev        # http://localhost:5199
npm test           # unit and content tests
npm run typecheck
npm run build      # static site in dist/, relative paths, host anywhere
npm run preview
npm run audit      # with the dev server running: measure the page in a browser
```

`npm run audit` drives the Chrome installed on the machine through every
chapter and every step of its figure, at several widths and in both
languages, and lists text that is cut off, sticks out of the shape it sits in,
is under 11 px or is short on contrast, and any width at which the page
scrolls sideways. `--only <section-id>` keeps it to one chapter and `--cards`
opens every glossary card. `scripts/shots.mjs` takes screenshots the same way.

`npm run fetch-reference` downloads the source files the excerpts are taken
from into `reference/` (git-ignored). With that folder present, the tests also
check every excerpt against the tagged file, line for line.

`npm run fonts` rebuilds the Chinese fonts in `src/assets/fonts/` and the
stylesheet that loads them. They are cut down to the characters the source
actually uses (about 0.2 MB a weight instead of 7 to 10 MB) and split so that
an English page fetches a few kilobytes of them, not a megabyte. Run it after
adding Chinese copy; a test fails until you do. The script stops with a list
if the copy uses a character the fonts do not hold.

`?lang=zh` or `?lang=en`, and `?depth=starter|curious|developer`, open the
page in that language and at that depth. A link like that holds for the visit
and is not stored. Once the reader chooses a language or depth on the page,
that choice is stored, the parameter leaves the address, and later visits open
as they left it. A link to a section, such as `#proof-of-work`, opens there.

## How it is put together

React 19, TypeScript, Vite and Tailwind CSS v4. Controls come from
[BoardUI](https://www.boardui.com/) (React Aria underneath), restyled for the
poster look. Motion uses the tokens and recipes of
[transitions.dev](https://transitions.dev/) as plain CSS in
`src/styles/motion.css`.

```
src/
  lib/           The engine: pure TypeScript, no DOM, written test-first.
                 bytes, hash, header, miner, difficulty, merkle, keys, tx,
                 subsidy, attack, rng, netsim, p2p/messages
  content/       Everything the reader reads, as data in both languages
    sections/      NN-id.ts    one chapter each
    whitepaper/    NN-id.ts    the paper's text and its translation
    sources/       NN-id.ts    source excerpts and our line notes
    ui.ts, parts.ts, actors.ts, journey.ts, references.ts
  glossary/      terms.ts (94 terms) and visuals/<term-id>.tsx
  figures/       <Name>.tsx per chapter, with its parts in <name>/
  components/
    site/          the page: top bar, chain navigation, hero, journey,
                   section anatomy, term cards, appendices, search
    viz/           shared drawing parts: block tiles, hashes, byte views
    base/          BoardUI components
  state/, i18n/, text/, styles/
scripts/
  fetch-reference.mjs   mirror the pinned source files
  excerpt.mjs           print exact lines of a mirrored file for pasting
  subset-fonts.mjs      cut the Chinese fonts down to the characters in use
  shots.mjs             drive the installed Chrome and save screenshots
  layout-audit.mjs      measure every chapter for clipped, tiny or faint text
docs/
  authoring.md          how to write a chapter, a figure or a term visual
  superpowers/          the design spec and the implementation plan
```

Chapters, figures, term visuals and redrawn paper diagrams are found by file
name; there is no registry to edit, apart from the list of terms that have a
visual. `docs/authoring.md` has the conventions, and
`src/content/consistency.test.ts` holds every chapter to them.

### Adding or changing a term

Edit `src/glossary/terms.ts`. Link it from copy with `[[term-id]]` or
`[[term-id|shown words]]`. A live figure for its card is a default export in
`src/glossary/visuals/<term-id>.tsx`; add the id to `TERMS_WITH_VISUALS`.

### Adding or changing a chapter

See `docs/authoring.md`. Section 4 (Proof-of-Work) is the reference.

## Sources and accuracy

- The paper is the PDF at <https://bitcoin.org/bitcoin.pdf>
  (SHA-256 `b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553`).
  The English shown on the page is checked against its text by
  `src/content/whitepaper/whitepaper.test.ts`. The Traditional Chinese
  translation is ours.
- The Simplified Chinese edition is not written separately. It is derived
  from the Traditional copy as the page is drawn (`src/i18n/hans.ts`): words
  that differ between Hong Kong and the mainland are swapped first
  (`scripts/hans-terms.mjs`), then each remaining character is mapped to its
  Simplified form. After changing the Chinese copy, run `npm run hans` and
  then `npm run fonts`; the tests fail until you do.
- Source excerpts are quoted from [bitcoin/bitcoin](https://github.com/bitcoin/bitcoin)
  at tag `v32.1`, and from the 2009 client at tag `v0.1.5`. Both are
  distributed under the MIT licence. Excerpts are verbatim; the notes beside
  them are ours. What a light wallet asks a server for is taken from the
  Electrum protocol document, pinned to a commit.
- Where the paper and today's Bitcoin differ, the explanation follows the paper
  and the "paper vs today" block states the current rule.
- The page shows no market data, makes no recommendations, and is not
  financial advice. Product names appear only as examples of a kind of
  software or device.

Keys and addresses generated in the page are for demonstration only. Never
send funds to them.

## Support

The site is free, has no ads and tracks nothing. If it helped you, a tip to any
of these addresses keeps it going. Compare the first and last few characters
after pasting: a payment to a wrong address cannot be undone.

| Network | Address |
| --- | --- |
| Bitcoin | `bc1qfl9phz8p4capyd2ewz0w4u3s0wgu05kwv2cya6` |
| Ethereum and any EVM chain | `0x7E9620a4bAB85aED025b8c8d6277834084b0D261` |
| TRON | `TYR5uQCUpk2MztNWQgBP9E9BKNUVgdLvFr` |
