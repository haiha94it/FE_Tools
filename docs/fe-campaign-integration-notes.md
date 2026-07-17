# FE integration notes — bug fix & migrate (living doc)

> Ghi chú sửa nhanh sau deploy BE. Spec đầy đủ: [`team-collaboration-be-fe-contract.md`](./team-collaboration-be-fe-contract.md).  
> **Bổ sung section mới** bên dưới khi có thêm bug.

---

## Campaign — Hướng dẫn FE tổng hợp (mọi loại)

Tài liệu gửi FE implement màn `zalo-campaigns/*`: **kết quả log**, **start/stop**, **poll**, **unwrap envelope**.

### 1. Pattern REST chung (có kịch bản `category`)

Prefix mount: `/api/campaign/{prefix}/`

| Hành động | Method | URL |
|-----------|--------|-----|
| Danh sách kịch bản | `GET` | `/api/campaign/{prefix}/category/` |
| Chi tiết / form | `GET` | `/api/campaign/{prefix}/category/{id}/` |
| Tạo | `POST` | `/api/campaign/{prefix}/category/` |
| Sửa | `PUT` / `PATCH` | `/api/campaign/{prefix}/category/{id}/` |
| Xóa | `DELETE` | `/api/campaign/{prefix}/category/{id}/` |
| Sao chép | `POST` | `/api/campaign/{prefix}/category/{id}/copy/` |
| **Chạy mới** | `POST` | `/api/campaign/{prefix}/category/start/` |
| **Chạy tiếp** | `POST` | `/api/campaign/{prefix}/category/start/` (không `"type": "new"`) |
| Dừng | `POST` | `/api/campaign/{prefix}/category/stop/` |
| **Log kết quả** | `GET` | `/api/campaign/{prefix}/category/{id}/results/` |
| Xóa log | `DELETE` | `/api/campaign/{prefix}/category/{id}/results/` |
| Thống kê | `GET` | `/api/campaign/{prefix}/statistics/` |

**Start / stop body:**

```json
{ "id_categories": [1, 2] }
```

Chạy mới (reset queue — tuỳ loại hỗ trợ):

```json
{ "id_categories": [1], "type": "new" }
```

**Start response:** `{ "success": true, "message": "Đã bắt đầu chiến dịch", "data": true }` — **không** có `id_task` Celery.

**`status` kịch bản** (`GET .../category/{id}/`):

| Value | Ý nghĩa |
|-------|---------|
| `0` | Tạm dừng |
| `1` | Đang chạy |
| `2` | Hoàn thành |
| `3` | Bị chặn / limit |
| `4` | Chưa chạy |

### 2. Log kết quả — bắt buộc API riêng

**Không** lấy log từ `GET .../category/{id}/`. Field như `phone_numbers_running`, `list_group`, … là **hàng đợi chờ xử lý**, không phải bảng kết quả.

```
GET /api/campaign/{prefix}/category/{category_id}/results/?page=1&number_per_page=100
```

| Query | Mặc định | Ghi chú |
|-------|----------|---------|
| `page` | `1` | DRF pagination |
| `number_per_page` | `100` (hầu hết view); **add-friend = 10** | FE nên truyền `50`–`100` |

**Response envelope + phân trang:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "count": 240,
    "next": "?page=2&number_per_page=100",
    "previous": null,
    "results": [ { "id": 12, "status": 1, "...": "..." } ]
  }
}
```

**Unwrap** (`FE/src/lib/apiResponse.js`):

```js
import { unwrapPaginatedPayload } from '@/lib/apiResponse';

