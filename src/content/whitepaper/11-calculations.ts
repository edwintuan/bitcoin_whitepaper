import type { WhitepaperSection } from '../types';

/*
 * Formulas, read off pages 6 and 7 of the PDF and written as Presentation MathML.
 * As printed: λ is upright; (q / p) is set on one line with a slash; the exponent
 * (z − k) keeps its brackets; both case tables stand between a left and a right
 * brace. The paper's italic "if" is text here, so that it is read as a word.
 */

const LAMBDA = '<mi mathvariant="normal">λ</mi>';
const Q_OVER_P = '<mrow><mo>(</mo><mi>q</mi><mo>/</mo><mi>p</mi><mo>)</mo></mrow>';
const IF = '<mtext>if&#xA0;</mtext>';
const TIMES = '<mo>&#x2062;</mo>';

/** (q / p) to the power (z − k): the chance of catching up from z − k blocks behind. */
const CATCH_UP = `<msup>${Q_OVER_P}<mrow><mo>(</mo><mi>z</mi><mo>−</mo><mi>k</mi><mo>)</mo></mrow></msup>`;

/** The Poisson density: λ^k e^(−λ) over k! */
const POISSON = [
  '<mfrac>',
  `<mrow><msup>${LAMBDA}<mi>k</mi></msup>${TIMES}<msup><mi>e</mi><mrow><mo>−</mo>${LAMBDA}</mrow></msup></mrow>`,
  '<mrow><mi>k</mi><mo>!</mo></mrow>',
  '</mfrac>',
].join('');

/** Sum over k from 0 to the given upper limit. */
const sum = (upper: string) =>
  `<munderover><mo>∑</mo><mrow><mi>k</mi><mo>=</mo><mn>0</mn></mrow>${upper}</munderover>`;

/** q_z = 1 if p ≤ q; (q / p)^z if p > q. */
const QZ_CASES = [
  '<math display="block">',
  '<msub><mi>q</mi><mi>z</mi></msub><mo>=</mo>',
  '<mrow><mo>{</mo><mtable>',
  `<mtr><mtd><mn>1</mn></mtd><mtd>${IF}<mi>p</mi><mo>≤</mo><mi>q</mi></mtd></mtr>`,
  `<mtr><mtd><msup>${Q_OVER_P}<mi>z</mi></msup></mtd><mtd>${IF}<mi>p</mi><mo>&gt;</mo><mi>q</mi></mtd></mtr>`,
  '</mtable><mo>}</mo></mrow>',
  '</math>',
].join('');

/** λ = z q / p, with q over p as a built-up fraction. */
const LAMBDA_VALUE = [
  '<math display="block">',
  `${LAMBDA}<mo>=</mo><mi>z</mi>${TIMES}<mfrac><mi>q</mi><mi>p</mi></mfrac>`,
  '</math>',
].join('');

/** The infinite sum: Poisson density times the chance of catching up, in two cases. */
const INFINITE_SUM = [
  '<math display="block">',
  sum('<mi mathvariant="normal">∞</mi>'),
  POISSON,
  '<mo>·</mo>',
  '<mrow><mo>{</mo><mtable>',
  `<mtr><mtd>${CATCH_UP}</mtd><mtd>${IF}<mi>k</mi><mo>≤</mo><mi>z</mi></mtd></mtr>`,
  `<mtr><mtd><mn>1</mn></mtd><mtd>${IF}<mi>k</mi><mo>&gt;</mo><mi>z</mi></mtd></mtr>`,
  '</mtable><mo>}</mo></mrow>',
  '</math>',
].join('');

/** Rearranged: 1 minus the finite sum from k = 0 to z. */
const FINITE_SUM = [
  '<math display="block">',
  '<mn>1</mn><mo>−</mo>',
  sum('<mi>z</mi>'),
  POISSON,
  `${TIMES}<mrow><mo>(</mo><mn>1</mn><mo>−</mo>${CATCH_UP}<mo>)</mo></mrow>`,
  '</math>',
].join('');

/* Listings, with the line breaks, indentation and column spacing of the PDF. */

const C_FUNCTION = [
  '#include <math.h>',
  'double AttackerSuccessProbability(double q, int z)',
  '{',
  '    double p = 1.0 - q;',
  '    double lambda = z * (q / p);',
  '    double sum = 1.0;',
  '    int i, k;',
  '    for (k = 0; k <= z; k++)',
  '    {',
  '        double poisson = exp(-lambda);',
  '        for (i = 1; i <= k; i++)',
  '            poisson *= lambda / i;',
  '        sum -= poisson * (1 - pow(q / p, z - k));',
  '    }',
  '    return sum;',
  '}',
].join('\n');

