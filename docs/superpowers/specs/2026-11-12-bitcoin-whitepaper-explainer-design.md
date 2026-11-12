# Bitcoin 白皮书可视化教程 · 设计规格

- 日期：2026-11-12
- 状态：设计已获用户逐节批准（浏览器内六节全部点选「可以」，终端回复 "ok lets go"）
- 署名：Provided by Animus Laboratories

## 1. 目标

做一个网站，依据中本聪 2008 年的白皮书《Bitcoin: A Peer-to-Peer Electronic Cash System》，详尽、专业地讲清比特币的工作原理。形式参考 [Transformer Explainer](https://poloclub.github.io/transformer-explainer/)：读者不是看动画，而是亲手操作一台在浏览器里真实运行的「小比特币」。

用户原始要求与本设计的对应：

| # | 用户要求 | 落点 |
| --- | --- | --- |
| 1 | 从网上取得白皮书，拆成若干步骤并附摘要 | §3 信息架构、§4 章节版式（一句话总结 + 原文逐字收录） |
| 2 | Web App，参考 Transformer Explainer；UI 用 BoardUI 或 Arc；UX 用 transitions.dev；不要 AI 味 | §9 视觉、§10 动效、§11 技术 |
| 3 | 英文 + 繁体中文 | §8 双语（繁中采用香港用语） |
| 4 | 每个关键词可点，弹出浮动卡片；需要时带可视化 | §7 关键词系统 |
| 5 | UI/UX 要酷，尤其是区块链的动效 | §9、§10 |
| 6 | 不止理论，要有工程解释和源码一瞥（例如 P2P 协议） | §4「源碼一瞥」、§5 各图、§6 工程实现层 |
| 7 | 流程清晰易懂，同时照顾新手、感兴趣的读者和专业开发者 | §2 三档深度、§14 验收 |
| 补 | 介绍白皮书每个环节在工程上由谁实现（软/硬件钱包、RPC、矿机……） | §6 工程实现层 |

### 明确不做

- 不做暗色模式（用户指定 only C1）。
- 不做后端、账号、统计、埋点；不请求任何外部接口，不连真实比特币网络，所有链上数据要么是内嵌的公开常量（如创世区块），要么是浏览器内模拟。
- 不提供可用于真实资金的钱包功能。演示中生成的密钥是一次性的，页面上明确提示「切勿用于真实资金」。
- 只做英文和繁体中文两种语言。
- 不做 SSR / CMS；产物是纯静态文件。

## 2. 读者与三档阅读深度

全站一个深度开关，三档，保存在 `localStorage`，可用 `?depth=` 指定：

| 值 | 界面名（英 / 繁） | 面向 | 默认展开的内容 |
| --- | --- | --- | --- |
| `starter` | Starter / 入門 | 第一次接触比特币的人 | 一句话总结、类比、交互图 |
| `curious`（默认） | Curious / 進階 | 想真正弄懂机制的人 | 上述 + 正文、白皮书原文、工程上由谁实现 |
| `developer` | Developer / 開發者 | 工程师 | 全部，包括源码一瞥、白皮书 vs 今天、RPC / 字节细节 |

规则：深度只决定「默认展开」。未展开的区块收成一行可点的标题，永不隐藏。读者手动展开或收起某个区块后，该状态一直保持到下一次切换深度；切换深度时，所有区块重置为新深度的默认状态。

## 3. 信息架构

单页长卷，自上而下：

1. **顶栏**（吸顶）：品牌「₿ Bitcoin, explained · Animus Laboratories」｜链式导航｜EN / 繁 切换｜深度切换｜`⌘K` 搜索。
2. **首屏 Hero**：标题、一句话定位、用真实双重 SHA-256 实时出块的区块链、「开始阅读」按钮。
3. **全景「一筆付款的旅程」**：七站流程图（见 §6.1）。
4. **13 章**，按白皮书原顺序，归成六个部分，部分之间有整幅橙色分隔带。
5. **附录 A 工程全景表**、**附录 B 关键词总表**、**参考文献**、**致谢与许可**。

### 章节与锚点

| 区块 | 白皮书 | 锚点 id | 英文标题 | 繁中标题 | 部分 |
| --- | --- | --- | --- | --- | --- |
| #0 | Abstract | `abstract` | Abstract | 摘要 | I The Problem / 問題 |
| #1 | §1 | `introduction` | Introduction | 引言 | I |
| #2 | §2 | `transactions` | Transactions | 交易 | II Owning a Coin / 擁有一枚幣 |
| #3 | §3 | `timestamp-server` | Timestamp Server | 時間戳伺服器 | III Ordering History / 為歷史排序 |
| #4 | §4 | `proof-of-work` | Proof-of-Work | 工作量證明 | III |
| #5 | §5 | `network` | Network | 網絡 | IV Running the Network / 運行網絡 |
| #6 | §6 | `incentive` | Incentive | 激勵 | IV |
| #7 | §7 | `reclaiming-disk-space` | Reclaiming Disk Space | 回收磁碟空間 | V Making It Practical / 讓它實用 |
| #8 | §8 | `spv` | Simplified Payment Verification | 簡易支付驗證 | V |
| #9 | §9 | `combining-splitting-value` | Combining and Splitting Value | 價值的合併與分割 | V |
| #10 | §10 | `privacy` | Privacy | 私隱 | V |
| #11 | §11 | `calculations` | Calculations | 計算 | VI Is It Safe? / 它安全嗎 |
| #12 | §12 | `conclusion` | Conclusion | 結論 | VI |

其他锚点：`journey`、`engineering-map`、`glossary`、`references`。

### 链式导航

- 13 个小方块连成一条链，对应 #0–#12。已读为实心，当前章为橙色，未读为空心。
- 每个方块对应一个真实的「区块」：`hash = sha256d(prevHash ‖ sectionId ‖ nonce)`，启动时以 8 个零位元的玩具难度算好。读者第一次滚到某章时，该方块播放「挖出」动效，章首的条带显示 `BLOCK #n · prev … · nonce … · hash …`。
- 点击跳转；键盘 `J` / `K` 上下跳章；滚动时 URL hash 随当前章更新（`history.replaceState`，不污染历史记录）。
- 宽度小于 900px 时，链收成一条进度条加菜单按钮，点开是章节抽屉（含深度切换与搜索入口）。

## 4. 章节版式

13 章同一版式。桌面端两栏：左栏文字，右栏图与工程内容；小于 900px 时单栏，交互图紧跟总结。

| 区块 | 内容 | starter | curious | developer |
| --- | --- | --- | --- | --- |
| 章首 | 大号数字、标题（当前语言）、区块条带 | 显示 | 显示 | 显示 |
| 一句話總結 TL;DR | 一到两句大白话 | 展开 | 展开 | 展开 |
| 打個比方 Analogy | 一个生活类比，一小段 | 展开 | 展开 | 展开 |
| 交互圖 Figure | 本章主角。分步引导 + 自由操作 | 展开 | 展开 | 展开 |
| 正文 How it works | 3–6 段，术语可点 | 收起 | 展开 | 展开 |
| 白皮書原文 Original text | 本章英文原文逐字收录，含原图的静态重绘；繁中模式下并排显示繁中译文 | 收起 | 展开 | 展开 |
| 工程上由誰實現 Who runs this | 2–4 个角色，各配一个具体抓手 | 收起 | 展开 | 展开 |
| 源碼一瞥 In the source | Bitcoin Core 真实片段，逐行注释 | 收起 | 收起 | 展开 |
| 白皮書 vs 今天 Paper vs. today | 设想与现实的出入 | 收起 | 收起 | 展开 |
| 章尾 | 「下一章 →」 | 显示 | 显示 | 显示 |

### 交互图的统一外框 `FigureFrame`

- 标题栏：`FIG. n.m — 标题`。
- **引导模式**：`StepGuide` 显示「第 i / N 步」、一句说明和「上一步 / 下一步」；每步把图置于指定状态并高亮相关部位。
- **自由模式**：走完或跳过引导后，所有控件解锁。
- 图不在视口内或标签页不可见时暂停一切计算与动画。
- 外层有错误边界：图出错时显示一张静态说明卡，文章其余部分照常可读。
- 懒加载：每个图单独分包，进入视口前显示骨架占位。

### 源码一瞥 `SourceGlance`

- 片段来自 Bitcoin Core 固定标签 **v32.1**，逐字抓取，不凭记忆书写；标明文件路径、起止行号、GitHub 链接与 MIT 许可。
- 个别章节用选项卡对照中本聪 2009 年 v0.1 的原始代码。
- 行号、单色「印刷清单」式语法着色（自写的小型 C++ 分词器：关键字加粗、注释灰、数字橙），行级注释：点或悬停某行，在旁显示中英文说明。
- 注释文字是我们写的，必须在界面上和原始代码明确区分。

## 5. 13 个交互图

所有计算由 `src/lib` 下的纯函数完成（见 §11），图只负责展示与编排。

### #0 摘要：Hero 链 + 旅程
- Hero 链：5 个区块位，最右是正在挖的候选块；按帧分片做真实区块头挖矿，难度约 16 个零位元并限速到平均约 4 秒一块；挖到后候选块「砸入」、整条链左移一格。
- 旅程见 §6.1。

### §1 引言 `IntroTrust`
- 左右两栏对比同一笔付款：经银行记账（银行可冻结、可撤销、收手续费）与点对点直付。
- 「把一枚数字硬币花两次」：读者把同一个代币文件拖给两个收款人，两边都「收到」——在没有裁判时无人能拦。点「加一个裁判（铸币厂）」解决，但整个系统的命运系于它一身；引出「用工作量证明代替裁判」。
- 无密码学计算。

### §2 交易 `TxSignatures`
- 三个角色各有一对真实 secp256k1 密钥（可重新生成）。一枚币沿 Owner 0 → 1 → 2 → 3 依次转手：每一步对「上一笔交易的哈希 + 下一位所有者的公钥」做 SHA-256，再用当前所有者的私钥签名。
- 读者可点任何一步的「验证」，看到用上一位所有者的公钥验签通过；可篡改任一字段（收款人、上一笔哈希），验签立刻失败并抖动提示。
- 最后一步：让 Owner 1 把同一枚币再签一次给另一个人——两笔签名都有效，收款人单靠签名无法分辨谁先谁后。这就是双重支付缺口。
- 引擎：`keys.ts`（生成、签名、验签）、`hash.ts`。

### §3 时间戳服务器 `TimestampChain`
- 四个区块的哈希链，每块含几条可编辑的文字条目与上一块的哈希。
- 读者改动第 2 块的一条记录：该块哈希变化，第 3、4 块的「上一块哈希」不再匹配，依次变红断链，动画逐块传播。
- 「重新登报」按钮：把后续哈希重算一遍即可恢复——说明单有哈希链并不费力，引出下一章为什么需要工作量。
- 引擎：`hash.ts`。

### §4 工作量证明 `PowMiner`
- 一个真实结构的 80 字节区块头（版本、上一块哈希、默克尔根、时间、难度位、nonce），每个字段可悬停查看含义与字节数。
- 难度滑块：4–24 个零位元。显示期望尝试次数 `2^n`、目标值、实时哈希率。按「挖礦」后 nonce 滚动、哈希闪动，命中时前导零高亮；统计本次用了多少次并与期望值比较。
- 三块连成链：篡改第 1 块的数据后，第 1–3 块全部失效，必须依次重挖；显示累计重做的哈希次数。
- 「验证创世区块」：内嵌真实创世区块头，读者点一下，浏览器现场算出 `000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f`。
- 小附图「难度调整」：把全网算力调高或调低，看 2016 块后的目标值如何按实际用时调整（上下限 4 倍）。
- 引擎：`header.ts`、`miner.ts`、`difficulty.ts`。

### §5 网络 `NetworkSim` + `P2PHandshake`
- `NetworkSim`：约 10 个节点、随机连边的小网络，离散事件模拟。
  - 按白皮书的六个步骤引导：① 广播一笔交易，看 `inv → getdata → tx` 沿边扩散；② 各节点把它收进候选块；③ 节点按算力占比随机出块；④ 新块广播；⑤ 其他节点验证后接受；⑥ 在它之上继续挖。
  - 「制造分叉」：让两个相距较远的节点几乎同时出块，网络染成两色；下一块出现后较短的一支被放弃，演示重组。
  - 可点任一节点看它的视角：已知的链尖、内存池、收发消息日志。可随时让节点离线再上线，看它如何补齐缺失的区块。
- `P2PHandshake`：两个节点之间的时序图，逐条回放 `version → verack → …→ inv → getdata → tx`。每条消息可展开成十六进制视图：24 字节消息头（magic、command、length、checksum）与载荷分色标注，字节由 `p2p/messages.ts` 真实序列化、校验和真实计算。
- 引擎：`netsim.ts`、`p2p/messages.ts`、`rng.ts`。

### §6 激励 `IncentiveSupply`
- 高度滑块（0 到约 700 万块）：显示当前区块补贴、第几次减半、已发行总量；阶梯图 + 逼近 2100 万的供应曲线，当前高度处有游标。
- 手续费计算器：给定一笔交易的输入、输出，差额即手续费；并入区块奖励 = 补贴 + 手续费总和。
- 「贪心的攻击者」：给定算力占比，对比「诚实挖矿的期望收入」与「攻击自己付出的那笔钱」，说明白皮书的激励论证。
- 引擎：`subsidy.ts`（与 Bitcoin Core `GetBlockSubsidy` 一致的整数右移算法）。

### §7 回收磁盘空间 `MerklePrune`
- 交易列表（可增删，4–8 笔）自底向上搭出默克尔树，哈希逐层上流动画；奇数个时演示比特币的「复制最后一个」规则。
- 把若干交易标记为「已花费」后点「修剪」：整棵可剪的子树被收成一个哈希，根不变。
- 存储计算器：80 字节 × 每小时 6 块 × 24 × 365 = 约 4.2 MB / 年，可改出块间隔看结果。
- 引擎：`merkle.ts`。

### §8 简易支付验证 `SpvProof`
- 上方是只含区块头的最长链；下方是某个区块完整的默克尔树（灰显，表示轻钱包并没有它）。
- 读者选一笔交易，「向全节点索取证明」：只点亮默克尔路径上的兄弟哈希；逐步把交易哈希与兄弟哈希两两合并，最终与区块头里的默克尔根比较，相等则打钩。
- 篡改交易或任一兄弟哈希，证明失败。显示数据量对比：完整区块与一条证明（`log2(n)` 个哈希）。
- 引擎：`merkle.ts`（`merkleProof`、`verifyProof`）。

### §9 价值的合并与分割 `UtxoCombineSplit`
- 钱包里有若干面额不同的 UTXO（以大小不一的方块表示）。输入付款金额与费率，钱包自动选币（也可手动勾选）。
- 动画：选中的输入汇入一笔交易，分出两个输出：付款与找续；`输入合计 − 输出合计 = 手续费`。
- 金额不足、粉尘找续等边界情况给出明确提示。
- 引擎：`tx.ts`（`selectCoins`、`buildPayment`）。

### §10 私隐 `PrivacyLinkage`
- 白皮书的两个模型图做成可切换：传统模型（身份、交易都藏在可信第三方身后）与新模型（交易公开，身份与公钥之间断开）。
- 链上观察者视角：同一个人做 6 笔收付款。开关一「重复使用地址」，开关二「多输入合并」。观察者的关联图实时更新，显示他能把多少笔交易归到同一个人。
- 密钥、公钥、地址的真实推导链（私钥 → 公钥 → HASH160 → Bech32 地址）可逐步展开。
- 引擎：`keys.ts`、`tx.ts`。

### §11 计算 `AttackCalculator`
- 两个滑块：攻击者算力占比 `q`（0.01–0.49）与确认数 `z`（0–100）。实时显示成功概率 `P`，并用对数坐标画出 `P` 随 `z` 下降的曲线，当前点高亮。
- 旁边并排显示白皮书的 C 代码与我们的 TypeScript 移植，当前循环变量的取值随滑块变化。
- 「赛跑」：按当前 `q`、`z` 做蒙特卡洛模拟，诚实链与攻击链逐块前进的动画；跑满若干轮后给出经验成功率，与理论值对照。
- 白皮书的三张结果表由同一函数现场算出，逐项与原文一致。
- 引擎：`attack.ts`。

### §12 结论 `ConclusionMachine`
- 一张完整的机器图：钱包、交易、内存池、区块、工作量证明、网络、激励、默克尔树、轻钱包。每个部件点一下，显示一句话回顾并可跳回对应章节。
- 「你现在知道了」清单，对应 12 章各一句。

## 6. 工程实现层

### 6.1 一筆付款的旅程（`journey`）

七站横向流程，按「發送」后一枚交易令牌依次经过各站，每站停留并显示当下发生的事；点任一站跳到对应章节。

| 站 | 角色 | 做什么 | 接口 / 协议 | 对应章节 |
| --- | --- | --- | --- | --- |
| 1 | 软件钱包 | 挑选要花的币，组出未签名交易 | PSBT（BIP 174） | §2、§9 |
| 2 | 硬件钱包 | 在自己的屏幕上显示交易，用永不离开设备的私钥签名 | USB / 二维码 / microSD | §2 |
| 3 | 全节点 | 检查交易，放进内存池，转发给邻居 | RPC `sendrawtransaction` → P2P `inv` / `getdata` / `tx` | §5 |
| 4 | 矿池 | 按手续费挑交易，组出区块模板，分发任务 | `getblocktemplate` → Stratum | §5、§6、§7 |
| 5 | ASIC 矿机 | 对 80 字节区块头反复换 nonce 求哈希 | SHA-256 × 2 | §4 |
| 6 | 全网节点 | 各自验证新区块，接到工作量最大的链上 | P2P `headers` / `block` | §5、§11 |
| 7 | 轻钱包 | 收款方凭区块头与默克尔路径确认到账 | SPV；BIP 157/158 | §8、§11 |

### 6.2 每章的「工程上由誰實現」

每章 2–4 张角色卡。每张卡：角色名（英 + 繁）、在这一环节的职责（一句）、一个具体抓手。`developer` 深度下抓手可展开为可照着敲的内容。

| 章 | 角色与抓手（最终文案以抓取到的源码和文档为准） |
| --- | --- |
| §1 | 软件钱包、全节点、矿工三者的总览：没有任何一方居中 |
| §2 | 软件钱包（组交易、跟踪 UTXO；`createpsbt` / `walletprocesspsbt` / `finalizepsbt`）；硬件钱包（保管私钥并签名）；全节点（验签：`script/interpreter.cpp` + libsecp256k1） |
| §3 | 全节点（区块头里的 `nTime` 与 `hashPrevBlock`：`primitives/block.h`；时间规则）；区块浏览器 |
| §4 | ASIC 矿机；矿池（分发工作）；全节点（`pow.cpp` 的 `CheckProofOfWork` 与难度调整） |
| §5 | 全节点的 P2P 层（`net.cpp`、`net_processing.cpp`、`protocol.h`；`getpeerinfo`、`getrawmempool`）；矿池（`getblocktemplate` / `submitblock`） |
| §6 | 矿池（构造 coinbase 交易、分配收益）；全节点（`validation.cpp` 的 `GetBlockSubsidy`、coinbase 成熟期）；钱包（`estimatesmartfee`） |
| §7 | 全节点的存储（`blocks/`、`chainstate/`；`-prune`）；`consensus/merkle.cpp` |
| §8 | 轻钱包；全节点提供证明（`gettxoutproof` / `verifytxoutproof`、`merkleblock.cpp`）；Electrum 协议；BIP 37 与 BIP 157/158 |
| §9 | 软件钱包的选币（`wallet/coinselection.cpp`；`listunspent`、`fundrawtransaction`）；硬件钱包核对找续地址；全节点的 UTXO 集（`coins.cpp`） |
| §10 | HD 钱包（BIP 32 / 39 / 84，每次收款换新地址）；硬件钱包的助记词；链上分析方使用的「共同输入」启发式 |
| §11 | 商户、交易所、钱包各自设定的确认数；全节点的重组处理 |
| §12 | 全部角色的回顾，指向附录 A |

### 6.3 附录 A 工程全景表（`engineering-map`）

一张对照表：角色 × 负责白皮书的哪部分 × 现实中的例子 × 接口 / 协议。角色共七类：软件钱包、硬件钱包、全节点、矿池、ASIC 矿机、轻钱包、区块浏览器 / 交易所。产品名（Bitcoin Core、Electrum、Sparrow、Trezor、Ledger、Coldcard、btcd、CKPool、mempool.space、Esplora 等）只作举例，页面注明不构成推荐，不放购买链接。

## 7. 关键词系统

### 标记语法

正文是带轻量内联标记的字符串，由 `lib/richtext.ts` 解析：

| 语法 | 含义 |
| --- | --- |
| `[[term-id]]` | 术语，显示该术语在当前语言的默认写法 |
| `[[term-id\|显示文字]]` | 术语，自定义显示文字 |
| `{§4}` / `{§4\|文字}` | 指向章节的链接 |
| `**粗体**`、`*斜体*`、`` `代码` `` | 行内样式 |
| `[文字](https://…)` | 外部链接，新窗口打开 |

### 卡片

- 触发：术语是 `<button>`，橙色荧光笔下划线。点击或 Enter / 空格打开，Esc 或点外部关闭，焦点回到触发处。
- 桌面端用 BoardUI Popover（锚定触发词，自动避让视口边缘）；小于 640px 用底部抽屉。
- 内容：术语名（英 + 繁）、别名、一句话大白话定义；`developer` 深度下多一行精确定义；可选小图；「出现于 §…」链接；相关术语（可继续点，卡片内容原地切换）。
- 同一时间只开一张卡。

### 词表

共 94 个术语，全部中英双语，集中在 `src/glossary/terms.ts`，同时生成附录 B（按下列九个类别分组、可筛选）与 `⌘K` 搜索索引（BoardUI Command Palette，可搜术语与章节）。带「▣」的 29 个有活的小图，小图文件为 `src/glossary/visuals/<术语 id>.tsx`，按文件名自动注册。

- **密码学**：hash ▣、sha-256、double-sha256、digital-signature ▣、public-key、private-key、key-pair ▣、ecdsa、address ▣、hash160
- **货币与交易**：electronic-coin、transaction ▣、input、output、utxo ▣、change ▣、fee ▣、coinbase ▣、satoshi-unit、double-spending ▣、trusted-third-party、mint、script、txid、psbt、coin-selection、irreversibility、escrow
- **链与共识**：block ▣、block-header ▣、block-height、genesis-block、blockchain、timestamp、timestamp-server ▣、proof-of-work ▣、nonce ▣、hashcash、difficulty ▣、target、bits、zero-bits、retarget、hash-rate、longest-chain ▣、chainwork、fork ▣、stale-block、reorg、confirmation ▣、majority-attack
- **网络**：peer-to-peer ▣、node、full-node、light-client、broadcast、mempool ▣、inv、getdata、version-handshake、best-effort、compact-blocks
- **激励与挖矿**：incentive、block-subsidy、halving ▣、supply-cap、miner、mining、mining-pool ▣、asic、stratum、getblocktemplate
- **存储与轻量验证**：merkle-tree ▣、merkle-root、merkle-branch ▣、pruning、spv ▣、bloom-filter、compact-block-filters
- **私隐**：pseudonymity、address-reuse、common-input-heuristic、hd-wallet ▣、seed-phrase
- **数学**：poisson-distribution ▣、binomial-random-walk、gamblers-ruin ▣
- **工程**：wallet、software-wallet、hardware-wallet、rpc、bitcoin-core、bitcoind、bitcoin-cli

一致性规则（由测试强制）：正文里出现的每个 `[[id]]` 必须在词表中存在；词表里每个术语必须中英文齐全，且至少被一处正文或另一张卡片引用。

## 8. 双语

- 语言：`en` 与 `zh-Hant`。繁中采用**香港用语**与香港字形（`<html lang="zh-Hant-HK">`，字体 Noto Sans HK / Noto Serif HK）。
- 初始语言：`?lang=` 优先，其次 `localStorage`，再次 `navigator.languages`（任何 `zh-*` 取繁中，其余取英文）。切换即时生效，不刷新，滚动位置不变。
- 所有界面文案在 `src/content/ui.ts`，所有章节内容以 `{ en, zh }` 成对书写；测试保证没有只写了一种语言的条目。
- 白皮书原文：英文逐字取自 bitcoin.org 的 PDF（SHA-256 `b1674191a88ec5cdd733e4240a81803105dc412d6c6708d53ab94fc248f4f553`）；繁中为本项目自行翻译，界面注明「譯文僅供參考，以英文原文為準」。公式用 MathML 排版。
- 代码、哈希、RPC 名称、协议消息名不翻译。

### 繁中术语表（约束性）

| English | 繁中（香港） | English | 繁中（香港） |
| --- | --- | --- | --- |
| hash | 哈希 | digital signature | 數碼簽署 |
| public / private key | 公鑰 / 私鑰 | key pair | 密鑰對 |
| transaction | 交易 | double-spending | 雙重支付 |
| trusted third party | 可信第三方 | mint | 鑄幣廠 |
| timestamp server | 時間戳伺服器 | proof-of-work | 工作量證明 |
| nonce | 隨機數（nonce） | block / block header | 區塊 / 區塊頭 |
| node / full node | 節點 / 全節點 | light client | 輕錢包 |
| network / peer-to-peer | 網絡 / 點對點 | broadcast | 廣播 |
| CPU power / hash rate | 算力 | difficulty / target | 難度 / 目標值 |
| longest chain | 最長鏈 | fork / reorg | 分叉 / 重組 |
| confirmation | 確認 | incentive | 激勵 |
| block subsidy / reward | 區塊補貼 / 區塊獎勵 | transaction fee | 交易手續費 |
| halving | 減半 | Merkle tree / root / branch | 默克爾樹 / 根 / 分支 |
| pruning | 修剪 | disk space | 磁碟空間 |
| SPV | 簡易支付驗證 | input / output / change | 輸入 / 輸出 / 找續 |
| UTXO | 未花費輸出（UTXO） | privacy | 私隱 |
| wallet | 錢包 | software / hardware wallet | 軟件錢包 / 硬件錢包 |
| miner / mining pool / mining machine | 礦工 / 礦池 / 礦機 | mempool | 記憶池 |
| probability | 概率 | Poisson distribution | 泊松分佈 |
| binomial random walk | 二項隨機漫步 | Gambler's Ruin | 賭徒破產問題 |
| Internet | 互聯網 | online | 網上 |
| software / hardware | 軟件 / 硬件 | information / data | 資訊 / 數據 |
| memory | 記憶體 | storage | 儲存 |
| source code | 源碼 | server | 伺服器 |
| byte / bit | 位元組 / 位元 | file | 檔案 |
| default | 預設 | interface | 介面 |
| merchant | 商戶 | inflation | 通脹 |
| screen | 螢幕 | QR code | 二維碼 |

深度名称：Starter 入門、Curious 進階、Developer 開發者。

## 9. 视觉系统（C1 橙色海报）

用户在浏览器中从七个方向里选定 C1，且只要 C1。参考实现见 `.superpowers/brainstorm/…/visual-direction-v2.html` 的 `.mkP`。

### 颜色

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `--orange` | `#F7931A` | 主视觉：Hero、部分分隔带、强调、活动状态 |
| `--orange-ink` | `#B45F06` | 浅底上的橙色文字（保证对比度） |
| `--ink` | `#0B0B0B` | 文字、边框、深色面 |
| `--cream` | `#F6F3EC` | 阅读区底色 |
| `--paper` | `#FFFFFF` | 图与卡片的面 |
| `--ink-2` | `#3A342C` | 次要文字 |
| `--rule` | `#D8CFBF` | 细分隔线 |
| `--valid` | `#1E7A46` | 验证通过 |
| `--invalid` | `#C22D1F` | 验证失败、攻击者 |

状态从不只靠颜色表达：通过 / 失败同时带图标与文字。已知取舍：Hero 标题中的两个强调词按用户选定的样式使用奶油色压橙底，对比度低于 WCAG 大字标准；该处仅为装饰性强调，完整标题另有 `aria-label`。除此之外的文字都满足 AA。

### 字体（全部自托管，`@fontsource`）

| 用途 | 英文 | 繁中 |
| --- | --- | --- |
| 展示标题、数字、按钮 | Anton | Noto Sans HK 900 |
| 正文 | Newsreader（可变字体） | Noto Serif HK 400 / 700 |
| 界面小字、卡片正文 | Public Sans（可变字体） | Noto Sans HK 400 / 500 |
| 数据、标签、代码 | DM Mono | DM Mono + Noto Sans HK |

### 造型

- 直角，无圆角（BoardUI 的 `--radius-*` 全部置 0）。
- 边框粗：图与卡片 3px 黑边，分隔线 2–3px，细分隔 1px。无柔和阴影；不用渐变、玻璃拟态。
- 章首：大号橙色数字（Anton）+ 全大写标题 + 3px 下划线。
- 关键词卡片：整块黑底，橙色 Anton 标题。
- 区块造型（全站统一的 `BlockTile`）：已确认为黑底奶油字，候选块为奶油底黑框，命中瞬间反转并「砸入」；前导零用橙色。
- 版心最大 1240px；正文行宽不超过约 34em。

## 10. 动效系统

遵循 transitions.dev 的原则：只动 `transform` / `opacity`（及小幅 `filter: blur`）、逐一列出过渡属性而不用 `transition: all`、时长与缓动全部走令牌、每处都有 `prefers-reduced-motion` 降级。

### 令牌（取自 transitions.dev `_root.css`）

`--duration-stagger 40ms`、`--duration-micro 80ms`、`--duration-quick 150ms`、`--duration-fast 250ms`、`--duration-medium 350ms`、`--duration-slow 400ms`、`--duration-very-slow 500ms`；`--ease-smooth-out cubic-bezier(0.22, 1, 0.36, 1)`、`--ease-bounce cubic-bezier(0.34, 1.36, 0.64, 1)`、`--ease-in-out`、`--ease-out`、`--ease-linear`；以及其距离、缩放、模糊令牌。

### 配方映射

| 场景 | transitions.dev 配方 |
| --- | --- |
| 语言、深度的分段控件 | Tabs sliding |
| 关键词卡片弹出 | Menu dropdown（从触发点长出，开 250ms / 关 150ms） |
| 小提示 | Tooltip open/close |
| 折叠区块 | Accordion expand（grid-rows） |
| 语言切换时的文字 | Text states swap / Text swap soft |
| nonce、高度等频繁变化的数字 | Number subtle change |
| 挖到区块、概率结果等「事件」数字 | Number pop-in / Spinning counter |
| 章节进入视口 | Texts reveal（40ms 交错） |
| 验签通过 / 失败 | Success check / Error state shake |
| 图的面板切换、手机抽屉 | Panel reveal |
| 出块通知 | Toast open / close |
| 懒加载占位 | Skeleton loader and reveal |
| 「正在挖礦…」状态字 | Shimmer text |

### 区块链专属动效

- **砸入**：命中的区块 `scale(1.16) → 1`，`--ease-bounce`，450ms；随后整条链左移一格，`--ease-smooth-out`，500ms。
- **哈希闪动**：挖矿时每帧显示最新一次哈希，前导零实时高亮（差一点命中的也会闪一下）。
- **断链传播**：篡改后，失效状态沿链逐块传播，每块间隔 `--duration-micro`，配抖动。
- **网络包**：消息是沿边移动的小方块，速度与模拟延迟一致；分叉两支分别着黑与橙，被放弃的一支淡出。
- **默克尔上流**：两两合并的哈希沿连线汇入父节点。
- **减少动态效果**：以上全部退化为即时状态切换；挖矿与模拟照常运行，网络图提供「逐步」按钮代替连续动画。

发布前用 `npx transitions-agent` 做动效审计并修到合格。

## 11. 技术架构

### 选型

- React 19 + TypeScript + Vite；Tailwind CSS v4。
- **BoardUI**（MIT 免费层，CLI 把组件源码写入项目）：button、icon-button、segmented-control、slider、switch、tabs、popover、drawer、tooltip、accordion、command-palette、toast、table、badge、chip、kbd、number-field、progress、divider、skeleton、spinner。通过覆盖其语义令牌（颜色、圆角、字体、阴影）改成 C1；必要处直接改已写入项目的组件源码。运行 CLI 时设 `BOARDUI_TELEMETRY_DISABLED=1`。
- 密码学：`@noble/hashes`（SHA-256、RIPEMD-160）、`@noble/curves`（secp256k1）、`@scure/base`（Base58Check、Bech32）。
- 测试：Vitest（引擎纯函数）+ Testing Library（解析器与关键组件）。
- 不引入动画库、图表库、状态管理库。图用内联 SVG 与 CSS；状态用 React 自带能力。

没选的方案：Arc（uiarc.dev）同样可行，但 BoardUI 基于 React Aria，浮层的定位、焦点和键盘行为更扎实，令牌层更易整体换肤；Svelte + D3 与两个指定组件库都不兼容。

### 目录

```
src/
  main.tsx  App.tsx
  styles/        theme.css typography.css globals.css（BoardUI 写入）
                 poster.css（C1 令牌覆盖与全站样式）  motion.css（动效令牌与配方）
  components/
    base/        BoardUI 组件（CLI 写入）
    site/        TopBar ChainNav Hero Journey PartDivider SectionShell Collapsible
                 FigureFrame StepGuide OriginalText WhoRuns SourceGlance PaperVsToday
                 Term TermCard GlossaryIndex EngineeringMap References Footer CommandSearch
    viz/         BlockTile HashText ChainRow Arrow Counter Packet HexView MiniChart
  figures/       每章一个文件，见 §5；全部懒加载
  glossary/      terms.ts  visuals/*.tsx
  content/       ui.ts  sections/*.ts  whitepaper/{en,zh}.ts  sources.ts  actors.ts  journey.ts
  i18n/          SettingsProvider（语言、深度）  useT
  state/         useProgress（当前章、已读）  useInView
  lib/           引擎，见下
```

### 引擎模块（纯 TypeScript，不依赖 DOM，全部先写测试）

| 模块 | 对外接口 |
| --- | --- |
| `bytes.ts` | `hexToBytes` `bytesToHex` `reverseBytes` `concatBytes` `u32le` `u64le` `varInt` `utf8` |
| `hash.ts` | `sha256(b)` `sha256d(b)` `hash160(b)`，以及返回十六进制的便捷版本 |
| `header.ts` | `BlockHeader` 类型；`serializeHeader(h): Uint8Array`（80 字节）；`headerHash(h): string`（显示序）；`bitsToTarget` `targetToBits` `targetFromZeroBits(n)` `meetsTarget(hash, target)` `leadingZeroBits(hash)`；`GENESIS_HEADER` |
| `miner.ts` | `createMiner({ header, target })` → `step(maxHashes): { found, nonce, hash, tried }`；复用同一 80 字节缓冲 |
| `difficulty.ts` | `nextTarget(prevTarget, actualTimespan, targetTimespan)`，含 4 倍上下限 |
| `merkle.ts` | `merkleLevels(txids)` `merkleRoot(txids)` `merkleProof(txids, i)` `verifyProof(txid, proof, root)` `prunableSubtrees(levels, spent)` |
| `keys.ts` | `generateKeyPair()` `sign(msgHash, priv)` `verify(sig, msgHash, pub)` `pubkeyToAddress(pub, kind)` |
| `tx.ts` | 玩具交易模型：`Tx` `Utxo`；`txid(tx)` `applyTx(utxoSet, tx)` `selectCoins(utxos, amount, feeRate)` `buildPayment(...)` `fee(tx, utxoSet)` |
| `subsidy.ts` | `blockSubsidy(height): bigint`（聪）`halvingsAt(height)` `supplyAt(height): bigint` |
| `attack.ts` | `attackerSuccessProbability(q, z)`（白皮书 C 代码的逐行移植）`minConfirmations(q, pMax)` `simulateRace(q, z, rng)` |
| `p2p/messages.ts` | `encodeMessage(command, payload)`（含 magic 与校验和）`encodeVersion(...)` `encodeInv(...)`；`annotate(bytes)` 返回字段分段，供十六进制视图着色 |
| `netsim.ts` | 离散事件模拟器：`createNetwork(opts)` → `step(dt)` `broadcastTx(nodeId)` `forceBlock(nodeId)` `setOnline(nodeId, bool)` `snapshot()`；选链按累计工作量；接受注入的随机数源以便测试可重复 |
| `rng.ts` | `mulberry32(seed)` |
| `richtext.ts` | `parseRich(s): Token[]` |
| `cppHighlight.ts` | `tokenizeCpp(code): Token[][]` |

### 数据流

- `SettingsProvider` 提供语言与深度；`useT()` 取当前语言的文案。
- `App` 渲染章节列表；`SectionShell` 读取章节内容对象并按深度决定各区块初始展开状态。
- `useProgress` 用 IntersectionObserver 跟踪当前章，驱动 `ChainNav` 与 URL hash。
- 图内部自持状态；需要跨图共享的只有全站设置。

### 内容类型（节选）

```ts
type L<T> = { en: T; zh: T };
interface SectionContent {
  id: SectionId; number: number; part: 1 | 2 | 3 | 4 | 5 | 6;
  title: L<string>; tldr: L<string>; analogy: L<string>;
  body: L<string[]>;
  figure: { component: string; title: L<string>; steps: L<{ title: string; text: string }[]> };
  whoRuns: { actor: ActorId; role: L<string>; artifact: { kind: 'rpc' | 'cli' | 'p2p' | 'file' | 'hardware' | 'bip'; label: string; detail: L<string>; snippet?: string } }[];
  paperVsToday: L<string[]>;
}
```

每章的白皮书原文与源码片段各在独立文件（`content/whitepaper/<nn>-<id>.ts`、`content/sources/<nn>-<id>.ts`），与章节内容文件同名，通过 `import.meta.glob` 自动汇集，章节之间不共享索引文件。

### 部署

`vite build` 产出 `dist/`，`base: './'`，可放在任何静态托管的任意子路径下。

## 12. 内容来源与准确性

- 白皮书文本：bitcoin.org/bitcoin.pdf，记录校验和。页脚注明出处与许可；许可表述（白皮书随原始项目以 MIT 许可发布）在写入页面前须对照 bitcoin.org 的声明原文核实，核实不了就只写出处、不写许可结论。
- 源码片段：从 `github.com/bitcoin/bitcoin` 的 v32.1 标签抓取原文，记录路径与行号；v0.1 原始代码同样抓取原文。
- 「白皮書 vs 今天」与工程层的每条事实，在写入前对照抓取到的源码或官方文档核实；不确定的不写。
- 可计算的事实用测试固定（见 §14）。
- 不给出会随时间变化的数字（全网算力、币价、矿机型号参数）；必须提到量级时注明「撰写时」。

## 13. 错误处理与降级

- 图的错误边界：显示静态说明卡。
- `localStorage` 不可用：设置只保存在内存。
- 窄屏：单栏；浮动卡片改底部抽屉；网络图减少节点数。
- 减少动态效果：见 §10。
- 无 JavaScript：`<noscript>` 说明并给出白皮书 PDF 链接。
- 目标浏览器：近两年的 Chrome、Edge、Safari、Firefox（需要 `BigInt`、`IntersectionObserver`、CSS 嵌套与 `@layer`）。

## 14. 测试与验收

### 自动化

- **引擎单元测试（先写）**
  - SHA-256 标准测试向量；`sha256d`；`hash160`。
  - 创世区块头序列化为 80 字节，哈希为 `000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f`；`bitsToTarget(0x1d00ffff)` 与往返转换。
  - 默克尔：单笔交易时根等于该 txid；真实区块（区块 170 的两笔交易）的根与链上一致；奇数复制规则；任一下标的证明可验证，篡改后失败。
  - 减半：高度 0 为 50 BTC，209999 与 210000 的分界，第 64 次后为 0；总量小于 2100 万。
  - 攻击概率：与白皮书三张表逐项一致（如 `q=0.1, z=5 → 0.0009137`；`P<0.001` 时 `q=0.30 → z=24`）。
  - 难度调整的 4 倍上下限；选币；交易费用；密钥签名往返与篡改失败；地址编码的已知向量；P2P 消息头的 magic 与校验和；网络模拟在固定种子下的确定性与分叉收敛。
- **一致性测试**：文案与内容中英文齐全；正文术语都在词表中；词表术语都被引用；每章结构完整；章节锚点唯一。
- **组件测试**：`parseRich`；`Term` 的键盘开合与焦点返回；深度开关对默认展开状态的影响；语言切换。
- `tsc --noEmit` 与 `vite build` 无错误、无警告。

### 人工 / 截图检查

- 1440、820、390 三种宽度 × 中英文，逐章截图检查版式、溢出与字体。
- 纯键盘走通：导航、深度与语言切换、打开一张关键词卡片、操作每个图的主控件。
- 开启「减少动态效果」走一遍。
- 三类读者各走一遍：`starter` 只读总结、类比与图能否读懂；`curious` 正文是否连贯；`developer` 每章能否找到源码与可执行的 RPC。
- transitions-agent 动效审计达标。

### 验收标准

1. 白皮书 13 个部分全部上线，各有总结、原文、交互图。
2. 英文与繁中（香港用语）完整对等，无缺漏文案。
3. 正文术语全部可点并弹出卡片；带图的卡片可交互。
4. 每章都有「工程上由誰實現」；顶部旅程与附录 A 可用。
5. `developer` 深度下每章至少一段带出处的真实源码。
6. 上述自动化检查全部通过，截图检查无明显缺陷。

## 16. 实现后的出入（2026-11-12 记录）

实现与评审过程中，以下各点与上文不同。以这里为准。

### 版式：一个外框，框内不再套框

用户看过成品后的反馈是「div 太多，不要框套框」。此后的规则写在 `docs/authoring.md`：每个交互图只有 `FigureFrame` 这一个边框；框内用留白、小标题、1px 细线或唯一的浅色带区分；故事里的对象（区块、交易、币）是实心色块，不描边；引导步骤用左侧橙色竖条（`fig-pointed`）指向，不用描边。区块的四种状态只靠填色区分，`ghost` 状态已删除。部分分隔带里的章节入口、「下一章」入口、白皮书原图的外框也一并去掉。

### 导航

- 页内跳转改为即时到位，并在页面高度稳定前把目标保持在原位（`src/state/navigate.ts`）。平滑滚动会经过沿途所有懒加载的图，落点偏差可达数千像素，所以取消。
- 当前章节、地址栏的 hash 由页面几何实时推算；停留约 0.8 秒才算「已读」；位于附录时不高亮任何章节。
- 两栏布局的断点是 1000px，不是 900px。
- `?lang=`、`?depth=` 只对当次访问生效，不写入存储；读者在页面上做出选择后，参数会从地址栏移除。

### 动效

- 「出块通知 → Toast」没有做。找到区块时已有砸入、整链左移和状态行三重提示，再加一个浮层与「更简洁」的要求相悖。
- 「Number subtle change」的组件保留，但每帧都变的数字（nonce、尝试次数）按原意直接印出，不加动画。
- 「章节进入视口 → Texts reveal」「语言切换 → Text swap soft」已接上。
- 引导步骤条在读者浏览较高的图时吸附在顶栏下方；按「上一步 / 下一步」时，被指向的部分会滚入视野。

### 颜色与对比度

- `--color-orange-ink` 由 `#B45F06` 加深为 `#9C5106`，在白、奶油、奶油-2、浅橙底上都不低于 4.7:1。
- `--color-invalid-soft`、`--color-valid-soft` 调浅，使红、绿文字压在其上不低于 4.5:1。
- 已知例外共两处，都是装饰性的大号展示字，且同一信息另有可读文本：Hero 标题的两个强调词（奶油色压橙底，2.07:1）；每章标题旁的大号章节编号（橙色压奶油底，2.07:1，`aria-hidden`）。
- `npm run audit` 会逐章、逐步骤、按多种宽度和两种语言实测对比度、溢出和小于 11px 的文字。

### 字体

- 中文字体按 `unicode-range` 拆成三类文件：正文、拉丁字体缺少的符号、英文页首屏会出现的 16 个字。英文页首屏的中文字体下载量由约 790 kB 降到约 9 kB。
- Noto Sans HK 的来源由按地区切分的子集换成完整字体：前者不含全角标点和「着」字。
- 比特币符号、折返箭头改为图形；叉号用 ×；公式里的点乘用间隔号。这五个字符任何一款 Noto 字体都没有。

### 源码一瞥

2009 年源码与今日源码没有做成标签页切换，而是作为并列的摘录逐段列出；注解常驻显示，悬停注解时高亮对应行。

### 流程

各章由后台代理分组撰写，再由独立代理逐组评审（先对照规格，再看质量），评审意见经核实后修入。参考实现是 §4。
