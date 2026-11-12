#!/usr/bin/env node
/**
 * Downloads the Bitcoin Core source files this site quotes into ./reference
 * (git-ignored). Every excerpt under src/content/sources must match these
 * files line for line, so run this before writing or checking an excerpt.
 *
 *   node scripts/fetch-reference.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'reference');
const RAW = 'https://raw.githubusercontent.com/bitcoin/bitcoin';

/** tag → files */
const FILES = {
  'v32.1': [
    'COPYING',
    'src/arith_uint256.cpp',
    'src/chain.cpp',
    'src/chain.h',
    'src/coins.h',
    'src/consensus/amount.h',
    'src/consensus/merkle.cpp',
    'src/consensus/params.h',
    'src/consensus/tx_verify.cpp',
    'src/hash.h',
    'src/kernel/chainparams.cpp',
    'src/merkleblock.cpp',
    'src/merkleblock.h',
    'src/net.cpp',
    'src/net_processing.cpp',
    'src/node/miner.cpp',
    'src/pow.cpp',
    'src/primitives/block.cpp',
    'src/primitives/block.h',
    'src/primitives/transaction.h',
    'src/protocol.cpp',
    'src/protocol.h',
    'src/rpc/blockchain.cpp',
    'src/rpc/mining.cpp',
    'src/rpc/rawtransaction.cpp',
    'src/script/interpreter.cpp',
    'src/txmempool.h',
    'src/validation.cpp',
    'src/wallet/coinselection.cpp',
    'src/wallet/coinselection.h',
    'src/wallet/spend.cpp',
  ],
  // The earliest tag in the official repository: Satoshi's original client.
  'v0.1.5': ['main.cpp', 'main.h', 'net.cpp', 'net.h'],
};

const missing = [];
let fetched = 0;

for (const [tag, files] of Object.entries(FILES)) {
  await Promise.all(
    files.map(async (path) => {
      const res = await fetch(`${RAW}/${tag}/${path}`);
      if (!res.ok) {
        missing.push(`${tag}/${path} (HTTP ${res.status})`);
        return;
      }
      const target = join(ROOT, tag, path);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, Buffer.from(await res.arrayBuffer()));
      fetched += 1;
    }),
  );
}

console.log(`Fetched ${fetched} files into ${ROOT}`);
if (missing.length > 0) {
  console.error(`Missing ${missing.length}:\n  ${missing.join('\n  ')}`);
  process.exit(1);
}