const RESULTS_Q_01 = [
  'q=0.1',
  'z=0    P=1.0000000',
  'z=1    P=0.2045873',
  'z=2    P=0.0509779',
  'z=3    P=0.0131722',
  'z=4    P=0.0034552',
  'z=5    P=0.0009137',
  'z=6    P=0.0002428',
  'z=7    P=0.0000647',
  'z=8    P=0.0000173',
  'z=9    P=0.0000046',
  'z=10   P=0.0000012',
].join('\n');

const RESULTS_Q_03 = [
  'q=0.3',
  'z=0    P=1.0000000',
  'z=5    P=0.1773523',
  'z=10   P=0.0416605',
  'z=15   P=0.0101008',
  'z=20   P=0.0024804',
  'z=25   P=0.0006132',
  'z=30   P=0.0001522',
  'z=35   P=0.0000379',
  'z=40   P=0.0000095',
  'z=45   P=0.0000024',
  'z=50   P=0.0000006',
].join('\n');

const BLOCKS_FOR_ONE_IN_A_THOUSAND = [
  'P < 0.001',
  'q=0.10   z=5',
  'q=0.15   z=8',
  'q=0.20   z=11',
  'q=0.25   z=15',
  'q=0.30   z=24',
  'q=0.35   z=41',
  'q=0.40   z=89',
  'q=0.45   z=340',
].join('\n');

/**
 * The third definition is printed as q with a subscript z. Block text is plain,
 * so it stands here as the PDF's own characters, "qz"; the formula that follows
 * shows the subscript.
 */
