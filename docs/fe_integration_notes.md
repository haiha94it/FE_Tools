# Hướng dẫn FE — Gộp Kết bạn SĐT + Nhắn tin SĐT → `mess-phone-number`

**Trạng thái:** BE gộp + **xóa hẳn campaign add-friend** (kể cả kết quả).  
**Ngày:** 2026-07-21  
**Design:** `campaign-phone-interact-merge-design.md`  
**AS-IS cũ (tham chiếu):** `campaign-add-friend-and-mess-phone-logic.md` (lỗi thời sau ship)

---

## 0. Tóm tắt bắt buộc cho FE

| Việc | Chi tiết |
|------|----------|
| **1 màn duy nhất** | Nhắn tin / kết bạn SĐT — API chỉ còn **`/api/campaign/mess-phone-number/`** |
| **Xóa hẳn** | Mọi route, page, store, menu, API client của **`/api/campaign/add-friend/`** |
| **Không giữ** | List/detail/results/stats Excel của campaign kết bạn SĐT cũ — **không** archive, **không** dual-read |
| **Permission** | Vào màn nếu user có `mess_phone` **hoặc** `add_friend` (BE or-map lúc cutover) |
| **Không nhầm** | `POST /api/friends/add-friend` (kết bạn **UID thủ công** trong chat) **vẫn còn** — **không xóa** |

### Checklist dọn code FE (bắt buộc — đừng để dead code)

- [ ] Xóa page/route `add-friend` campaign (React Router / menu sidebar)  
- [ ] Xóa `api.addFriendCampaign*` / constants URL `.../campaign/add-friend/...`  
- [ ] Xóa redux/query keys, types, mock, i18n keys chỉ dùng campaign add-friend  
- [ ] Xóa component form/results riêng add-friend nếu không reuse được  
- [ ] Gộp menu “Kết bạn SĐT” + “Nhắn SĐT” → **1 entry** trỏ mess-phone  
- [ ] Grep toàn FE: `add-friend/category`, `ADD_FRIEND` campaign, `failed-campaigns-phone-numbers` dưới add-friend  
- [ ] Không để link 404 / feature flag “legacy add-friend”  

---

## 1. Product UX

### 1.1 Mục tiêu

- 1 kịch bản: multi-nick + list SĐT.  
- Bật **Kết bạn** và/hoặc **Nhắn tin** (≥1).  
- **Cùng 1 nick** xử lý **cùng 1 SĐT**: Find → (KB) → (tin).  
- KB fail **vẫn mess** (độc lập); hiện fail + lý do từng nhánh.

### 1.2 Mode gán nick × SĐT

| `assign_mode` | Label UI | Ý nghĩa |
|---------------|----------|---------|
| `distribute` (**default**) | **Chia SĐT cho các nick** | Mỗi SĐT **1 nick** full pipeline (KB+tin) |
| `all` | **Mọi nick × mọi SĐT** | Mỗi SĐT: **mọi nick** hợp lệ đều full pipeline |

**Không** dùng field `divide` trên form mới (BE có thể dual-write nội bộ). FE **chỉ** gửi `assign_mode`.

---

## 2. API — chỉ `mess-phone-number`

Base: `/api/campaign/mess-phone-number/`  
Auth + full feature + permission `mess_phone` **hoặc** `add_friend`.

| Method | Path | |
|--------|------|--|
| GET/POST | `category/` | List / tạo |
| GET/PUT/PATCH/DELETE | `category/<id>/` | Detail / sửa / xóa |
| POST | `category/<id>/copy/` | Copy |
| POST | `category/start/` | `{ id_categories, type?: "new" }` |
| POST | `category/stop/` | `{ id_categories }` |
| GET/DELETE | `category/<id>/results/` | Log; `?id_account=&start_time=&end_time=` |
| GET | `failed-campaigns-phone-numbers/?id_category=` | SĐT fail |
| GET | `statistics/` | Dual counters |
| GET | `account-limit/` | Nick đạt limit |

### 2.1 Đã XÓA — không gọi nữa

```text
/api/campaign/add-friend/category/
/api/campaign/add-friend/category/start/
/api/campaign/add-friend/category/stop/
/api/campaign/add-friend/category/<id>/
/api/campaign/add-friend/category/<id>/copy/
/api/campaign/add-friend/category/<id>/results/
/api/campaign/add-friend/failed-campaigns-phone-numbers/
/api/campaign/add-friend/statistics/
/api/campaign/add-friend/account-limit/
```

WS event cũ `status_category_add_friend` — **không còn**. Chỉ `status_category_mess_phone_number`.

---

## 3. Body tạo / sửa kịch bản

```json
{
  "name": "KB + nhắn SĐT Q3",
  "id_accounts": [101, 102],
  "phone_numbers": ["0901111222", "0912222333"],
  "assign_mode": "distribute",
  "add_friend": true,
  "first_messages": ["Xin chào [name], kết bạn với mình nhé"],
  "send_message": true,
  "contents": ["Chào [name]! [r] — SĐT [sdt]"],
  "type": null,
  "images": [],
  "id_video": null,
  "id_album": null,
  "split_attachment": false,
  "delay_time": 90,
  "number_count": 40,
  "from_time": "08:00:00",
  "to_time": "21:00:00"
}
```

### 3.1 Field rules

| Field | Rule |
|-------|------|
| `add_friend` | bool — default false |
| `send_message` | bool — default true (kịch bản chỉ mess) |
| **≥1** trong 2 flag | true |
| `first_messages` | Bắt buộc non-empty nếu `add_friend`; mỗi câu **≤ 135 ký tự** |
| `contents` / media | Bắt buộc nếu `send_message` (text hoặc type image/video/album) |
| `assign_mode` | `distribute` \| `all` — default `distribute` |
| `phone_numbers` | Normalize 84…; max 1000; dedup |
| `id_accounts` | Multi nick team |
| `from_time` / `to_time` | `HH:MM:SS` |
| `delay_time` / `number_count` | > 0 |

