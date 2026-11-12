import type { SectionSources } from '../types';

// Code below is copied line for line from the tagged files by scripts/excerpt.mjs.
// Do not edit it by hand; annotations are ours.
const sources: SectionSources = {
  id: 'combining-splitting-value',
  excerpts: [
    {
      id: 'single-random-draw',
      title: { en: 'One way to pick coins: Single Random Draw', zh: '選幣方法之一：Single Random Draw' },
      repo: 'bitcoin/bitcoin',
      tag: 'v32.1',
      path: 'src/wallet/coinselection.cpp',
      startLine: 610,
      code: `util::Result<SelectionResult> SelectCoinsSRD(const std::vector<OutputGroup>& utxo_pool, CAmount target_value, CAmount change_fee, FastRandomContext& rng,
                                             int max_selection_weight)
{
    SelectionResult result(target_value, SelectionAlgorithm::SRD);
    std::priority_queue<OutputGroup, std::vector<OutputGroup>, MinOutputGroupComparator> heap;

    // Include change for SRD as we want to avoid making really small change if the selection just
    // barely meets the target. Just use the lower bound change target instead of the randomly
    // generated one, since SRD will result in a random change amount anyway; avoid making the
    // target needlessly large.
    target_value += CHANGE_LOWER + change_fee;

    std::vector<size_t> indexes;
    indexes.resize(utxo_pool.size());
    std::iota(indexes.begin(), indexes.end(), 0);
    std::shuffle(indexes.begin(), indexes.end(), rng);

    CAmount selected_eff_value = 0;
    int weight = 0;
    bool max_tx_weight_exceeded = false;
    for (const size_t i : indexes) {
        const OutputGroup& group = utxo_pool.at(i);
        Assume(group.GetSelectionAmount() > 0);

        // Add group to selection
        heap.push(group);
        selected_eff_value += group.GetSelectionAmount();
        weight += group.m_weight;

        // If the selection weight exceeds the maximum allowed size, remove the least valuable inputs until we
        // are below max weight.
        if (weight > max_selection_weight) {
            max_tx_weight_exceeded = true; // mark it in case we don't find any useful result.
            do {
                const OutputGroup& to_remove_group = heap.top();
                selected_eff_value -= to_remove_group.GetSelectionAmount();
                weight -= to_remove_group.m_weight;
                heap.pop();
            } while (!heap.empty() && weight > max_selection_weight);
        }

        // Now check if we are above the target
        if (selected_eff_value >= target_value) {
            // Result found, add it.
            while (!heap.empty()) {
                result.AddInput(heap.top());
                heap.pop();
            }
            return result;
        }
    }
    return max_tx_weight_exceeded ? ErrorMaxWeightExceeded() : util::Error();
}`,
      annotations: [
        {
          lines: [610, 611],
          note: {
            en: 'Single Random Draw, the shortest of the [[coin-selection|coin selection]] algorithms Bitcoin Core runs for a payment. An `OutputGroup` is one or more of the wallet’s [[utxo|unspent outputs]], treated as a unit.',
            zh: 'Single Random Draw（單次隨機抽取），是 Bitcoin Core 為一筆付款所執行的幾種[[coin-selection|選幣]]演算法中最短的一種。一個 `OutputGroup` 代表錢包內一個或多個[[utxo|未花費輸出]]，當作一個單位處理。',
          },
        },
        {
          lines: [616, 620],
          note: {
            en: 'The target is raised by a minimum amount of [[change]] (`CHANGE_LOWER`, 50,000 satoshis) and by the fee of a change output, so that a draw which succeeds leaves change worth having.',
            zh: '目標金額先加上一個最低[[change|找續]]額（`CHANGE_LOWER`，即 50,000 聰），再加上找續輸出本身的手續費；這樣抽取一旦成功，剩下的找續便有保留的價值。',
          },
        },
        {
          lines: [622, 625],
          note: {
            en: 'The whole idea: shuffle the coins and take them in that order.',
            zh: '整個構想就是這樣：把幣的次序打亂，然後依次取用。',
          },
        },
        {
          lines: [634, 637],
          note: {
            en: 'Each coin counts for its effective value: its amount less the fee it costs to spend as an [[input]].',
            zh: '每枚幣按「有效價值」計算，即它的金額減去把它當作[[input|輸入]]花掉所需的手續費。',
          },
        },
        {
          lines: [651, 659],
          note: {
            en: 'Stop as soon as the running total reaches the target. Whatever exceeds the payment and its fees comes back as change.',
            zh: '累計金額一達到目標便停手。超出付款額和手續費的部分，會以找續的形式退回。',
          },
        },
      ],
    },
    {
      id: 'selection-get-change',
      title: { en: 'Change, or none', zh: '找續，還是不找' },
      repo: 'bitcoin/bitcoin',
      tag: 'v32.1',
      path: 'src/wallet/coinselection.cpp',
      startLine: 1043,
      code: `CAmount SelectionResult::GetChange(const CAmount min_viable_change, const CAmount change_fee) const
{
    // change = SUM(inputs) - SUM(outputs) - fees
    // 1) With SFFO we don't pay any fees
    // 2) Otherwise we pay all the fees:
    //  - input fees are covered by GetSelectedEffectiveValue()
    //  - non_input_fee is included in m_target
    //  - change_fee
    const CAmount change = m_use_effective
                           ? GetSelectedEffectiveValue() - m_target - change_fee
                           : GetSelectedValue() - m_target;

    if (change < min_viable_change) {
        return 0;
    }

    return change;
}`,
      annotations: [
        {
          lines: [1045, 1053],
          note: {
            en: 'Change is whatever is left: the inputs, less what is being paid, less the fees. Nothing in the finished transaction states the [[fee]]; it is the part that no [[output]] claims.',
            zh: '找續就是剩下來的部分：輸入總額，減去付出的金額，再減去手續費。完成後的交易不會寫明[[fee|手續費]]是多少；沒有任何[[output|輸出]]領取的那一部分，就是手續費。',
          },
        },
        {
          lines: [1055, 1057],
          note: {
            en: 'If the change would be smaller than `min_viable_change`, the wallet makes no change output at all and the remainder stays in the transaction as extra fee. The threshold is the dust limit, or the cost of spending the change later if that is higher (`src/wallet/spend.cpp`).',
            zh: '若找續小於 `min_viable_change`，錢包便完全不設找續輸出，餘額留在交易之內，成為額外的手續費。這個門檻是粉塵界線，或日後花掉這筆找續所需的費用，以較高者為準（見 `src/wallet/spend.cpp`）。',
          },
        },
      ],
    },
    {
      id: 'update-coins',
      title: { en: 'What a payment does to the set of coins', zh: '一筆付款如何改動未花費輸出的集合' },
      repo: 'bitcoin/bitcoin',
      tag: 'v32.1',
      path: 'src/validation.cpp',
      startLine: 1998,
      code: `void UpdateCoins(const CTransaction& tx, CCoinsViewCache& inputs, CTxUndo &txundo, int nHeight)
{
    // mark inputs spent
    if (!tx.IsCoinBase()) {
        txundo.vprevout.reserve(tx.vin.size());
        for (const CTxIn &txin : tx.vin) {
            txundo.vprevout.emplace_back();
            bool is_spent = inputs.SpendCoin(txin.prevout, &txundo.vprevout.back());
            assert(is_spent);
        }
    }
    // add outputs
    AddCoins(inputs, tx, nHeight);
}`,
      annotations: [
        {
          lines: [2000, 2008],
          note: {
            en: 'Every input removes the output it spends from the set of unspent outputs. The whole output goes: there is no way to spend part of one. A copy is kept in `txundo` so that the block can be undone in a [[reorg]].',
            zh: '每個輸入都把它所花費的輸出從未花費輸出的集合中移除，而且是整個移除：沒有只花一部分的做法。被花掉的輸出會在 `txundo` 留一份副本，以便日後[[reorg|重組]]時撤銷這個區塊。',
          },
        },
        {
          lines: [2009, 2010],
          note: {
            en: 'Then the transaction’s own outputs are added as new coins. `ConnectBlock()` runs these two steps for every [[transaction]] in a block, and that is all a payment does to the set.',
            zh: '然後把這筆交易自己的輸出加進去，成為新的幣。`ConnectBlock()` 對區塊內每筆[[transaction|交易]]都執行這兩步；一筆付款對這個集合所做的改動，僅此而已。',
          },
        },
      ],
    },
  ],
};

export default sources;