const res = await api.get(
  `/api/campaign/${prefix}/category/${categoryId}/results/`,
  { params: { page: 1, number_per_page: 100 } },
);
const { count, next, previous, results } = unwrapPaginatedPayload(res.data);
```

| Sai → bảng trống | Đúng |
|-------------------|------|
| `res.data.results` | `unwrapPaginatedPayload(res.data).results` |
| Log từ `GET .../category/{id}/` | `GET .../category/{id}/results/` |

**`status` dòng log** (0/1/3 — khác `status` kịch bản):

| `status` | UI |
|----------|-----|
| `1` | Thành công |
| `0` | Thất bại — đọc `status_message` |
| `3` | Limit / bị chặn |

**Poll:** Khi `category.status === 1`, refetch `results` mỗi **5–10s**. BE **không** push WebSocket kết quả campaign.

**DELETE log:**

```json
DELETE /api/campaign/{prefix}/category/{id}/results/
{ "id_results": [12, 15] }
```

**Quyền team:** Manager xem full log category; NV (`is_employee`) chỉ log do mình tạo. 403 `CATEGORY_FORBIDDEN`.

### 3. Ma trận từng loại chiến dịch

| Menu FE | Permission key | `{prefix}` | GET results | Ghi chú thêm |
|---------|----------------|------------|-------------|--------------|
| Kết bạn | `add_friend` | `add-friend` | `.../category/{id}/results/` | `failed-campaigns-phone-numbers`, `account-limit` — § dưới |
| Tham gia nhóm | `join_group` | `join-group` | `.../category/{id}/results/` | `failed-campaigns-link-group`, `account-limit` |
| Mời vào nhóm (bạn bè) | `invite_group` | `invite-group` | `.../category/{id}/results/` | `failed-campaigns-phone-numbers` |
| Mời SĐT vào nhóm | `invite_phone_group` | `invite-phone-group` | `.../category/{id}/results/` | `failed-campaigns-phone-numbers` |
| Nhắn bạn bè | `mess_friend` | `mess-friend` | `.../category/{id}/results/` | — |
| Nhắn nhóm | `mess_group` | `mess-group` | `.../category/{id}/results/` | — |
| Nhắn thành viên nhóm | `mess_member_group` | `mess-member-group` | `.../category/{id}/results/` | — |
| Nhắn SĐT | `mess_phone` | **`mess-phone-number`** | `.../category/{id}/results/` | `phone-numbers-error`, `failed-campaigns-phone-numbers`, `account-limit` |
| Chúc SN | `mess_birthday` | `mess-birthday` | **`GET .../mess-birthday/results/`** | Không có `category/{id}/results/` — §4 |
| Spam link nhóm | `spam_link_group` | `spam-link-group` | `.../category/{id}/results/` | `category/all-group/` |
| Auto inbox | `auto_inbox` | `auto-inbox` | **Không có results REST** | `start` / `stop` / `status` — §5 |

**Helper URL (copy-paste):**

```text
/api/campaign/add-friend/category/{id}/results/
/api/campaign/join-group/category/{id}/results/
/api/campaign/invite-group/category/{id}/results/
/api/campaign/invite-phone-group/category/{id}/results/
/api/campaign/mess-friend/category/{id}/results/
/api/campaign/mess-group/category/{id}/results/
/api/campaign/mess-member-group/category/{id}/results/
/api/campaign/mess-phone-number/category/{id}/results/
/api/campaign/spam-link-group/category/{id}/results/
/api/campaign/mess-birthday/results/
```

### 4. Field `results[]` theo loại (cột bảng UI)

**add-friend:** `id`, `phone_number`, `name`, `avt`, `message`, `status`, `status_message`, `created_at`, `account`

**join-group:** `id`, `link_group`, `status`, `status_message`, `created_at`, `account`

**invite-group:** `id`, `created_at`, `account`, `group_link`, `group_name`, `phone_number`, `friend_name`, `friend_avt`, `status`, `status_message`

**invite-phone-group:** `id`, `created_at`, `account`, `phone_number`, `friend_name`, `status`, `group_name`, `status_message`

**mess-friend:** `id`, `account`, `name`, `phone_number`, `content`, `images`, `thumb_url`, `status`, `status_message`, `created_at`

**mess-group:** `id`, `created_at`, `account`, `name`, `content`, `images`, `thumb_url`, `status`, `status_message`

**mess-member-group:** `id`, `created_at`, `account`, `name`, `first_message`, `content`, `images`, `status_add_friend`, `status_send_message`, `status_send_message_message`, `status_add_friend_message`, `thumb_url`, `member` (object `friend`)

**mess-phone-number:** `id`, `created_at`, `account`, `phone_number`, `name`, `content`, `images`, `status`, `status_message`, `thumb_url`

**spam-link-group:** `id`, `created_at`, `account`, `member`, `thumb_url`, `first_message`, `name_group_invite`, `message`, `images`, `status_add_friend`, `status_add_friend_message`, `status_invite_group`, `avt_group_invite`, `status_send_message`, `status_send_message_message`, `status_invite_group_message`, `status_find_info_message`

**mess-birthday** (`GET .../mess-birthday/results/`): `id`, `created_at`, `created_date`, `account`, `uid`, `category`, `account_number`, `friend_avt`, `thumb_url`, `friend_name`, `content`, `images`, `status`, `status_message`, `name`, …

### 5. Ngoại lệ: mess-birthday

- **Một kịch bản / user** — không poll theo `category_id` trên URL results.
- Log: `GET /api/campaign/mess-birthday/results/?page=1&number_per_page=100`
- Xóa log: `DELETE /api/campaign/mess-birthday/results/` + `{ "id_results": [...] }`
- Start: `POST .../mess-birthday/category/start/` hoặc `POST .../mess-birthday/category/{id}/start/`
- Chạy ngay 1 lượt: `POST /api/campaign/mess-birthday/run-now/`

### 6. Ngoại lệ: auto-inbox

Không có `category/` CRUD hay `results/`. Theo **nick**:

| Method | URL | Body / ghi chú |
|--------|-----|----------------|
| `POST` | `/api/campaign/auto-inbox/status` | `{ "id_account": 25 }` → `data: true/false` đang chạy |
| `POST` | `/api/campaign/auto-inbox/start` | `{ "id_account": 25, "type": "new" }` chạy mới; bỏ `type` = tiếp tục |
| `POST` | `/api/campaign/auto-inbox/stop` | `{ "id_account": 25 }` |
| `GET` | `/api/campaign/auto-inbox/get-script` | Script đã lưu |
| `POST` | `/api/campaign/auto-inbox/save-script` | Lưu script |

Poll: refetch `status` khi bật; không có bảng log paginated qua REST.

### 7. API phụ (failed / limit / lỗi)

Đọc query `id_category` (trừ khi ghi chú khác). Response envelope `{ success, message, data }`.

| Loại | URL đúng |
|------|----------|
| add-friend SĐT fail | `GET /api/campaign/add-friend/failed-campaigns-phone-numbers/?id_category=` |
| join-group link fail | `GET /api/campaign/join-group/failed-campaigns-link-group/?id_category=` |
| invite-group SĐT fail | `GET /api/campaign/invite-group/failed-campaigns-phone-numbers/?id_category=` |
| invite-phone-group SĐT fail | `GET /api/campaign/invite-phone-group/failed-campaigns-phone-numbers/?id_category=` |
| mess-phone SĐT fail | `GET /api/campaign/mess-phone-number/failed-campaigns-phone-numbers/?id_category=` |
| mess-phone lỗi parse SĐT | `GET /api/campaign/mess-phone-number/phone-numbers-error/?id_category=` |
| add-friend / join-group / mess-phone limit nick | `GET /api/campaign/{prefix}/account-limit/?id_category=` |
| spam-link danh sách nhóm | `GET /api/campaign/spam-link-group/category/all-group/` |

**Sai path hay gặp (404):** chèn `/category/` trước `failed-campaigns-*` — xem § add-friend bên dưới.

### 8. Flow FE chuẩn (mọi loại có `category/{id}/results/`)

```
1. POST .../category/start/     → data: true
2. GET  .../category/{id}/      → status, counters, queue fields
3. GET  .../category/{id}/results/?page=1&number_per_page=100
   → unwrapPaginatedPayload → bind results[]
