# FE integration notes — bug fix & migrate (living doc)

> Spec đầy đủ: [`team-collaboration-be-fe-contract.md`](./team-collaboration-be-fe-contract.md).  
> Chat realtime handler: contract **§2.3.2**.

---

## Invite-phone-group — `category/all-group/` **404 (không tồn tại)**

**Triệu chứng:** màn `/zalo-campaigns/phone-number-invite-group` gọi:

```http
POST /api/campaign/invite-phone-group/category/all-group/
Content-Type: application/json

{ "id_accounts": [25], "keyword": "" }
```

→ **404** / route không mount.

### Kết luận BE (SSOT `campaign/urls.py`)

| Path | Có? | Dùng cho |
|------|-----|----------|
| `POST /api/campaign/spam-link-group/category/all-group/` | ✅ | **Chỉ** spam link nhóm — picker nhóm **chung** nhiều nick |
| `POST /api/campaign/invite-phone-group/category/all-group/` | ❌ **Không có** | — |
| `POST /api/campaign/invite-group/category/all-group/` | ❌ **Không có** | — |
| `GET /api/group/?id_account=` | ✅ | List nhóm 1 nick (picker invite-phone / invite-group) |

Route invite-phone-group **chỉ** có:

```text
GET|POST  /api/campaign/invite-phone-group/category/
POST      /api/campaign/invite-phone-group/category/start/
POST      /api/campaign/invite-phone-group/category/stop/
GET|PUT|PATCH|DELETE  /api/campaign/invite-phone-group/category/{id}/
POST      /api/campaign/invite-phone-group/category/{id}/copy/
GET|DELETE /api/campaign/invite-phone-group/category/{id}/results/
GET       /api/campaign/invite-phone-group/failed-campaigns-phone-numbers/?id_category=
GET       /api/campaign/invite-phone-group/statistics/
```

### FE phải làm (màn mời SĐT vào nhóm)

**1. Picker nhóm** — **không** copy API spam-link. Dùng groups:

```http
GET /api/group/?id_account=25&page=1&number_per_page=50
```

- Query bắt buộc: `id_account` (một nick).
- Lọc tên: `?name=keyword` (không body `keyword` kiểu spam).
- Multi nick: gọi **lặp** theo từng `id_account` đã chọn (hoặc union FE).
- Envelope: `data.results[]` (paginated) — `unwrapPaginatedPayload`.

**2. Tạo / sửa kịch bản** — field nhóm là chuỗi `group_invite = "{name}|{avatar}"` (không gửi `id` nhóm trên collection):

```http
POST /api/campaign/invite-phone-group/category/
Content-Type: application/json

{
  "name": "Mời SĐT test",
  "id_accounts": [25],
  "group_invite": "Tên nhóm|https://avatar-url...",
  "phone_numbers": ["0964456370"],
  "delay_time": 60,
  "number_count": 1,
  "from_time": "07:00:00",
  "to_time": "21:00:00"
}
```

| Field | Bắt buộc | Ghi chú |
|-------|----------|---------|
| `name` | ✅ | Tên kịch bản |
| `id_accounts` | ✅ | Nick chạy |
| `group_invite` | ✅ | `name\|avatar` từ item list group (`global_profile.name` + `avatar`) |
| `phone_numbers` | ✅ | Mảng SĐT |
| `delay_time`, `number_count`, `from_time`, `to_time` | — | Có default BE |

**3. Khi nào dùng `spam-link-group/.../all-group/`**

Chỉ màn **spam link nhóm** (`spam_link_group`):

```http
POST /api/campaign/spam-link-group/category/all-group/
{ "id_accounts": [25, 26], "keyword": "" }
```

Trả nhóm **chung** mọi nick trong `id_accounts` (intersection). Permission key: `spam_link_group` — **không** dùng cho invite-phone.

### Checklist FE

1. Grep `invite-phone-group/category/all-group` → xóa / đổi sang `GET /api/group/`.
2. Build `group_invite` = `` `${group.name}|${group.avatar}` `` (field đúng serializer group).
3. Start/stop/results theo contract §5.7 (`invite-phone-group`).
4. Failed SĐT: `GET /api/campaign/invite-phone-group/failed-campaigns-phone-numbers/?id_category=` — **không** chèn `/category/` trước `failed-campaigns-*`.

---

## Group members — picker hiện **uid** thay vì tên (send-mess-member-gr)

**Triệu chứng UI:** list “Chọn thành viên” chỉ hiện số Zalo (`6871946…`, avatar chữ số).

