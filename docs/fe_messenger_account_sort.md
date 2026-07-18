# FE design — Sắp xếp nick messenger theo tin mới nhất

> **Trạng thái:** đã implement (FE)  
> **Phạm vi:** cột tài khoản Zalo trên `/zalo-messages`  
> **Liên quan:** `docs/fe_integration_notes.md` (WS multi-nick), store `use-zalo-messenger-store`

---

## 1. Mục tiêu product

Khi manager / sale mở messenger với **nhiều nick**:

1. Nick **vừa có tin mới nhất** → **lên đầu** danh sách nick.
2. Nick tin mới thứ 2 → vị trí 2, thứ 3 → vị trí 3, …
3. Áp dụng cho **cả hai** ngữ cảnh:
   - **Realtime (WS)** khi đang mở app;
   - **Load lại trang / F5 / vào lại** `/zalo-messages` (REST bootstrap) — **không** chỉ sort khi WS.
4. Nick đang ghim (`pinning`) vẫn ưu tiên trên (nếu product giữ pin).
5. **Không** vì sắp xếp nick realtime mà:
   - load lại full REST accounts / conversations / messages mỗi tin;
   - kẹt vòng “cứ load nick hoài, không ra cuộc trò chuyện”.
6. List **hội thoại** đã sort theo tin mới (giữ nguyên — ngoài scope).

---

## 2. Hiện trạng FE (baseline)

| Hạng mục | Hành vi hiện tại |
|----------|------------------|
| Lần đầu / F5 | REST: `fetchAccounts` → `sortMessengerAccounts` (pin + `updated_time`) |
| Sort khi fetch | Đã sort theo `updated_time` **nếu** BE trả field đúng “lúc nick có tin mới” |
| WS tin mới | `mergeAccountBadge` chỉ set `new_message` — **không** bump `updated_time`, **không** re-sort |
| WS hội thoại | `mergeConversations` + sort list conv (đã OK) |
| WS tin đang mở | `appendLiveMessages` |

**Hệ quả:**

- Realtime: nick **không** nhảy lên đầu cho đến khi F5 (nếu BE có `updated_time` tốt).
- F5: thứ tự **phụ thuộc BE** — nếu `GET /api/account/?scope=messenger` không phản ánh tin mới nhất / nick, FE sort sai dù có `sortMessengerAccounts`.

---

## 3. Logic đề xuất (sau duyệt)

Hai đường **cùng một sort key** (pin → activity time DESC → id):

| Đường | Khi nào | Nguồn `activity` |
|-------|---------|------------------|
| **A. Bootstrap / F5** | `fetchAccounts` xong | Field REST trên từng nick (`updated_time` hoặc field BE mới — xem §3.0) |
| **B. Realtime WS** | `new_global_update` | Bump `updated_time` local từ `message_details[].ts` / conv `updated_time`, rồi sort memory |

```
[ F5 / vào messenger ]
        │
        ▼
  GET accounts (REST)
        │
        ▼
  sortMessengerAccounts(accounts)   ← nick tin mới nhất lên đầu
        │
        ▼
  UI list nick

[ WS new_global_update ]  (app đang mở)
        │
        ├── mergeConversations / appendLiveMessages (như hiện tại)
        └── mergeAccountActivity → bump updated_time + sort  ← nick nhảy realtime
```

### 3.0. Bootstrap / F5 — yêu cầu dữ liệu

FE **bắt buộc** sau `listAccounts()`:

```ts
set({ accounts: sortMessengerAccounts(rawAccounts) });
```

(đã có — giữ và kiểm tra field sort đúng nghĩa “tin mới nhất”.)

**Field sort trên REST (chọn 1):**

| Option | Ý nghĩa | Ai làm |
|--------|---------|--------|
| **A (ưu tiên)** | BE đảm bảo `updated_time` (hoặc `last_message_at`) trên account = thời điểm tin/activity mới nhất của nick | **BE** bump khi ingest tin; FE chỉ sort |
| **B** | FE sau list accounts gọi thêm API/aggregate — **không khuyến nghị** (nặng, N+1) | Tránh |

→ **Load lại trang đúng thứ tự = chủ yếu BE trả đúng activity time + FE sort.**  
→ **Realtime khi không F5 = chỉ FE (WS).**

Nếu sau F5 thứ tự vẫn sai: kiểm tra BE `GET /api/account/?scope=messenger` có cập nhật time khi nick nhận tin không — đó là **ticket BE**, không phải FE “quên sort”.

