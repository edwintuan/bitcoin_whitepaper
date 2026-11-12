import type { SectionSources } from '../types';

// Code below is copied line for line from the tagged files by scripts/excerpt.mjs.
// Do not edit it by hand; annotations are ours.
const sources: SectionSources = {
  id: 'conclusion',
  excerpts: [
    {
      id: "conclusion-main-params",
      title: { en: "The constants of the main network", zh: "主網的常數" },
      repo: 'bitcoin/bitcoin',
      tag: "v32.1",
      path: "src/kernel/chainparams.cpp",
      startLine: 105,
      code: `/**
 * Main network on which people trade goods and services.
 */
class CMainParams : public CChainParams {
public:
    CMainParams(const MainNetOptions& opts) {
        m_chain_type = ChainType::MAIN;
        consensus.signet_blocks = false;
        consensus.signet_challenge.clear();
        consensus.nSubsidyHalvingInterval = 210000;
        consensus.script_flag_exceptions.emplace( // BIP16 exception
            uint256{"00000000000002dc756eebf4f49723ed8d30cc28a5f108eb94b1ba88ac4f9c22"}, SCRIPT_VERIFY_NONE);
        consensus.script_flag_exceptions.emplace( // Taproot exception
            uint256{"0000000000000000000f14c35b2d841e986ab5441de8c585d5ffe55ea1e395ad"}, SCRIPT_VERIFY_P2SH | SCRIPT_VERIFY_WITNESS);
        consensus.BIP34Height = 227931;
        consensus.BIP34Hash = uint256{"000000000000024b89b42a942fe0d9fea3bb44ab7bd1b19115dd6a759c0808b8"};
        consensus.BIP65Height = 388381; // 000000000000000004c2b624ed5d7756c508d90fd0da2c7c679febfa6c4735f0
        consensus.BIP66Height = 363725; // 00000000000000000379eaa19dce8c9b722d46ae6a57c2f1a988119488b50931
        consensus.CSVHeight = 419328; // 000000000000000004a1b34462cb8aeebd5799177f7a29cf28f2d1961716b5b5
        consensus.SegwitHeight = 481824; // 0000000000000000001c8018d9cb3b742ef25114f27563e3fc4a1902167f9893
        consensus.MinBIP9WarningHeight = 711648; // taproot activation height + miner confirmation window
        consensus.powLimit = uint256{"00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffff"};
        consensus.nPowTargetTimespan = 14 * 24 * 60 * 60; // two weeks
        consensus.nPowTargetSpacing = 10 * 60;
        consensus.fPowAllowMinDifficultyBlocks = false;
        consensus.enforce_BIP94 = false;
        consensus.fPowNoRetargeting = false;`,
      annotations: [
        {
          lines: [105, 108],
          note: {
            en: "The parameters of the network “on which people trade goods and services”, as the source puts it. The other networks defined in this file are for testing.",
            zh: "這是主網的參數；用源碼的話說，就是「人們用來買賣商品與服務」的那個網絡。同一檔案內定義的其他網絡，都是測試用的。",
          },
        },
        {
          lines: [114, 114],
          note: {
            en: "The [[block-subsidy|subsidy]] halves every 210,000 blocks: the issuance schedule of {§6}.",
            zh: "[[block-subsidy|區塊補貼]]每 210,000 個區塊[[halving|減半]]一次，也就是 {§6} 所述的發行時間表。",
          },
        },
        {
          lines: [126, 126],
          note: {
            en: "The easiest [[target]] the network accepts: a hash must begin with at least 32 zero bits.",
            zh: "網絡所接受的最容易的[[target|目標值]]：哈希至少要以 32 個零位元開頭。",
          },
        },
        {
          lines: [127, 128],
          note: {
            en: "Two numbers set the rhythm: one block every ten minutes on average, and the [[difficulty]] reviewed over two weeks of blocks.",
            zh: "定下節奏的是這兩個數字：平均每十分鐘出一個區塊，並以兩星期的區塊為單位檢討[[difficulty|難度]]。",
          },
        },
        {
          lines: [129, 131],
          note: {
            en: "No exceptions on the main network: the difficulty is never relaxed for a slow block, and the adjustment is never switched off.",
            zh: "主網不設例外：出塊再慢，難度也不會放寬；難度調整亦不會停用。",
          },
        },
      ],
    },
    {
      id: "conclusion-adjustment-interval",
      title: { en: "Where 2,016 comes from", zh: "2,016 這個數字的由來" },
      repo: 'bitcoin/bitcoin',
      tag: "v32.1",
      path: "src/consensus/params.h",
      startLine: 124,
      code: `    int64_t nPowTargetSpacing;
    int64_t nPowTargetTimespan;
    std::chrono::seconds PowTargetSpacing() const
    {
        return std::chrono::seconds{nPowTargetSpacing};
    }
    int64_t DifficultyAdjustmentInterval() const { return nPowTargetTimespan / nPowTargetSpacing; }`,
      annotations: [
        {
          lines: [124, 125],
          note: {
            en: "The two constants as every part of the program reads them, in seconds: 600 and 1,209,600 on the main network.",
            zh: "程式各處讀取的就是這兩個常數，以秒為單位：在主網上分別是 600 和 1,209,600。",
          },
        },
        {
          lines: [130, 130],
          note: {
            en: "The number of blocks between two adjustments is stored nowhere. It is this division, and on the main network it comes to 2,016.",
            zh: "兩次調整之間相隔多少個區塊，並沒有另外儲存：它就是這個除法的結果，在主網上等於 2,016。",
          },
        },
      ],
    },
    {
      id: "conclusion-genesis",
      title: { en: "Where every chain begins", zh: "每條鏈的起點" },
      repo: 'bitcoin/bitcoin',
      tag: "v32.1",
      path: "src/kernel/chainparams.cpp",
      startLine: 158,
      code: `        genesis = CreateGenesisBlock(1231006505, 2083236893, 0x1d00ffff, 1, 50 * COIN);
        consensus.hashGenesisBlock = genesis.GetHash();
        assert(consensus.hashGenesisBlock == uint256{"000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f"});
        assert(genesis.hashMerkleRoot == uint256{"4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b"});`,
      annotations: [
        {
          lines: [158, 158],
          note: {
            en: "The first block is part of the program: its time, its [[nonce]], its compact target, its version and a reward of 50 coins.",
            zh: "第一個區塊直接寫在程式裏：它的時間、[[nonce|隨機數]]、壓縮形式的目標值、版本，以及 50 枚幣的獎勵。",
          },
        },
        {
          lines: [159, 161],
          note: {
            en: "The program refuses to run unless it computes exactly this hash and this [[merkle-root|Merkle root]]. Whatever chain a [[node]] later accepts as proof of what happened, it starts from this block.",
            zh: "程式必須算出一模一樣的哈希和[[merkle-root|默克爾根]]，否則拒絕運行。[[node|節點]]日後接受哪一條鏈作為「發生過甚麼」的證明，都得由這個區塊數起。",
          },
        },
      ],
    },
  ],
};

export default sources;
