#!/usr/bin/env node
/**
 * Prints lines of a reference source file as a TypeScript template literal,
 * ready to paste into src/content/sources. Keeps the text byte for byte apart
 * from stripping Windows line endings.
 *
 *   node scripts/excerpt.mjs v32.1 src/pow.cpp 146 171
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [tag, path, from, to] = process.argv.slice(2);
if (!tag || !path || !from || !to) {
  console.error('usage: node scripts/excerpt.mjs <tag> <path> <firstLine> <lastLine>');
  process.exit(1);
}

const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'reference', tag, path);
const lines = readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');
const excerpt = lines.slice(Number(from) - 1, Number(to)).join('\n');
const escaped = excerpt.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
process.stdout.write(`${tag}/${path}, lines ${from} to ${to}, as a template literal:\n\`${escaped}\`\n`);
