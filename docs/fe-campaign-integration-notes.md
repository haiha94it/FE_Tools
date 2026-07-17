# FE integration notes — bug fix & migrate (living doc)

> SSOT logic BE: [`BE/docs/backend_logic_guide.md`](../../BE/docs/backend_logic_guide.md) **§15** · **§15.13**.  
> Stub cũ team contract: [`team-collaboration-be-fe-contract.md`](./team-collaboration-be-fe-contract.md) (chỉ trỏ SSOT).

---

## Invite-phone-group — picker nhóm chung (cập nhật BE)

> **SSOT FE:** [`fe-guide-invite-phone-group.md`](./fe-guide-invite-phone-group.md).  
> Section cũ (all-group 404 + union `GET /api/group/`) **hết hiệu lực** sau khi BE mount route invite-phone.

### Picker nhóm

```http
POST /api/campaign/invite-phone-group/category/all-group/
{ "id_accounts": [21, 25], "keyword": "" }
```

| `id_accounts` | `data` |
|---------------|--------|
| 1 nick | Toàn bộ nhóm nick đã join |
| ≥ 2 nick | Chỉ **nhóm chung** |
| Không chung | `[]` |

Envelope: `{ success, message, data: GroupDetail[] }` — fields: `id`, `uid`, `name`, `avt`, `link_group`, `total_member`, …

**Không** dùng:

- `POST .../spam-link-group/category/all-group/` (permission spam)
- Union `GET /api/group/?id_account=` cho màn này

### Tạo / sửa

```http
POST /api/campaign/invite-phone-group/category/
PUT  /api/campaign/invite-phone-group/category/{id}/
```

Body: `group_invite = "${name}|${avt}"` — **không** gửi `group_link` (BE tự resolve).

Lỗi: `error_code: GROUP_NOT_ON_ALL_ACCOUNTS` → toast bỏ nick / chọn nhóm all-group khác.

### Start / results

- `POST .../start/` `{ id_categories, type: "new" }`
- Poll results + `unwrapPaginatedPayload` — **không** `id_task`
- Failed SĐT: `GET .../failed-campaigns-phone-numbers/?id_category=` (không chèn `/category/`)

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
