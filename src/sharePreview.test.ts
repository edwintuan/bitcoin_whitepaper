import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)));
const html = read('../index.html').toString('utf8');
const meta = (key: string) =>
  new RegExp(`<meta\\s+(?:property|name)="${key}"\\s+content="([^"]*)"`).exec(html)?.[1];

/** What a link to the site looks like when it is pasted into X, Slack or a chat. */
describe('the share preview', () => {
  it('has a title, a description and a large-image card', () => {
    expect(meta('og:title')).toBeTruthy();
    expect(meta('og:description')).toBeTruthy();
    expect(meta('og:type')).toBe('website');
    expect(meta('twitter:card')).toBe('summary_large_image');
  });

  it('points at an absolute address: crawlers do not resolve relative ones', () => {
    expect(meta('og:url')).toMatch(/^https:\/\/.+\/$/);
    expect(meta('og:image')).toBe(`${meta('og:url')}og.png`);
  });

  it('ships the picture it points at, at the size it says', () => {
    const png = read('../public/og.png');
    expect(png.subarray(1, 4).toString('latin1')).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(Number(meta('og:image:width')));
    expect(png.readUInt32BE(20)).toBe(Number(meta('og:image:height')));
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
  });
});