### 3.1. Nguồn sự kiện realtime (WS)

```
new_global_update
  ├─ account.id
  ├─ message_details[]
  └─ conversations[]
```

**Không** poll REST list account mỗi tin.

### 3.2. Quy tắc cập nhật activity nick (WS)

Với mỗi frame WS hợp lệ (`account.id` xác định):

1. `activityTs` = max từ `message_details[].ts`, rồi `conversations[].updated_time`, fallback `Date.now()` nếu chỉ badge.
2. Patch:

```ts
accounts = accounts.map((a) =>
  a.id === accountId
    ? {
        ...a,
        new_message: badgeStatus,
        updated_time: maxTime(a.updated_time, activityTs), // reuse field, đồng bộ sort F5
      }
    : a,
);
```

3. **Re-sort in-memory** (cùng key với F5):

```
1. pinning === true trước
2. updated_time DESC  (tin / activity mới nhất trên)
3. id DESC (ổn định)
```

4. **Không** unselect nick đang mở; **không** `switchAccount` / `fetchConversations` / `fetchMessages` vì sort.

### 3.3. Những gì **không** làm (tránh lag / loop)

| Không | Lý do |
|-------|--------|
| `fetchAccounts()` **mỗi tin WS** | Thừa; F5 mới REST 1 lần |
| Bỏ sort lúc `fetchAccounts` | **Bắt buộc** sort khi load/F5 |
| `switchAccount` vì nick nhảy vị trí | Gây reload conv + có thể reset chat |
| `fetchConversations` / `fetchMessages` vì re-sort nick | Không liên quan; WS đã merge conv + append tin |
| Re-render 3 cột full layout | Chỉ cột account cần re-render (subscribe slice `accounts`) |

### 3.4. Sơ đồ

```
[WS new_global_update]
        │
        ▼
  resolve accountId + activityTs
        │
        ├── mergeConversations (như hiện tại, nếu có conv)
        ├── appendLiveMessages (nếu đúng nick + chat đang mở)
        └── touchAccountActivity(accountId, ts, hasUnread)
                 │
                 ▼
           sortMessengerAccounts(accounts)   // O(n log n), n = số nick
                 │
                 ▼
           set({ accounts })                 // 1 setState, không REST
```

---

## 4. Hiệu năng — có nặng không?

### 4.1. Độ phức tạp

| Tham số | Thực tế Care |
|---------|----------------|
| Số nick / user | Thường **vài chục**, hiếm > 100 |
| Sort mỗi frame | `O(n log n)` với n nhỏ → **rất nhẹ** (µs–ms) |
| Payload | Chỉ patch 1 nick + sort mảng reference |

**Kết luận:** re-sort nick **không** đáng kể so với render bubble / list hội thoại.

### 4.2. Storm tin (nhiều tin liên tục)

| Rủi ro | Mức | Giảm thiểu |
|--------|-----|------------|
| Gọi REST accounts lặp | **Không** (design cấm) | Chỉ memory sort |
| Sort quá nhiều lần/giây | Thấp–TB | Optional: **throttle 100–200ms** gộp nhiều WS rồi sort 1 lần |
| Không ra được list hội thoại | **Không** nếu không gọi `switchAccount` | UI 3 cột độc lập; sort nick không chặn fetch conv |
| Re-render list nick | TB | Cột account chỉ subscribe `accounts`; conversation/chat cache giữ nguyên |

### 4.3. Trả lời thẳng câu hỏi user

> “Có tin nhắn nhiều thì nó cứ load nick hoài mà không ra cuộc trò chuyện không?”

**Không** — nếu implement đúng design này:

- Không “load nick” REST lặp.
- Không hủy / block `fetchConversations`.
- Chỉ **đổi thứ tự mảng nick** trong Zustand.

Lag khi tin nhiều (nếu có) vẫn chủ yếu từ **append tin + render chat / sort list hội thoại**, không từ sort nick.

---

## 5. Edge cases

| Case | Xử lý |
|------|--------|
| Frame nick B khi đang xem nick A | Vẫn touch + re-sort list nick (A vẫn selected; B nhảy lên nếu tin mới hơn) |
| Frame thiếu `account.id` | Bỏ qua sort nick (đã có rule anti-ghost) |
| Chỉ reaction / undo | Có thể vẫn touch activity (tin “sống”) **hoặc** chỉ touch khi `msgType` timeline — **chờ product chốt** (mặc định đề xuất: **mọi message_details có ts** đều touch) |
| Nick pin | Luôn trên cùng nhóm pin; trong nhóm pin vẫn sort theo activity |
| Checkpoint / nick offline | Giữ filter `checkpoint === false` như hiện tại |
| F5 / vào lại | REST `fetchAccounts` + sort theo `updated_time` BE (đồng bộ lâu dài) |