### 3.2 Chỉ kết bạn (không mess)

```json
{
  "add_friend": true,
  "send_message": false,
  "first_messages": ["Kết bạn nhé [name]"],
  "contents": [],
  "type": null
}
```

### 3.3 Chỉ nhắn (không KB)

```json
{
  "add_friend": false,
  "send_message": true,
  "first_messages": [],
  "contents": ["Xin chào [name]"]
}
```

### 3.4 Edit khi `status === 1`

- **Cho:** contents, first_messages, media, split_attachment  
- **Cấm:** id_accounts, phone_numbers, assign_mode, add_friend, send_message, delay/number/times (hoặc theo BE — nếu reject structural thì disable UI)

### 3.5 Mapping form cũ → mới

| Add-friend cũ | Mess-phone cũ | Form gộp |
|---------------|---------------|----------|
| `first_messages` | — | `first_messages` + `add_friend: true` |
| — | `contents` + media | `contents` + media + `send_message: true` |
| `divide: true` | `divide: true` | `assign_mode: "distribute"` |
| `divide: false` | `divide: false` | `assign_mode: "all"` |
| `phone_numbers`, `id_accounts` | same | same |

---

## 4. Results (log 1 row / nick × SĐT)

### 4.1 Fields quan trọng

| Field | Ý nghĩa UI |
|-------|------------|
| `created_at` | Thời điểm |
| `account` | Nick thực thi |
| `phone_number` | SĐT |
| `name`, `avt` | Snapshot Zalo |
| `first_message` | Lời KB đã gửi |
| `content`, `images`, `thumb_url` | Tin / media |
| `status_add_friend` | 1 OK · 0 lỗi · 3 limit · **2** N/A (không bật KB) |
| `status_add_friend_message` | Lý do / “Đã là bạn bè” |
| `status` | **Nhánh mess** (giữ field cũ): 1 OK · 0 lỗi · 3 limit · 2 N/A |
| `status_message` | Lý do mess |

**Bảng UI gợi ý cột:** Thời gian | Nick | SĐT | Tên | TT KB | Lý do KB | TT tin | Lý do tin | Nội dung  

### 4.2 Độc lập 2 nhánh

| KB | Mess | Ý nghĩa |
|----|------|---------|
| 1 | 1 | Cả hai OK |
| 0 | 1 | KB fail, mess OK |
| 1 | 0 | KB OK, mess fail |
| 2 | 1 | Chỉ mess (không bật KB) |
| 1 | 2 | Chỉ KB |

### 4.3 Excel client

Fetch results (multi-page) + filter time/`id_account` → sheet.  
**Không** gọi API add-friend results nữa.

---

## 5. Statistics

```http
GET /api/campaign/mess-phone-number/statistics/?id_category=10&start_time=20-07-2026&end_time=20-07-2026
```

Date: **`DD-MM-YYYY`**.

```json
{
  "add_friend_success": 0,
  "add_friend_failure": 0,
  "mess_phone_number_success": 0,
  "mess_phone_number_failure": 0,
  "total_account": 0,
  "account_count": 0,
  "account_excluded_count": 0
}
```

- KB success: `status_add_friend === 1`  
- KB failure: not 1 and not 2  
- Mess success/failure: field `status` (send) tương tự  

---

## 6. Start / Stop / WS

```json
POST .../category/start/
{ "id_categories": [1], "type": "new" }
```

```json
POST .../category/stop/
{ "id_categories": [1] }
```

WS: `status_category_mess_phone_number` → `{ id, status }` trên `campaign_{userId}`.

Status category: 0 tạm dừng · 1 chạy · 2 xong · 3 limit · 4 chưa chạy.

---

## 7. Placeholder

| Token | KB (`first_messages`) | Mess (`contents`) |
|-------|------------------------|-------------------|
| `[name]` / name | Có | Có |
| `[gender]` | Có | Có |
| `[r]` | Có (nếu BE template full) | Có |
| `[sdt]` | Không bắt buộc | Có |

---

## 8. Runtime (để FE giải thích user)

```text
1 nhịp:
  lọc nick hợp lệ
  assign_mode=distribute → zip nick×SĐT (mỗi SĐT 1 nick, full KB+tin)
  assign_mode=all → 1 SĐT × mọi nick (mỗi nick full KB+tin)
  delay giữa nhịp (number_count)
```

Find SĐT fail → không KB, không mess; log fail.  
KB fail → log lý do → **vẫn mess** nếu bật.

---

## 9. Deploy / cutover

1. Ship BE gộp + **xóa** route add-friend.  
2. Ship FE **cùng lúc**: dọn add-friend + form gộp.  
3. User tạo lại kịch bản trên màn mới (data add-friend DB **xóa** — không đọc lại).  
4. Smoke: chỉ KB · chỉ mess · cả hai · distribute · all.

---

## 10. FAQ

**Q: Kết quả campaign kết bạn cũ?**  
A: **Xóa** — không giữ API/UI/history campaign add-friend.

**Q: Menu “Kết bạn” trong chat theo UID?**  
A: **Giữ** — `friends/add-friend`, không phải campaign.

**Q: `divide` còn gửi không?**  
A: Form mới chỉ `assign_mode`. Không gửi `divide` (trừ BE còn accept tạm — FE không dùng).

---

*FE dọn sạch add-friend campaign; chỉ mess-phone gộp.*
