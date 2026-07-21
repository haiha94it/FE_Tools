# FE — Friend: gợi ý kết bạn + lời mời đã gửi

**Cập nhật:** 2026-07-21  
**Base:** `/api/friend/` · JWT · envelope `{ success, message, data }`  
**Pattern Celery:** mô hình A — **cùng URL** start + poll `id_task` (**không** invent `/result`).  
Phần 1–10: **gợi ý kết bạn**. Phần 11+: **lời mời đã gửi** (show + thu hồi).

---

## 1. API có trên BE / test?

| Path | Code | `testcare` (OPTIONS) |
|------|------|----------------------|
| `POST /api/friend/friend-recommend/get` | Có | 403 (cần JWT — **không** 404) |
| `POST /api/friend/friend-recommend/accept` | Có | 403 (cần JWT — **không** 404) |
| `POST /api/friend/friend-recommend/remove` | Có | 403 (cần JWT — **không** 404) |

Register: `Zalo/urls.py` → `api/friend/` → `friends/urls.py`.

---

## 2. Tóm tắt UX

| Nút UI | API | Ý |
|--------|-----|---|
| Tải / làm mới gợi ý | `friend-recommend/get` | Lấy list gợi ý + lời mời từ Zalo |
| **Kết bạn** / chấp nhận gợi ý | `friend-recommend/accept` | Accept lời mời (reqsrc=41) |
| **Bỏ qua** / xóa gợi ý | `friend-recommend/remove` | Gỡ item khỏi recommend |

---

## 3. Poll Celery (chung 3 API)

```text
1) POST body start → HTTP 202, data.id_task
2) Lặp POST cùng URL + { "id_task": "<id>" }
3) task_status PENDING|PROGRESS → chờ
4) task_status SUCCESS → data.result
5) success=false / CELERY_TASK_FAILED → toast lỗi
```

**Cấm:** `GET /api/friend/friend-recommend/result` → 404.

### Envelope

**Start (202):**

```json
{
  "success": true,
  "message": "Đã nhận",
  "data": { "id_task": "celery-uuid..." }
}
```

**Poll đang chạy (202):**

```json
{
  "success": true,
  "message": "Đang xử lý",
  "data": { "task_status": "PENDING" }
}
```

**Poll xong (200):**

```json
{
  "success": true,
  "message": "Thành công",
  "data": {
    "task_status": "SUCCESS",
    "result": { }
  }
}
```

---

## 4. `POST /api/friend/friend-recommend/get`

Lấy danh sách gợi ý kết bạn / lời mời liên quan recommend.

### Start body

```json
{ "id_account": 28 }
```

| Field | Bắt buộc | |
|-------|----------|--|
| `id_account` | Có | PK ZaloAccount (owner hoặc NV được gán nick) |

### Poll body

```json
{ "id_task": "..." }
```

### `data.result` khi SUCCESS

**Mảng** item Zalo (raw). FE map hiển thị list.

Gợi ý field hay gặp (tùy Zalo, defensive parse):

| Field | Dùng cho |
|-------|----------|
| `userId` | UID Zalo người kia → **accept** truyền `fid` = giá trị này |
| `zaloName` / tên | Label |
| `avatar` | Avatar |
| `type` | BE filter nội bộ: `friend_request` = lời mời; item khác = gợi ý |

Ví dụ (minh họa):

```json
{
  "task_status": "SUCCESS",
  "result": [
    {
      "userId": "123456789",
      "zaloName": "Nguyen Van A",
      "avatar": "https://...",
      "type": "friend_request"
    }
  ]
}
```

Sau get: BE có thể sync incoming request DB nền — FE **không** cần gọi thêm.

---

## 5. `POST /api/friend/friend-recommend/accept`

Chấp nhận kết bạn từ gợi ý / lời mời recommend.

### Start body

```json
{
  "id_account": 28,
  "fid": "123456789"
}
```

| Field | Bắt buộc | |
|-------|----------|--|
| `id_account` | Có | Nick thao tác |
| `fid` | Có | **UID Zalo** người accept (`userId` từ list get) |

### Poll

```json
{ "id_task": "..." }
```

### SUCCESS

`data.result` dạng envelope Zalo OK, message kiểu *Đã chấp nhận kết bạn thành công*.  
BE cập nhật `FriendModel.relation_status = FRIEND` nếu có row.

FE: toast success → **remove item** khỏi UI list hoặc **get lại** list.

### Lỗi hay gặp

- Limit add friend → message từ Zalo / task fail  
- Nick checkpoint / proxy → resolve fail  

---

## 6. `POST /api/friend/friend-recommend/remove`

Bỏ gợi ý / xóa lời mời phía recommend.

### Start body

```json
{
  "id_account": 28,
  "fid": "123456789"
}
```

| Field | Bắt buộc | |
|-------|----------|--|
| `id_account` | Có | |
| `fid` | Có* | ID Zalo dùng remove request (cùng `userId` / fid item — **string**) |

