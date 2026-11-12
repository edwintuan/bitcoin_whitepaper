#!/usr/bin/env node
/**
 * Looks for layout faults that a screenshot review can miss: text that sticks
 * out of the shape it sits in, text that is cut off, text under 11 px, and a
 * page that scrolls sideways. Drives the Chrome already installed on this
 * machine against a running dev or preview server.
 *
 *   node scripts/layout-audit.mjs [--url http://localhost:5199/]
 *        [--widths 1440,1024,820,390] [--langs en,zh] [--depth developer]
 *        [--only <section-id>] [--cards] [--verbose]
 *
 * For every chapter it walks the figure's guided steps and checks each one.
 * With --cards it also opens every glossary card. Truncation with an ellipsis
 * is deliberate where it happens (hashes), so it is only listed with --verbose,
 * and so are the two contrast exceptions the design accepts (see EXCEPTIONS).
 *
 * Exits with 1 if anything was found.
 */
import { chromium } from 'playwright-core';
import { auditInPage, widestInPage } from './audit-in-page.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const flag = (name) => args.includes(`--${name}`);

const base = opt('url', 'http://localhost:5199/');
const widths = opt('widths', '1440,1024,820,390').split(',').map(Number);
const langs = opt('langs', 'en,zh').split(',');
const depth = opt('depth', 'developer');
const only = opt('only', null);
const cards = flag('cards');
const verbose = flag('verbose');

/**
 * Contrast the design knowingly accepts, recorded in section 16 of the design
 * spec. Both are display type at 60 px and more whose content is also there
 * as ordinary text: the title's full wording is the heading's accessible
 * name, and the section's number is in the navigation and the address.
 */
const EXCEPTIONS = [
  { kind: 'contrast', element: /^span\.hero-em\b/ }, // two words of the hero title, cream on orange
  { kind: 'contrast', element: /^span\.section-no\b/ }, // the large numeral beside each section title
];
const accepted = (finding) => EXCEPTIONS.some((entry) => entry.kind === finding.kind && entry.element.test(finding.element ?? ''));

const browser = await chromium.launch({ channel: 'chrome', headless: true });
/** key -> { finding, where: Set<string> } */
const all = new Map();
const note = (config, place, findings) => {
  for (const finding of findings) {
    if ((finding.kind === 'ellipsis' || accepted(finding)) && !verbose) continue;
    // Sixty line numbers in the same faint grey are one finding, not sixty.
    const sameLook = finding.kind === 'contrast' || finding.kind === 'small';
    const key = [finding.kind, place.split(' ')[0], finding.container, sameLook ? finding.by : finding.text, finding.element].join('|');
    let entry = all.get(key);
    if (!entry) all.set(key, (entry = { finding, place, where: new Set(), texts: new Set() }));
    entry.where.add(config);
    entry.texts.add(finding.text);
  }
};

for (const width of widths) {
  for (const lang of langs) {
    const config = `${width}/${lang}`;
    const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width < 600 });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.goto(`${base}?lang=${lang}&depth=${depth}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);

    const sections = await page.evaluate(() => [...document.querySelectorAll('main section[id]')].map((s) => s.id));
    const sideways = () =>
      page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

    for (const id of sections) {
      if (only && id !== only) continue;
      const selector = `#${id}`;
      await page.evaluate((sel) => document.querySelector(sel)?.scrollIntoView({ block: 'start' }), selector);
      await page.waitForTimeout(350);
      const figure = page.locator(`${selector} figure.figure`).first();
      const hasFigure = (await figure.count()) > 0;
      if (hasFigure) {
        await figure.scrollIntoViewIfNeeded();
        await page
          .locator(`${selector} .figure-stage .t-reveal`)
          .first()
          .waitFor({ timeout: 8000 })
          .catch(() => note(config, id, [{ kind: 'figure-not-loaded', container: selector, text: '', element: '' }]));
        await page.waitForTimeout(500);
      }
      note(config, id, await page.evaluate(auditInPage, selector));

      if (hasFigure) {
        for (let step = 2; step <= 12; step += 1) {
          const forward = page.locator(`${selector} .figure-step-nav .btn-dark`).first();
          if ((await forward.count()) === 0) break;
          await forward.click();
          await page.waitForTimeout(650);
          note(config, `${id} step ${step}`, await page.evaluate(auditInPage, `${selector} figure.figure`));
        }
      }
      const extra = await sideways();
      if (extra > 1) {
        const widest = await page.evaluate(widestInPage);
        note(config, id, [{ kind: 'page-scrolls-sideways', container: 'html', text: widest.join(', '), by: `${extra}px`, element: '' }]);
      }
    }

    if (!only) {
      for (const selector of ['header.topbar', '.hero', 'footer.footer']) {
        note(config, selector, await page.evaluate(auditInPage, selector));
      }
    }

    if (cards && (!only || only === 'glossary')) {
      const terms = await page.evaluate(() => [...document.querySelectorAll('[id^="term-"]')].map((item) => item.id));
      for (const id of terms) {
        await page.evaluate((termId) => document.getElementById(termId)?.scrollIntoView({ block: 'center' }), id);
        await page.waitForTimeout(120);
        await page.locator(`#${id} .kw`).first().click();
        const card = page.locator('.term-card').first();
        const opened = await card
          .waitFor({ timeout: 3000 })
          .then(() => true)
          .catch(() => false);
        if (!opened) {
          note(config, id, [{ kind: 'card-did-not-open', container: id, text: '', element: '' }]);
          continue;
        }
        await page.waitForTimeout(450);
        note(config, `card ${id}`, await page.evaluate(auditInPage, '.term-card'));
        await page.keyboard.press('Escape');
        await card.waitFor({ state: 'detached', timeout: 3000 }).catch(() => {});
      }
    }

    for (const message of new Set(errors)) {
      note(config, 'console', [{ kind: 'console-error', container: '', text: message.slice(0, 160), element: '' }]);
    }
    await context.close();
    process.stderr.write(`checked ${config}\n`);
  }
}
await browser.close();

const lines = [...all.values()]
  .sort((a, b) => a.finding.kind.localeCompare(b.finding.kind) || a.place.localeCompare(b.place))
  .map(({ finding, place, where, texts }) => {
    const by = finding.by ? ` by ${finding.by}` : '';
    const more = texts.size > 1 ? ` and ${texts.size - 1} more` : '';
    return `${finding.kind.padEnd(10)} ${place.padEnd(34)} "${finding.text}"${more}${by}\n           in ${finding.container} (${finding.element}) at ${[...where].join(' ')}`;
  });
console.log(lines.length ? lines.join('\n') : 'Nothing found.');
console.log(`\n${lines.length} finding(s) across ${widths.length * langs.length} configuration(s).`);
process.exit(lines.length ? 1 : 0);