---

## 6. Thay đổi code dự kiến (sau duyệt — chưa làm)

| File | Việc |
|------|------|
| `types/zalo-messenger.ts` | Optional: document reuse `updated_time` hoặc thêm `last_activity_at` FE-only |
| `lib/zalo-messenger-utils.ts` | `touchMessengerAccountActivity` + `sortMessengerAccounts` dùng field activity |
| `stores/use-zalo-messenger-store.ts` | `mergeAccountActivity(accountId, { ts, hasUnread })` — patch + sort |
| `hooks/use-messenger-ws.ts` | Gọi `mergeAccountActivity` thay (hoặc mở rộng) `mergeAccountBadge` |
| UI | Không đổi layout; list nick tự reorder |

**Không** đụng `selectConversation` / `fetchMessages` / multi-page reaction.

### 6.1. Pseudocode

```javascript
function onNewGlobalUpdate(data) {
  const accountId = data.account?.id;
  // ... mergeConversations / appendLiveMessages như hiện tại ...

  if (accountId == null) return;

  const ts = maxTs(data.message_details, data.conversations) ?? Date.now();
  const hasUnread = Boolean(data.account?.status);

  useZaloMessengerStore.getState().mergeAccountActivity(accountId, {
    ts,
    hasUnread,
  });
}

// store
mergeAccountActivity(accountId, { ts, hasUnread }) {
  set((state) => {
    const accounts = sortMessengerAccounts(
      state.accounts.map((a) =>
        a.id === accountId
          ? {
              ...a,
              new_message: hasUnread,
              updated_time: maxTime(a.updated_time, ts),
            }
          : a,
      ),
    );
    return { accounts };
  });
}
```

Optional throttle:

```javascript
// gộp WS trong 150ms → 1 lần sort
scheduleAccountResort();
```

---

## 7. Checklist nghiệm thu (khi implement)

### Realtime (WS)
- [ ] 2+ nick: tin nick B → B lên trên A (cùng nhóm pin/unpinned)
- [ ] Đang mở chat nick A: tin nick B **không** reload conv/message của A
- [ ] Network: **0** REST account/conv/message **chỉ vì** re-sort WS
- [ ] Storm tin: UI nick reorder mượt; chat đang mở vẫn append bubble

### Load / F5
- [ ] F5 `/zalo-messages`: nick có tin mới nhất vẫn **trên đầu** (sau `fetchAccounts` + sort)
- [ ] Vào lại app sau khi có tin lúc offline: thứ tự khớp activity (phụ thuộc BE field)
- [ ] Pin: pin trên cùng; trong nhóm unpinned sort theo tin mới

### Hội thoại
- [ ] Không regression: conv vẫn lên trên khi có tin (logic cũ)

---

## 8. BE vs FE (tóm tắt)

| Nhu cầu | FE | BE |
|---------|----|----|
| Sort nick khi **đang chat** (WS) | **Bắt buộc** bump + sort | Không bắt buộc |
| Sort nick khi **F5 / load lại** | Sort sau `listAccounts` | **Cần** field activity đúng (`updated_time` / `last_message_at` phản ánh tin mới nhất) |
| List hội thoại lên đầu | Đã có | — |

Nếu F5 sai thứ tự → verify BE account list, không chỉ đổ lỗi FE.

---

## 9. Quyết định chờ duyệt

| # | Câu hỏi | Đề xuất |
|---|---------|---------|
| A | Field sort | Reuse `updated_time` (WS bump + REST) |
| B | Reaction/undo đẩy nick? | Có |
| C | Throttle WS sort? | 150ms |
| D | Pin cứng trên? | Có |
| E | F5 + WS đều sort? | **Có** (đã chốt product) |

**Sau approve:** implement §6 + đảm bảo `fetchAccounts` luôn `sortMessengerAccounts`.

---

| Ngày | Ghi chú |
|------|---------|
| 2026-07-18 | Draft design sort nick theo tin mới — chờ duyệt |
| 2026-07-18 | Bổ sung: F5/load trang cũng sort theo tin mới nhất (không chỉ WS) |
| 2026-07-18 | Implement: `mergeAccountActivity` + throttle 150ms WS; `fetchAccounts` sort pin + `updated_time` |
