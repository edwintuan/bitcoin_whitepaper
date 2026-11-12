import type { WhitepaperSection } from '../types';

const section: WhitepaperSection = {
  id: 'spv',
  number: 8,
  heading: { en: 'Simplified Payment Verification', zh: '簡易支付驗證' },
  en: [
    {
      type: 'p',
      text: "It is possible to verify payments without running a full network node. A user only needs to keep a copy of the block headers of the longest proof-of-work chain, which he can get by querying network nodes until he's convinced he has the longest chain, and obtain the Merkle branch linking the transaction to the block it's timestamped in. He can't check the transaction for himself, but by linking it to a place in the chain, he can see that a network node has accepted it, and blocks added after it further confirm the network has accepted it.",
    },
    { type: 'figure', id: 'spv-chain' },
    {
      type: 'p',
      text: "As such, the verification is reliable as long as honest nodes control the network, but is more vulnerable if the network is overpowered by an attacker. While network nodes can verify transactions for themselves, the simplified method can be fooled by an attacker's fabricated transactions for as long as the attacker can continue to overpower the network. One strategy to protect against this would be to accept alerts from network nodes when they detect an invalid block, prompting the user's software to download the full block and alerted transactions to confirm the inconsistency. Businesses that receive frequent payments will probably still want to run their own nodes for more independent security and quicker verification.",
    },
  ],
  zh: [
    {
      type: 'p',
      text: '毋須運行完整的網絡節點，亦可驗證付款。用戶只需保存一份最長工作量證明鏈的區塊頭副本——他可不斷查詢網絡節點以取得副本，直至確信自己擁有最長鏈為止——並取得默克爾分支，該分支把交易連結至為其加上時間戳的區塊。他無法自行檢查該交易，但藉着把交易連結至鏈上的某個位置，他可以看到已有網絡節點接受了它，而其後加入的區塊則進一步確認網絡已接受該交易。',
    },
    { type: 'figure', id: 'spv-chain' },
    {
      type: 'p',
      text: '因此，只要誠實節點控制着網絡，這種驗證便是可靠的；但若網絡被攻擊者壓倒，驗證便較為脆弱。雖然網絡節點可自行驗證交易，但只要攻擊者能持續壓倒網絡，這種簡易方法便可能被攻擊者偽造的交易所欺騙。防範這種情況的一種策略，是在網絡節點偵測到無效區塊時接收它們發出的警報，促使用戶的軟件下載完整的區塊及警報所指的交易，以確認當中的不一致之處。經常收款的企業大概仍會希望運行自己的節點，以獲得更獨立的安全保障和更快的驗證。',
    },
  ],
};

export default section;
