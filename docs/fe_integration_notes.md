# FE integration notes — living doc

> Chat payload: [`fe_chat_architecture.md`](./fe_chat_architecture.md) · contract team: [`team-collaboration-be-fe-contract.md`](./team-collaboration-be-fe-contract.md).

---

## Chat — WS `chat.undo` (thu hồi tin): **không xóa bubble**

### Triệu chứng

- Gửi tin → WS `webchat` hiện bubble.
- Người gửi (hoặc mình) **thu hồi** trên Zalo → FE **xóa mất** bubble.
- **F5** `get-message` → tin gốc **vẫn còn** trong `results`.

→ FE xử lý undo **sai** so với BE (BE **không** xóa tin gốc).

### BE có cần sửa?

| | |
|--|--|
| Hiện tại | Listener ghi thêm 1 row `msgType: "chat.undo"`; **không** xóa / soft-delete tin gốc |
| F5 hiện tin | Đúng theo DB |
| WS | Đẩy `chat.undo` trong `new_global_update.message_details[]` |
| Sửa BE? | **Không bắt buộc** cho case “đừng mất tin trên UI”. Muốn F5 = “đã thu hồi” thì sau này BE flag tin gốc — **chưa có** |

**Product chốt (theo yêu cầu):** realtime **không** xóa tin khi nhận undo; giữ bubble (hoặc đổi text “Tin đã thu hồi”) — khớp hướng “không bị mất”.

---

### WS frame thu hồi (log thật testcare)

Gửi tin `"5"`:

```json
{
  "type": "new_global_update",
  "message_details": [{
    "msgId": "8055261175080",
    "cliMsgId": "1784347474557",
    "msgType": "webchat",
    "content": "5",
    "id_account": 25,
    "conversation_id": 2808
  }]
}
```

(Echo outbound còn frame `uidFrom: "0"`, `msgId`/`cliMsgId` có thể trùng client.)

**Thu hồi** (~5s sau):

```json
{
  "type": "new_global_update",
  "conversations": [{ "id": 2808, "account": 25, "...": "..." }],
  "message_details": [{
    "actionId": "13596876859289",
    "msgId": "8055261444694",
    "cliMsgId": "1784347478130",
    "msgType": "chat.undo",
    "uidFrom": "0",
    "idTo": "3617497249381594260",
    "dName": "Hải Chốt Nhanh",
    "ts": "1784347478996",
    "content": {
      "globalMsgId": 8055261175080,
      "cliMsgId": 1784347474557,
      "deleteMsg": 0,
      "srcId": 0,
      "destId": 3617497249381594260
    },
    "id_account": 25,
    "conversation_id": 2808
  }],
  "account": { "id": 25, "uid": "...", "status": true }
}
```

| Field | Ý nghĩa |
|-------|---------|
| `msgType === "chat.undo"` | Event thu hồi — **không** phải bubble chat |
| `content.globalMsgId` | **`msgId` tin gốc** bị thu hồi (`8055261175080`) |
| `content.cliMsgId` | **`cliMsgId` tin gốc** (`1784347474557`) |
| `msgId` / `cliMsgId` (ngoài content) | Id **của event undo** — **không** dùng để xóa bubble |
| `deleteMsg` | `0` trong log — FE **đừng** hard-delete chỉ vì thấy undo |
| `id_account` | Chỉ apply khi = nick đang mở sidebar |

Frame tương tự lặp cho nick khác trong group (`account: 21`, `uidFrom` ≠ `"0"`) — **filter `id_account`**.

---

### FE sai (hay gặp)

```javascript
// ❌ Xóa bubble bằng msgId của frame undo
if (m.msgType === "chat.undo") {
  removeMessage(m.msgId); // 8055261444694 — sai target
}

// ❌ Xóa luôn tin gốc
if (m.msgType === "chat.undo") {
  removeMessage(content.globalMsgId); // mất bubble → lệch F5
}
```

### FE đúng

```javascript
function applyUndoEvent(m, selectedAccountId) {
  if (m.msgType !== "chat.undo") return;
  if (m.id_account != null && Number(m.id_account) !== Number(selectedAccountId)) {
    return; // frame nick khác
  }

  const c = typeof m.content === "string"
    ? (() => { try { return JSON.parse(m.content); } catch { return null; } })()
    : m.content;
  if (!c) return;

  const targetMsgId = c.globalMsgId != null ? String(c.globalMsgId) : null;
  const targetCliId = c.cliMsgId != null ? String(c.cliMsgId) : null;

  // Tìm tin gốc trong state (không xóa)
  setMessages((prev) =>
    prev.map((msg) => {
      const hit =
        (targetMsgId && String(msg.msgId) === targetMsgId) ||
        (targetCliId && String(msg.cliMsgId) === targetCliId);
      if (!hit) return msg;
      // Giữ bubble: đánh dấu thu hồi (UI) — F5 vẫn có raw webchat
      return {
        ...msg,
        recalled: true,
        // optional: content hiển thị
        // displayText: "Tin nhắn đã được thu hồi",
      };
    })
  );

  // Không push chat.undo vào list bubble timeline
}

ws.on("new_global_update", (data) => {
  for (const m of data.message_details || []) {
    if (m.msgType === "chat.undo") {
      applyUndoEvent(m, selectedAccountId);
      continue;
    }
    if (m.msgType === "chat.reaction") {
      // badge only — xem mục reaction
      continue;
    }
    // append webchat / media ...
  }
});
```

**Render bubble:**

```javascript
if (msg.recalled) {
  return <Bubble muted>Tin nhắn đã được thu hồi</Bubble>;
}
// else normal content
```

Nếu product muốn **y hệt F5** (vẫn hiện chữ `"5"`): **bỏ qua** `chat.undo` hoàn toàn (no-op) — không xóa, không mark.

---

### Checklist FE

1. Nhận `msgType === "chat.undo"` trong `new_global_update.message_details`.
2. Target tin gốc = `content.globalMsgId` / `content.cliMsgId` — **không** dùng `m.msgId` của undo.
3. **Không** `filter`/`splice` xóa tin gốc khỏi state.
4. `recalled: true` hoặc no-op — khớp “không mất tin”.
5. Filter `id_account === selectedAccountId`.
6. Không append undo như bubble text.

### BE (tham chiếu)

- Không xóa row tin gốc khi ingest undo.
- `get-message` vẫn trả `webchat` gốc → F5 còn tin.
- Muốn REST cũng “đã thu hồi”: cần flag/update tin gốc khi ingest `chat.undo` (feature sau).

---

## Chat — `chat.reaction` / multi-nick (tóm tắt)

- `chat.reaction`: không bubble; badge theo `rMsg[].gMsgID`.
- WS merge list: `conversations[].account === selectedAccountId`.

---

| Ngày | Ghi chú |
|------|---------|
| 2026-07-18 | `chat.undo` — FE không xóa bubble; map `globalMsgId` |
