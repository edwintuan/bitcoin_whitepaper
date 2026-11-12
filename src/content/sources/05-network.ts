import type { SectionSources } from '../types';

// Code below is copied line for line from the tagged files by scripts/excerpt.mjs.
// Do not edit it by hand; annotations are ours.
const sources: SectionSources = {
  id: 'network',
  excerpts: [
    {
      id: "message-header",
      title: { en: "The envelope around every message", zh: "每則訊息外面的信封" },
      repo: 'bitcoin/bitcoin',
      tag: "v32.1",
      path: "src/protocol.h",
      startLine: 22,
      code: `/** Message header.
 * (4) message start.
 * (12) message type.
 * (4) size.
 * (4) checksum.
 */
class CMessageHeader
{
public:
    static constexpr size_t MESSAGE_TYPE_SIZE = 12;
    static constexpr size_t MESSAGE_SIZE_SIZE = 4;
    static constexpr size_t CHECKSUM_SIZE = 4;
    static constexpr size_t MESSAGE_SIZE_OFFSET = std::tuple_size_v<MessageStartChars> + MESSAGE_TYPE_SIZE;
    static constexpr size_t CHECKSUM_OFFSET = MESSAGE_SIZE_OFFSET + MESSAGE_SIZE_SIZE;
    static constexpr size_t HEADER_SIZE = std::tuple_size_v<MessageStartChars> + MESSAGE_TYPE_SIZE + MESSAGE_SIZE_SIZE + CHECKSUM_SIZE;

    explicit CMessageHeader() = default;

    /** Construct a P2P message header from message-start characters, a message type and the size of the message.
     * @note Passing in a \`msg_type\` longer than MESSAGE_TYPE_SIZE will result in a run-time assertion error.
     */
    CMessageHeader(const MessageStartChars& pchMessageStartIn, const char* msg_type, unsigned int nMessageSizeIn);

    std::string GetMessageType() const;
    bool IsMessageTypeValid() const;

    SERIALIZE_METHODS(CMessageHeader, obj) { READWRITE(obj.pchMessageStart, obj.m_msg_type, obj.nMessageSize, obj.pchChecksum); }

    MessageStartChars pchMessageStart{};
    char m_msg_type[MESSAGE_TYPE_SIZE]{};
    uint32_t nMessageSize{std::numeric_limits<uint32_t>::max()};
    uint8_t pchChecksum[CHECKSUM_SIZE]{};
};`,
      annotations: [
        {
          lines: [22, 27],
          note: {
            en: "Four fields, 24 bytes, in front of every message on the original transport. The second scene of the figure builds exactly these bytes.",
            zh: "四個欄位，合共 24 位元組，放在原有傳輸格式的每則訊息之前。上圖第二個場景砌出來的，正是這些位元組。",
          },
        },
        {
          lines: [48, 48],
          note: {
            en: "The order on the wire: start bytes, message type, payload size, checksum. The 2009 client sent the first three and no checksum, a header of 20 bytes.",
            zh: "線路上的次序：起始位元組、訊息類型、載荷大小、校驗碼。2009 年的客戶端只發送前三項，沒有校驗碼，訊息頭只有 20 位元組。",
          },
        },
        {
          lines: [50, 50],
          note: {
            en: "The start bytes say which network the message belongs to. On the main network they are `f9 be b4 d9`, the same four bytes the 2009 client used.",
            zh: "起始位元組標明訊息屬於哪個網絡。主網用的是 `f9 be b4 d9`，與 2009 年的客戶端所用的四個位元組完全相同。",
          },
        },
        {
          lines: [51, 51],
          note: {
            en: "The message type is its name in ASCII, such as `version`, `inv` or `tx`, padded with zero bytes to twelve.",
            zh: "訊息類型即訊息的 ASCII 名稱，例如 `version`、`inv` 或 `tx`，不足十二個位元組的部分以零補足。",
          },
        },
        {
          lines: [53, 53],
          note: {
            en: "The first four bytes of the [[double-sha256|double SHA-256]] of the payload. A receiver recomputes it and skips the message if the two differ.",
            zh: "載荷經[[double-sha256|雙重 SHA-256]] 計算後的首四個位元組。接收方會重算一次，兩者不符便略過該則訊息。",
          },
        },
      ],
    },
    {
      id: "inv-today",
      title: { en: "An announcement arrives, today", zh: "今天：收到一則公告" },
      repo: 'bitcoin/bitcoin',
      tag: "v32.1",
      path: "src/net_processing.cpp",
      startLine: 4377,
      code: `            if (inv.IsMsgBlk()) {
                const bool fAlreadyHave = AlreadyHaveBlock(inv.hash);
                LogDebug(BCLog::NET, "got inv: %s %s peer=%d", inv.ToString(), fAlreadyHave ? "have" : "new", pfrom.GetId());

                UpdateBlockAvailability(pfrom.GetId(), inv.hash);
                if (!fAlreadyHave && !m_chainman.m_blockman.LoadingBlocks() && !IsBlockRequested(inv.hash)) {
                    // Headers-first is the primary method of announcement on
                    // the network. If a node fell back to sending blocks by
                    // inv, it may be for a re-org, or because we haven't
                    // completed initial headers sync. The final block hash
                    // provided should be the highest, so send a getheaders and
                    // then fetch the blocks we need to catch up.
                    best_block = &inv.hash;
                }
            } else if (inv.IsGenTxMsg()) {
                if (reject_tx_invs) {
                    LogDebug(BCLog::NET, "transaction (%s) inv sent in violation of protocol, %s", inv.hash.ToString(), pfrom.DisconnectMsg());
                    pfrom.fDisconnect = true;
                    return;
                }
                // MSG_WITNESS_TX is treated as a txid, despite only being specified for getdata.
                auto& seen_hashes{inv.IsMsgWtx() ? seen_wtxids : seen_txids};
                if (!seen_hashes.insert(inv.hash).second) continue;
                const GenTxid gtxid = ToGenTxid(inv);
                AddKnownTx(peer, inv.hash);

                if (!m_chainman.IsInitialBlockDownload()) {
                    const bool fAlreadyHave{m_txdownloadman.AddTxAnnouncement(pfrom.GetId(), gtxid, current_time)};
                    LogDebug(BCLog::NET, "got inv: %s %s peer=%d", inv.ToString(), fAlreadyHave ? "have" : "new", pfrom.GetId());
                }
            } else {
                LogDebug(BCLog::NET, "Unknown inv type \\"%s\\" received from peer=%d\\n", inv.ToString(), pfrom.GetId());
            }`,
      annotations: [
        {
          lines: [4378, 4379],
          note: {
            en: "This runs once for each entry of an [[inv]], and its first question is the one the 2009 client asked: do I already have this? Even the two words written to the log, `have` and `new`, are unchanged; compare the next excerpt.",
            zh: "[[inv]] 內每個項目都會經過這段程式，而第一個問題與 2009 年的客戶端所問的一樣：這個我有了嗎？連寫進日誌的兩個字 `have` 和 `new` 也沒有改過，可與下一段對照。",
          },
        },
        {
          lines: [4382, 4390],
          note: {
            en: "A block the node lacks is not fetched straight from the announcement. The node asks for [[block-header|headers]] first (the `getheaders` is sent a few lines below), checks the proof-of-work they carry, and only then downloads the blocks it needs.",
            zh: "節點即使沒有該區塊，也不會憑公告直接索取。它先索取[[block-header|區塊頭]]（`getheaders` 在下文數行之後發出），核對其中的工作量證明，然後才下載所需的區塊。",
          },
        },
        {
          lines: [4401, 4401],
          note: {
            en: "The node notes that this peer has the transaction, so it will not announce it back to the peer it came from.",
            zh: "節點記下這個對等節點已有該筆交易，日後便不會再向它公告同一筆交易。",
          },
        },
        {
          lines: [4403, 4406],
          note: {
            en: "`AddTxAnnouncement` records which peer offered the transaction and reports whether the node already has it. If not, a [[getdata]] for it goes out later from `SendMessages`, in the same file.",
            zh: "`AddTxAnnouncement` 記錄是哪個對等節點公告了這筆交易，並回報節點是否已有它。若沒有，稍後便由同一檔案內的 `SendMessages` 發出 [[getdata]] 索取。",
          },
        },
      ],
    },
    {
      id: "inv-getdata-2009",
      title: { en: "Announce, then fetch: the 2009 original", zh: "先公告，後索取：2009 年的原始版本" },
      repo: 'bitcoin/bitcoin',
      tag: "v0.1.5",
      path: "main.cpp",
      startLine: 1800,
      code: `    else if (strCommand == "inv")
    {
        vector<CInv> vInv;
        vRecv >> vInv;

        CTxDB txdb("r");
        foreach(const CInv& inv, vInv)
        {
            if (fShutdown)
                return true;
            pfrom->AddInventoryKnown(inv);

            bool fAlreadyHave = AlreadyHave(txdb, inv);
            printf("  got inventory: %s  %s\\n", inv.ToString().c_str(), fAlreadyHave ? "have" : "new");

            if (!fAlreadyHave)
                pfrom->AskFor(inv);
            else if (inv.type == MSG_BLOCK && mapOrphanBlocks.count(inv.hash))
                pfrom->PushMessage("getblocks", CBlockLocator(pindexBest), GetOrphanRoot(mapOrphanBlocks[inv.hash]));
        }
    }


    else if (strCommand == "getdata")
    {
        vector<CInv> vInv;
        vRecv >> vInv;

        foreach(const CInv& inv, vInv)
        {
            if (fShutdown)
                return true;
            printf("received getdata for: %s\\n", inv.ToString().c_str());

            if (inv.type == MSG_BLOCK)
            {
                // Send block from disk
                map<uint256, CBlockIndex*>::iterator mi = mapBlockIndex.find(inv.hash);
                if (mi != mapBlockIndex.end())
                {
                    //// could optimize this to send header straight from blockindex for client
                    CBlock block;
                    block.ReadFromDisk((*mi).second, !pfrom->fClient);
                    pfrom->PushMessage("block", block);
                }
            }
            else if (inv.IsKnownType())
            {
                // Send stream from relay memory
                CRITICAL_BLOCK(cs_mapRelay)
                {
                    map<CInv, CDataStream>::iterator mi = mapRelay.find(inv);
                    if (mi != mapRelay.end())
                        pfrom->PushMessage(inv.GetCommand(), (*mi).second);
                }
            }
        }
    }`,
      annotations: [
        {
          lines: [1802, 1803],
          note: {
            en: "An `inv` is read as a list of entries, each a type and a hash: the same payload the figure encodes.",
            zh: "`inv` 讀出來是一列項目，每項由類型和哈希組成，與上圖編碼的載荷格式相同。",
          },
        },
        {
          lines: [1812, 1813],
          note: {
            en: "The same check as today, and the same two words in the log: `have` or `new`.",
            zh: "與今天相同的檢查，寫進日誌的也是同樣的兩個字：`have` 或 `new`。",
          },
        },
        {
          lines: [1815, 1816],
          note: {
            en: "The whole idea in two lines: if the object is new, queue a request to the peer that announced it. `SendMessages` later sends every queued request whose time has come as one [[getdata]].",
            zh: "整個構想就在這兩行：若是新的，便把向公告者索取的請求排進隊列。稍後 `SendMessages` 會把隊列內到期的請求合成一則 [[getdata]] 發出。",
          },
        },
        {
          lines: [1834, 1845],
          note: {
            en: "The other side of the exchange. Asked for a block, the node reads it from disk and sends it whole in a `block` message.",
            zh: "交換的另一方。被索取區塊時，節點從磁碟讀出該區塊，再以一則 `block` 訊息整個發送。",
          },
        },
        {
          lines: [1846, 1855],
          note: {
            en: "Anything else, a transaction for instance, is served from `mapRelay`, a memory of what the node has recently relayed. Entries were dropped after fifteen minutes.",
            zh: "其他類型（例如交易）則從 `mapRelay` 取出，那是節點近期轉發過的內容的暫存；項目存放十五分鐘後便會清除。",
          },
        },
      ],
    },
  ],
};

export default sources;
