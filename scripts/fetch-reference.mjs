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
    'doc/REST-interface.md',
    'doc/bips.md',
    'doc/files.md',
    'doc/managing-wallets.md',
    'doc/policy/README.md',
    'doc/reduce-traffic.md',
    'doc/release-notes/release-notes-0.11.0.md',
    'doc/release-notes/release-notes-0.12.0.md',
    'doc/release-notes/release-notes-0.19.0.1.md',
    'doc/release-notes/release-notes-0.21.0.md',
    'doc/release-notes/release-notes-0.8.0.md',
    'doc/release-notes/release-notes-0.9.0.md',
    'src/addresstype.cpp',
    'src/addresstype.h',
    'src/arith_uint256.cpp',
    'src/bitcoin-cli.cpp',
    'src/blockfilter.cpp',
    'src/blockfilter.h',
    'src/chain.cpp',
    'src/chain.h',
    'src/chainparamsbase.cpp',
    'src/clientversion.cpp',
    'src/clientversion.h',
    'src/coins.cpp',
    'src/coins.h',
    'src/common/bloom.cpp',
    'src/common/bloom.h',
    'src/consensus/amount.h',
    'src/consensus/consensus.h',
    'src/consensus/merkle.cpp',
    'src/consensus/merkle.h',
    'src/consensus/params.h',
    'src/consensus/tx_check.cpp',
    'src/consensus/tx_verify.cpp',
    'src/consensus/validation.h',
    'src/core_io.cpp',
    'src/crypto/sha256.cpp',
    'src/hash.h',
    'src/index/base.h',
    'src/index/blockfilterindex.cpp',
    'src/index/blockfilterindex.h',
    'src/init.cpp',
    'src/kernel/blockmanager_opts.h',
    'src/kernel/chainparams.cpp',
    'src/kernel/chainparams.h',
    'src/key.h',
    'src/key_io.cpp',
    'src/merkleblock.cpp',
    'src/merkleblock.h',
    'src/net.cpp',
    'src/net.h',
    'src/net_processing.cpp',
    'src/net_processing.h',
    'src/netaddress.h',
    'src/node/blockmanager_args.cpp',
    'src/node/blockstorage.cpp',
    'src/node/blockstorage.h',
    'src/node/miner.cpp',
    'src/node/protocol_version.h',
    'src/outputtype.cpp',
    'src/policy/feerate.cpp',
    'src/policy/feerate.h',
    'src/policy/policy.cpp',
    'src/policy/policy.h',
    'src/policy/rbf.cpp',
    'src/pow.cpp',
    'src/primitives/block.cpp',
    'src/primitives/block.h',
    'src/primitives/transaction.cpp',
    'src/primitives/transaction.h',
    'src/protocol.cpp',
    'src/protocol.h',
    'src/pubkey.cpp',
    'src/pubkey.h',
    'src/qt/transactionrecord.cpp',
    'src/qt/transactionrecord.h',
    'src/rpc/blockchain.cpp',
    'src/rpc/client.cpp',
    'src/rpc/fees.cpp',
    'src/rpc/mempool.cpp',
    'src/rpc/mining.cpp',
    'src/rpc/net.cpp',
    'src/rpc/output_script.cpp',
    'src/rpc/rawtransaction.cpp',
    'src/rpc/rawtransaction_util.cpp',
    'src/rpc/txoutproof.cpp',
    'src/rpc/util.cpp',
    'src/script/descriptor.cpp',
    'src/script/interpreter.cpp',
    'src/script/script.h',
    'src/script/script_error.cpp',
    'src/script/solver.cpp',
    'src/serialize.h',
    'src/test/arith_uint256_tests.cpp',
    'src/test/pow_tests.cpp',
    'src/txdb.cpp',
    'src/txdb.h',
    'src/txmempool.h',
    'src/undo.h',
    'src/util/hasher.h',
    'src/util/moneystr.cpp',
    'src/validation.cpp',
    'src/validation.h',
    'src/wallet/coincontrol.h',
    'src/wallet/coinselection.cpp',
    'src/wallet/coinselection.h',
    'src/wallet/feebumper.cpp',
    'src/wallet/receive.cpp',
    'src/wallet/rpc/addresses.cpp',
    'src/wallet/rpc/backup.cpp',
    'src/wallet/rpc/coins.cpp',
    'src/wallet/rpc/spend.cpp',
    'src/wallet/rpc/transactions.cpp',
    'src/wallet/scriptpubkeyman.cpp',
    'src/wallet/spend.cpp',
    'src/wallet/spend.h',
    'src/wallet/wallet.cpp',
    'src/wallet/wallet.h',
    'src/wallet/walletutil.cpp',
    'src/wallet/walletutil.h',
  ],
  // The earliest tag in the official repository: Satoshi's original client.
  'v0.1.5': ['main.cpp', 'main.h', 'net.cpp', 'net.h'],
};

/** Documents from other repositories that a chapter cites, each pinned to a commit. */
const OTHER = [
  {
    // The Electrum protocol: what section 8 says a light wallet asks a server for.
    folder: 'electrum-protocol',
    raw: 'https://raw.githubusercontent.com/spesmilo/electrum-protocol/c99f5b47534fff08ca273bc2974e58acdc738bb7',
    files: ['docs/protocol-methods.rst'],
  },
];

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

for (const { folder, raw, files } of OTHER) {
  for (const path of files) {
    const res = await fetch(`${raw}/${path}`);
    if (!res.ok) {
      missing.push(`${folder}/${path} (HTTP ${res.status})`);
      continue;
    }
    const target = join(ROOT, folder, path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, Buffer.from(await res.arrayBuffer()));
    fetched += 1;
  }
}

console.log(`Fetched ${fetched} files into ${ROOT}`);
if (missing.length > 0) {
  console.error(`Missing ${missing.length}:\n  ${missing.join('\n  ')}`);
  process.exit(1);
}