\*View: `fid` có thể null nhưng task Zalo cần id hợp lệ — FE **luôn gửi** `fid`.

### Poll

```json
{ "id_task": "..." }
```

### SUCCESS

`data.result` Zalo OK. FE: gỡ card khỏi list local.

---

## 7. Flow UI gợi ý kết bạn

```
[Mở màn gợi ý]
  → POST get { id_account }
  → poll get
  → render data.result[]

[Kết bạn / Chấp nhận]
  → POST accept { id_account, fid: item.userId }
  → poll accept
  → success: remove card + toast

[Bỏ qua / Xóa]
  → POST remove { id_account, fid: item.userId }
  → poll remove
  → success: remove card
```

### Pseudo poll helper

```ts
async function runFriendRecommend(
  path: "get" | "accept" | "remove",
  body: Record<string, unknown>,
) {
  const start = await api.post(`/api/friend/friend-recommend/${path}`, body);
  const id_task = start.data?.id_task;
  if (!id_task) throw new Error(start.message || "Không có id_task");

  for (;;) {
    await sleep(800);
    const poll = await api.post(`/api/friend/friend-recommend/${path}`, { id_task });
    if (!poll.success) throw new Error(poll.message);
    const st = poll.data?.task_status;
    if (st === "SUCCESS") return poll.data.result;
    if (st === "PENDING" || st === "PROGRESS") continue;
    // 202 không task_status hiếm — retry
  }
}
```

---

## 8. Quyền nick

- `get_account_for_user` — manager owner **hoặc** NV được gán nick.  
- JWT bắt buộc.

---

## 9. Checklist FE

| # | Pass |
|---|------|
| R1 | 3 path đúng prefix `/api/friend/friend-recommend/...` |
| R2 | Poll **cùng URL**, body `id_task` — không `/result` |
| R3 | accept/remove: `fid` = `userId` string từ get |
| R4 | get SUCCESS: `result` là **array** |
| R5 | Disable nút khi poll; toast lỗi task |
| R6 | Sau accept/remove: cập nhật UI list |

---

## 10. Lưu ý (recommend)

- Accept = `add_friend_by_uid(..., reqsrc=41)` — khác `add-friend` thường.  
- Remove recommend = Zalo `recommendsv2/remove`.  
- Chi tiết poll vs campaign: `backend_logic_guide.md` §15.16.

---

## 11. Lời mời đã gửi — có thu hồi không?

| Path | Method | Có? | Ý |
|------|--------|-----|---|
| `/api/friend/sent-request/show` | **GET** | Có | **List** lời mời đã gửi (DB) — **không** thu hồi |
| `/api/friend/sent-request/get` | **POST** | Có | Sync list từ Zalo (Celery) |
| `/api/friend/sent-request/remove` | **POST** | **Có** | **Thu hồi** lời mời đã gửi (Celery) |

**Kết luận:** `show` chỉ đọc. Thu hồi = **`POST sent-request/remove`** với `fids` (mảng **uid** Zalo).

---

## 12. `GET /api/friend/sent-request/show`

### Query

| Param | Bắt buộc | Mặc định | |
|-------|----------|----------|--|
| `id_account` | **Có** | — | PK ZaloAccount |
| `page` | Không | 1 | DRF page |
| `number_per_page` | Không | 300 | page size |

Ví dụ: `GET /api/friend/sent-request/show?id_account=25&page=1&number_per_page=50`

### Response (paginated envelope)

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "count": 2,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": 101,
        "uid": "123456789",
        "name": "Nguyen Van A",
        "alias_name": "",
        "avatar": "https://...",
        "gender": null,
        "sdob": null,
        "relation_status": 2,
        "isBlocked": false,
        "created_at": "2026-07-20T...",
        "category_messages": []
      }
    ]
  }
}
```

| Field | Ý FE |
|-------|------|
| `id` | PK `FriendModel` (DB) — **không** dùng cho remove Zalo |
| `uid` | **UID Zalo** — dùng trong `fids` khi thu hồi |
| `name` / `avatar` | Hiển thị |
| `relation_status` | `2` = OUTGOING (đã gửi) |

Không có bản ghi → `count: 0`, `results: []` (**không** 404).

Quyền: `get_account_for_user` (owner hoặc NV gán nick).

---

## 13. `POST /api/friend/sent-request/remove` — thu hồi lời mời

Celery poll **cùng URL**.

### Start body

```json
{
  "id_account": 25,
  "fids": ["123456789", "987654321"]
}
```

| Field | Bắt buộc | |
|-------|----------|--|
| `id_account` | Có | Nick |
| `fids` | Có (mảng, không rỗng) | **UID Zalo** — lấy từ `results[].uid` của show (hoặc sync get) |

Thiếu list → `error_code: MISSING_LIST`.

### Poll body

```json
{ "id_task": "..." }
```

### SUCCESS

`data.result` = mảng per-uid:

```json
[
  { "uid": "123456789", "success": true, "message": "..." },
  { "uid": "987654321", "success": false, "message": "..." }
]
```

(Field exact theo envelope Zalo + `uid` gộp; FE check từng phần tử.)

FE: toast → **remove** row khỏi list local (hoặc gọi lại `show`).

### Một người

```json
{ "id_account": 25, "fids": ["123456789"] }
```

---

## 14. `POST /api/friend/sent-request/get` (optional sync)

Kéo list lời mời đã gửi **từ Zalo** (Celery), cập nhật DB nền. UI list chính nên dùng **`show`** (nhanh, DB).

```json
// start
{ "id_account": 25 }
// poll
{ "id_task": "..." }
```

Sau SUCCESS: refresh `GET show`.

---

## 15. Flow UI — tab “Đã gửi lời mời”

```
[Mở tab]
  → GET show?id_account=
  → render results[] (name, avatar, uid)

