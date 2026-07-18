# FE integration notes — living doc

> Spec đầy đủ: [`team-collaboration-be-fe-contract.md`](./team-collaboration-be-fe-contract.md) · chat: [`fe_chat_architecture.md`](./fe_chat_architecture.md).

---

## Chat — page 1 đầy `chat.reaction` → UI trống (không bubble)

**Triệu chứng**

- `GET /api/message/get-message?id_account=&id_conversation=&page=1` → `results[]` hầu hết `msgType: "chat.reaction"`.
- Màn chat: sidebar có hội thoại, panel tin **trắng** (không bubble).
- Nhóm hot (nhiều like/heart) hay gặp.

**Nguyên nhân**

- BE lưu **mọi** event Zalo (kể cả reaction) thành 1 row `GlobalMessageDetailsModel`, sort `-ts`.
- Page 1 = tin **mới nhất** → nếu vừa có storm reaction thì page gần 100% reaction.
- FE nếu chỉ render `webchat` / media **hoặc** không biết parse reaction → 0 bubble.
- BE có workaround yếu: nếu ≥90% reaction trên page → tăng `page_size=50` — **vẫn có thể** toàn reaction.

### Shape reaction (raw)

```json
{
  "msgType": "chat.reaction",
  "msgId": "8054989498784",
  "uidFrom": "2418207312809750583",
  "ts": "1784342974995",
  "content": "{\"rType\":5,\"rIcon\":\"/-heart\",\"rMsg\":[{\"cMsgID\":1784331990507,\"gMsgID\":8054488264158,\"msgType\":32}],\"source\":0}"
}
```

| Field | Ý nghĩa FE |
|-------|------------|
| `msgType === "chat.reaction"` | **Không** vẽ bubble timeline riêng |
| `content` (string JSON) | Parse → `rIcon`, `rType`, `rMsg[]` |
| `rMsg[].gMsgID` | `msgId` tin **gốc** bị react |
| `rMsg[].cMsgID` | `cliMsgId` tin gốc (fallback) |
| `rIcon` | Icon Zalo: `/-heart`, `/-strong`, … |
| `uidFrom` | Ai react |

### Quy tắc render (bắt buộc)

1. **Timeline bubbles** = tin “có nội dung” — **loại** `chat.reaction` khỏi list bubble.
2. **Reaction** = metadata gắn **lên tin gốc** (badge under bubble), không phải tin độc lập.
3. `chat.undo` = ẩn/đánh dấu tin gốc — cũng không phải bubble text.

```javascript
/** Tin vẽ bubble (timeline) */
const TIMELINE_MSG_TYPES = new Set([
  "webchat",
  "chat.photo",
  "chat.video.msg",
  "chat.sticker",
  "chat.voice",
  "share.file",
  "share.file.", // nếu BE có biến thể
  "chat.recommended",
  "chat.ecard",
  "sendBubbleMessage",
  "group.poll",
  // thêm type media khác khi gặp
]);

function isTimelineMessage(m) {
  if (!m?.msgType) return false;
  if (m.msgType === "chat.reaction") return false;
  if (m.msgType === "chat.undo") return false;
  // Ưu tiên whitelist; fallback: không phải reaction/undo
  return TIMELINE_MSG_TYPES.has(m.msgType) || !String(m.msgType).includes("reaction");
}

function parseContent(m) {
  let c = m.content;
  if (typeof c === "string") {
    try { c = JSON.parse(c); } catch { /* webchat plain string */ }
  }
  return c;
}

function parseReaction(m) {
  const c = parseContent(m);
  if (!c || typeof c !== "object") return null;
  const targets = Array.isArray(c.rMsg) ? c.rMsg : [];
  return {
    msgId: m.msgId,
    uidFrom: m.uidFrom,
    ts: m.ts,
    rIcon: c.rIcon || "",
    rType: c.rType,
    // map sang tin gốc
    targetMsgIds: targets.map((t) => String(t.gMsgID ?? t.gMsgId ?? "")).filter(Boolean),
    targetCliMsgIds: targets.map((t) => String(t.cMsgID ?? t.cMsgId ?? "")).filter(Boolean),
  };
}
```

### Gắn reaction vào tin gốc

