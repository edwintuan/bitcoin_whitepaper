import type { SectionSources } from '../types';

// Code below is copied line for line from the tagged files by scripts/excerpt.mjs.
// Do not edit it by hand; annotations are ours.
const sources: SectionSources = {
  id: 'spv',
  excerpts: [
    {
      id: 'partial-merkle-tree-extract',
      title: { en: 'Checking a proof', zh: '核對一份證明' },
      repo: 'bitcoin/bitcoin',
      tag: 'v32.1',
      path: 'src/merkleblock.cpp',
      startLine: 99,
      code: `uint256 CPartialMerkleTree::TraverseAndExtract(int height, unsigned int pos, unsigned int &nBitsUsed, unsigned int &nHashUsed, std::vector<Txid> &vMatch, std::vector<unsigned int> &vnIndex) {
    if (nBitsUsed >= vBits.size()) {
        // overflowed the bits array - failure
        fBad = true;
        return uint256();
    }
    bool fParentOfMatch = vBits[nBitsUsed++];
    if (height==0 || !fParentOfMatch) {
        // if at height 0, or nothing interesting below, use stored hash and do not descend
        if (nHashUsed >= vHash.size()) {
            // overflowed the hash array - failure
            fBad = true;
            return uint256();
        }
        const uint256 &hash = vHash[nHashUsed++];
        if (height==0 && fParentOfMatch) { // in case of height 0, we have a matched txid
            vMatch.push_back(Txid::FromUint256(hash));
            vnIndex.push_back(pos);
        }
        return hash;
    } else {
        // otherwise, descend into the subtrees to extract matched txids and hashes
        uint256 left = TraverseAndExtract(height-1, pos*2, nBitsUsed, nHashUsed, vMatch, vnIndex), right;
        if (pos*2+1 < CalcTreeWidth(height-1)) {
            right = TraverseAndExtract(height-1, pos*2+1, nBitsUsed, nHashUsed, vMatch, vnIndex);
            if (right == left) {
                // The left and right branches should never be identical, as the transaction
                // hashes covered by them must each be unique.
                fBad = true;
            }
        } else {
            right = left;
        }
        // and combine them before returning
        return Hash(left, right);
    }
}`,
      annotations: [
        {
          lines: [105, 106],
          note: {
            en: 'The proof carries one flag bit for every node visited, saying whether a transaction being proved lies somewhere beneath it. If none does, or at the bottom of the tree, the node’s hash is read from the proof and the walk goes no deeper.',
            zh: '證明為每個走訪到的節點帶一個旗標位元，表示它底下有沒有要證明的交易。若沒有，或者已到樹的最底層，節點的哈希便直接取自證明，不再往下走。',
          },
        },
        {
          lines: [114, 117],
          note: {
            en: 'A leaf whose bit is set is one of the transactions the proof is about. Its [[txid|id]] and its position in the block are recorded.',
            zh: '旗標位元為 1 的葉節點，就是這份證明所針對的交易之一；它的[[txid|交易 ID]] 和它在區塊中的位置會被記下。',
          },
        },
        {
          lines: [121, 128],
          note: {
            en: 'Otherwise both children are worked out first. If they come out equal the proof is marked bad: the ids in a block are all different, so two equal branches cannot be genuine.',
            zh: '否則先算出左右兩個子節點。若兩者相同，證明即標記為無效：區塊內的交易 ID 各不相同，兩條分支一模一樣，不可能是真的。',
          },
        },
        {
          lines: [129, 131],
          note: {
            en: 'No right child means the level had an odd number of nodes. The left hash is used twice, the same rule as in {§7}.',
            zh: '沒有右邊的子節點，表示這一層的節點數目是單數；左邊的哈希便用兩次，與 {§7} 的規則相同。',
          },
        },
        {
          lines: [133, 133],
          note: {
            en: '`Hash(left, right)` is double SHA-256 of the two joined. `ExtractMatches()` returns what comes out at the top, and the caller compares it with the [[merkle-root|Merkle root]] in the [[block-header|block header]].',
            zh: '`Hash(left, right)` 就是把兩者相連後計算雙重 SHA-256。`ExtractMatches()` 回傳頂端算出的結果，由呼叫方拿去與[[block-header|區塊頭]]內的[[merkle-root|默克爾根]]比較。',
          },
        },
      ],
    },
    {
      id: 'merkle-branch-2009',
      title: { en: 'The branch in the 2009 client', zh: '2009 年客戶端裏的分支' },
      repo: 'bitcoin/bitcoin',
      tag: 'v0.1.5',
      path: 'main.h',
      startLine: 899,
      code: `    vector<uint256> GetMerkleBranch(int nIndex) const
    {
        if (vMerkleTree.empty())
            BuildMerkleTree();
        vector<uint256> vMerkleBranch;
        int j = 0;
        for (int nSize = vtx.size(); nSize > 1; nSize = (nSize + 1) / 2)
        {
            int i = min(nIndex^1, nSize-1);
            vMerkleBranch.push_back(vMerkleTree[j+i]);
            nIndex >>= 1;
            j += nSize;
        }
        return vMerkleBranch;
    }

    static uint256 CheckMerkleBranch(uint256 hash, const vector<uint256>& vMerkleBranch, int nIndex)
    {
        if (nIndex == -1)
            return 0;
        foreach(const uint256& otherside, vMerkleBranch)
        {
            if (nIndex & 1)
                hash = Hash(BEGIN(otherside), END(otherside), BEGIN(hash), END(hash));
            else
                hash = Hash(BEGIN(hash), END(hash), BEGIN(otherside), END(otherside));
            nIndex >>= 1;
        }
        return hash;
    }`,
      annotations: [
        {
          lines: [905, 911],
          note: {
            en: 'Cutting a [[merkle-branch|Merkle branch]] out of the tree: one hash per level below the top. `nIndex^1` is the neighbour of the node on our path, and `min(…, nSize-1)` makes a lone last node its own neighbour.',
            zh: '從樹中取出一條[[merkle-branch|默克爾分支]]：頂端以下每層一個哈希。`nIndex^1` 是路徑上那個節點的鄰居；`min(…, nSize-1)` 則令落單的最後一個節點以自己為鄰居。',
          },
        },
        {
          lines: [919, 926],
          note: {
            en: 'The whole Merkle-branch check behind [[spv|simplified payment verification]], in eight lines. The lowest bit of `nIndex` says whether our hash goes on the right or on the left at this level; then the index is halved and the walk moves up.',
            zh: '[[spv|簡易支付驗證]]所依賴的默克爾分支檢查，八行就寫完。`nIndex` 的最低位元決定我方的哈希在這一層放右邊還是左邊；之後索引減半，再往上走一層。',
          },
        },
        {
          lines: [927, 927],
          note: {
            en: 'The caller compares the result with the block’s `hashMerkleRoot`. The 2009 wallet stored such a branch with each of its own transactions (`CMerkleTx::vMerkleBranch`).',
            zh: '呼叫方把結果與區塊的 `hashMerkleRoot` 比較。2009 年的錢包為自己的每筆交易都存有這樣一條分支（`CMerkleTx::vMerkleBranch`）。',
          },
        },
      ],
    },
  ],
};

export default sources;
