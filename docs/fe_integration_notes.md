# FE integration notes — living doc

> Spec đầy đủ: [`team-collaboration-be-fe-contract.md`](./team-collaboration-be-fe-contract.md) · chat: [`fe_chat_architecture.md`](./fe_chat_architecture.md).

---

## Register — danh sách chờ kích hoạt mail + kích hoạt hộ

### Hiện trạng (sau fix BE 2026-07-18)

| Nhu cầu | API | Ghi chú |
|---------|-----|---------|
| List đăng ký **chưa** bấm mail | `GET /api/register/activations` | `Activation.user is null` |
| Kích hoạt **hộ** KH | `POST /api/register/activations/activate` | **Mới** |
| KH tự kích hoạt (link mail) | `GET /api/register/activate?token=<uuid>` | Public — không dùng màn sale |

**Vì sao FE trước không thấy list:**

1. Quyền cũ chỉ `IsDeveloper` — admin/sale thường **403**.
2. Đã đổi → **`IsAdminOrSaler`** (admin / saler / sale_manager).
3. Serializer list **không** trả `password` / `token`.

Model: `register.Activation` — pending = `user` null; đã kích hoạt = `user` trỏ `UserAccount`.

### 1. List chờ kích hoạt

```http
GET /api/register/activations?page=1&number_per_page=50&keyword=
Authorization: Bearer <admin|saler JWT>
```

| Query | Mặc định | Ý nghĩa |
|-------|----------|---------|
| `page` | 1 | Phân trang DRF |
| `number_per_page` | 50 | Page size |
| `keyword` | — | Lọc `fullname` / `username` / `phone_number` / `mail` |
| `excel` | — | truthy → full list (không page) trong `data.results` |

**Response (paginated envelope):**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "count": 12,
    "next": "...",
    "previous": null,
    "results": [
      {
        "id": 101,
        "username": "khach01",
        "mail": "a@gmail.com",
        "fullname": "Nguyễn A",
        "phone_number": null,
        "facebook_link": "",
        "created_at": "2026-07-18T08:00:00",
        "system_domain": "care.chotnhanh.vn",
        "is_zalovideo": false,
        "is_pro": false
      }
    ]
  }
}
```

Rỗng: `count=0`, `results=[]` — **không** 404.

### 2. Nút kích hoạt hộ

```http
POST /api/register/activations/activate
Authorization: Bearer <admin|saler JWT>
Content-Type: application/json

{ "id": 101 }
```

Hoặc: `{ "username": "khach01" }` (chỉ bản pending).

**Success:**

```json
{
  "success": true,
  "message": "Đã kích hoạt tài khoản giúp khách",
  "data": {
    "activation_id": 101,
    "user_id": 55,
    "username": "khach01",
    "mail": "a@gmail.com",
    "fullname": "Nguyễn A",
    "expiration_date": "2031-07-18T..."
  }
}
```

| `error_code` | Khi |
|--------------|-----|
| `ACTIVATION_REQUIRED` | Thiếu `id` và `username` |
| `ACTIVATION_NOT_FOUND` | 404 |
| `ALREADY_ACTIVATED` | Đã có `user` |
| `USERNAME_EXISTS` | User trùng username (lệch data) |

**Không** trả JWT khách — KH đăng nhập bằng username/password đã đăng ký.

Entitlement = cùng luồng click mail (CARE: 5 năm, manager, `employee_limit=999`, …).

### 3. FE màn gợi ý

```
1. GET /api/register/activations → bảng chờ kích hoạt
2. Hàng: username, mail, fullname, created_at
3. Nút "Kích hoạt" → POST .../activations/activate { id }
4. Success → toast + refetch list (row biến mất vì user đã gán)
5. Role: admin / saler — JWT staff, không dùng JWT manager thường
```

### Checklist FE

- [ ] Gọi đúng path `activations` (không nhầm `register/get` = `RegisterModel` mua gói)
- [ ] Staff role đủ `IsAdminOrSaler`
- [ ] Unwrap paginated `data.results`
- [ ] Nút kích hoạt → `POST activations/activate`
- [ ] Không expect `password` / `token` trên list

---

## Chat — hội thoại “lạ” / leak thread nick khác (`Hội thoại #5339`)

**Triệu chứng:** Sidebar/panel nick A hiện thread (title `Hội thoại #id`); app Zalo nick A không có. F5 list đôi khi hết.

### Case xác nhận (testcare)

| | |
|--|--|
| Conv 5339 | pair nick **27** (user 1) ↔ Nguyễn Long |
| Nick 26 | user 6 — **không** trong pair; chỉ **bạn** Long |
| Khác user | 26 = user 6 · 27 = user 1 |

### Bug BE (đã fix)

`account_has_access_to_global_conversation` cũ: nick không thuộc pair nhưng `FriendModel` trỏ a/b → cho mở tin.  
**Đúng:** `self_gid ∈ {a,b}` rồi mới check Friend peer.

### FE

WS `new_global_update`: chỉ merge khi `conversations[].account === selectedAccountId`.

---

## Chat — page 1 đầy `chat.reaction` → UI trống

**Nguyên nhân:** BE lưu reaction như message; page 1 sort `-ts` → full `chat.reaction`.

### Quy tắc FE

1. **Không** vẽ bubble cho `msgType === "chat.reaction"`.
2. Gắn badge lên tin gốc qua `content.rMsg[].gMsgID` = `msgId` gốc.
3. Page reaction-heavy → fetch thêm page đến khi đủ bubble timeline.
4. WS: reaction chỉ update badge, không `append` bubble.

```javascript
function isTimelineMessage(m) {
  if (!m?.msgType) return false;
  if (m.msgType === "chat.reaction" || m.msgType === "chat.undo") return false;
  return true;
}

function parseReaction(m) {
  let c = m.content;
  if (typeof c === "string") {
    try { c = JSON.parse(c); } catch { return null; }
  }
  const targets = Array.isArray(c?.rMsg) ? c.rMsg : [];
  return {
    rIcon: c?.rIcon || "",
    targetMsgIds: targets.map((t) => String(t.gMsgID ?? "")).filter(Boolean),
  };
}
```

| `rIcon` | UI |
|---------|-----|
| `/-heart` | ❤️ |
| `/-strong` | 👍 |

---

| Ngày | Ghi chú |
|------|---------|
| 2026-07-18 | Reaction flood page 1 |
| 2026-07-18 | Leak conv / access friend pair |
| 2026-07-18 | Activation list + admin activate-for-user |
