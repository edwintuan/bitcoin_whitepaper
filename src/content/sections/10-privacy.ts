import type { SectionContent } from '../types';

const section: SectionContent = {
  id: 'privacy',
  number: 10,
  part: 5,
  title: { en: 'Privacy', zh: '私隱' },

  tldr: {
    en: 'Every [[transaction]] is public, yet none carries a name. Privacy rests on keeping a [[public-key|key]] from being tied to a person, so the paper advises a new [[key-pair|key pair]] for each transaction.',
    zh: '每筆[[transaction|交易]]都公開，卻沒有一筆寫着名字。私隱就繫於不讓[[public-key|公鑰]]與真人身份扯上關係，所以白皮書建議每筆交易都使用新的[[key-pair|密鑰對]]。',
  },

  analogy: {
    en: 'A row of numbered lockers in a station concourse. Anyone can watch money move from locker to locker, and see when and how much. What nobody can see is who holds each key. Use the same locker every day, though, and people soon work out whose it is.',
    zh: '好比車站大堂裏一整排有編號的儲物櫃。誰都看得見錢在甚麼時候、由哪個櫃轉到哪個櫃、轉了多少，卻看不見每把鑰匙在誰手上。可是，你若每天都用同一個櫃，旁人很快便猜得出它是誰的。',
  },

  body: {
    en: [
      'A bank keeps payments private by keeping them to itself. Only the two parties and the bank, the [[trusted-third-party|trusted third party]], know who paid whom, and the public is shown nothing. That method is closed to a system that works by announcing every transaction to everyone.',
      'So the paper cuts the flow of information at a different point. Transactions stay in full view, but nothing in them says who the people are. What the public sees is that one [[public-key|public key]] has paid another: an amount and a time, like the tape of a stock exchange, which reports the size and time of every trade without naming the traders. The usual word for this today is [[pseudonymity]]. You act under a key instead of a name, and the protection lasts for as long as nobody can tie the key to you.',
      'The paper adds what it calls a firewall: use a new [[key-pair|key pair]] for each transaction. If the same key, or the [[address]] made from it, receives ten payments, anyone can see that the ten belong together, and learning who owns one reveals who owns them all. [[address-reuse|Address reuse]] is the easiest way to give up what privacy the design offers. A new key every time leaves an observer with payments that have nothing visibly in common.',
      'One link cannot be avoided. A payment larger than any single coin has to spend several coins at once ({§9}), and every [[input]] must be signed by the key that owns it. An observer may fairly conclude that all the inputs of one transaction have one owner. Chain analysts call this the [[common-input-heuristic|common-input-ownership heuristic]], and the paper already concedes it: such transactions “necessarily reveal that their inputs were owned by the same owner”.',
      'The section ends on the risk this leaves. Links are harmless while every key is a stranger. Once the owner of a single key becomes known, as happens when a shop delivers goods to a home address, everything linked to that key is exposed with it. The record is permanent, so this applies to payments already made as much as to those still to come.',
    ],
    zh: [
      '銀行保護付款私隱的方法，是把資料留在自己手裏。誰付了錢給誰，只有交易雙方和銀行這個[[trusted-third-party|可信第三方]]知道，公眾甚麼也看不到。但一個靠向所有人宣佈每筆交易來運作的系統，用不上這個方法。',
      '於是白皮書改在另一處切斷資訊的流動。交易依然攤開給所有人看，但裏面沒有任何內容說明當事人是誰。公眾看到的，只是一把[[public-key|公鑰]]向另一把公鑰付了款：有金額，有時間，就像證券交易所的行情紙帶，只報每宗買賣的數量和時間，不報買賣雙方的名字。今天一般把這種狀況稱為[[pseudonymity|假名性]]：你以密鑰而非姓名行事，只要沒有人能把密鑰和你連上，這層保護就一直有效。',
      '白皮書還加了一道它稱之為「防火牆」的措施：每筆交易都使用新的[[key-pair|密鑰對]]。若同一把密鑰，或由它推算出來的同一個[[address|地址]]，收了十筆款項，任何人都看得出這十筆同屬一人；只要查出其中一筆是誰的，其餘九筆也就水落石出。[[address-reuse|地址重用]]是最輕易把這套設計所提供的私隱拱手相讓的做法。每次都換新密鑰，觀察者看到的，就只是一筆筆表面上毫無共通之處的付款。',
      '但有一種關聯無法避免。金額比任何一枚幣都大的付款，必須同時花掉幾枚幣（{§9}），而每個[[input|輸入]]都要由擁有它的密鑰簽署。觀察者有理由推斷：同一筆交易的所有輸入同屬一人。鏈上分析者把這稱為[[common-input-heuristic|共同輸入推斷法]]；白皮書自己亦早已承認，這類交易「必然會揭示其各項輸入同屬一位擁有者」。',
      '這一章以由此而來的風險作結。只要每把密鑰背後都是陌生人，這些關聯本身並無害處。可是，只要其中一把密鑰的擁有者曝光（例如商店要把貨物送到住址），與這把密鑰相連的一切便隨之曝光。賬本是永久的，所以受影響的不只是日後的付款，也包括早已完成的付款。',
    ],
  },

  figure: {
    component: 'PrivacyLinkage',
    title: { en: 'Where the wall stands', zh: '屏障設在哪裏' },
    steps: {
      en: [
        {
          title: 'The bank’s wall',
          text: 'In the traditional model the bank sees everything, identities and transactions alike, and a wall keeps all of it from the public. Read what each side of the wall is told about one payment.',
        },
        {
          title: 'Move the wall',
          text: 'Switch to the new model. The transaction is now on the public side, for anyone to read. The wall has moved: it stands between the transaction and the identity of the people in it.',
        },
        {
          title: 'Six payments, fresh addresses',
          text: 'Alice is paid three times and pays three times, with a new [[address]] for every coin. An observer who knows one of her addresses can tie two transactions to her: that coin arriving, and that coin being spent.',
        },
        {
          title: 'Reuse one address',
          text: 'The first switch is now on. Every coin sits at the same address, so everything joins: to know that one address is to know all six transactions.',
        },
        {
          title: 'Spend coins together',
          text: 'Reuse is off and the second switch is on. Her first bill is larger than any coin she holds, so three coins go into one transaction. Their addresses differ, yet the observer now knows they share an owner: the leak the paper names.',
        },
        {
          title: 'From public key to address',
          text: 'Under the scene, follow one public key through [[sha-256|SHA-256]] and then RIPEMD-160, the two hashes that together are [[hash160|HASH160]], into a form made for copying. Make a new key and every line changes.',
        },
      ],
      zh: [
        {
          title: '銀行的屏障',
          text: '在傳統模式下，銀行對身份和交易一覽無遺，而一道屏障把這一切擋在公眾之外。看看對於同一筆付款，屏障兩邊各自得知些甚麼。',
        },
        {
          title: '挪動屏障',
          text: '切換到新模式。交易現在位於公開的一邊，任何人都可以查閱。屏障換了位置：它隔開的，是交易與交易雙方的身份。',
        },
        {
          title: '六筆收付，全用新地址',
          text: '愛麗絲收款三次、付款三次，每一枚幣都用新的[[address|地址]]。觀察者只要知道她其中一個地址，便能把兩筆交易歸到她名下：那枚幣的收入，以及它的支出。',
        },
        {
          title: '重用同一個地址',
          text: '第一個開關現已打開。每一枚幣都落在同一個地址，於是全部連在一起：知道這個地址是誰的，就知道全部六筆交易是誰的。',
        },
        {
          title: '把幾枚幣一併花掉',
          text: '重用已關掉，第二個開關則已打開。她的第一張賬單比手上任何一枚幣都大，所以三枚幣要放進同一筆交易。三個地址各不相同，觀察者卻由此知道它們同屬一人，這正是白皮書點明的那個漏洞。',
        },
        {
          title: '由公鑰到地址',
          text: '在場景下方，跟着一把公鑰走一遍：先 [[sha-256|SHA-256]]，再 RIPEMD-160，兩次哈希合起來就是 [[hash160|HASH160]]，最後寫成便於抄寫的形式。換一把新密鑰，每一行都會改變。',
        },
      ],
    },
  },

  whoRuns: [
    {
      actor: 'software-wallet',
      role: {
        en: 'Makes the paper’s advice automatic. An [[hd-wallet|HD wallet]] derives every key from one seed, gives out a fresh [[address]] for each payment it is asked to receive, and sends its own change to yet another.',
        zh: '把白皮書的建議變成自動進行的事。[[hd-wallet|HD 錢包]]由同一個種子推導出每一把密鑰，每次收款都給出一個新[[address|地址]]，自己的找續亦另用一個地址。',
      },
      artifact: {
        kind: 'bip',
        label: 'BIP 32 · BIP 44 · BIP 84',
        detail: {
          en: 'BIP 32 grows a tree of keys from a single seed. BIP 44 gives the tree its shape, `m / purpose\' / coin_type\' / account\' / change / address_index`, and BIP 84 sets purpose 84\' for the `bc1q` addresses shown in the figure. Chain 0 is for receiving, chain 1 for change.',
          zh: 'BIP 32 規定如何由單一個種子長出一棵密鑰樹。BIP 44 定出樹的形狀：`m / purpose\' / coin_type\' / account\' / change / address_index`；BIP 84 則為圖中那種 `bc1q` 地址定下用途編號 84\'。第 0 條鏈用於收款，第 1 條鏈用於找續。',
        },
        snippet:
          'm/84\'/0\'/0\'/0/0   receiving, 1st\nm/84\'/0\'/0\'/0/1   receiving, 2nd\nm/84\'/0\'/0\'/1/0   change, 1st\n\n$ bitcoin-cli getnewaddress\n# every call takes the next key of\nwpkh(xpub…/84h/0h/0h/0/*)\n# and change takes the next key of\nwpkh(xpub…/84h/0h/0h/1/*)',
      },
    },
    {
      actor: 'hardware-wallet',
      role: {
        en: 'Holds the seed that every one of those keys comes from. The seed is written down as a [[seed-phrase|list of words]]; whoever has the words can rebuild every key, and with them every address the [[wallet]] has used.',
        zh: '保管推導出所有密鑰的那個種子。種子會抄寫成一組[[seed-phrase|助記詞]]；誰拿到這組詞語，誰就能重建每一把密鑰，從而得知這個[[wallet|錢包]]用過的每一個地址。',
      },
      artifact: {
        kind: 'bip',
        label: 'BIP 39',
        detail: {
          en: '12 to 24 words from a list of 2,048, so that each word carries 11 bits, with a checksum built in. PBKDF2 with HMAC-SHA512 and 2,048 rounds turns the sentence into the 512-bit seed BIP 32 starts from.',
          zh: '由一份 2,048 個詞的詞表中取出 12 至 24 個詞，每個詞代表 11 位元，並內含校驗碼。這組詞語再經 2,048 輪以 HMAC-SHA512 進行的 PBKDF2 運算，變成 512 位元的種子，供 BIP 32 使用。',
        },
        snippet:
          '128 bits + 4 checksum = 12 words\n256 bits + 8 checksum = 24 words\n\nseed = PBKDF2(HMAC-SHA512,\n  password = the words,\n  salt = "mnemonic" + passphrase,\n  rounds = 2048)   → 64 bytes',
      },
    },
    {
      actor: 'explorer',
      role: {
        en: 'Works from the other side. Anyone with an index of the chain can group addresses by owner, using exactly the two links the paper names: an address used twice, and inputs spent together.',
        zh: '站在另一邊做相反的事。任何人只要有一份鏈的索引，便能按擁有者把地址分組，用的正是白皮書點明的兩種關聯：重複使用的地址，以及一併花掉的輸入。',
      },
      artifact: {
        kind: 'rpc',
        label: 'getrawtransaction',
        detail: {
          en: 'With `verbosity` set to 2 a node returns each input together with the output it spends, address included. Inputs listed side by side in one transaction are the raw material of the [[common-input-heuristic|common-input-ownership heuristic]].',
          zh: '把 `verbosity` 設為 2，節點便會把每個輸入連同它所花掉的輸出一併傳回，當中包括地址。同一筆交易內並列的輸入，就是[[common-input-heuristic|共同輸入推斷法]]的原材料。',
        },
        snippet:
          '$ bitcoin-cli getrawtransaction \\\n    <txid> 2\n{\n  "vin": [\n    { "prevout": { "scriptPubKey":\n        { "address": "bc1q…" } } },\n    { "prevout": { "scriptPubKey":\n        { "address": "bc1q…" } } }\n  ],\n  ...\n}',
      },
    },
  ],

  paperVsToday: {
    en: [
      'The paper speaks of keeping public keys “anonymous”. The accurate word is pseudonymous: the whole history of every key is public for good and can be studied at leisure, so the protection holds only until one key is tied to a person.',
      'The two leaks the paper names, [[address-reuse|address reuse]] and transactions with several inputs, are the two that matter most in practice. Bitcoin Core’s own wallet code describes coins sent to one address as “obviously controlled by a single wallet”.',
      'Wallets now avoid reuse without being asked. A hierarchical deterministic wallet (BIP 32) has one chain of keys for receiving and another for change, and in Bitcoin Core every call to `getnewaddress` moves on to the next key.',
      'What made this practical is the seed. Before BIP 32 the reference client created every key at random, and to spare its users a backup after each transaction it kept a pool of 100 keys in reserve, as the BIP recalls. With every key derived from one seed, a new key costs nothing.',
      'The same tree has a price. An extended public key can derive every address of an account without being able to spend from any. Hand one to a service that watches your balance and that service can see the account’s whole history.',
      'An [[address]] of the kinds shown here is not the public key but a 20-byte hash of it. The key itself is published only in the transaction that spends the coin, so less is on view than the paper assumed.',
    ],
    zh: [
      '白皮書說的是保持公鑰「匿名」。準確的說法應是「假名」：每把密鑰的全部歷史永久公開，任何人都可以慢慢研究，所以這層保護只維持到其中一把密鑰被連到真人身上為止。',
      '白皮書點明的兩個漏洞，即[[address-reuse|地址重用]]和多輸入交易，正是實際上影響最大的兩個。Bitcoin Core 錢包的源碼，就把發往同一個地址的款項形容為「顯然由同一個錢包控制」。',
      '今天的錢包毋須用戶提醒，也會避免重用地址。分層確定性錢包（BIP 32）有一條鏈的密鑰專門用於收款，另一條專門用於找續；在 Bitcoin Core 裏，每呼叫一次 `getnewaddress`，便換用下一把密鑰。',
      '令這一切變得可行的是種子。在 BIP 32 之前，參考客戶端的每把密鑰都是隨機生成的；據該 BIP 憶述，為免用戶每做一筆交易便要備份一次，客戶端會預先儲備 100 把密鑰。當所有密鑰都由同一個種子推導出來，換一把新密鑰便毫無成本。',
      '這棵樹也有代價。擴展公鑰可以推導出一個賬戶的全部地址，卻不能動用其中任何一枚幣。把它交給替你查看結餘的服務，對方便看得到這個賬戶的全部歷史。',
      '圖中那幾類[[address|地址]]並不是公鑰本身，而是公鑰的 20 位元組哈希。公鑰要到花掉這枚幣的交易中才會公開；換言之，公開的內容比白皮書設想的還要少。',
    ],
  },
};

export default section;
