import type { SectionSources } from '../types';

// Code below is copied line for line from the tagged files by scripts/excerpt.mjs.
// Do not edit it by hand; annotations are ours.
const sources: SectionSources = {
  id: 'reclaiming-disk-space',
  excerpts: [
    {
      id: 'compute-merkle-root',
      title: { en: 'Computing the Merkle root', zh: '計算默克爾根' },
      repo: 'bitcoin/bitcoin',
      tag: 'v32.1',
      path: 'src/consensus/merkle.cpp',
      startLine: 51,
      code: `uint256 ComputeMerkleRoot(std::vector<uint256> hashes, bool* mutated) {
    bool mutation = false;
    while (hashes.size() > 1) {
        if (mutated) {
            // Check every level because equal pairs can appear above the leaves,
            // as in the [1,2,3,4,5,6,5,6] construction described above.
            // Continuing after finding one is redundant, but mutated blocks should
            // not propagate through the network anyway, and the total number of
            // comparisons is the same as for an unmutated input of the same length.
            for (size_t pos = 0; pos + 1 < hashes.size(); pos += 2) {
                if (hashes[pos] == hashes[pos + 1]) mutation = true;
            }
        }
        if (hashes.size() & 1) {
            hashes.push_back(hashes.back());
        }
        SHA256D64(hashes[0].begin(), hashes[0].begin(), hashes.size() / 2);
        hashes.resize(hashes.size() / 2);
    }
    if (mutated) *mutated = mutation;
    if (hashes.size() == 0) return uint256();
    return hashes[0];
}`,
      annotations: [
        {
          lines: [53, 53],
          note: {
            en: 'One pass of this loop is one level of the [[merkle-tree|Merkle tree]]. It repeats until a single hash is left.',
            zh: '這個迴圈每執行一次，就是[[merkle-tree|默克爾樹]]的一層；一直重複到只剩一個哈希為止。',
          },
        },
        {
          lines: [54, 63],
          note: {
            en: 'Only when the caller asks for it: note whether the two hashes of any pair are equal. Repeating transactions can leave the root unchanged (CVE-2012-2459), so a block built that way is refused.',
            zh: '只在呼叫方要求時執行：留意有沒有哪一對的兩個哈希完全相同。重複的交易可以令默克爾根維持不變（CVE-2012-2459），所以這樣組成的區塊會被拒絕。',
          },
        },
        {
          lines: [64, 66],
          note: {
            en: 'The odd-count rule. If a level has an odd number of hashes, the last one is appended again, and so gets paired with itself.',
            zh: '單數規則：某一層的哈希數目若是單數，便把最後一個再加一次，讓它與自己配對。',
          },
        },
        {
          lines: [67, 68],
          note: {
            en: '`SHA256D64` hashes each 64-byte pair of neighbours with [[double-sha256|double SHA-256]] and writes the results over the front of the list, which is then cut to half its length.',
            zh: '`SHA256D64` 對每一對相鄰的哈希（合共 64 位元組）計算[[double-sha256|雙重 SHA-256]]，結果直接覆寫在列表前端，然後把列表截短一半。',
          },
        },
        {
          lines: [72, 72],
          note: {
            en: 'What is left is the [[merkle-root|Merkle root]]. `BlockMerkleRoot()`, the next function in the file, feeds this one the block’s [[txid|transaction ids]] in order.',
            zh: '餘下的就是[[merkle-root|默克爾根]]。檔案內的下一個函數 `BlockMerkleRoot()`，便是把區塊內每一筆的[[txid|交易 ID]] 依次交給這個函數。',
          },
        },
      ],
    },
    {
      id: 'build-merkle-tree-2009',
      title: { en: 'The same tree in 2009', zh: '2009 年的同一棵樹' },
      repo: 'bitcoin/bitcoin',
      tag: 'v0.1.5',
      path: 'main.h',
      startLine: 880,
      code: `    uint256 BuildMerkleTree() const
    {
        vMerkleTree.clear();
        foreach(const CTransaction& tx, vtx)
            vMerkleTree.push_back(tx.GetHash());
        int j = 0;
        for (int nSize = vtx.size(); nSize > 1; nSize = (nSize + 1) / 2)
        {
            for (int i = 0; i < nSize; i += 2)
            {
                int i2 = min(i+1, nSize-1);
                vMerkleTree.push_back(Hash(BEGIN(vMerkleTree[j+i]),  END(vMerkleTree[j+i]),
                                           BEGIN(vMerkleTree[j+i2]), END(vMerkleTree[j+i2])));
            }
            j += nSize;
        }
        return (vMerkleTree.empty() ? 0 : vMerkleTree.back());
    }`,
      annotations: [
        {
          lines: [883, 884],
          note: {
            en: 'The leaves: the hash of every transaction in the block, in order.',
            zh: '葉節點：區塊內每筆交易的哈希，依次排列。',
          },
        },
        {
          lines: [886, 886],
          note: {
            en: '`nSize` is the width of the level being hashed. Each pass halves it, rounding up.',
            zh: '`nSize` 是正在計算的這一層的寬度；每執行一次便減半，遇上單數則向上取整。',
          },
        },
        {
          lines: [890, 890],
          note: {
            en: 'Satoshi’s form of the odd-count rule: when there is no hash at `i+1`, the partner of the last hash is the last hash.',
            zh: '中本聰筆下的單數規則：若 `i+1` 的位置沒有哈希，最後一個哈希的配對對象就是它自己。',
          },
        },
        {
          lines: [891, 892],
          note: {
            en: 'Every level is appended to `vMerkleTree`, so the 2009 client held the whole tree in memory and could read a [[merkle-branch|Merkle branch]] straight out of it. Nothing in its `main.h` or `main.cpp` removes a branch: the [[pruning]] the paper describes was not written.',
            zh: '每一層都接在 `vMerkleTree` 之後，所以 2009 年的客戶端在記憶體內保存整棵樹，可以直接從中讀出[[merkle-branch|默克爾分支]]。它的 `main.h` 和 `main.cpp` 沒有任何剪除分支的源碼：白皮書描述的[[pruning|修剪]]並未寫成。',
          },
        },
      ],
    },
    {
      id: 'unlink-pruned-files',
      title: { en: 'Pruning as Bitcoin Core does it', zh: 'Bitcoin Core 實際的修剪方式' },
      repo: 'bitcoin/bitcoin',
      tag: 'v32.1',
      path: 'src/node/blockstorage.cpp',
      startLine: 821,
      code: `void BlockManager::UnlinkPrunedFiles(const std::set<int>& setFilesToPrune) const
{
    std::error_code ec;
    for (std::set<int>::iterator it = setFilesToPrune.begin(); it != setFilesToPrune.end(); ++it) {
        FlatFilePos pos(*it, 0);
        const bool removed_blockfile{fs::remove(m_block_file_seq.FileName(pos), ec)};
        const bool removed_undofile{fs::remove(m_undo_file_seq.FileName(pos), ec)};
        if (removed_blockfile || removed_undofile) {
            LogDebug(BCLog::BLOCKSTORAGE, "Prune: %s deleted blk/rev (%05u)\\n", __func__, *it);
        }
    }
}`,
      annotations: [
        {
          lines: [821, 821],
          note: {
            en: 'The files were chosen beforehand by `FindFilesToPrune()`: lowest numbers first, never a file holding any of the latest 288 blocks, until the block files fit the size given with `-prune`.',
            zh: '要刪除哪些檔案，事先已由 `FindFilesToPrune()` 選定：由編號最小的開始，凡載有最新 288 個區塊的檔案一律不選，直到區塊檔案的總大小降至 `-prune` 所指定的數值之內。',
          },
        },
        {
          lines: [824, 827],
          note: {
            en: 'For each number, the block file `blkNNNNN.dat` and the undo file `revNNNNN.dat` are deleted whole. No Merkle tree is opened and no single transaction is cut out.',
            zh: '對每個編號，區塊檔案 `blkNNNNN.dat` 和存放復原數據的 `revNNNNN.dat` 都是整個刪除。這裏既不會打開默克爾樹，也不會單獨剪掉某一筆交易。',
          },
        },
      ],
    },
  ],
};

export default sources;
