/**
 * The status line of the wallet figure, put together from its copy and the
 * payment on screen. Kept out of the component so that each sentence can be
 * read, and tested, as the reader will read it.
 */
import type { Lang } from '@/content/types';
import { fill, formatBtc } from '@/text/format';
import { COPY } from './copy';
import { DUST } from './wallet';
import type { Plan } from './wallet';
import { pick } from '@/i18n/settings';

/** "1 coin", "3 coins": a count that reads as a phrase in either language. */
export function coinCount(lang: Lang, n: number): string {
  return n === 1 ? pick(COPY.oneCoin, lang) : fill(pick(COPY.coins, lang), { n });
}

/** What the figure shows, as far as its status line is concerned. */
export interface WalletStatusInput {
  /** The amount field holds text that cannot become an amount. */
  badAmount: boolean;
  plan: Plan;
  /** What the reader is paying, in satoshis, or null without an amount. */
  amount: bigint | null;
  /** Coins picked by hand while there is no amount yet: how many, and what they hold. */
  picked: { coins: number; total: bigint } | null;
  /** What the last payment did, until the reader does something else. */
  sent: { spent: number; amount: bigint; change: bigint } | null;
  /** Every coin has been spent. */
  walletEmpty: boolean;
}

/** The status line under the figure. */
export function walletStatus(lang: Lang, state: WalletStatusInput): string {
  const { plan } = state;
  if (state.badAmount) return pick(COPY.badAmount, lang);

  if (plan.kind === 'idle') {
    if (state.picked && state.picked.coins > 0) {
      return fill(pick(COPY.statusPicked, lang), { n: coinCount(lang, state.picked.coins), total: formatBtc(state.picked.total) });
    }
    if (state.sent) {
      return fill(pick((state.sent.change > 0n ? COPY.statusSent : COPY.statusSentNoChange), lang), {
        n: coinCount(lang, state.sent.spent),
        amount: formatBtc(state.sent.amount),
        change: formatBtc(state.sent.change),
      });
    }
    return pick((state.walletEmpty ? COPY.empty : COPY.statusIdle), lang);
  }

  const amount = formatBtc(state.amount ?? 0n);

  if (plan.kind === 'short') {
    const template = !plan.manual ? COPY.statusShort : plan.inputs.length === 0 ? COPY.statusPickOne : COPY.statusShortManual;
    return fill(pick(template, lang), {
      total: formatBtc(plan.total),
      amount,
      need: formatBtc(plan.total + plan.missing),
      missing: formatBtc(plan.missing),
    });
  }

  if (plan.outcome === 'exact') return pick(COPY.statusExact, lang);
  if (plan.outcome === 'dust') return fill(pick(COPY.statusDust, lang), { dust: formatBtc(plan.dust), limit: formatBtc(DUST) });

  const inputs = plan.selection.inputs;
  const template = plan.manual ? COPY.statusManual : inputs.length === 1 ? COPY.statusSplit : COPY.statusCombine;
  return fill(pick(template, lang), {
    n: coinCount(lang, inputs.length),
    coin: formatBtc(inputs[0].value),
    total: formatBtc(plan.selection.total),
    amount,
    change: formatBtc(plan.change),
  });
}
