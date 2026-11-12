import type { SectionSources } from '../types';

// Code below is copied line for line from the tagged files by scripts/excerpt.mjs.
// Do not edit it by hand; annotations are ours.
const sources: SectionSources = {
  id: 'introduction',
  excerpts: [
    {
      id: "check-tx-inputs",
      title: { en: "Refusing coins that are missing or spent", zh: "拒絕不存在或已花掉的幣" },
      repo: 'bitcoin/bitcoin',
      tag: "v32.1",
      path: "src/consensus/tx_verify.cpp",
      startLine: 170,
      code: `bool Consensus::CheckTxInputs(const CTransaction& tx, TxValidationState& state, const CCoinsViewCache& inputs, int nSpendHeight, CAmount& txfee)
{
    // are the actual inputs available?
    if (!inputs.HaveInputs(tx)) {
        return state.Invalid(TxValidationResult::TX_MISSING_INPUTS, "bad-txns-inputs-missingorspent",
                         strprintf("%s: inputs missing/spent", __func__));
    }`,
      annotations: [
        {
          lines: [173, 173],
          note: {
            en: "`inputs` is this node’s view of every coin that exists and has not been spent. `HaveInputs` looks up each coin the transaction claims to spend.",
            zh: "`inputs` 是這個節點眼中所有存在而尚未花掉的幣。`HaveInputs` 會逐一查找交易聲稱要動用的每一枚幣。",
          },
        },
        {
          lines: [174, 175],
          note: {
            en: "If any is absent, the transaction is refused as `bad-txns-inputs-missingorspent`: whether the coin was spent or never existed, it is not there to spend. This is the check a [[mint]] would have made.",
            zh: "只要缺了一枚，交易便以 `bad-txns-inputs-missingorspent` 為由被拒絕：不論這枚幣是已經花掉還是從未存在，它都不在可動用之列。[[mint|鑄幣廠]]要做的，正是這項檢查。",
          },
        },
      ],
    },
    {
      id: "mempool-missing-inputs",
      title: { en: "The same check when a payment first arrives", zh: "付款初到時的同一項檢查" },
      repo: 'bitcoin/bitcoin',
      tag: "v32.1",
      path: "src/validation.cpp",
      startLine: 842,
      code: `    m_view.SetBackend(m_viewmempool);

    const CCoinsViewCache& coins_cache = m_active_chainstate.CoinsTip();
    // do all inputs exist?
    for (const CTxIn& txin : tx.vin) {
        if (!coins_cache.HaveCoinInCache(txin.prevout)) {
            coins_to_uncache.push_back(txin.prevout);
        }

        // Note: this call may add txin.prevout to the coins cache
        // (coins_cache.cacheCoins) by way of FetchCoin(). It should be removed
        // later (via coins_to_uncache) if this tx turns out to be invalid.
        if (!m_view.HaveCoin(txin.prevout)) {
            // Are inputs missing because we already have the tx?
            for (size_t out = 0; out < tx.vout.size(); out++) {
                // Optimistically just do efficient check of cache for outputs
                if (coins_cache.HaveCoinInCache(COutPoint(hash, out))) {
                    return state.Invalid(TxValidationResult::TX_CONFLICT, "txn-already-known");
                }
            }
            // Otherwise assume this might be an orphan tx for which we just haven't seen parents yet
            return state.Invalid(TxValidationResult::TX_MISSING_INPUTS, "bad-txns-inputs-missingorspent");
        }
    }`,
      annotations: [
        {
          lines: [842, 842],
          note: {
            en: "The view being consulted is the chain’s unspent coins plus those created by transactions still waiting in this node’s [[mempool]].",
            zh: "這裏查閱的，是鏈上未花費的幣，再加上仍在這個節點[[mempool|記憶池]]裏等候的交易所產生的幣。",
          },
        },
        {
          lines: [846, 854],
          note: {
            en: "For each input, the node asks whether the output it points to, its `prevout`, is among those coins.",
            zh: "節點逐一查問：每個輸入所指向的輸出（即 `prevout`），是否在這些幣當中。",
          },
        },
        {
          lines: [855, 861],
          note: {
            en: "One innocent explanation is ruled out first: the transaction is already known, and its own outputs are in the set.",
            zh: "先排除一個無傷大雅的可能：這筆交易其實早已收過，它自己的輸出已在集合之內。",
          },
        },
        {
          lines: [862, 863],
          note: {
            en: "Otherwise the transaction is turned away. The reject reason says missing or spent, the comment adds a third case, that the transaction creating the coin has not arrived yet, and the node cannot tell which.",
            zh: "否則交易便被拒諸門外。拒絕理由寫的是「不存在或已花掉」，註釋再補上第三種可能，即產生這枚幣的那筆交易尚未送到；節點無從分辨是哪一種。",
          },
        },
      ],
    },
  ],
};

export default sources;
