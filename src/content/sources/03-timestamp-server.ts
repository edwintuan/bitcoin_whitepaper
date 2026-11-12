import type { SectionSources } from '../types';

// Code below is copied line for line from the tagged files by scripts/excerpt.mjs.
// Do not edit it by hand; annotations are ours.
const sources: SectionSources = {
  id: 'timestamp-server',
  excerpts: [
    {
      id: "block-header-fields",
      title: { en: "The six fields of a block header", zh: "區塊頭的六個欄位" },
      repo: 'bitcoin/bitcoin',
      tag: "v32.1",
      path: "src/primitives/block.h",
      startLine: 19,
      code: `/** Nodes collect new transactions into a block, hash them into a hash tree,
 * and scan through nonce values to make the block's hash satisfy proof-of-work
 * requirements.  When they solve the proof-of-work, they broadcast the block
 * to everyone and the block is added to the block chain.  The first transaction
 * in the block is a special one that creates a new coin owned by the creator
 * of the block.
 */
class CBlockHeader
{
public:
    // header
    int32_t nVersion;
    uint256 hashPrevBlock;
    uint256 hashMerkleRoot;
    uint32_t nTime;
    uint32_t nBits;
    uint32_t nNonce;`,
      annotations: [
        {
          lines: [19, 25],
          note: {
            en: "The whole system in one comment, which has stood since the 2009 client. It says “block chain”, in two words; the paper itself never uses the term.",
            zh: "一段註釋概括了整個系統；這幾句話自 2009 年的客戶端起沿用至今。註釋寫的是分成兩個字的 block chain，白皮書本身則從未用過這個詞。",
          },
        },
        {
          lines: [31, 31],
          note: {
            en: "`hashPrevBlock` is the hash of the block before. This one field is the paper’s “each timestamp includes the previous timestamp in its hash”.",
            zh: "`hashPrevBlock` 是上一個區塊的哈希。白皮書所說「每個時間戳都把前一個時間戳納入其哈希值之中」，靠的就是這一個欄位。",
          },
        },
        {
          lines: [33, 33],
          note: {
            en: "`nTime` is when the miner says the block was made, in seconds since the start of 1970, held in four bytes.",
            zh: "`nTime` 是礦工所報的出塊時間，以 1970 年初起計的秒數表示，佔四個位元組。",
          },
        },
      ],
    },
    {
      id: "block-time-rules",
      title: { en: "How far a block’s clock may be off", zh: "區塊時間可以偏差多少" },
      repo: 'bitcoin/bitcoin',
      tag: "v32.1",
      path: "src/validation.cpp",
      startLine: 4099,
      code: `    // Check timestamp against prev
    if (block.GetBlockTime() <= pindexPrev->GetMedianTimePast())
        return state.Invalid(BlockValidationResult::BLOCK_INVALID_HEADER, "time-too-old", "block's timestamp is too early");

    // Testnet4 and regtest only: Check timestamp against prev for difficulty-adjustment
    // blocks to prevent timewarp attacks (see https://github.com/bitcoin/bitcoin/pull/15482).
    if (consensusParams.enforce_BIP94) {
        // Check timestamp for the first block of each difficulty adjustment
        // interval, except the genesis block.
        if (nHeight % consensusParams.DifficultyAdjustmentInterval() == 0) {
            if (block.GetBlockTime() < pindexPrev->GetBlockTime() - MAX_TIMEWARP) {
                return state.Invalid(BlockValidationResult::BLOCK_INVALID_HEADER, "time-timewarp-attack", "block's timestamp is too early on diff adjustment block");
            }
        }
    }

    // Check timestamp
    if (block.Time() > NodeClock::now() + std::chrono::seconds{MAX_FUTURE_BLOCK_TIME}) {
        return state.Invalid(BlockValidationResult::BLOCK_TIME_FUTURE, "time-too-new", "block timestamp too far in the future");
    }`,
      annotations: [
        {
          lines: [4099, 4101],
          note: {
            en: "Too old: a block whose time is not later than the median time of the eleven blocks before it is rejected as `time-too-old`.",
            zh: "太舊：區塊的時間若不晚於前 11 個區塊的時間中位數，便以 `time-too-old` 為由被拒絕。",
          },
        },
        {
          lines: [4103, 4113],
          note: {
            en: "An extra rule that only test networks apply. On the main network this branch is skipped.",
            zh: "只有測試網絡才執行的一條額外規則；在主網上，這個分支會被略過。",
          },
        },
        {
          lines: [4115, 4118],
          note: {
            en: "Too new: a block more than `MAX_FUTURE_BLOCK_TIME`, two hours, ahead of this node’s own clock is rejected as `time-too-new`. The verdict depends on the clock of whoever is checking.",
            zh: "太新：區塊的時間若比這個節點自己的時鐘快超過 `MAX_FUTURE_BLOCK_TIME`（兩小時），便以 `time-too-new` 為由被拒絕。這項判斷取決於驗證者自己的時鐘。",
          },
        },
      ],
    },
    {
      id: "median-time-past",
      title: { en: "The median of the last eleven blocks", zh: "最近十一個區塊的時間中位數" },
      repo: 'bitcoin/bitcoin',
      tag: "v32.1",
      path: "src/chain.h",
      startLine: 231,
      code: `    static constexpr int nMedianTimeSpan = 11;

    int64_t GetMedianTimePast() const
    {
        int64_t pmedian[nMedianTimeSpan];
        int64_t* pbegin = &pmedian[nMedianTimeSpan];
        int64_t* pend = &pmedian[nMedianTimeSpan];

        const CBlockIndex* pindex = this;
        for (int i = 0; i < nMedianTimeSpan && pindex; i++, pindex = pindex->pprev)
            *(--pbegin) = pindex->GetBlockTime();

        std::sort(pbegin, pend);
        return pbegin[(pend - pbegin) / 2];
    }`,
      annotations: [
        {
          lines: [231, 231],
          note: {
            en: "Eleven blocks: the one this is called on and the ten before it.",
            zh: "十一個區塊：被呼叫的這一個，連同它之前的十個。",
          },
        },
        {
          lines: [239, 241],
          note: {
            en: "Walk back along the chain, collecting the time of each block. Near the start of the chain there are fewer than eleven, and the loop stops early.",
            zh: "沿着鏈往回走，逐一收集每個區塊的時間。在鏈的開端，區塊不足十一個，迴圈便提早結束。",
          },
        },
        {
          lines: [243, 244],
          note: {
            en: "Sort the times and take the middle one, so that a single block with a wild time cannot drag the result far.",
            zh: "把這些時間排序，取中間的一個；這樣即使有一個區塊所報的時間離譜，結果也不會被拉得太遠。",
          },
        },
      ],
    },
  ],
};

export default sources;
