import type { SectionSources } from '../types';

// Code below is copied line for line from the tagged files by scripts/excerpt.mjs.
// Do not edit it by hand; annotations are ours.
const sources: SectionSources = {
  id: 'transactions',
  excerpts: [
    {
      id: "tx-input",
      title: { en: "An input", zh: "輸入" },
      repo: 'bitcoin/bitcoin',
      tag: "v32.1",
      path: "src/primitives/transaction.h",
      startLine: 58,
      code: `/** An input of a transaction.  It contains the location of the previous
 * transaction's output that it claims and a signature that matches the
 * output's public key.
 */
class CTxIn
{
public:
    COutPoint prevout;
    CScript scriptSig;
    uint32_t nSequence;
    CScriptWitness scriptWitness; //!< Only serialized through CTransaction`,
      annotations: [
        {
          lines: [58, 61],
          note: {
            en: "This comment has stood since the 2009 client. An input is a pointer to an earlier output plus a signature that matches that output’s public key: one link of the paper’s chain of signatures.",
            zh: "這段註釋自 2009 年的客戶端起一直保留至今。輸入就是指向某個先前輸出的指標，再加上與該輸出的公鑰相符的簽署：正是白皮書那條簽署鏈上的一環。",
          },
        },
        {
          lines: [65, 65],
          note: {
            en: "`prevout` names the coin being spent: the [[txid]] of the transaction that created it, and which of that transaction’s outputs it is.",
            zh: "`prevout` 指明要花的是哪一枚幣：產生它的那筆交易的[[txid|交易 ID]]，以及它是該筆交易的第幾個輸出。",
          },
        },
        {
          lines: [66, 66],
          note: {
            en: "`scriptSig` is where the signature goes for the original kinds of output.",
            zh: "對於早期的輸出類型，簽署就放在 `scriptSig`。",
          },
        },
        {
          lines: [68, 68],
          note: {
            en: "Since SegWit (BIP 141), signatures for the newer kinds of output travel here instead, in a part of the transaction that its id is not computed from.",
            zh: "自 SegWit（BIP 141）起，較新的輸出類型改把簽署放在這裏；計算交易 ID 時，並不包括這一部分。",
          },
        },
      ],
    },
    {
      id: "tx-output",
      title: { en: "An output", zh: "輸出" },
      repo: 'bitcoin/bitcoin',
      tag: "v32.1",
      path: "src/primitives/transaction.h",
      startLine: 137,
      code: `/** An output of a transaction.  It contains the public key that the next input
 * must be able to sign with to claim it.
 */
class CTxOut
{
public:
    CAmount nValue;
    CScript scriptPubKey;`,
      annotations: [
        {
          lines: [137, 139],
          note: {
            en: "Also unchanged since 2009: an output holds the public key that the next input must sign with. In the paper’s words, the public key of the next owner.",
            zh: "同樣自 2009 年起沒有改動：輸出載有下一個輸入必須用來簽署的公鑰。用白皮書的話說，就是下一位擁有者的公鑰。",
          },
        },
        {
          lines: [143, 143],
          note: {
            en: "`nValue` is the amount, counted in [[satoshi-unit|satoshis]].",
            zh: "`nValue` 是金額，以[[satoshi-unit|聰]]為單位。",
          },
        },
        {
          lines: [144, 144],
          note: {
            en: "`scriptPubKey` is the lock. It need not hold a public key as such: a short [[script]] can name a hash of the key instead, or set other conditions.",
            zh: "`scriptPubKey` 就是那把鎖。它不一定要直接載有公鑰：一小段[[script|腳本]]可以改為列出公鑰的哈希，或設下其他條件。",
          },
        },
      ],
    },
    {
      id: "check-ecdsa-signature",
      title: { en: "Checking a signature", zh: "驗證簽署" },
      repo: 'bitcoin/bitcoin',
      tag: "v32.1",
      path: "src/script/interpreter.cpp",
      startLine: 1701,
      code: `template <class T>
bool GenericTransactionSignatureChecker<T>::CheckECDSASignature(const std::vector<unsigned char>& vchSigIn, const std::vector<unsigned char>& vchPubKey, const CScript& scriptCode, SigVersion sigversion) const
{
    CPubKey pubkey(vchPubKey);
    if (!pubkey.IsValid())
        return false;

    // Hash type is one byte tacked on to the end of the signature
    std::vector<unsigned char> vchSig(vchSigIn);
    if (vchSig.empty())
        return false;
    int nHashType = vchSig.back();
    vchSig.pop_back();

    // Witness sighashes need the amount.
    if (sigversion == SigVersion::WITNESS_V0 && amount < 0) return HandleMissingData(m_mdb);

    uint256 sighash = SignatureHash(scriptCode, *txTo, nIn, nHashType, amount, sigversion, this->txdata, &m_sighash_cache);

    if (!VerifyECDSASignature(vchSig, pubkey, sighash))
        return false;

    return true;
}`,
      annotations: [
        {
          lines: [1704, 1706],
          note: {
            en: "The public key arrives as raw bytes from the script. Bytes that do not have the form of a key fail at once; whether they are a point on the curve is settled by the check further down.",
            zh: "公鑰以原始位元組的形式由腳本傳入；若連公鑰的格式也不符，檢查立即失敗，至於它是否真的對應曲線的一個點，則留待下面的驗證判定。",
          },
        },
        {
          lines: [1708, 1713],
          note: {
            en: "The last byte of the signature is not part of the signature proper: it is the hash type, which says how much of the transaction the signer committed to.",
            zh: "簽署的最後一個位元組並不屬於簽署本身，而是哈希類型，標明簽署人對交易的哪些部分作出了承諾。",
          },
        },
        {
          lines: [1718, 1718],
          note: {
            en: "The node rebuilds the digest the signer must have signed, from the transaction as it received it. Alter anything the signature covers and this digest comes out different.",
            zh: "節點按自己收到的交易，重新算出簽署人當初必定簽署過的摘要。簽署所涵蓋的內容只要有任何改動，這個摘要便會不同。",
          },
        },
        {
          lines: [1720, 1721],
          note: {
            en: "The check itself: does the signature fit that digest under that public key. The figure in this section runs the same kind of test each time you press Verify.",
            zh: "真正的檢查在這裏：以這把公鑰來看，簽署與摘要是否相符。本章的互動圖每次按「驗證」，執行的就是同一類測試。",
          },
        },
      ],
    },
  ],
};

export default sources;
