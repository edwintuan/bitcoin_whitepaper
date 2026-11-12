import type { SectionSources } from '../types';

// Code below is copied line for line from the tagged files by scripts/excerpt.mjs.
// Do not edit it by hand; annotations are ours.
const sources: SectionSources = {
  id: 'calculations',
  excerpts: [
    {
      id: "calculations-block-work",
      title: { en: "The work in one block", zh: "一個區塊的工作量" },
      repo: 'bitcoin/bitcoin',
      tag: "v32.1",
      path: "src/chain.cpp",
      startLine: 120,
      code: `arith_uint256 GetBitsProof(uint32_t bits)
{
    arith_uint256 bnTarget;
    bool fNegative;
    bool fOverflow;
    bnTarget.SetCompact(bits, &fNegative, &fOverflow);
    if (fNegative || fOverflow || bnTarget == 0)
        return 0;
    // We need to compute 2**256 / (bnTarget+1), but we can't represent 2**256
    // as it's too large for an arith_uint256. However, as 2**256 is at least as large
    // as bnTarget+1, it is equal to ((2**256 - bnTarget - 1) / (bnTarget+1)) + 1,
    // or ~bnTarget / (bnTarget+1) + 1.
    return (~bnTarget / (bnTarget + 1)) + 1;
}`,
      annotations: [
        {
          lines: [122, 127],
          note: {
            en: "The header’s compact `nBits` is expanded into the full [[target]]. A target that is negative, overflowing or zero is credited with no work at all.",
            zh: "把區塊頭內壓縮形式的 `nBits` 展開成完整的[[target|目標值]]。目標值若為負數、溢出或為零，一律不計工作量。",
          },
        },
        {
          lines: [128, 132],
          note: {
            en: "A block counts for the number of hashes it should take to find it: 2^256 ÷ (target + 1). The number 2^256 does not fit in 256 bits, so the code reaches the same value by another route.",
            zh: "一個區塊所記的工作量，是找到它預期所需的哈希次數：2^256 ÷（目標值 + 1）。2^256 這個數放不進 256 個位元，所以程式碼換了一種寫法來算出同一個值。",
          },
        },
      ],
    },
    {
      id: "calculations-most-work-first",
      title: { en: "Most work first", zh: "先比工作量" },
      repo: 'bitcoin/bitcoin',
      tag: "v32.1",
      path: "src/node/blockstorage.cpp",
      startLine: 174,
      code: `bool CBlockIndexWorkComparator::operator()(const CBlockIndex* pa, const CBlockIndex* pb) const
{
    // First sort by most total work, ...
    if (pa->nChainWork > pb->nChainWork) return false;
    if (pa->nChainWork < pb->nChainWork) return true;

    // ... then by earliest activatable time, ...
    if (pa->nSequenceId < pb->nSequenceId) return false;
    if (pa->nSequenceId > pb->nSequenceId) return true;

    // Use pointer address as tie breaker (should only happen with blocks
    // loaded from disk, as those share the same id: 0 for blocks on the
    // best chain, 1 for all others).
    if (pa < pb) return false;
    if (pa > pb) return true;

    // Identical blocks.
    return false;
}`,
      annotations: [
        {
          lines: [176, 178],
          note: {
            en: "Candidate branches are ranked by total work, [[chainwork]], and never by height. This comparison is what the paper calls choosing the [[longest-chain|longest chain]].",
            zh: "候選的分支先按總工作量（即[[chainwork|累計工作量]]）排序，從不按高度。白皮書所說的選擇[[longest-chain|最長鏈]]，實際上就是這一步比較。",
          },
        },
        {
          lines: [180, 182],
          note: {
            en: "With equal work, the branch this node could have switched to first wins. An attacker who merely draws level moves no one off the honest branch.",
            zh: "工作量相同時，本節點較早可以接上的那條分支勝出。攻擊者若僅僅追平，並不能令任何節點離開誠實的那條分支。",
          },
        },
      ],
    },
    {
      id: "calculations-switch-branch",
      title: { en: "Switching to the other branch", zh: "改跟另一條分支" },
      repo: 'bitcoin/bitcoin',
      tag: "v32.1",
      path: "src/validation.cpp",
      startLine: 3199,
      code: `bool Chainstate::ActivateBestChainStep(BlockValidationState& state, CBlockIndex& index_most_work, const std::shared_ptr<const CBlock>& pblock, bool& fInvalidFound, std::vector<ConnectedBlock>& connected_blocks)
{
    AssertLockHeld(cs_main);
    if (m_mempool) AssertLockHeld(m_mempool->cs);

    const CBlockIndex* pindexOldTip = m_chain.Tip();
    const CBlockIndex* pindexFork = m_chain.FindFork(index_most_work);

    // Disconnect active blocks which are no longer in the best chain.
    bool fBlocksDisconnected = false;
    DisconnectedBlockTransactions disconnectpool{MAX_DISCONNECTED_TX_POOL_BYTES};
    while (m_chain.Tip() && m_chain.Tip() != pindexFork) {
        if (!DisconnectTip(state, &disconnectpool)) {
            // This is likely a fatal error, but keep the mempool consistent,
            // just in case. Only remove from the mempool in this case.
            MaybeUpdateMempoolForReorg(disconnectpool, false);

            // If we're unable to disconnect a block during normal operation,
            // then that is a failure of our local system -- we should abort
            // rather than stay on a less work chain.
            FatalError(m_chainman.GetNotifications(), state, _("Failed to disconnect block."));
            return false;
        }
        fBlocksDisconnected = true;
    }`,
      annotations: [
        {
          lines: [3204, 3205],
          note: {
            en: "The node finds the block where the branch with the most work parts from the chain it is on: the [[fork]] point.",
            zh: "節點先找出工作量最多的那條分支，是在哪個區塊與自己目前所在的鏈分開的，即[[fork|分叉]]點。",
          },
        },
        {
          lines: [3207, 3223],
          note: {
            en: "Every block after that point is disconnected, newest first; the lines that follow connect the other branch in their place. This is a [[reorg]], and from the network’s side a successful [[double-spending|double-spend]] is nothing more.",
            zh: "分叉點之後的區塊由新到舊逐一撤銷，緊接其後的程式碼再把另一條分支接上。這就是[[reorg|重組]]；從網絡的角度看，一次得逞的[[double-spending|雙重支付]]也不過如此。",
          },
        },
      ],
    },
  ],
};

export default sources;
