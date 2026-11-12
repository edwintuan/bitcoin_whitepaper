import type { ArtifactKind, Depth, L, TermCategory } from './types';

/**
 * Every reader-facing string that belongs to the interface rather than to a
 * section. Section copy lives in src/content/sections.
 */
export const UI = {
  siteTitle: {
    en: 'Bitcoin, explained: the whitepaper, block by block',
    zh: '比特幣白皮書，逐塊拆解',
  },
  brand: { en: 'Bitcoin, explained', zh: '比特幣，逐塊拆解' },
  credit: { en: 'Provided by Animus Laboratories', zh: '由 Animus Laboratories 提供' },
  sourceLink: { en: 'Source on GitHub', zh: 'GitHub 原始碼' },
  skipToContent: { en: 'Skip to the paper', zh: '跳至正文' },

  language: { en: 'Language', zh: '語言' },
  depthLabel: { en: 'Reading depth', zh: '閱讀深度' },
  depth: {
    starter: { en: 'Starter', zh: '入門' },
    curious: { en: 'Curious', zh: '進階' },
    developer: { en: 'Developer', zh: '開發者' },
  } satisfies Record<Depth, L<string>>,
  depthHint: {
    starter: {
      en: 'Summaries, comparisons and the figures. Everything else is folded away.',
      zh: '只展開總結、比方和互動圖，其餘內容先收起。',
    },
    curious: {
      en: 'Adds the full explanation, the paper’s own words and who runs each part.',
      zh: '加上完整解說、白皮書原文，以及各環節由誰實現。',
    },
    developer: {
      en: 'Opens everything, including source code and where today’s Bitcoin differs.',
      zh: '全部展開，包括源碼，以及今天的比特幣與白皮書的出入。',
    },
  } satisfies Record<Depth, L<string>>,

  search: { en: 'Search', zh: '搜尋' },
  searchPlaceholder: { en: 'Search terms and sections', zh: '搜尋關鍵詞與章節' },
  searchEmpty: { en: 'Nothing matches.', zh: '沒有符合的結果。' },
  searchTerms: { en: 'Terms', zh: '關鍵詞' },
  searchSections: { en: 'Sections', zh: '章節' },
  menu: { en: 'Sections', zh: '章節' },
  close: { en: 'Close', zh: '關閉' },
  sectionsNav: { en: 'Sections of the paper', zh: '白皮書章節' },
  block: { en: 'Block', zh: '區塊' },
  abstract: { en: 'Abstract', zh: '摘要' },
  part: { en: 'Part', zh: '第' },
  partSuffix: { en: '', zh: '部分' },
  read: { en: 'read', zh: '已讀' },
  current: { en: 'you are here', zh: '目前位置' },
  nextSection: { en: 'Next', zh: '下一章' },
  backToTop: { en: 'Back to the top', zh: '返回頁首' },

  blocks: {
    tldr: { en: 'In one line', zh: '一句話總結' },
    analogy: { en: 'Think of it as', zh: '打個比方' },
    body: { en: 'How it works', zh: '運作原理' },
    original: { en: 'The paper’s own words', zh: '白皮書原文' },
    who: { en: 'Who runs this in the real world', zh: '工程上由誰實現' },
    source: { en: 'In the source', zh: '源碼一瞥' },
    paperVsToday: { en: 'The paper vs today', zh: '白皮書 vs 今天' },
  },

  figure: { en: 'Fig.', zh: '圖' },
  stepCount: { en: '{n} / {total}', zh: '{n}／{total}' },
  stepPrev: { en: 'Back', zh: '上一步' },
  stepNext: { en: 'Next', zh: '下一步' },
  stepSkip: { en: 'Explore freely', zh: '自由操作' },
  stepRestart: { en: 'Replay the walkthrough', zh: '重看引導' },
  figureLoading: { en: 'Loading the figure', zh: '正在載入互動圖' },
  figureFailed: {
    en: 'This figure could not start in your browser. The explanation around it is complete without it.',
    zh: '這個互動圖在你的瀏覽器中無法啟動。不看圖，前後的解說依然完整。',
  },

  /** Shown above the paper's text in the Chinese page only, where the translation stands beside the original. */
  originalNote: {
    en: 'Verbatim from the paper as published at bitcoin.org.',
    zh: '中文為本站譯文，僅供參考；並列的英文為白皮書原文，以英文為準。',
  },
  sourceNote: {
    en: 'Copied verbatim from the official repository, MIT licence. The numbered notes are ours, not part of the code.',
    zh: '逐字引自官方倉庫（MIT 許可證）。帶編號的註解為本站所加，並非源碼的一部分。',
  },
  sourceLines: { en: 'lines', zh: '行' },
  sourceOpen: { en: 'View on GitHub', zh: '在 GitHub 查看' },
  sourceNotes: { en: 'Notes', zh: '註解' },

  artifact: {
    rpc: { en: 'RPC', zh: 'RPC' },
    cli: { en: 'Command', zh: '指令' },
    p2p: { en: 'P2P message', zh: 'P2P 訊息' },
    protocol: { en: 'Protocol', zh: '協定' },
    file: { en: 'Source file', zh: '源碼檔案' },
    hardware: { en: 'Hardware', zh: '硬件' },
    bip: { en: 'Standard', zh: '標準' },
  } satisfies Record<ArtifactKind, L<string>>,

  term: {
    appearsIn: { en: 'Appears in', zh: '出現於' },
    seeAlso: { en: 'See also', zh: '相關' },
    precise: { en: 'More precisely', zh: '更精確地說' },
  },

  hero: {
    kickerLeft: {
      en: 'Satoshi Nakamoto · 2008 · explained block by block',
      zh: '中本聰 · 2008 · 逐塊拆解',
    },
    kickerRight: { en: '9 pages · 12 sections · real SHA-256', zh: '9 頁 · 12 章 · 真實 SHA-256' },
    /** The paper's title in three parts; the middle one is set in cream. */
    title: {
      en: ['Bitcoin: A Peer-to-Peer ', 'Electronic Cash', ' System'],
      zh: ['比特幣：一種點對點的', '電子現金', '系統'],
    } as L<readonly [string, string, string]>,
    lede: {
      en: 'The nine-page paper that started Bitcoin, taken apart section by section. Nothing here is a recording: every hash, signature and block on this page is computed in your browser as you read.',
      zh: '催生比特幣的九頁白皮書，逐章拆解。這裏沒有預錄的動畫：頁面上每一個哈希、每一個簽署、每一個區塊，都是你閱讀時在瀏覽器裏即場算出來的。',
    },
    start: { en: 'Start reading', zh: '開始閱讀' },
    chainLabel: {
      en: 'A chain of blocks being mined in this page with real double SHA-256.',
      zh: '本頁正以真實的雙重 SHA-256 挖出的一條區塊鏈。',
    },
    mining: {
      en: 'Mining block {height}: its hash must begin with {bits} zero bits. {tried} tries so far, {rate} a second.',
      zh: '正在挖第 {height} 號區塊：其哈希須以 {bits} 個零位元開頭。已試 {tried} 次，每秒 {rate} 次。',
    },
    found: {
      en: 'Block {height} found after {tried} tries. Checking it takes one.',
      zh: '第 {height} 號區塊找到了，共試 {tried} 次；要驗證它，一次就夠。',
    },
    pausedNote: { en: 'Mining paused.', zh: '挖礦已暫停。' },
    pause: { en: 'Pause mining', zh: '暫停挖礦' },
    resume: { en: 'Resume mining', zh: '繼續挖礦' },
    conf: { en: 'conf', zh: '確認' },
    miningShort: { en: 'mining…', zh: '挖礦中…' },
    foundShort: { en: 'found', zh: '已找到' },
  },

  appendix: {
    aKicker: { en: 'Appendix A', zh: '附錄 A' },
    aTitle: { en: 'Who builds what', zh: '誰負責甚麼' },
    aLede: {
      en: 'The paper describes roles. These are the programs and machines that fill them today. Products are named as examples only; none is a recommendation.',
      zh: '白皮書描述的是角色，下表列出今天擔當這些角色的程式與機器。產品名稱僅作舉例，並不構成任何推薦。',
    },
    colActor: { en: 'Actor', zh: '角色' },
    colWhat: { en: 'What it does', zh: '負責甚麼' },
    colCovers: { en: 'In the paper', zh: '對應白皮書' },
    colExamples: { en: 'Examples', zh: '例子' },
    colInterfaces: { en: 'Speaks', zh: '介面與協定' },

    bKicker: { en: 'Appendix B', zh: '附錄 B' },
    bTitle: { en: 'Every term', zh: '關鍵詞總表' },
    bLede: {
      en: 'All {count} terms used on this page. Press one to open its card.',
      zh: '本頁用到的全部 {count} 個關鍵詞。按任何一個，即可打開它的卡片。',
    },
    filterLabel: { en: 'Filter by category', zh: '按類別篩選' },
    all: { en: 'All', zh: '全部' },
    categories: {
      crypto: { en: 'Cryptography', zh: '密碼學' },
      money: { en: 'Coins and transactions', zh: '貨幣與交易' },
      chain: { en: 'Chain and consensus', zh: '鏈與共識' },
      network: { en: 'Network', zh: '網絡' },
      mining: { en: 'Incentive and mining', zh: '激勵與挖礦' },
      storage: { en: 'Storage and light wallets', zh: '儲存與輕量驗證' },
      privacy: { en: 'Privacy', zh: '私隱' },
      math: { en: 'Mathematics', zh: '數學' },
      engineering: { en: 'Engineering', zh: '工程' },
    } satisfies Record<TermCategory, L<string>>,

    refKicker: { en: 'References', zh: '參考文獻' },
    refTitle: { en: 'What the paper cites', zh: '白皮書引用的文獻' },
    refNote: { en: 'As printed on the last page of the paper.', zh: '依白皮書最後一頁原樣列出。' },
    aboutTitle: { en: 'Where this page gets its facts', zh: '本頁的資料來源' },
    aboutPaper: {
      en: 'The paper: Satoshi Nakamoto, “Bitcoin: A Peer-to-Peer Electronic Cash System”, 2008, as published at bitcoin.org. The English shown here is the paper’s text word for word. The Traditional Chinese is our own translation.',
      zh: '白皮書：中本聰〈Bitcoin: A Peer-to-Peer Electronic Cash System〉，2008 年，取自 bitcoin.org。本頁的英文為原文逐字收錄，繁體中文則為本站自行翻譯。',
    },
    aboutChecksum: { en: 'SHA-256 of the PDF', zh: 'PDF 檔案的 SHA-256' },
    aboutCode: {
      en: 'Source code: Bitcoin Core {tag} and the original 2009 client (tag v0.1.5), both from github.com/bitcoin/bitcoin under the MIT licence. Excerpts are verbatim. The numbered notes beside them are ours.',
      zh: '源碼：取自 github.com/bitcoin/bitcoin 的 Bitcoin Core {tag}，以及 2009 年的原始客戶端（標籤 v0.1.5），兩者均以 MIT 許可證發布。片段逐字引用，旁邊帶編號的註解則為本站所加。',
    },
    aboutCompute: {
      en: 'Everything computed on this page runs in your browser. Nothing is sent anywhere, and nothing here connects to the Bitcoin network.',
      zh: '本頁所有運算均在你的瀏覽器內進行，不會傳送任何數據，亦不會連接比特幣網絡。',
    },
    aboutAdvice: {
      en: 'This page explains how a system works. It is not financial advice.',
      zh: '本頁旨在解釋一個系統如何運作，並非財務建議。',
    },
    paperLink: { en: 'Read the original PDF', zh: '閱讀原始 PDF' },
  },

  demoKeysWarning: {
    en: 'Keys made on this page are for demonstration. Never send real funds to them.',
    zh: '本頁生成的密鑰僅供示範，切勿向其轉入真實資金。',
  },
} as const;
