import type { WhitepaperSection } from '../types';

const section: WhitepaperSection = {
  id: 'privacy',
  number: 10,
  heading: { en: 'Privacy', zh: '私隱' },
  en: [
    {
      type: 'p',
      text: 'The traditional banking model achieves a level of privacy by limiting access to information to the parties involved and the trusted third party. The necessity to announce all transactions publicly precludes this method, but privacy can still be maintained by breaking the flow of information in another place: by keeping public keys anonymous. The public can see that someone is sending an amount to someone else, but without information linking the transaction to anyone. This is similar to the level of information released by stock exchanges, where the time and size of individual trades, the "tape", is made public, but without telling who the parties were.',
    },
    { type: 'figure', id: 'privacy-models' },
    {
      type: 'p',
      text: 'As an additional firewall, a new key pair should be used for each transaction to keep them from being linked to a common owner. Some linking is still unavoidable with multi-input transactions, which necessarily reveal that their inputs were owned by the same owner. The risk is that if the owner of a key is revealed, linking could reveal other transactions that belonged to the same owner.',
    },
  ],
  zh: [
    {
      type: 'p',
      text: '傳統的銀行模式透過限制只有相關各方及可信第三方才可取得資訊，來達致一定程度的私隱。由於必須公開宣佈所有交易，這種方法並不可行，但只要在另一處切斷資訊的流動，即保持公鑰匿名，私隱仍可得以維持。公眾可以看到某人正把一筆款項轉給另一人，但沒有資訊把該交易與任何人聯繫起來。這與證券交易所披露資訊的程度相若：個別交易的時間和規模，即「行情紙帶」，均會公開，但不會透露交易各方是誰。',
    },
    { type: 'figure', id: 'privacy-models' },
    {
      type: 'p',
      text: '作為額外的一道防火牆，每筆交易都應使用新的密鑰對，以免這些交易被聯繫到同一位擁有者。多輸入交易仍難免有某程度的關聯，這類交易必然會揭示其各項輸入同屬一位擁有者。風險在於，一旦某個密鑰的擁有者被揭露，透過關聯便可能揭示屬於同一位擁有者的其他交易。',
    },
  ],
};

export default section;
