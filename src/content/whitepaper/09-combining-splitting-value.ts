import type { WhitepaperSection } from '../types';

const section: WhitepaperSection = {
  id: 'combining-splitting-value',
  number: 9,
  heading: { en: 'Combining and Splitting Value', zh: '價值的合併與分割' },
  en: [
    {
      type: 'p',
      text: 'Although it would be possible to handle coins individually, it would be unwieldy to make a separate transaction for every cent in a transfer. To allow value to be split and combined, transactions contain multiple inputs and outputs. Normally there will be either a single input from a larger previous transaction or multiple inputs combining smaller amounts, and at most two outputs: one for the payment, and one returning the change, if any, back to the sender.',
    },
    { type: 'figure', id: 'combine-split' },
    {
      type: 'p',
      text: "It should be noted that fan-out, where a transaction depends on several transactions, and those transactions depend on many more, is not a problem here. There is never the need to extract a complete standalone copy of a transaction's history.",
    },
  ],
  zh: [
    {
      type: 'p',
      text: '雖然可以逐枚處理貨幣，但若為一次轉賬中的每一分錢都另立一筆交易，便會十分累贅。為了讓價值可以分割和合併，交易包含多個輸入和輸出。一般而言，交易或是只有一個來自先前較大額交易的輸入，或是有多個把較小金額合併起來的輸入，而輸出則最多有兩個：一個用於付款，另一個把找續（如有）退回付款人。',
    },
    { type: 'figure', id: 'combine-split' },
    {
      type: 'p',
      text: '須注意的是，扇出——即一筆交易依賴若干筆交易，而這些交易又依賴更多交易——在這裏並不構成問題。任何時候都毋須提取某筆交易歷史的完整獨立副本。',
    },
  ],
};

export default section;