```javascript
function partitionMessages(results) {
  const timeline = [];
  const reactions = [];
  for (const m of results || []) {
    if (m.msgType === "chat.reaction") reactions.push(m);
    else if (isTimelineMessage(m)) timeline.push(m);
    // undo / type lạ: xử lý riêng hoặc skip bubble
  }
  return { timeline, reactions };
}

/** reactionsByMsgId: Map<msgId, { icon: count, users: [...] }> */
function mergeReactionsOntoTimeline(timeline, reactions) {
  const byMsgId = new Map(timeline.map((m) => [String(m.msgId), { ...m, reactions: {} }]));
  const byCli = new Map(timeline.map((m) => [String(m.cliMsgId), byMsgId.get(String(m.msgId))]));

  for (const raw of reactions) {
    const r = parseReaction(raw);
    if (!r) continue;
    let target = null;
    for (const id of r.targetMsgIds) {
      if (byMsgId.has(id)) { target = byMsgId.get(id); break; }
    }
    if (!target) {
      for (const id of r.targetCliMsgIds) {
        if (byCli.has(id)) { target = byCli.get(id); break; }
      }
    }
    if (!target) continue; // tin gốc không nằm page hiện tại — bỏ hoặc giữ buffer
    const icon = r.rIcon || "reaction";
    target.reactions[icon] = (target.reactions[icon] || 0) + 1;
  }
  return [...byMsgId.values()].sort((a, b) => Number(b.ts) - Number(a.ts));
}
```

### Load chat — đủ bubble dù page reaction-heavy

```javascript
async function loadChatMessages({ id_account, id_conversation, minBubbles = 15, maxPages = 5 }) {
  let page = 1;
  let allRaw = [];
  let next = true;

  while (next && page <= maxPages) {
    const res = await api.get("/api/message/get-message", {
      params: { id_account, id_conversation, page /* page_size nếu BE hỗ trợ */ },
    });
    const data = unwrapPaginatedPayload(res.data); // { count, next, results }
    allRaw = allRaw.concat(data.results || []);
    const { timeline } = partitionMessages(allRaw);
    if (timeline.length >= minBubbles || !data.next) {
      next = false;
    } else {
      page += 1;
    }
  }

  const { timeline, reactions } = partitionMessages(allRaw);
  return mergeReactionsOntoTimeline(timeline, reactions);
}
```

| Bước | Việc |
|------|------|
| 1 | `unwrap` → `data.results` |
| 2 | Tách `chat.reaction` vs timeline |
| 3 | Nếu `timeline.length` quá ít → **fetch page 2, 3…** (đến khi đủ bubble hoặc hết `next`) |
| 4 | Gắn reaction theo `rMsg.gMsgID` === `msgId` tin gốc |
| 5 | Render bubble từ timeline; badge reaction dưới bubble |
| 6 | WS `new_global_update.message_details[]`: cùng rule — reaction không `append` bubble, chỉ update badge |

### WS realtime

```javascript
ws.on("new_global_update", (data) => {
  for (const m of data.message_details || []) {
    if (m.msgType === "chat.reaction") {
      applyOneReactionToState(m); // merge badge, không push bubble
      continue;
    }
    if (isTimelineMessage(m)) appendBubble(m);
  }
});
```

### Map icon gợi ý (Zalo)

| `rIcon` | UI |
|---------|-----|
| `/-heart` | ❤️ |
| `/-strong` | 👍 / like |
| `:>` | 😂 |
| `:o` | 😮 |
| `:-((` | 😢 |
| `:-h` | 😡 |

(Align bảng reaction WS gửi tin — contract §2.3.1.)

### Checklist FE

1. **Không** `results.map(renderBubble)` mù quáng.
2. Filter / partition `msgType === "chat.reaction"`.
3. Auto multi-page khi page 1 toàn reaction.
4. Badge reaction trên tin gốc (`gMsgID` / `msgId`).
5. Empty state chỉ khi **hết page** và timeline rỗng — không empty vì page 1 full reaction.

### BE hiện tại (tham chiếu)

- `get_message_api_view`: không exclude reaction mặc định; nếu ≥90% reaction → `page_size=50` (vẫn có thể full reaction).
- Không phụ thuộc workaround BE — FE **phải** partition + multi-page.

---

| Ngày | Ghi chú |
|------|---------|
| 2026-07-18 | Chat: `chat.reaction` flood page 1 — FE partition + multi-page + badge |