**API:**

```http
POST /api/group/get-member          → { id_task }
POST /api/group/get-member/result   → body { "id_task": "..." }
```

### Envelope poll (unwrap 2 lớp)

```json
{
  "success": true,
  "message": "Thành công",
  "data": {
    "task_status": "SUCCESS",
    "result": {
      "success": true,
      "message": "OK",
      "group_name": "...",
      "total_member": 3,
      "data": [ /* members[] */ ]
    }
  }
}
```

```javascript
const poll = unwrapApiData(res.data);           // data
if (poll.task_status !== "SUCCESS") { /* PENDING / FAILURE */ return; }
const payload = poll.result;                    // zalo envelope
const members = payload?.data ?? [];            // list
// group_name = payload.group_name
// total_member = payload.total_member
```

**Không** đọc `res.data.data` như list trực tiếp — list nằm ở `data.result.data`.

### Shape từng member (sau fix BE 2026-07-17)

```json
{
  "id": 87770,
  "friend": {
    "id": 72442,
    "uid": "7517650037771897331",
    "name": "Mobi",
    "avatar": "https://..."
  },
  "is_admin": false,
  "is_creator": false
}
```

| Field | Ý nghĩa FE |
|-------|------------|
| `id` | `GlobalGroupMembershipModel.id` — **không** dùng làm friend id campaign |
| `friend.id` | `FriendModel.id` — chọn thành viên gửi tin / queue campaign |
| `friend.uid` | Zalo uid — fallback hiển thị / key Zalo |
| `friend.name` | **Label UI** (alias ưu tiên, rồi tên Zalo) |
| `friend.avatar` | URL avatar |
| `friend: null` | Member **không** có row Friend trên nick (thường = nick mình / creator) |
| `is_admin` / `is_creator` | Badge admin / chủ nhóm |

**Payload cũ (bug FE hay gặp):** `friend` = `FriendSerializer` `__all__` — chỉ có `uid`, `alias_name`, `global_profile` = **string globalId**, **không** có `name`/`avatar` → UI hiện uid. BE đã đổi sang `FriendDetailSimpleSerializer`.

### Cách render list (copy)

```javascript
function memberLabel(row) {
  const f = row?.friend;
  if (!f) {
    if (row?.is_creator) return "Tôi (chủ nhóm)";
    if (row?.is_admin) return "Admin";
    return "Thành viên";
  }
  return f.name || f.alias_name || f.uid || `Friend #${f.id}`;
}

function memberAvatar(row) {
  return row?.friend?.avatar || null; // null → avatar chữ cái từ label
}

function memberSelectValue(row) {
  // Campaign mess-member-group / invite: dùng FriendModel.id
  return row?.friend?.id ?? null;
}

// Filter search
members.filter((m) => {
  const q = keyword.trim().toLowerCase();
  if (!q) return true;
  const label = memberLabel(m).toLowerCase();
  const uid = String(m?.friend?.uid ?? "");
  return label.includes(q) || uid.includes(q);
});

// Bỏ member không chọn được (friend null) khỏi multi-select tin nhắn
const selectable = members.filter((m) => m.friend?.id != null);
```

### Flow FE chuẩn (màn quét thành viên)

```
1. POST /api/group/get-member
   body: { "id_account": 25, "id_group": 123 }
   → data.id_task

2. Poll POST /api/group/get-member/result
   body: { "id_task": "..." }
   until task_status === "SUCCESS" | "FAILURE"

3. members = data.result.data
   label = friend.name || friend.uid
   value chọn = friend.id

4. (Tuỳ chọn cache DB, không quét Zalo lại)
   POST /api/group/get-member/show
   body: { "id_group": 123 }  // hoặc type: "basic"
```

### Checklist FE

1. Unwrap: `poll.result.data` không phải `poll.data`.
2. Label: **`friend.name`** (sau deploy BE); fallback `alias_name` → `uid`.
3. Value campaign: **`friend.id`**, không `membership.id`, không chỉ `uid` string nếu API campaign cần Friend PK.
4. `friend === null`: không crash; ẩn hoặc label “Tôi / Admin”.
5. Avatar: `friend.avatar`; không parse `global_profile` string như URL.
6. Deploy BE: `MemberGroupSerializer` + `get_group_member_task` (group `select_related`).

---

| Ngày | Ghi chú |
|------|---------|
| 2026-07-17 | Invite-phone: không có `all-group` — dùng `GET /api/group/` |
| 2026-07-17 | get-member: friend name/avatar + FE unwrap `result.data` |