[Thu hồi 1 người]
  → POST remove { id_account, fids: [row.uid] }
  → poll remove
  → success: gỡ row

[Thu hồi nhiều]
  → fids: selectedUids
  → poll → refresh list

[Làm mới từ Zalo] (optional)
  → POST get { id_account } → poll
  → GET show lại
```

**Lưu ý:**  
- Thu hồi dùng **`uid`**, không dùng `id` (PK DB).  
- Khác `friend-recommend/remove` (gỡ gợi ý) và `unfriend` (hủy bạn đã là bạn).

---

## 16. Checklist — lời mời đã gửi

| # | Pass |
|---|------|
| S1 | List = `GET sent-request/show?id_account=` |
| S2 | Thu hồi = `POST sent-request/remove` + `fids: string[]` uid |
| S3 | Poll remove cùng URL + `id_task` |
| S4 | Không nhầm `fid` (recommend) vs `fids` (sent-request) |
| S5 | Empty list không lỗi UI |

---

## 17. List bạn bè — QL vs NV (cùng `id_account`)

`GET /api/friend/?id_account=<nick>&page=1&number_per_page=100`

| Actor | Hành vi **trước** | Hành vi **sau fix** |
|-------|-------------------|---------------------|
| Quản lý (owner nick) | Có list friend | Có list friend |
| Nhân viên (nick **được gán**) | **Rỗng** (bug `account__user=request.user`) | **Cùng list friend** như QL |
| NV nick **không** gán | — | 404 `ACCOUNT_NOT_FOUND` |

FE NV tạo nhóm: dùng **cùng** API + `id_account` nick assignment — không API riêng.

---

## 18. Campaign results — NV rỗng dù Zalo đã chạy

### Nguyên nhân chung

| | |
|--|--|
| Task ghi log | Một số loại: `Campaign*.user = account.user` (**owner nick** = QL) |
| List results (cũ) | NV filter `log.user_id = NV` → **rỗng** dù Zalo OK |
| Fix SSOT | `campaign_log_queryset` / statistics: list theo **`category_id`** (quyền xem kịch bản), **không** filter log.user = NV |
| Ghi log mới | add-friend / join-group / mess-member-group → `user = category.user` (chủ kịch bản) |

### Audit từng loại campaign

| Campaign | Results API | Task ghi `log.user` | Dùng `campaign_log_queryset`? | NV results sau fix |
|----------|-------------|---------------------|-------------------------------|--------------------|
| **add-friend** | `.../add-friend/category/<id>/results/` | Trước: `account.user`; **sau: category.user** | Có | OK (cả log cũ theo category) |
| **join-group** | `.../join-group/category/<id>/results/` | Trước: `account.user`; **sau: category.user** | Có | OK |
| **mess-member-group** | `.../mess-member-group/category/<id>/results/` | Trước: `account.user`; **sau: category.user** | Có | OK |
| **mess-friend** | `.../mess-friend/category/<id>/results/` | `category.user` | Có | OK (trước cũng OK nếu filter user) |
| **mess-group** | `.../mess-group/category/<id>/results/` | `category.user_id` | Có | OK |
| **mess-phone-number** | `.../mess-phone-number/category/<id>/results/` | `category.user` | Có | OK |
| **invite-group** | `.../invite-group/category/<id>/results/` | `category.user` | Có | OK |
| **invite-phone-group** | `.../invite-phone-group/category/<id>/results/` | `category.user` | Có | OK |
| **spam-link-group** | `.../spam-link-group/category/<id>/results/` | `category.user` | Có | OK |
| **mess-birthday** | `.../mess-birthday/results/` (no id in path) | `category.user` | `campaign_statistics_queryset` (theo `category__user`) | OK |

Failed-phones / failed-links: đa số `get_failed_distinct_field` theo `category_id` hoặc `campaign_log_queryset` → cùng fix.

### FE

Không đổi path. NV xem results kịch bản **mình tạo** sau deploy BE. Manager vẫn xem log kịch bản team (can_view).
