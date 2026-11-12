#!/usr/bin/env node
/**
 * Drives the page in the Chrome already installed on this machine and takes
 * screenshots for visual review. No browser download.
 *
 *   node scripts/shots.mjs --out /tmp/shots [--url http://localhost:5199/]
 *        [--width 1440] [--height 900] [--scale 1] [--lang en|zh] [--depth developer]
 *        [--reduced] [--do <action> ...]
 *
 * Actions run in order:
 *   goto:#proof-of-work          scroll an element to just under the top bar
 *   click:<selector>             Playwright selector, e.g. click:text=Mine
 *   fill:<selector>|<text>
 *   press:<key>
 *   hover:<selector>
 *   wait:<ms>
 *   waitfor:<selector>
 *   shot:<name>                  viewport screenshot
 *   full:<name>                  full-page screenshot
 *   el:<selector>|<name>         screenshot of one element
 *   eval:<expression>            print the value of a page expression
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const flag = (name) => args.includes(`--${name}`);
const actions = args.flatMap((a, i) => (a === '--do' ? [args[i + 1]] : []));

const out = opt('out', 'shots');
const width = Number(opt('width', 1440));
const height = Number(opt('height', 900));
const params = new URLSearchParams();
if (opt('lang')) params.set('lang', opt('lang'));
if (opt('depth')) params.set('depth', opt('depth'));
const url = `${opt('url', 'http://localhost:5199/')}${params.size ? `?${params}` : ''}`;

mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: Number(opt('scale', 1)),
  reducedMotion: flag('reduced') ? 'reduce' : 'no-preference',
  hasTouch: width < 600,
});
const page = await context.newPage();
const problems = [];
page.on('console', (message) => {
  if (message.type() === 'error') problems.push(`console: ${message.text()}`);
});
page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));

await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);

for (const action of actions.length ? actions : ['shot:shot']) {
  const cut = action.indexOf(':');
  const verb = action.slice(0, cut);
  const rest = action.slice(cut + 1);
  const [first, second] = rest.split('|');
  try {
    if (verb === 'goto') {
      await page.evaluate((selector) => {
        const element = document.querySelector(selector);
        const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topbar-h')) || 0;
        if (element) {
          window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - bar - 8, behavior: 'instant' });
        }
      }, first);
      await page.waitForTimeout(500);
    } else if (verb === 'click') await page.locator(first).first().click({ timeout: 5000 });
    else if (verb === 'fill') await page.locator(first).first().fill(second ?? '', { timeout: 5000 });
    else if (verb === 'press') await page.keyboard.press(first);
    else if (verb === 'hover') await page.locator(first).first().hover({ timeout: 5000 });
    else if (verb === 'wait') await page.waitForTimeout(Number(first));
    else if (verb === 'waitfor') await page.locator(first).first().waitFor({ timeout: 15000 });
    else if (verb === 'shot') console.log(await shot(first, {}));
    else if (verb === 'full') console.log(await shot(first, { fullPage: true }));
    else if (verb === 'el') {
      const file = join(out, `${second}.png`);
      await page.locator(first).first().screenshot({ path: file });
      console.log(file);
    } else if (verb === 'eval') console.log(`eval ${first} →`, JSON.stringify(await page.evaluate(first)));
    else console.log(`unknown action: ${action}`);
  } catch (error) {
    console.log(`FAILED ${action}: ${String(error.message).split('\n')[0]}`);
  }
}

async function shot(name, options) {
  const file = join(out, `${name}.png`);
  await page.screenshot({ path: file, ...options });
  return file;
}

if (problems.length) {
  console.log(`PROBLEMS (${problems.length}):\n  ${[...new Set(problems)].slice(0, 15).join('\n  ')}`);
}
await browser.close();
