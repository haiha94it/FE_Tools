# FE — Nhãn hội thoại (`CategoryMessageModel`)

Tài liệu gọn cho FE: **chỉ** API nhãn chat (gán nhãn friend/group trong messenger).

**Cập nhật:** 2026-07-15

---

## 1. Breaking — đổi URL (bắt buộc)

| Trước (xóa / 404) | Sau (dùng) |
|-------------------|------------|
| `POST /api/campaign/message-label/category/` | `POST /api/message/category/` |
| `GET /api/campaign/message-label/category/` | `GET /api/message/category/` |
| `GET /api/campaign/message-label/category/{id}/` | `GET /api/message/category/{id}/` |
| `PUT` / `PATCH` / `DELETE` `.../campaign/message-label/category/{id}/` | Cùng method → `/api/message/category/{id}/` |
| `POST` / `DELETE` `.../campaign/message-label/category/{id}/members/` | `/api/message/category/{id}/members/` |
| `POST /api/message/category/create-or-edit` | **Không tồn tại** — xem §3 |

**Không** giữ alias path cũ dưới `/api/campaign/message-label/`.

---

## 2. Ma trận API (envelope chuẩn)

Base: `https://<host>/api/message/`

| Method | Path | Manager | NV (employee) |
|--------|------|---------|---------------|
| `GET` | `category/` | ✅ list nhãn team | ✅ list nhãn team |
| `POST` | `category/` | ✅ tạo | ❌ `NOT_MANAGER` |
| `GET` | `category/{id}/` | ✅ | ✅ |
| `PUT` / `PATCH` | `category/{id}/` | ✅ sửa | ❌ |
| `DELETE` | `category/{id}/` | ✅ xóa | ❌ |
| `POST` / `DELETE` | `category/{id}/members/` | ✅ | ✅ (nick được gán) |

**Query (optional):**

- `GET category/` · `GET category/{id}/` — `?id_account=<nick_id>` → response kèm `friend_ids` / `group_ids` theo nick.
- `GET category/{id}/?type=friend|group|both|all&id_account=<nick_id>` → chỉ membership ids (không full object nhãn).

**Response envelope:**

```json
{
  "success": true,
  "message": "...",
  "data": { }
}
```

Lỗi: `success: false`, `error_code` (vd. `NOT_MANAGER`, `NAME_EXISTS`, `CATEGORY_LIMIT`, `ACCOUNT_ID_REQUIRED`).

---

## 3. Tạo / sửa — body

**Tạo** — `POST /api/message/category/`:

```json
{
  "name": "Khách VIP",
  "color": "#465fff"
}
```

Không gửi `id_category: null` trên collection. Giới hạn **12** nhãn / manager (`CATEGORY_LIMIT`).

**Sửa** — `PATCH` hoặc `PUT /api/message/category/{id}/`:

```json
{
  "name": "Khách VIP",
  "color": "#FFEB3B"
}
```

`PUT` = thay đủ `name` + `color`; `PATCH` = một hoặc hai field.

**Ví dụ curl tạo:**

```bash
curl -X POST 'https://testcare.chotnhanh.vn/api/message/category/' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"name":"1","color":"#465fff"}'
```

**Item trong `data` (tạo / detail):**

```json
{
  "id": 7,
  "name": "1",
  "color": "#465fff",
  "friend_ids": [],
  "group_ids": []
}
```

(`friend_ids` / `group_ids` có khi gọi kèm `id_account`.)

---

## 4. Gán / gỡ thành viên

`POST` hoặc `DELETE /api/message/category/{id}/members/`:

```json
{
  "id_account": 1,
  "id_friends": [10, 11]
}
```

hoặc `"id_groups": [3]`. NV chỉ được `id_account` thuộc assignment.

---

## 5. Legacy — chỉ đọc (bundle cũ)

| Method | Path | Ghi chú |
|--------|------|---------|
| `GET` | `/api/message/category/get` | **Không envelope** — raw array hoặc `{friend_ids}` / `{group_ids}` |

Query: `type=detail` → list nhãn; `type=friend|group|conversation` + `id_category` + `id_account` → membership.

FE **mới** nên dùng `GET /api/message/category/` (có envelope). Không dùng legacy cho CRUD.

---

## 6. Checklist FE (`api.js` / service)

- [ ] Đổi mọi `campaign/message-label/category` → `message/category`
- [ ] Xóa / thay `category/create-or-edit` → `POST category/` hoặc `PATCH category/{id}/`
- [ ] Tạo: `POST` body `{ name, color }` — không `id_category`
- [ ] Sửa: `PATCH` URL có `{id}` — không body `id_category`
- [ ] Members: `.../category/{id}/members/` + `id_account`
- [ ] NV: ẩn nút tạo/sửa/xóa nhãn; vẫn cho gán/gỡ member
- [ ] Parse envelope `success` / `data` / `error_code`

---

## 7. Phân biệt với campaign category

| | Nhãn hội thoại | Kịch bản campaign (mess-friend, …) |
|--|----------------|-------------------------------------|
| App | `message` | `campaign` |
| Path | `/api/message/category/` | `/api/campaign/mess-friend/category/` … |
| Mục đích | Nhãn UI messenger | Chiến dịch gửi tin / add friend / … |

Không nhầm `message/category` với `campaign/*/category/`.