4. interval 5–10s while status === 1
5. POST .../category/stop/      khi user dừng
```

### 9. Checklist FE (mọi màn campaign)

- [ ] `GET my-campaign-permissions` — ẩn menu theo permission key
- [ ] CRUD + start/stop đúng `{prefix}` (mess-phone → **`mess-phone-number`**)
- [ ] Bảng kết quả: `.../results/` + `unwrapPaginatedPayload`
- [ ] Poll khi `status === 1`; không chờ WS
- [ ] Phân trang: theo `next` / `count`
- [ ] Phân biệt `status` kịch bản vs `status` dòng log
- [ ] Không gọi `/api/friend/category/*` cho kết bạn — dùng `/api/campaign/add-friend/category/`
- [ ] mess-birthday: `GET .../mess-birthday/results/` (không `{category_id}` trên path results)
- [ ] auto-inbox: `status` / `start` / `stop` theo `id_account`

Spec chi tiết team / CRUD body: [`team-collaboration-be-fe-contract.md`](./team-collaboration-be-fe-contract.md) §5, §6, §15.

---

## Campaign kết bạn — SĐT thất bại (sai path)

**Sai (404)**

```
GET /api/campaign/add-friend/category/failed-campaigns-phone-numbers/?id_category={id}
```

**Đúng**

```
GET /api/campaign/add-friend/failed-campaigns-phone-numbers/?id_category={id}
```

`id_category` = `id` kịch bản từ `GET /api/campaign/add-friend/category/`.

**Response**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "phone_numbers_failed": ["8496...", "..."]
  }
}
```

**Verify**

- [ ] Đổi path trong service / `api.js` màn `zalo-campaigns/add-friend`
- [ ] Không chèn `/category/` trước `failed-campaigns-phone-numbers`

---

## Changelog

| Ngày | Ghi chú |
|------|---------|
| 2026-07-16 | § Campaign tổng hợp — mọi loại results / start / poll / ma trận prefix |
| 2026-07-16 | § Kết quả add-friend — gộp vào § tổng hợp |
| 2026-07-16 | § SĐT thất bại — path `failed-campaigns-phone-numbers` |