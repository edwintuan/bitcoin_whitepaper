import type { SectionSources } from '../types';

// Code below is copied line for line from the tagged files by scripts/excerpt.mjs.
// Do not edit it by hand; annotations are ours.
const sources: SectionSources = {
  id: 'privacy',
  excerpts: [
    {
      id: "privacy-key-id",
      title: { en: "From public key to key id", zh: "由公鑰到密鑰識別碼" },
      repo: 'bitcoin/bitcoin',
      tag: "v32.1",
      path: "src/pubkey.h",
      startLine: 165,
      code: `    //! Get the KeyID of this public key (hash of its serialization)
    CKeyID GetID() const
    {
        return CKeyID(Hash160(std::span{vch}.first(size())));
    }`,
      annotations: [
        {
          lines: [168, 168],
          note: {
            en: "The id of a key is the [[hash160|HASH160]] of its serialised bytes, 33 of them for a compressed [[public-key|public key]]. This 20-byte value, not the key itself, is what a P2PKH or P2WPKH [[address]] encodes.",
            zh: "密鑰的識別碼，就是其序列化位元組的 [[hash160|HASH160]]；壓縮格式的[[public-key|公鑰]]有 33 個位元組。P2PKH 或 P2WPKH [[address|地址]]所編碼的，正是這 20 個位元組，而不是公鑰本身。",
          },
        },
      ],
    },
    {
      id: "privacy-hash160",
      title: { en: "SHA-256, then RIPEMD-160", zh: "先 SHA-256，後 RIPEMD-160" },
      repo: 'bitcoin/bitcoin',
      tag: "v32.1",
      path: "src/hash.h",
      startLine: 56,
      code: `/** A hasher class for Bitcoin's 160-bit hash (SHA-256 + RIPEMD-160). */
class CHash160 {
private:
    CSHA256 sha;
public:
    static constexpr size_t OUTPUT_SIZE{CRIPEMD160::OUTPUT_SIZE};

    void Finalize(std::span<unsigned char> output) {
        assert(output.size() == OUTPUT_SIZE);
        unsigned char buf[CSHA256::OUTPUT_SIZE];
        sha.Finalize(buf);
        CRIPEMD160().Write(buf, CSHA256::OUTPUT_SIZE).Finalize(output.data());
    }`,
      annotations: [
        {
          lines: [56, 57],
          note: {
            en: "Bitcoin’s 160-bit hash is two functions run one after the other, as the comment says.",
            zh: "正如註解所說，比特幣的 160 位元哈希，是兩個函數接連計算的結果。",
          },
        },
        {
          lines: [65, 67],
          note: {
            en: "`Finalize` completes the [[sha-256|SHA-256]] into a 32-byte buffer and passes that buffer through RIPEMD-160. The 20 bytes that come out are the fingerprint an address carries.",
            zh: "`Finalize` 先把 [[sha-256|SHA-256]] 的結果寫進 32 位元組的緩衝區，再把緩衝區送進 RIPEMD-160。輸出的 20 個位元組，就是地址所載的那個指紋。",
          },
        },
      ],
    },
    {
      id: "privacy-wallet-paths",
      title: { en: "A fresh address every time", zh: "每次都是新地址" },
      repo: 'bitcoin/bitcoin',
      tag: "v32.1",
      path: "src/wallet/walletutil.cpp",
      startLine: 35,
      code: `WalletDescriptor GenerateWalletDescriptor(const CExtPubKey& master_key, const OutputType& addr_type, bool internal)
{
    int64_t creation_time = GetTime();

    std::string xpub = EncodeExtPubKey(master_key);

    // Build descriptor string
    std::string desc_prefix;
    std::string desc_suffix = "/*)";
    switch (addr_type) {
    case OutputType::LEGACY: {
        desc_prefix = "pkh(" + xpub + "/44h";
        break;
    }
    case OutputType::P2SH_SEGWIT: {
        desc_prefix = "sh(wpkh(" + xpub + "/49h";
        desc_suffix += ")";
        break;
    }
    case OutputType::BECH32: {
        desc_prefix = "wpkh(" + xpub + "/84h";
        break;
    }
    case OutputType::BECH32M: {
        desc_prefix = "tr(" + xpub + "/86h";
        break;
    }
    case OutputType::UNKNOWN: {
        // We should never have a DescriptorScriptPubKeyMan for an UNKNOWN OutputType,
        // so if we get to this point something is wrong
        assert(false);
    }
    } // no default case, so the compiler can warn about missing cases
    assert(!desc_prefix.empty());

    // Mainnet derives at 0', testnet and regtest derive at 1'
    if (Params().IsTestChain()) {
        desc_prefix += "/1h";
    } else {
        desc_prefix += "/0h";
    }

    std::string internal_path = internal ? "/1" : "/0";
    std::string desc_str = desc_prefix + "/0h" + internal_path + desc_suffix;`,
      annotations: [
        {
          lines: [44, 61],
          note: {
            en: "One branch of the key tree for each kind of address. The numbers are the purposes assigned by BIP 44, 49, 84 and 86, and `h` marks a hardened step.",
            zh: "每種地址各佔密鑰樹的一條分支。這些數字是 BIP 44、49、84、86 所定的用途編號，`h` 表示這一步採用強化推導。",
          },
        },
        {
          lines: [70, 75],
          note: {
            en: "The next step is the coin type: 0 on the main network, 1 on test networks.",
            zh: "下一步是幣種：主網為 0，測試網絡為 1。",
          },
        },
        {
          lines: [77, 78],
          note: {
            en: "Account 0, then `/0` for addresses given out to payers or `/1` for the wallet’s own [[change]], then `/*`: one key after another, without end. This is how an [[hd-wallet|HD wallet]] follows the paper’s advice of a new [[key-pair|key pair]] for each transaction.",
            zh: "先是 0 號賬戶，然後以 `/0` 表示交給付款人的收款地址、以 `/1` 表示錢包自用的[[change|找續]]地址，最後的 `/*` 代表逐一遞增的索引，沒有盡頭。[[hd-wallet|HD 錢包]]就是這樣落實白皮書的建議：每筆交易都用新的[[key-pair|密鑰對]]。",
          },
        },
      ],
    },
  ],
};

export default sources;