const section: WhitepaperSection = {
  id: 'calculations',
  number: 11,
  heading: { en: 'Calculations', zh: '計算' },
  en: [
    {
      type: 'p',
      text: 'We consider the scenario of an attacker trying to generate an alternate chain faster than the honest chain. Even if this is accomplished, it does not throw the system open to arbitrary changes, such as creating value out of thin air or taking money that never belonged to the attacker. Nodes are not going to accept an invalid transaction as payment, and honest nodes will never accept a block containing them. An attacker can only try to change one of his own transactions to take back money he recently spent.',
    },
    {
      type: 'p',
      text: "The race between the honest chain and an attacker chain can be characterized as a Binomial Random Walk. The success event is the honest chain being extended by one block, increasing its lead by +1, and the failure event is the attacker's chain being extended by one block, reducing the gap by -1.",
    },
    {
      type: 'p',
      text: "The probability of an attacker catching up from a given deficit is analogous to a Gambler's Ruin problem. Suppose a gambler with unlimited credit starts at a deficit and plays potentially an infinite number of trials to try to reach breakeven. We can calculate the probability he ever reaches breakeven, or that an attacker ever catches up with the honest chain, as follows [8]:",
    },
    {
      type: 'list',
      ordered: false,
      items: [
        'p = probability an honest node finds the next block',
        'q = probability the attacker finds the next block',
        'qz = probability the attacker will ever catch up from z blocks behind',
      ],
    },
    { type: 'math', mathml: QZ_CASES },
    {
      type: 'p',
      text: "Given our assumption that p > q, the probability drops exponentially as the number of blocks the attacker has to catch up with increases. With the odds against him, if he doesn't make a lucky lunge forward early on, his chances become vanishingly small as he falls further behind.",
    },
    {
      type: 'p',
      text: "We now consider how long the recipient of a new transaction needs to wait before being sufficiently certain the sender can't change the transaction. We assume the sender is an attacker who wants to make the recipient believe he paid him for a while, then switch it to pay back to himself after some time has passed. The receiver will be alerted when that happens, but the sender hopes it will be too late.",
    },
    {
      type: 'p',
      text: 'The receiver generates a new key pair and gives the public key to the sender shortly before signing. This prevents the sender from preparing a chain of blocks ahead of time by working on it continuously until he is lucky enough to get far enough ahead, then executing the transaction at that moment. Once the transaction is sent, the dishonest sender starts working in secret on a parallel chain containing an alternate version of his transaction.',
    },
    {
      type: 'p',
      text: "The recipient waits until the transaction has been added to a block and z blocks have been linked after it. He doesn't know the exact amount of progress the attacker has made, but assuming the honest blocks took the average expected time per block, the attacker's potential progress will be a Poisson distribution with expected value:",
    },
    { type: 'math', mathml: LAMBDA_VALUE },
    {
      type: 'p',
      text: 'To get the probability the attacker could still catch up now, we multiply the Poisson density for each amount of progress he could have made by the probability he could catch up from that point:',
    },
    { type: 'math', mathml: INFINITE_SUM },
    { type: 'p', text: 'Rearranging to avoid summing the infinite tail of the distribution...' },
    { type: 'math', mathml: FINITE_SUM },
    { type: 'p', text: 'Converting to C code...' },
    { type: 'code', code: C_FUNCTION },
    { type: 'p', text: 'Running some results, we can see the probability drop off exponentially with z.' },
    { type: 'code', code: RESULTS_Q_01 },
    { type: 'code', code: RESULTS_Q_03 },
    { type: 'p', text: 'Solving for P less than 0.1%...' },
    { type: 'code', code: BLOCKS_FOR_ONE_IN_A_THOUSAND },
  ],
  zh: [
    {
      type: 'p',
      text: '我們考慮這樣的情境：攻擊者試圖以快於誠實鏈的速度生成一條替代鏈。即使做到這一點，系統亦不會因此而門戶大開、任由隨意更改，例如憑空創造價值，或取走從不屬於攻擊者的金錢。節點不會接受無效的交易作為付款，而誠實節點亦永遠不會接受包含這類交易的區塊。攻擊者只能嘗試更改他自己的某一筆交易，以取回他最近花費的金錢。',
    },
    {
      type: 'p',
      text: '誠實鏈與攻擊者鏈之間的競賽可描述為二項隨機漫步。成功事件是誠實鏈延長一個區塊，使其領先幅度 +1；失敗事件是攻擊者的鏈延長一個區塊，使差距 -1。',
    },
    {
      type: 'p',
      text: '攻擊者從某個落後差距追上的概率類似於賭徒破產問題。假設一名信貸額無限的賭徒從虧損狀態開始，並可能進行無限次試驗，以求達到收支平衡。我們可以計算他終能達到收支平衡的概率，亦即攻擊者終能追上誠實鏈的概率，計算方法如下 [8]：',
    },
    {
      type: 'list',
      ordered: false,
      items: [
        'p = 誠實節點找到下一個區塊的概率',
        'q = 攻擊者找到下一個區塊的概率',
        'qz = 攻擊者在落後 z 個區塊的情況下終能追上的概率',
      ],
    },
    { type: 'math', mathml: QZ_CASES },
    {
      type: 'p',
      text: '鑑於我們假設 p > q，隨着攻擊者需要追趕的區塊數目增加，這個概率會呈指數下降。由於他勝算較低，若他未能在早期僥倖地向前猛進一步，隨着他愈來愈落後，其機會便會變得微乎其微。',
    },
    {
      type: 'p',
      text: '現在我們考慮，一筆新交易的收款人需要等待多久，才能充分確定付款人無法更改該交易。我們假設付款人是一名攻擊者，他想讓收款人在一段時間內相信他已向其付款，然後在過了一些時間之後，把交易改為付回給自己。屆時收款人會收到警報，但付款人希望那時已經太遲。',
    },
    {
      type: 'p',
      text: '收款人生成一個新的密鑰對，並在簽署前不久才把公鑰交給付款人。這可防止付款人預先持續不斷地構建一條由區塊組成的鏈，直至幸運地取得足夠的領先，然後才在那一刻執行交易。交易一經發出，不誠實的付款人便開始秘密構建一條平行的鏈，該鏈包含其交易的另一個版本。',
    },
    {
      type: 'p',
      text: '收款人會一直等待，直至該交易已加入某個區塊，而且其後已連結了 z 個區塊為止。他不知道攻擊者確切取得了多少進展，但假設誠實區塊所用的時間為每個區塊的平均預期時間，攻擊者的潛在進展將呈泊松分佈，其期望值為：',
    },
    { type: 'math', mathml: LAMBDA_VALUE },
    {
      type: 'p',
      text: '為求得攻擊者此刻仍能追上的概率，我們把他可能取得的每一種進展量的泊松密度，乘以他從該點追上的概率：',
    },
    { type: 'math', mathml: INFINITE_SUM },
    { type: 'p', text: '重新整理，以避免對該分佈的無限尾部求和……' },
    { type: 'math', mathml: FINITE_SUM },
    { type: 'p', text: '轉換為 C 程式碼……' },
    { type: 'code', code: C_FUNCTION },
    { type: 'p', text: '運行程式得出一些結果後，我們可以看到概率隨 z 呈指數下降。' },
    { type: 'code', code: RESULTS_Q_01 },
    { type: 'code', code: RESULTS_Q_03 },
    { type: 'p', text: '求解 P 小於 0.1% 的情況……' },
    { type: 'code', code: BLOCKS_FOR_ONE_IN_A_THOUSAND },
  ],
};

export default section;
