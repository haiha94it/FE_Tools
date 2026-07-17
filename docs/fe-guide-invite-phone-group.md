# Hướng dẫn FE — Kịch bản mời SĐT tham gia nhóm

**Chỉ FE.** BE đã chỉnh theo `campaign-invite-phone-group-logic.md`.  
**Không** trộn implement FE vào PR BE.

---

## 1. Picker nhóm chung (bắt buộc)

**Không** dùng:

- `GET /api/group/?id_account=` union nhiều nick  
- `POST /api/campaign/spam-link-group/category/all-group/` (permission spam, API cấm nền tảng)

**Dùng:**

```http
POST /api/campaign/invite-phone-group/category/all-group/
Authorization: Bearer …
Content-Type: application/json

{ "id_accounts": [21, 25], "keyword": "" }
```

| `id_accounts` | Kết quả `data` |
|---------------|----------------|
| 1 nick | Toàn bộ nhóm nick đó đã join |
| ≥ 2 nick | Chỉ **nhóm chung** (mọi nick đều trong nhóm) |
| Không chung | `data: []` |

Envelope: `{ success, message, data: GroupDetail[] }`.

Mỗi item (sau fix BE):

| Field | Ý nghĩa |
|-------|---------|
| `id` | GroupModel.id (nick đại diện) |
| `uid` | groupId Zalo local |
| `name` | Tên nhóm |
| `avt` | Avatar URL |
| `link_group` | Link mời (có thể rỗng nếu chưa sync) |
| `total_member` | Số thành viên |
| `is_joined` | true trên nick đại diện |
| `is_blocked_chat` | — |

Chọn **1** nhóm → build:

```js
const group_invite = `${group.name || ""}|${group.avt || ""}`;
// Avatar rỗng OK: "Tên nhóm|"
// FE không cần gửi link_group / group_link — BE tự resolve
```

---

## 2. Tạo / sửa kịch bản

```http
POST /api/campaign/invite-phone-group/category/
PUT  /api/campaign/invite-phone-group/category/{id}/
```

```json
{
  "name": "test",
  "delay_time": 350,
  "number_count": 20,
  "id_accounts": [21, 25],
  "phone_numbers": ["0975...", "0787..."],
  "from_time": "07:00:00",
  "to_time": "21:00:00",
  "group_invite": "Nhóm ABC|"
}
```

| Field | Bắt buộc | Ghi chú |
|-------|----------|---------|
| `group_invite` | ✅ | `name\|avatar` — **không** gửi `group_link` |
| `id_accounts` | ✅ | Mọi nick **phải** đã join nhóm (BE validate) |
| `phone_numbers` | ✅ | BE normalize `84…` |

**Lỗi mới:** `error_code: GROUP_NOT_ON_ALL_ACCOUNTS`  
→ Toast: nick chưa có nhóm / chưa sync — bỏ nick hoặc chọn nhóm all-group khác.

---

## 3. Chạy / dừng / kết quả

```http
POST .../category/start/   { "id_categories": [1], "type": "new" }
POST .../category/stop/    { "id_categories": [1] }
GET  .../category/1/
GET  .../category/1/results/?page=1&number_per_page=50
GET  .../failed-campaigns-phone-numbers/?id_category=1
```

- Poll **results** + `unwrapPaginatedPayload` — **không** `id_task`.  
- `type: "new"` = chạy lại từ đầu queue SĐT.  
- Start fail `GROUP_NOT_ON_ALL_ACCOUNTS` nếu nick rời nhóm sau khi lưu.

---

## 4. Hành vi runtime (UI copy)

- SĐT = **1 queue chung**, nick **thay phiên** mời vào **cùng** nhóm chung.  
- Nick mất group / proxy / limit → **không** nhận SĐT (số không bị “nuốt”).  
- Không còn case “Hải không có nhóm vẫn ăn nửa list SĐT”.

---

## 5. Checklist FE

- [x] Gọi `invite-phone-group/category/all-group/` khi đổi `id_accounts`  
- [x] Xóa / không gọi `invite-phone-group/.../all-group` nhầm path spam  
- [x] Xóa gọi `GET /api/group/` union cho màn này (trừ debug)  
- [x] Body create chỉ `group_invite`, không `group_link`  
- [x] Handle `GROUP_NOT_ON_ALL_ACCOUNTS`  
- [x] Start/stop/results theo resource path hiện tại  
- [x] Map `GroupDetail` (`name`/`avt`) → `group_invite = name|avt`  
- [x] Update kịch bản bằng `PUT .../category/{id}/`  

---

## 6. Spec BE đầy đủ

`BE/docs/campaign-invite-phone-group-logic.md`
