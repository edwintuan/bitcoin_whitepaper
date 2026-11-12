import type { SectionSources } from '../types';

// Code below is copied line for line from the tagged files by scripts/excerpt.mjs.
// Do not edit it by hand; annotations are ours.
const sources: SectionSources = {
  id: 'incentive',
  excerpts: [
    {
      id: "block-subsidy",
      title: { en: "How many new coins a block may create", zh: "一個區塊可以新造多少幣" },
      repo: 'bitcoin/bitcoin',
      tag: "v32.1",
      path: "src/validation.cpp",
      startLine: 1833,
      code: `CAmount GetBlockSubsidy(int nHeight, const Consensus::Params& consensusParams)
{
    int halvings = nHeight / consensusParams.nSubsidyHalvingInterval;
    // Force block reward to zero when right shift is undefined.
    if (halvings >= 64)
        return 0;

    CAmount nSubsidy = 50 * COIN;
    // Subsidy is cut in half every 210,000 blocks which will occur approximately every 4 years.
    nSubsidy >>= halvings;
    return nSubsidy;
}`,
      annotations: [
        {
          lines: [1835, 1835],
          note: {
            en: "How many [[halving|halvings]] have happened by this [[block-height|height]]. The interval is 210,000 blocks on the main network, and the division drops any remainder.",
            zh: "到這個[[block-height|高度]]為止已經[[halving|減半]]了多少次。主網的間隔是 210,000 個區塊，除法只取整數部分。",
          },
        },
        {
          lines: [1840, 1840],
          note: {
            en: "Every calculation starts from 50 BTC, held as a whole number of [[satoshi-unit|satoshis]]: 5,000,000,000.",
            zh: "每次計算都由 50 BTC 開始，並以[[satoshi-unit|聰]]的整數表示：5,000,000,000。",
          },
        },
        {
          lines: [1842, 1842],
          note: {
            en: "One shift to the right per halving, and a shift drops whatever does not divide evenly, so no fraction of a satoshi is ever issued. That is why the total stops just short of 21 million, and why the [[block-subsidy|subsidy]] is zero from the 33rd halving on.",
            zh: "每減半一次，便向右移一位；移位會捨去除不盡的部分，所以從不發行不足一聰的零頭。總量因而略低於 2,100 萬，而[[block-subsidy|區塊補貼]]由第 33 次減半起便是零。",
          },
        },
      ],
    },
    {
      id: "block-value-2009",
      title: { en: "The same rule in the 2009 client", zh: "2009 年客戶端裏的同一條規則" },
      repo: 'bitcoin/bitcoin',
      tag: "v0.1.5",
      path: "main.cpp",
      startLine: 675,
      code: `int64 CBlock::GetBlockValue(int64 nFees) const
{
    int64 nSubsidy = 50 * COIN;

    // Subsidy is cut in half every 4 years
    nSubsidy >>= (nBestHeight / 210000);

    return nSubsidy + nFees;
}`,
      annotations: [
        {
          lines: [677, 680],
          note: {
            en: "The paper names no amounts; the 2009 client did: 50 coins, and a shift to the right every 210,000 blocks. Both numbers are unchanged today.",
            zh: "白皮書沒有寫明任何數額，2009 年的客戶端則寫了：50 枚幣，每 210,000 個區塊向右移一位。這兩個數字至今沒有改過。",
          },
        },
        {
          lines: [682, 682],
          note: {
            en: "What the paper's second paragraph says, in one line: the block is worth the new coins plus the [[fee|fees]] of the transactions in it. In this client both the miner and the check on received blocks call this function.",
            zh: "白皮書第二段的意思，一行寫完：區塊的價值等於新幣加上區塊內各筆交易的[[fee|手續費]]。在這個客戶端裏，挖礦程式和對收到的區塊所作的檢查，用的都是這個函數。",
          },
        },
      ],
    },
    {
      id: "coinbase-amount-check",
      title: { en: "A coinbase that pays too much", zh: "領取過多的 coinbase 交易" },
      repo: 'bitcoin/bitcoin',
      tag: "v32.1",
      path: "src/validation.cpp",
      startLine: 2608,
      code: `    CAmount blockReward = nFees + GetBlockSubsidy(pindex->nHeight, params.GetConsensus());
    if (block.vtx[0]->GetValueOut() > blockReward && state.IsValid()) {
        state.Invalid(BlockValidationResult::BLOCK_CONSENSUS, "bad-cb-amount",
                      strprintf("coinbase pays too much (actual=%d vs limit=%d)", block.vtx[0]->GetValueOut(), blockReward));
    }`,
      annotations: [
        {
          lines: [2608, 2608],
          note: {
            en: "The most a block may pay its maker. `nFees` was added up earlier in the same function, one transaction at a time, as inputs minus [[output|outputs]].",
            zh: "一個區塊最多可以付給其創建者的金額。`nFees` 在同一函數的前文逐筆交易累加而成，每筆都是輸入減去[[output|輸出]]。",
          },
        },
        {
          lines: [2609, 2611],
          note: {
            en: "If the outputs of `vtx[0]`, the [[coinbase|coinbase transaction]], add up to more than the limit, even by one satoshi, the whole block is invalid and every node drops it. Claiming less is allowed; the difference is never created.",
            zh: "`vtx[0]` 就是 [[coinbase|coinbase 交易]]：它的輸出總和只要超過上限，哪怕只多一聰，整個區塊即屬無效，所有節點都會棄掉它。少領則沒有問題，只是差額永遠不會被造出來。",
          },
        },
      ],
    },
  ],
};

export default sources;
