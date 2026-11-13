#!/usr/bin/env node
/**
 * Drives the page in a real browser and checks what a reader with a keyboard,
 * a screen reader or a finger depends on:
 *
 * - every control, picture and dialog has a name in the accessibility tree;
 * - keyboard focus can be seen, and its ring stands 3:1 against what is behind it;
 * - on a phone, a control that stands alone is at least 24px in each direction.
 *
 * Text contrast and overflow are scripts/layout-audit.mjs. Exits 1 on any finding.
 *
 *   node scripts/a11y-audit.mjs [base url] [langs] [widths]
 *   node scripts/a11y-audit.mjs https://example.org/bitcoin/ en,zh,zh-CN 1440,390
 */
import { chromium } from 'playwright-core';
const [base = 'http://localhost:5199/', langs = 'en,zh,zh-CN', widths = '1440,390'] = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
let total = 0;
for (const width of widths.split(',').map(Number)) for (const lang of langs.split(',')) {
  const context = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 900 }, hasTouch: width < 600 });
  const page = await context.newPage();
  await page.goto(`${base}?lang=${lang}&depth=developer`, { waitUntil: 'networkidle' });
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 600) { await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y); await page.waitForTimeout(50); }
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  // names, from the browser's own accessibility tree
  const cdp = await context.newCDPSession(page);
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  const INTERACTIVE = new Set(['button', 'link', 'textbox', 'searchbox', 'combobox', 'slider', 'spinbutton', 'checkbox', 'radio', 'switch', 'tab', 'menuitem', 'option', 'listbox', 'radiogroup', 'tablist', 'dialog', 'img', 'figure', 'table', 'navigation', 'region']);
  const mustName = new Set(['button', 'link', 'textbox', 'searchbox', 'combobox', 'slider', 'spinbutton', 'checkbox', 'radio', 'switch', 'tab', 'menuitem', 'option', 'listbox', 'radiogroup', 'tablist', 'dialog', 'img']);
  const unnamed = {}; const counts = {};
  for (const n of nodes) {
    const role = n.role?.value; if (n.ignored || !INTERACTIVE.has(role)) continue;
    counts[role] = (counts[role] ?? 0) + 1;
    if (mustName.has(role) && !(n.name?.value ?? '').trim()) (unnamed[role] ??= []).push(n.backendDOMNodeId);
  }
  const describe = async (id) => { try { const { object } = await cdp.send('DOM.resolveNode', { backendNodeId: id }); const r = await cdp.send('Runtime.callFunctionOn', { objectId: object.objectId, functionDeclaration: 'function(){const e=this.nodeType===1?this:this.parentElement;let s=e.closest("section[id]");return (s?"#"+s.id+" ":"")+e.tagName.toLowerCase()+"."+String(e.className.baseVal??e.className).split(" ").slice(0,2).join(".")}', returnByValue: true }); return r.result.value; } catch { return '?'; } };
  const findings = [];
  for (const [role, ids] of Object.entries(unnamed)) { const where = [...new Set(await Promise.all(ids.map(describe)))]; findings.push(`unnamed ${role} ×${ids.length}: ${where.slice(0, 6).join(' | ')}`); }
  // focus rings and target sizes
  await page.keyboard.press('Tab');
  const res = await page.evaluate(async (narrow) => {
    const lum = (c) => { const m = c.match(/[\d.]+/g).map(Number); const [r, g, b] = m.slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return { l: 0.2126 * r + 0.7152 * g + 0.0722 * b, a: m[3] ?? 1 }; };
    const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (lum(c).a > 0.9) return c; } return 'rgb(255,255,255)'; };
    const where = (e) => { const s = e.closest('section[id]'); return (s ? '#' + s.id + ' ' : '') + e.tagName.toLowerCase() + '.' + String(e.className.baseVal ?? e.className).split(' ').slice(0, 2).join('.') + ' "' + (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 24) + '"'; };
    const els = [...document.querySelectorAll('a[href], button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !e.disabled && getComputedStyle(e).visibility !== 'hidden'; });
    const noRing = [], weakRing = [], small = [];
    for (const el of els) {
      const r = el.getBoundingClientRect();
      // WCAG 2.5.8: 24 by 24, unless the control sits in a sentence
      const inline = getComputedStyle(el).display === 'inline' && el.closest('p, li, dd, figcaption, td');
      // A native input kept for the keyboard and hidden from the eye is pressed through its label or its track.
      const clipped = (() => { for (let e = el.parentElement, i = 0; e && i < 2; e = e.parentElement, i++) { const p = e.getBoundingClientRect(); if (p.width <= 1 && p.height <= 1) return true; } return false; })();
      const pressed = clipped ? (el.closest('label') ?? el.parentElement.parentElement.parentElement.parentElement) : el;
      const size = pressed.getBoundingClientRect();
      // The skip link is off screen until it has the focus.
      const offscreen = r.width <= 1 && r.height <= 1;
      if (narrow && !inline && !offscreen && (size.width < 24 || size.height < 24)) small.push(`${where(el)} ${Math.round(size.width)}×${Math.round(size.height)}`);
      const before = getComputedStyle(el); const b = { o: before.outlineStyle + before.outlineWidth + before.outlineColor, s: before.boxShadow, bg: before.backgroundColor, bd: before.borderColor };
      el.focus({ preventScroll: true, focusVisible: true });
      if (document.activeElement !== el) continue;
      const a = getComputedStyle(el);
      const outlined = a.outlineStyle !== 'none' && parseFloat(a.outlineWidth) > 0;
      const changed = outlined || a.boxShadow !== b.s || a.backgroundColor !== b.bg || a.borderColor !== b.bd;
      // a wrapper may draw the ring instead
      const wrap = el.parentElement && (() => { const p = getComputedStyle(el.parentElement); return (p.outlineStyle !== 'none' && parseFloat(p.outlineWidth) > 0) || p.boxShadow !== 'none'; })();
      // A hidden native input hands its ring to the part that is drawn: a slider's thumb, a switch's track.
      // The library marks the drawn part on its next render, not at once.
      if (clipped) await new Promise((done) => setTimeout(done, 60));
      const stand = clipped && (() => { const e = el.closest('[data-focus-visible]') ?? el.closest('label')?.querySelector('[data-focus-visible]'); if (!e) return false; const c = getComputedStyle(e); return c.boxShadow !== 'none' || (c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0); })();
      if (stand) { el.blur(); continue; }
      if (!changed && !wrap) noRing.push(where(el));
      else if (outlined) { const ring = lum(a.outlineColor), back = lum(bgOf(parseFloat(a.outlineOffset) >= 0 ? el.parentElement ?? el : el)); const ratio = (Math.max(ring.l, back.l) + 0.05) / (Math.min(ring.l, back.l) + 0.05); if (ratio < 3) weakRing.push(`${where(el)} ${ratio.toFixed(2)}:1`); }
      el.blur();
    }
    return { n: els.length, noRing, weakRing, small };
  }, width < 600);
  const uniq = (a) => [...new Set(a)];
  if (res.noRing.length) findings.push(`no visible focus ×${res.noRing.length}: ${uniq(res.noRing).slice(0, 8).join(' | ')}`);
  if (res.weakRing.length) findings.push(`focus ring under 3:1 ×${res.weakRing.length}: ${uniq(res.weakRing).slice(0, 8).join(' | ')}`);
  if (res.small.length) findings.push(`target under 24px ×${res.small.length}: ${uniq(res.small).slice(0, 10).join(' | ')}`);
  console.log(`\n${width}/${lang}: ${res.n} focusable, roles ${JSON.stringify(counts)}`);
  for (const f of findings) console.log('  - ' + f);
  if (!findings.length) console.log('  nothing found');
  total += findings.length;
  await context.close();
}
await browser.close();
console.log(`\n${total} finding group(s).`);
process.exit(total ? 1 : 0);
