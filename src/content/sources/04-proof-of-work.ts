import type { SectionSources } from '../types';

// Code below is copied line for line from the tagged files by scripts/excerpt.mjs.
// Do not edit it by hand; annotations are ours.
const sources: SectionSources = {
  id: 'proof-of-work',
  excerpts: [
    {
      id: "check-proof-of-work",
      title: { en: "Checking the work", zh: "驗證工作量" },
      repo: 'bitcoin/bitcoin',
      tag: "v32.1",
      path: "src/pow.cpp",
      startLine: 146,
      code: `std::optional<arith_uint256> DeriveTarget(unsigned int nBits, const uint256 pow_limit)
{
    bool fNegative;
    bool fOverflow;
    arith_uint256 bnTarget;

    bnTarget.SetCompact(nBits, &fNegative, &fOverflow);

    // Check range
    if (fNegative || bnTarget == 0 || fOverflow || bnTarget > UintToArith256(pow_limit))
        return {};

    return bnTarget;
}

bool CheckProofOfWorkImpl(uint256 hash, unsigned int nBits, const Consensus::Params& params)
{
    auto bnTarget{DeriveTarget(nBits, params.powLimit)};
    if (!bnTarget) return false;

    // Check proof of work matches claimed amount
    if (UintToArith256(hash) > bnTarget)
        return false;

    return true;
}`,
      annotations: [
        {
          lines: [152, 152],
          note: {
            en: "`nBits` is the compact, four-byte form of the [[target]] that every header carries. `SetCompact` expands it into a full 256-bit number.",
            zh: "`nBits` 是[[target|目標值]]的壓縮形式，佔四個位元組，每個區塊頭都帶着它。`SetCompact` 把它展開成完整的 256 位元數值。",
          },
        },
        {
          lines: [155, 156],
          note: {
            en: "A target that is zero, negative, overflowing, or easier than the limit the network allows is refused before any comparison.",
            zh: "目標值若為零、為負、溢出，或比網絡容許的下限還要容易，未作比較便直接拒絕。",
          },
        },
        {
          lines: [167, 168],
          note: {
            en: "The whole rule in one comparison: read the hash as a number, and it must not exceed the target. This runs after a single double SHA-256 of the header.",
            zh: "整條規則就是這一次比較：把哈希當作數值，它不得大於目標值。在此之前，只需對區塊頭做一次雙重 SHA-256。",
          },
        },
      ],
    },
    {
      id: "next-work-required",
      title: { en: "Adjusting the difficulty", zh: "調整難度" },
      repo: 'bitcoin/bitcoin',
      tag: "v32.1",
      path: "src/pow.cpp",
      startLine: 50,
      code: `unsigned int CalculateNextWorkRequired(const CBlockIndex* pindexLast, int64_t nFirstBlockTime, const Consensus::Params& params)
{
    if (params.fPowNoRetargeting)
        return pindexLast->nBits;

    // Limit adjustment step
    int64_t nActualTimespan = pindexLast->GetBlockTime() - nFirstBlockTime;
    if (nActualTimespan < params.nPowTargetTimespan/4)
        nActualTimespan = params.nPowTargetTimespan/4;
    if (nActualTimespan > params.nPowTargetTimespan*4)
        nActualTimespan = params.nPowTargetTimespan*4;

    // Retarget
    const arith_uint256 bnPowLimit = UintToArith256(params.powLimit);
    arith_uint256 bnNew;

    // Special difficulty rule for Testnet4
    if (params.enforce_BIP94) {
        // Here we use the first block of the difficulty period. This way
        // the real difficulty is always preserved in the first block as
        // it is not allowed to use the min-difficulty exception.
        int nHeightFirst = pindexLast->nHeight - (params.DifficultyAdjustmentInterval()-1);
        const CBlockIndex* pindexFirst = pindexLast->GetAncestor(nHeightFirst);
        bnNew.SetCompact(pindexFirst->nBits);
    } else {
        bnNew.SetCompact(pindexLast->nBits);
    }

    bnNew *= nActualTimespan;
    bnNew /= params.nPowTargetTimespan;

    if (bnNew > bnPowLimit)
        bnNew = bnPowLimit;

    return bnNew.GetCompact();
}`,
      annotations: [
        {
          lines: [56, 60],
          note: {
            en: "How long the last 2,016 blocks really took, held between a quarter of and four times the two-week goal.",
            zh: "最近 2,016 個區塊實際花了多少時間；數值被限制在兩星期目標的四分之一至四倍之間。",
          },
        },
        {
          lines: [66, 76],
          note: {
            en: "An exception that applies only to a test network. On the main network the previous target is simply loaded.",
            zh: "只適用於某個測試網絡的例外情況。在主網上，這裏只是載入上一期的目標值。",
          },
        },
        {
          lines: [78, 79],
          note: {
            en: "New target = old target × actual time ÷ intended time. If blocks came too fast the target shrinks, and mining gets harder.",
            zh: "新目標值 = 舊目標值 × 實際用時 ÷ 預定用時。出塊太快，目標值便縮小，挖礦隨之變難。",
          },
        },
        {
          lines: [81, 82],
          note: {
            en: "The target may never become easier than the limit fixed when the chain began.",
            zh: "目標值永遠不會比創鏈時定下的下限更容易。",
          },
        },
      ],
    },
    {
      id: "satoshi-mining-loop",
      title: { en: "The original mining loop, 2009", zh: "2009 年的原始挖礦迴圈" },
      repo: 'bitcoin/bitcoin',
      tag: "v0.1.5",
      path: "main.cpp",
      startLine: 2333,
      code: `        //
        // Search
        //
        unsigned int nStart = GetTime();
        uint256 hashTarget = CBigNum().SetCompact(pblock->nBits).getuint256();
        uint256 hash;
        loop
        {
            BlockSHA256(&tmp.block, nBlocks0, &tmp.hash1);
            BlockSHA256(&tmp.hash1, nBlocks1, &hash);


            if (hash <= hashTarget)
            {
                pblock->nNonce = tmp.block.nNonce;
                assert(hash == pblock->GetHash());

                    //// debug print
                    printf("BitcoinMiner:\\n");
                    printf("proof-of-work found  \\n  hash: %s  \\ntarget: %s\\n", hash.GetHex().c_str(), hashTarget.GetHex().c_str());`,
      annotations: [
        {
          lines: [2337, 2337],
          note: {
            en: "The target, expanded from the same compact `nBits` field used today.",
            zh: "目標值，由今天仍在使用的同一個壓縮欄位 `nBits` 展開而來。",
          },
        },
        {
          lines: [2341, 2342],
          note: {
            en: "SHA-256 twice: once over the header, once over that result.",
            zh: "SHA-256 做兩次：先對區塊頭，再對所得結果。",
          },
        },
        {
          lines: [2345, 2345],
          note: {
            en: "Satoshi’s own miner applied the test that every node still applies: the hash must not exceed the target.",
            zh: "中本聰自己的挖礦程式所用的判斷，正是今天每個節點仍在使用的那一條：哈希不得大於目標值。",
          },
        },
      ],
    },
  ],
};

export default sources;
