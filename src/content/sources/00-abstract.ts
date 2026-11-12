import type { SectionSources } from '../types';

// Code below is copied line for line from the tagged files by scripts/excerpt.mjs.
// Do not edit it by hand; annotations are ours.
const sources: SectionSources = {
  id: 'abstract',
  excerpts: [
    {
      id: "create-genesis-block",
      title: { en: "Building the first block", zh: "構造第一個區塊" },
      repo: 'bitcoin/bitcoin',
      tag: "v32.1",
      path: "src/kernel/chainparams.cpp",
      startLine: 37,
      code: `static CBlock CreateGenesisBlock(const char* pszTimestamp, const CScript& genesisOutputScript, uint32_t nTime, uint32_t nNonce, uint32_t nBits, int32_t nVersion, const CAmount& genesisReward)
{
    CMutableTransaction txNew;
    txNew.version = 1;
    txNew.vin.resize(1);
    txNew.vout.resize(1);
    txNew.vin[0].scriptSig = CScript() << 486604799 << CScriptNum(4) << std::vector<unsigned char>((const unsigned char*)pszTimestamp, (const unsigned char*)pszTimestamp + strlen(pszTimestamp));
    txNew.vout[0].nValue = genesisReward;
    txNew.vout[0].scriptPubKey = genesisOutputScript;

    CBlock genesis;
    genesis.nTime    = nTime;
    genesis.nBits    = nBits;
    genesis.nNonce   = nNonce;
    genesis.nVersion = nVersion;
    genesis.vtx.push_back(MakeTransactionRef(std::move(txNew)));
    genesis.hashPrevBlock.SetNull();
    genesis.hashMerkleRoot = BlockMerkleRoot(genesis);
    return genesis;
}

/**
 * Build the genesis block. Note that the output of its generation
 * transaction cannot be spent since it did not originally exist in the
 * database.
 *
 * CBlock(hash=000000000019d6, ver=1, hashPrevBlock=00000000000000, hashMerkleRoot=4a5e1e, nTime=1231006505, nBits=1d00ffff, nNonce=2083236893, vtx=1)
 *   CTransaction(hash=4a5e1e, ver=1, vin.size=1, vout.size=1, nLockTime=0)
 *     CTxIn(COutPoint(000000, -1), coinbase 04ffff001d0104455468652054696d65732030332f4a616e2f32303039204368616e63656c6c6f72206f6e206272696e6b206f66207365636f6e64206261696c6f757420666f722062616e6b73)
 *     CTxOut(nValue=50.00000000, scriptPubKey=0x5F1DF16B2B704C8A578D0B)
 *   vMerkleTree: 4a5e1e
 */
static CBlock CreateGenesisBlock(uint32_t nTime, uint32_t nNonce, uint32_t nBits, int32_t nVersion, const CAmount& genesisReward)
{
    const char* pszTimestamp = "The Times 03/Jan/2009 Chancellor on brink of second bailout for banks";
    const CScript genesisOutputScript = CScript() << "04678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5f"_hex << OP_CHECKSIG;
    return CreateGenesisBlock(pszTimestamp, genesisOutputScript, nTime, nNonce, nBits, nVersion, genesisReward);
}`,
      annotations: [
        {
          lines: [43, 43],
          note: {
            en: "The first transaction’s only input points at no earlier coin, so its script is free to carry other bytes. Here it carries the text handed in as `pszTimestamp`.",
            zh: "第一筆交易唯一的輸入並不指向任何先前的幣，所以它的腳本可以載入其他位元組。這裏載入的，是以 `pszTimestamp` 傳入的那段文字。",
          },
        },
        {
          lines: [44, 45],
          note: {
            en: "The output: the reward for the block, locked by the script passed in as `genesisOutputScript`.",
            zh: "輸出：這個區塊的獎勵，由以 `genesisOutputScript` 傳入的腳本鎖定。",
          },
        },
        {
          lines: [47, 54],
          note: {
            en: "The header: no block comes before this one, so `hashPrevBlock` is set to null, all zeros. The [[merkle-root|Merkle root]] is computed from the single transaction.",
            zh: "區塊頭：在它之前沒有任何區塊，所以 `hashPrevBlock` 設為空值，即全零。[[merkle-root|默克爾根]]則由這唯一的一筆交易算出。",
          },
        },
        {
          lines: [58, 61],
          note: {
            en: "A quirk the code itself points out: the output of this first transaction can never be spent, because it was never entered in the database of spendable coins.",
            zh: "源碼自己指出的一個特別之處：這第一筆交易的輸出永遠無法動用，因為它從來沒有被寫進可動用的幣的數據庫。",
          },
        },
        {
          lines: [71, 71],
          note: {
            en: "The headline of The Times for 3 January 2009. A block that contains it cannot have been made before that day: the newspaper of {§3}, used the other way round.",
            zh: "2009 年 1 月 3 日《泰晤士報》的標題。載有這句話的區塊，不可能在該日之前造出：這是把 {§3} 的登報做法反過來用。",
          },
        },
        {
          lines: [72, 72],
          note: {
            en: "The reward is addressed to a bare [[public-key|public key]] followed by `OP_CHECKSIG`, the plainest lock there is: a signature made with the matching private key opens it. {§2} shows how payments are addressed today.",
            zh: "獎勵的收款對象是一把[[public-key|公鑰]]，後接 `OP_CHECKSIG`，是最簡單的一種鎖：以對應私鑰作出的簽署便可開啟。{§2} 會說明今天的付款怎樣指定收款對象。",
          },
        },
      ],
    },
  ],
};

export default sources;
