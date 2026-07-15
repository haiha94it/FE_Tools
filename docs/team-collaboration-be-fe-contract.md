# Hợp đồng API — Team collaboration (Manager + Nhân viên)

Tài liệu chuẩn để FE chỉnh UI/flow theo hệ thống **manager + nhân viên** dùng chung nick Zalo, phân quyền chiến dịch, audit người gửi tin.

**Source of truth BE:**

| File | Vai trò |
|------|---------|
| `BE/users/urls.py` | **SSOT route** — mount `/api/users/` |
| `BE/users/views/team_permissions.py` | Gán nick + campaign permission |
| `BE/users/views/employee.py` | CRUD nhân viên (`get-employees`, `create-employee`, …) |
| `BE/users/views/auth.py` | `GET me` |
| `BE/account/access.py` | Phạm vi nick (`get_accessible_accounts`) |
| `BE/campaign/access.py` | Quyền kịch bản + log |
| `BE/campaign/serializers.py` | `CategoryTeamListMixin` → `is_mine`, `created_by` |
| `BE/message/chat_payload.py` | Field `sent_by` REST/WS |
| `BE/message/label_access.py` | Nhãn chat manager CRUD / NV gán-gỡ |
| `BE/docs/backend_logic_guide.md` | §15 logic nghiệp vụ |
| `BE/friends/views/basic_views.py` | Danh bạ bạn bè (`GET /api/friend/`, `POST fetchs`) |
| `BE/friends/serializers.py` | `FriendDetailSerializer`, `FriendSimpleSerializer` |
| `BE/account/urls.py` | SSOT route `/api/account/` |
| `BE/friends/urls.py` | SSOT route `/api/friend/` |
| `BE/groups/urls.py` | SSOT route `/api/group/` |
| `BE/campaign/urls.py` | SSOT route `/api/campaign/` |
| `BE/groups/views/basic_views.py` | Nhóm Zalo — access layer **một phần** |
| `BE/message/urls.py` | SSOT route `/api/message/` |
| `BE/message/views/basic_views.py` | Chat REST — conversations, tin nhắn, note/pin |
| `BE/message/views/legacy_views.py` | Alias legacy (không envelope) |
| `BE/message/handlers.py` | WS gửi tin + `sent_by` attribution |

**Kết quả audit URL (2026-07):** mount `BE/Zalo/urls.py` — **không có path mới / đổi URL** cho team collaboration. Chỉ đổi **logic phân quyền**, field response (`is_mine`, `created_by`, `sent_by`), và quyền DELETE results. Ma trận URL: **§15** · **Lấy kết quả / poll:** **§16** (Celery + campaign log).

**Tham chiếu envelope chung:** mọi response `{ success, message, data?, error_code? }` — skill `api-envelope`.

**Phân trang:** list có page → `data: { count, next, previous, results }` (bọc trong envelope) — `api_paginated_success`.

---

## 1. Tổng quan

```
┌────────────────────────────────────────────────────────────────────┐
│ Manager                                                             │
│  ├─ GET get-employees / POST create-employee                      │
│  ├─ POST employee-account-assignments/set  → gán nick cho NV       │
│  ├─ POST employee-campaign-permissions/set → bật loại chiến dịch │
│  └─ CRUD nick, proxy, chatbot, channel; giám sát kịch bản NV      │
├────────────────────────────────────────────────────────────────────┤
│ Employee (NV)                                                     │
│  ├─ GET my-account-assignments → nick được gán                     │
│  ├─ GET my-campaign-permissions → menu chiến dịch                  │
│  ├─ Chat + campaign trên nick được gán                             │
│  ├─ Kịch bản tự tạo: full quyền (kể status=1)                    │
│  └─ Kịch bản người khác: chỉ thấy list (`is_mine=false`)         │
└────────────────────────────────────────────────────────────────────┘
```

| Khái niệm | Giá trị |
|----------|---------|
| Auth | JWT — `IsAuthenticated` |
| Role detect | `GET /api/users/me` → `is_manager`, `is_employee` |
| Nick NV | **Chỉ nick manager đã gán** — không phải toàn bộ nick manager |
| Campaign list | **Team list** — mọi NV + manager cùng manager thấy chung |
| Campaign detail NV | Chỉ khi `is_mine=true` hoặc user là manager |
| Gửi tin audit | WS/REST message có `sent_by` (outbound) |

---

## 2. Thay đổi hành vi (app khác `users`)

URL **giữ nguyên** — chỉ đổi logic phân quyền / response. Chi tiết app `users`: **§3–§4**.

| Endpoint | Manager | Employee (NV) |
|----------|---------|---------------|
| `GET /api/account/` | Mọi nick mình | Chỉ nick **được gán** (cùng access với `my-account-assignments`) |
| `GET /api/account/?scope=messenger` | Như trên | Như trên |
| `GET /api/campaign/*/category/` | List team + §5 | List team; chỉ action khi `is_mine=true` |
| `GET /api/campaign/*/category/{id}/` | Mọi kịch bản team | **404** nếu không phải owner |
| `PUT/PATCH` category | Kịch bản mình | Chỉ kịch bản mình; manager **không** sửa kịch bản NV |
| `DELETE` / start / stop | Mình + kịch bản NV | Chỉ kịch bản mình |
| `GET/DELETE .../results/` | Log cả category | Log chỉ row mình tạo · DELETE §6 |
| Nhãn CRUD `/api/message/category/` | ✅ | ❌ `NOT_MANAGER` |
| Nhãn members `.../members/` | ✅ | ✅ (nick được gán) |
| Proxy / chatbot / channel / CRUD nick | ✅ | ❌ `NOT_MANAGER` |
| WS `new_global_update` | Nick mình | Chỉ nick được gán |
| Message payload | — | Outbound có `sent_by` §7 |
| `GET /api/friend/` | Nick `account__user=manager` | ⚠️ **Chưa** access layer — xem §2.1 |
| `POST /api/friend/fetchs` | Hydrate ID → name/avatar | ⚠️ Cùng hạn chế §2.1 |
| `GET /api/group/` | List theo `id_account` (không check owner) | ✅ List được nếu `id_account` ∈ assignment; sync/một số POST vẫn `user_id=self` — §2.2 |
| `POST /api/group/fetchs` | Hydrate `id_groups` | ⚠️ Không lọc theo nick — chỉ tin `id` hợp lệ |
| `GET /api/message/conversations` | Chat list/detail | ✅ `get_account_for_user` — §2.3 |
| `GET /api/message/get-message` | Bootstrap tin REST | ✅ + `sent_by` outbound §7 |
| `GET/POST /api/message/fast-reply` | Tin nhắn nhanh theo nick | ✅ nick gán |
| `GET/POST /api/message/video`, `/album` | Media đã lưu | ✅ **per-user** (`user=actor`) — NV thấy media của NV |
| `GET/POST /api/message/block-member/*` | Block member nhóm | ❌ `NOT_MANAGER` |
| Legacy `get-conversations`, `show-all-account-mess` | FE bundle cũ | ✅ access layer — §2.3 |

Prefix `/api/campaign/{loại}/` **không đổi** — chỉ list response, quyền, DELETE results. Key permission `mess_phone` → path **`mess-phone-number`** (không phải `mess-phone`).

---

## 2.1 Friends / danh bạ (`/api/friend/`) — đồng bộ BE thực tế

**SSOT code:** `BE/friends/views/basic_views.py` · mount `BE/Zalo/urls.py` → `/api/friend/`.

### `type=simple` — chỉ trả ID (đúng thiết kế, không phải lỗi)

`GET /api/friend/?id_account={id}&type=simple&page=1&number_per_page=50`

```json
{
  "success": true,
  "message": "OK",
  "data": [63357, 63356, 63355]
}
```

- `data` là **mảng `FriendModel.id`** (PK nội bộ DB), **không** có `name` / `avatar` / `uid`.
- Dùng cho picker virtual-scroll / lọc nhanh — FE hydrate sau bằng `POST fetchs` hoặc bỏ `type=simple`.

### Lấy đủ thông tin bạn bè — 2 cách

**Cách A — list phân trang đầy đủ (khuyến nghị màn danh bạ / contacts):**

```http
GET /api/friend/?id_account=23&page=1&number_per_page=50
```

Không gửi `type=simple`. Response:

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "count": 120,
    "next": "?page=2&...",
    "previous": null,
    "results": [
      {
        "id": 63357,
        "name": "Nguyễn Văn A",
        "alias_name": "",
        "avatar": "https://...",
        "gender": 0,
        "sdob": "01/01",
        "uid": "zalo_uid_...",
        "relation_status": 1,
        "isBlocked": false,
        "created_at": "...",
        "category_messages": [{ "id": 1, "name": "Nhãn A" }]
      }
    ]
  }
}
```

Serializer: `FriendDetailSerializer` (`BE/friends/serializers.py`).

**Cách B — two-step (giữ `type=simple` cho bước 1):**

```http
POST /api/friend/fetchs
Content-Type: application/json

{ "id_friends": [63357, 63356, 63355] }
```

```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": 63357,
      "uid": "zalo_uid_...",
      "name": "Nguyễn Văn A",
      "alias_name": "",
      "avatar": "https://...",
      "created_at": "..."
    }
  ]
}
```

Serializer: `FriendSimpleSerializer` (ít field hơn `FriendDetail`).

### Query params `GET /api/friend/`

| Param | Bắt buộc | Mặc định | Ý nghĩa |
|-------|----------|----------|---------|
| `id_account` | ✅ | — | Nick Zalo (`ZaloAccount.id`) |
| `page` | — | 1 | Trang (khi **không** `type=simple`) |
| `number_per_page` | — | 300 | Page size |
| `type` | — | *(detail)* | `simple` → chỉ mảng `id` |
| `name` | — | — | Lọc `alias_name` / `global_profile.name` / `display_name` |
| `id_category_message` | — | — | Lọc friend thuộc nhãn tin nhắn |
| `all_friend` | — | false | `true` → gồm cả không phải `relation_status=friend` |

### Lọc mặc định

- Không có `all_friend`: chỉ `relation_status = 1` (đã là bạn).
- Cần full feature: `user.is_full_feature_user()` — lỗi `403 FEATURE_EXPIRED` nếu hết hạn.

### Phân quyền nick (team) — **gap BE hiện tại**

Code hiện tại:

```python
FriendModel.objects.filter(account_id=id_account, account__user=request.user)
```

| Role | Hành vi **thực tế** | Hành vi **mục tiêu** (team) |
|------|---------------------|------------------------------|
| Manager | ✅ Danh bạ nick mình (`id_account` thuộc manager) | ✅ |
| Employee (NV) | ❌ List **rỗng** nếu `id_account` là nick manager đã gán (vì `account.user` ≠ NV) | ✅ Cùng nick assignment |

**FE tạm thời:** màn contacts khi login NV có thể trống dù đã gán nick — cần BE migrate `friends` sang `get_account_for_user` / `get_accessible_accounts` (giống `groups`, `account`).

**Manager** (JWT `user_id` = owner nick): dùng `type=simple` + `fetchs` hoặc bỏ `type=simple` như trên.

### Route friends — SSOT `BE/friends/urls.py` (URL không đổi)

| Method | Path (sau `/api/friend/`) | Team NV |
|--------|---------------------------|---------|
| `GET` | `` | ⚠️ §2.1 — `account__user=request.user` |
| `POST` | `fetchs` | ⚠️ Cùng filter owner |
| `POST` | `get` | ⚠️ Task Celery — owner check trong task |
| `POST` | `get/uid` | ⚠️ |
| `POST` | `friend-recommend/get` | ❌ `ZaloAccount.user_id=request.user` |
| `POST` | `friend-recommend/accept` | ❌ |
| `POST` | `friend-recommend/remove` | ❌ |
| `GET` | `sent-request/show` | ❌ `account__user=request.user` |
| `POST` | `sent-request/get` | ⚠️ Chỉ check account tồn tại |
| `POST` | `sent-request/remove` | ❌ `user_id=request.user` |
| `POST` | `unfriend` | ❌ `user_id=request.user` |
| `POST` | `add-friend` | ⚠️ Không check owner trước task — vẫn cần nick assignment ở task |
| `POST` | `backup` | Theo logic view |
| `POST` | `export-data` | Theo logic view |

**Poll Celery (gợi ý KB, sync danh bạ, …):** §16 — **không** có `/friend-recommend/result`; poll **cùng URL** + `id_task`.

---

## 2.2 Groups / nhóm (`/api/group/`) — đồng bộ BE thực tế

**SSOT code:** `BE/groups/views/basic_views.py` · mount → `/api/group/`.

### `type=simple` — giống friends

`GET /api/group/?id_account={id}&type=simple` → `data: [GroupModel.id, ...]` (không có name/avatar).

**Lấy đủ thông tin:** bỏ `type=simple` → paginated `GroupDetailSerializer` trong `data.results`; hoặc `POST /api/group/fetchs` với `{ "id_groups": [...] }` → `GroupDetailSimpleSerializer`.

### Query params `GET /api/group/`

| Param | Bắt buộc | Mặc định | Ý nghĩa |
|-------|----------|----------|---------|
| `id_account` | ✅ | — | `ZaloAccount.id` |
| `page` | — | 1 | Trang (khi không `type=simple`) |
| `number_per_page` | — | 100 (max 2000) | Page size |
| `type` | — | detail | `simple` → mảng `id` |
| `name` | — | — | Lọc `global_profile__name` |
| `id_category_message` | — | — | Lọc nhóm thuộc nhãn tin |

### Phân quyền nick (team) — **một phần**

| Endpoint | Access layer | NV + nick gán |
|----------|--------------|---------------|
| `GET /api/group/` | ❌ Chỉ filter `account_id` | ✅ **List được** nếu truyền đúng `id_account` gán |
| `POST fetchs` | ❌ Không lọc nick | ⚠️ Hydrate theo `id` — không leak nếu FE chỉ gửi id từ list |
| `POST get` (sync Zalo) | ❌ `user_id=request.user.id` | ❌ **404** — chưa assignment-aware |
| `POST get/link` | ❌ `user=request.user` | ❌ |
| `POST create`, `change-owner`, … | ✅ `get_account_for_user` | ✅ Nếu nick ∈ assignment |
| `GET creator` | ✅ `get_account_for_user` | ✅ |

**FE:** màn nhóm NV có thể **đọc list** qua `GET /api/group/` + `my-account-assignments`; nút **sync nhóm từ Zalo** (`POST get`) có thể lỗi cho đến khi BE migrate endpoint đó sang `get_accessible_accounts`.

### Route groups — SSOT `BE/groups/urls.py` (URL không đổi)

| Method | Path (sau `/api/group/`) | Ghi chú |
|--------|--------------------------|---------|
| `GET` | `` | List / `type=simple` |
| `POST` | `fetchs` | Hydrate |
| `POST` | `get` | Sync Celery — NV gap |
| `POST` | `get/result` | Poll task |
| `POST` | `get/uid` | Member theo uid trong nhóm |
| `POST` | `get-member`, `get-member/show`, `get-member/result` | Thành viên nhóm |
| `POST` | `get-member-link`, `show-member-link`, `get-member-link/result` | Member qua link |
| `POST` | `get/link`, `get/link/result` | Link nhóm — NV gap |
| `POST` | `create`, `create/result` | Tạo nhóm — `get_account_for_user` |
| `POST` | `quit`, `quit/result` | Rời nhóm |
| `POST` | `add-admin`, `remove-admin` + `/result` | Admin nhóm |
| `GET` | `creator` | Nhóm mình là creator |
| `POST` | `change-owner`, `change-name`, `change-avatar`, `get-group-setting`, `change-group-setting` + `/result` | Quản trị nhóm |
| `GET`/`POST`/`DELETE` | `lock-group-chat`, `lock-group-chat/<pk>` | Lịch khóa chat |

---

## 2.3 Message / chat (`/api/message/`) — đồng bộ BE thực tế

**SSOT code:** `BE/message/urls.py` · mount → `/api/message/`.

### Endpoint chính (envelope — FE mới)

| Method | Path (sau `/api/message/`) | Access team | Ghi chú FE |
|--------|----------------------------|-------------|------------|
| `GET` | `conversations` | ✅ `get_account_for_user` | Query bắt buộc `id_account`. List / detail / `position=1`. Filter `id_category` dùng nhãn **manager** (`team_manager`). Pagination **cumulative** (`page_size` mặc định 17). |
| `POST` | `conversations/open` | ✅ | Body `id_account` + (`id_friend` hoặc `id_group`) — mở hội thoại chưa có tin. |
| `GET` | `get-message` | ✅ | Query `id_account`, `id_conversation`. Tin trong `data.results` — mỗi item raw Zalo + `conversation_id` + **`sent_by`** (§7). `page_size` query param (mặc định 17). |
| `POST` | `note` | ✅ | Ghi chú local per-account trên overlay. |
| `POST` | `pin` | ✅ | Ghim hội thoại (`GlobalConversationModel.pinning`). |
| `POST` | `pin/account` | ⚠️ **Gap** | Chỉ `get_object_or_404(ZaloAccount, id=…)` — **chưa** `get_account_for_user`. |
| `GET` | `poll-detail` | ✅ | `resolve_account_and_proxy(id_account, user.id)` — team-aware. |

**Gửi tin:** qua **WebSocket** (`MessageHandler` + `resolve_account_and_proxy`) — không có REST `POST send-message`. Outbound gắn `sent_by` qua Redis (`sent_by_attribution.py`) → WS `new_global_update` + REST `get-message`.

### Legacy alias — production bundle cũ (**không envelope**)

| Method | Path | Shape response | Team |
|--------|------|----------------|------|
| `GET` | `get-conversations` | Raw pagination (unwrap từ `conversations`) | ✅ |
| `GET` | `get-conversation` | Raw object detail | ✅ — tự suy `id_account` từ nick accessible |
| `GET` | `show-all-account-mess` | Raw array `ZaloAccountMessSerializer` | ✅ `_messenger_accounts_queryset` |
| `GET` | `category/get` | Raw array / `{friend_ids}` / `{group_ids}` / `{conversation_ids}` | ✅ `manager_labels_q` + `validate_label_account` |

`GET /api/message/category/?id_account=` → list nhãn team (NV đọc, không CRUD — §8).

### Tin nhắn nhanh, sticker, media

| Method | Path | Manager | NV |
|--------|------|---------|-----|
| `GET`/`POST` | `fast-reply`, `fast-reply/<pk>` | ✅ theo nick | ✅ nick gán (`account_id__in get_accessible_accounts`) |
| `GET` | `stickers/search`, `suggest`, `category`, `detail` | ✅ | ✅ `id_account` qua `get_account_for_user` |
| `GET`/`POST` | `video`, `video/<pk>` | ✅ own | ✅ own — `VideoModel.user = actor` |
| `GET`/`POST` | `album`, `album/<pk>` | ✅ own | ✅ own — `AlbumImageModel.user = actor` |

NV **không** thấy video/album manager dùng trong campaign — mỗi user CRUD media của mình (§5.5).

### Block member — manager only

| Method | Path (sau `/api/message/block-member/`) | NV |
|--------|----------------------------------------|-----|
| `GET`/`POST` | `block-controls` | ❌ `NOT_MANAGER` |
| `GET` | `admin-groups` | ❌ |
| `GET` | `group-members` | ❌ |
| `POST` | `toggle-control` | ❌ |
| `POST` | `scan-admin-group`, `scan-admin-group/result` | ❌ |

### Query params hay dùng — `GET conversations`

| Param | Bắt buộc | Ý nghĩa |
|-------|----------|---------|
| `id_account` | ✅ | Nick chat |
| `id_conversation` | — | Có → detail hoặc position (kèm `position=1`) |
| `conversation_type` | — | `friend` \| `group` \| `all` (mặc định `all`) |
| `name` | — | Lọc tên hội thoại |
| `unread` | — | truthy → chỉ chưa đọc |
| `id_category` | — | Lọc theo nhãn chat (nhãn thuộc manager) |
| `page`, `page_size` | — | Cumulative pagination |

### WS events liên quan team

| Event | Fan-out | Field team |
|-------|---------|------------|
| `new_global_update` | Manager + NV được gán nick (`ws_recipient_ids_for_account`) | `conversations[]`, `message_details[]` có **`sent_by`** outbound |
| `message_ack` | Chỉ WS session gửi | Không có `sent_by` |

---

## 3. App `users` — bản đồ URL

Mount: `BE/Zalo/urls.py` → **`/api/users/`** + path trong `BE/users/urls.py`.

### 3.1 Nhóm liên quan team collaboration

| Method | Path (sau `/api/users/`) | Ai gọi | Mục đích FE |
|--------|---------------------------|--------|-------------|
| `GET` | `me` | All | Role: `is_manager`, `is_employee`, hạn mức, `team_account_count` |
| `GET` | `get-employees` | Manager | Danh sách NV — màn quản lý team |
| `POST` | `create-employee` | Manager | Tạo NV |
| `POST` | `edit-employee` | Manager | Sửa NV (limit, password, …) |
| `POST` | `delete-employee` | Manager | Xóa NV |
| `POST` | `active-employee` | Manager | Gia hạn NV theo manager |
| `GET` | `employee-account-assignments` | Manager | Đọc nick đã gán cho 1 NV |
| `POST` | `employee-account-assignments/set` | Manager | **Gán/replace** nick cho NV |
| `GET` | `my-account-assignments` | All | Nick dùng được (manager: full; NV: gán) |
| `GET` | `employee-campaign-permissions` | Manager | Đọc quyền 11 loại chiến dịch |
| `POST` | `employee-campaign-permissions/set` | Manager | **Bật/tắt** loại chiến dịch |
| `GET` | `my-campaign-permissions` | All | Map quyền — ẩn menu campaign |

### 3.2 URL `users` khác (không đổi contract team)

Auth: `login`, `logout`, `change-password`, `accept-terms` · Admin/sale: `get-all-account`, `create-manager`, … · Domain/mail/QR/token · `disable-message` (listener user-level) — giữ flow cũ.

### 3.3 Luồng FE — manager setup NV

```
1. GET  /api/users/me                          → is_manager, employee_limit
2. GET  /api/users/get-employees               → list NV
3. POST /api/users/create-employee             → tạo NV (nếu chưa có)
4. GET  /api/account/                          → list nick manager (picker gán)
5. GET  /api/users/employee-account-assignments?employee_id={id}
6. POST /api/users/employee-account-assignments/set
7. GET  /api/users/employee-campaign-permissions?employee_id={id}
8. POST /api/users/employee-campaign-permissions/set
```

### 3.4 Luồng FE — sau login (mọi role)

```javascript
const me = unwrapApiData((await api.get('/api/users/me')).data);

if (me.is_employee) {
  const accounts = unwrapApiData((await api.get('/api/users/my-account-assignments')).data);
} else if (me.is_manager) {
  const accounts = unwrapApiData((await api.get('/api/account/')).data);
  // hoặc my-account-assignments — cùng kết quả nick manager
}

const { permissions } = unwrapApiData((await api.get('/api/users/my-campaign-permissions')).data);
// permissions.add_friend → hiện menu
```

### 3.5 Ẩn module theo role

| Module UI | Manager | Employee |
|-----------|---------|----------|
| `get-employees` + gán nick/permission | ✅ | ❌ |
| Thêm/sửa/xóa nick Zalo (`/api/account/`) | ✅ | ❌ |
| Proxy, Chatbot, Channel, Block member | ✅ | ❌ |
| CRUD nhãn chat | ✅ | ❌ |
| Gán/gỡ nhãn hội thoại | ✅ | ✅ |
| Campaign (`my-campaign-permissions`) | ✅ all | ✅ từng loại |
| Chat messenger | ✅ | ✅ nick gán |

---

## 4. App `users` — chi tiết endpoint

### 4.1 GET profile đăng nhập

| | |
|--|--|
| **Method** | `GET` |
| **Path** | `/api/users/me` |

**FE đọc:** `is_manager`, `is_employee`, `manager`, `employee_limit`, `account_limit`, `expiration_date`, `team_account_count`, `disable_message`.

NV: `is_employee=true`, `is_manager=false`. User đăng ký mới: `is_manager=true`.

---

### 4.2 GET danh sách nhân viên

| | |
|--|--|
| **Method** | `GET` |
| **Path** | `/api/users/get-employees` |
| **Role** | Manager (cần `is_full_feature_user`) |

**Response 200:** array `UserManagerSerializer` + `logged_account_count` mỗi item.

**Lỗi:** `403 FULL_FEATURE_EXPIRED`

**FE:** màn “Quản lý nhân viên” — chọn 1 NV → mở form gán nick (§4.6–4.10).

---

### 4.3 POST tạo nhân viên

| | |
|--|--|
| **Method** | `POST` |
| **Path** | `/api/users/create-employee` |

**Body (chính):**

```json
{
  "username": "nv1",
  "password": "Abc@1234",
  "fullname": "Nguyễn Văn A",
  "account_limit": 0,
  "listener_limit": 0
}
```

**Response 201:** `data` = `UserManagerSerializer` NV mới.

**Lỗi thường gặp:** `EMPLOYEE_LIMIT_EXCEEDED` · `USERNAME_EXISTS` · `PASSWORD_INVALID` · `DOMAIN_NOT_ALLOWED`

Sau tạo: gán nick + permission (§4.6–4.10) — NV mặc định **tắt hết** campaign permission.

---

### 4.4 POST sửa / xóa / kích hoạt NV

| Method | Path | Body chính |
|--------|------|------------|
| `POST` | `/api/users/edit-employee` | `id_employee`, `account_limit`, `listener_limit`, `password`, … (serializer fields) |
| `POST` | `/api/users/delete-employee` | `{ "id_employee": 5 }` |
| `POST` | `/api/users/active-employee` | `{ "id_employee": 5 }` |

Chỉ manager; domain CARE/CAREPLUS/ZCARE. Xóa NV → cascade assignment/permission (DB).

---

### 4.5 GET gán nick (manager)

| | |
|--|--|
| **Method** | `GET` |
| **Path** | `/api/users/employee-account-assignments` |
| **Query** | `employee_id` (int, **bắt buộc**) |

**Response 200:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "employee_id": 5,
    "account_ids": [1, 2]
  }
}
```

**Lỗi:** `403 NOT_MANAGER` · `400 EMPLOYEE_REQUIRED` · `404` NV không thuộc team

---

### 4.6 POST gán nick — replace toàn bộ (manager)

| | |
|--|--|
| **Method** | `POST` |
| **Path** | `/api/users/employee-account-assignments/set` |

**Body:**

```json
{
  "employee_id": 5,
  "account_ids": [1, 2, 3]
}
```

- `account_ids: []` = bỏ hết gán.
- Mọi id phải thuộc nick manager (`zalo_account.user_id = manager.id`).

**Response 200:**

```json
{
  "success": true,
  "message": "OK",
  "data": { "employee_id": 5, "account_ids": [1, 2, 3] }
}
```

**Lỗi:** `INVALID_ACCOUNTS` · `ACCOUNT_IDS_INVALID` (không phải array)

---

### 4.7 GET nick của user hiện tại

| | |
|--|--|
| **Method** | `GET` |
| **Path** | `/api/users/my-account-assignments` |

**Response 200:**

- **Manager:** array `ZaloAccountSerializer` — mọi nick mình sở hữu.
- **Employee:** array `ZaloAccountSerializer` — chỉ nick được gán (rỗng nếu chưa gán).

```json
{
  "success": true,
  "message": "OK",
  "data": [
    { "id": 1, "uid": "...", "display_name": "...", "...": "..." }
  ]
}
```

**FE:** NV dùng endpoint này làm SSOT list nick — không assume `GET /api/account/` trả full team.

---

### 4.8 GET quyền chiến dịch NV (manager)

| | |
|--|--|
| **Method** | `GET` |
| **Path** | `/api/users/employee-campaign-permissions` |
| **Query** | `employee_id` (bắt buộc) |

**Response 200:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "employee_id": 5,
    "permissions": {
      "add_friend": true,
      "join_group": false,
      "invite_group": false,
      "invite_phone_group": false,
      "mess_friend": true,
      "mess_group": false,
      "mess_member_group": false,
      "mess_phone": false,
      "mess_birthday": false,
      "spam_link_group": false,
      "auto_inbox": false
    }
  }
}
```

Luôn trả **đủ 11 key** — thiếu row DB = `false`.

---

### 4.9 POST quyền chiến dịch — replace map (manager)

| | |
|--|--|
| **Method** | `POST` |
| **Path** | `/api/users/employee-campaign-permissions/set` |

**Body:**

```json
{
  "employee_id": 5,
  "permissions": {
    "add_friend": true,
    "mess_friend": true,
    "join_group": false
  }
}
```

- Gửi đủ 11 key hoặc subset — BE replace: chỉ tạo row cho key `enabled: true`.
- Key lạ → `400 INVALID_CAMPAIGN_TYPE`.

---

### 4.10 GET quyền chiến dịch user hiện tại

| | |
|--|--|
| **Method** | `GET` |
| **Path** | `/api/users/my-campaign-permissions` |

**Response 200:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "permissions": { "add_friend": true, "...": false }
  }
}
```

- **Manager:** mọi key = `true` (không cần row DB).
- **Employee:** theo `EmployeeCampaignPermission`.

**FE:** ẩn menu/route campaign khi `permissions[loại] === false`. Gọi API bị từ chối vẫn trả `403 CAMPAIGN_TYPE_DENIED`.

---

### 4.11 `CampaignType` — map FE menu

| Key | Menu gợi ý | Path campaign prefix |
|-----|--------------|----------------------|
| `add_friend` | Kết bạn | `/api/campaign/add-friend/` |
| `join_group` | Tham gia nhóm | `/api/campaign/join-group/` |
| `invite_group` | Mời vào nhóm | `/api/campaign/invite-group/` |
| `invite_phone_group` | Mời SĐT vào nhóm | `/api/campaign/invite-phone-group/` |
| `mess_friend` | Nhắn bạn bè | `/api/campaign/mess-friend/` |
| `mess_group` | Nhắn nhóm | `/api/campaign/mess-group/` |
| `mess_member_group` | Nhắn thành viên nhóm | `/api/campaign/mess-member-group/` |
| `mess_phone` | Nhắn SĐT | `/api/campaign/mess-phone-number/` |
| `mess_birthday` | Sinh nhật | `/api/campaign/mess-birthday/` |
| `spam_link_group` | Spam link nhóm | `/api/campaign/spam-link-group/` |
| `auto_inbox` | Auto inbox | `/api/campaign/auto-inbox/*` |

---

## 5. Campaign — list kịch bản (đổi response)

Áp dụng **mọi** `GET /api/campaign/{loại}/category/` dùng `*BasicSerializer` team:

- add-friend, join-group, invite-group, invite-phone-group  
- mess-friend, mess-group, mess-member-group, mess-phone-number, mess-birthday  
- spam-link-group  

**Không áp dụng auto inbox** (nick-scoped, không list team / `is_mine`).

### 5.1 Field mới trên mỗi item list

```json
{
  "id": 10,
  "name": "Kịch bản A",
  "status": 1,
  "status_label": "Đang chạy",
  "is_mine": false,
  "created_by": {
    "id": 5,
    "username": "nv1",
    "fullname": "Nguyễn Văn A"
  }
}
```

| Field | Ý nghĩa FE |
|-------|------------|
| `is_mine` | `true` → cho mở detail, sửa, log, start/stop (nếu có quyền loại) |
| `is_mine` | `false` + NV → **chỉ hiển thị card list**; không gọi detail/log |
| `created_by` | Hiển thị “Tạo bởi …” trên list team |
| `status_label` | Text trạng thái (display) |

### 5.2 Quyền thao tác (NV)

| Thao tác | `is_mine=true` | `is_mine=false` |
|----------|----------------|-----------------|
| List | ✅ | ✅ |
| GET detail | ✅ | ❌ **404** |
| PUT/PATCH | ✅ | ❌ 403 |
| DELETE | ✅ | ❌ 403 |
| Start/stop | ✅ | ❌ 404/403 |
| GET results / statistics | ✅ (log mình) | ❌ 403 |

### 5.3 Quyền thao tác (Manager)

| Thao tác | Kịch bản mình | Kịch bản NV |
|----------|---------------|-------------|
| GET detail | ✅ | ✅ read-only |
| PUT/PATCH | ✅ | ❌ **403** |
| DELETE / stop | ✅ | ✅ |
| GET results | ✅ | ✅ (toàn bộ log category) |

### 5.4 Gán nick trong kịch bản (`id_accounts` / M2M)

Mọi `account_id` POST/PUT phải ∈ nick user truy cập được:

- Manager: mọi nick mình.
- NV: chỉ nick trong assignment.

Lỗi validate → message dạng `"Nick không thuộc team: [...]"`.

### 5.5 Video / album đính kèm campaign

- `VideoModel`, `AlbumImageModel` **per-user** (`user = actor`).
- NV chọn video/album: chỉ item `user = NV` (`GET /api/message/video`, `GET /api/message/album`).
- Manager: item của manager — không share cross-user.

### 5.6 Chạy chiến dịch → lấy kết quả cho user (không Celery `id_task`)

Chiến dịch **không** dùng poll `id_task` như sync danh bạ. Flow:

```
1. POST /api/campaign/{prefix}/category/start/
   Body: { "id_categories": [10, 11], "type": "new" }   // type tùy loại (vd. mess-friend)
   → 200 { success, message: "Đã bắt đầu chiến dịch", data: true }

2. Worker nền ghi log vào DB (Redis queue) — có thể vài giây đến vài phút

3. Poll kết quả — GET phân trang (refetch định kỳ khi màn log đang mở hoặc status=1):
   GET /api/campaign/{prefix}/category/{category_id}/results/?page=1&number_per_page=50

4. (Tuỳ chọn) Thống kê tổng:
   GET /api/campaign/{prefix}/statistics/?id_category=10&start_time=...&end_time=...

5. Dừng: POST /api/campaign/{prefix}/category/stop/  { "id_categories": [10] }
```

**Biết “có kết quả mới”:**

| Cách | Ghi chú |
|------|---------|
| Refetch `GET .../results/` mỗi 3–10s khi `status=1` (đang chạy) | `data.count` / item mới trong `data.results` |
| Refetch `GET .../category/` | `status`, `status_label`, counter loại cụ thể |
| `GET .../statistics/` | Tổng success/failure theo khoảng thời gian |

**Response log** — envelope paginated (§ đầu doc):

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "count": 240,
    "next": "?page=2&...",
    "previous": null,
    "results": [ { "id": 12, "status": 1, "...": "..." } ]
  }
}
```

**Quyền team:** §5.2–5.3 — NV chỉ log row mình; manager xem full category. **Mess birthday:** `GET /api/campaign/mess-birthday/results/` (không `{category_id}`) — §6.

**Không có** WebSocket push kết quả campaign — FE **chủ động poll** REST.

---

## 6. Campaign — xóa log kết quả (mới)

**Pattern chung** — mọi loại có sub-resource `results`:

```
DELETE /api/campaign/{loại}/category/{category_id}/results/
```

| Loại | Path đầy đủ |
|------|-------------|
| Kết bạn | `/api/campaign/add-friend/category/{id}/results/` |
| Join group | `/api/campaign/join-group/category/{id}/results/` |
| Invite group | `/api/campaign/invite-group/category/{id}/results/` |
| Invite phone | `/api/campaign/invite-phone-group/category/{id}/results/` |
| Mess friend | `/api/campaign/mess-friend/category/{id}/results/` |
| Mess group | `/api/campaign/mess-group/category/{id}/results/` |
| Mess member | `/api/campaign/mess-member-group/category/{id}/results/` |
| Mess phone | `/api/campaign/mess-phone-number/category/{id}/results/` |
| Mess birthday | **`GET/DELETE /api/campaign/mess-birthday/results/`** — không có `category/{id}/results/` (singleton per user) |
| Spam link | `/api/campaign/spam-link-group/category/{id}/results/` |

**Body:**

```json
{
  "id_results": [12, 15, 20]
}
```

**Response 200:** `{ "success": true, "message": "Đã xóa thành công" }`

**Quyền xóa:**

- NV: chỉ row `Campaign*.user = NV` trong category **của mình** (`is_mine`).
- Manager: mọi row trong category (kể cả kịch bản NV).

**Lỗi:** `403 CATEGORY_FORBIDDEN` (không xem được log category) · `404 RESULT_NOT_FOUND`

**FE:** thêm checkbox + nút xóa trên màn kết quả; refetch list sau delete.

---

## 7. Chat — `sent_by` (REST + WebSocket)

### 7.1 Field payload

Outbound (manager hoặc NV gửi qua WS):

```json
{
  "msgId": "...",
  "cliMsgId": "...",
  "conversation_id": 42,
  "sent_by": {
    "id": 5,
    "username": "nv1",
    "fullname": "Nguyễn Văn A"
  }
}
```

| Trường hợp | `sent_by` |
|------------|-----------|
| Tin khách / hệ thống | `null` hoặc **omit** |
| Manager gửi | `{ id: managerId, ... }` |
| NV gửi | `{ id: employeeId, ... }` |

Nguồn: `BE/message/chat_payload.py` → event WS `new_global_update` và REST `GET /api/message/get-message` (§2.3).

### 7.2 FE gợi ý

- Bubble outbound: hiển thị `sent_by.fullname` hoặc `username` khi khác user đăng nhập (inbox chung nhiều NV).
- Không cần gọi API riêng — đọc từ payload tin.

### 7.3 WS fan-out

NV chỉ nhận `new_global_update` của nick **được gán** — không leak sang NV khác chỉ có nick khác.

---

## 8. Nhãn chat (`/api/message/category/`)

> Chi tiết FE: `docs/fe_message_label_category.md` · **Không** dùng path cũ `/api/campaign/message-label/`.

| Method | Path | Manager | Employee |
|--------|------|---------|----------|
| `GET` | `/api/message/category/` | ✅ | ✅ (list nhãn team) |
| `POST` | `/api/message/category/` | ✅ | ❌ `NOT_MANAGER` |
| `GET` | `/api/message/category/{id}/` | ✅ | ✅ |
| `PUT`/`PATCH`/`DELETE` | `/api/message/category/{id}/` | ✅ | ❌ |
| `POST`/`DELETE` | `/api/message/category/{id}/members/` | ✅ | ✅ |

**Members body (gán/gỡ):**

```json
{
  "id_account": 1,
  "id_friends": [10, 11]
}
```

hoặc `id_groups: [3]`. NV phải có quyền dùng `id_account`.

---

## 9. Auto inbox — không list team

URL giữ nguyên (`/api/campaign/auto-inbox/*`). Khác biệt:

- Cần `require_campaign_permission(AUTO_INBOX)`.
- Scope **theo nick** (`id_account`) — `get_account_for_user`.
- **Không** có `is_mine` / list team.
- 1 script / nick (`MessageToCategoryModel` unique per account).

---

## 10. `error_code` thường gặp

| `error_code` | HTTP | Khi nào | FE xử lý |
|--------------|------|---------|----------|
| `NOT_MANAGER` | 403 | NV vào proxy/chatbot/channel/tạo nick/CRUD nhãn | Ẩn menu hoặc toast |
| `CAMPAIGN_TYPE_DENIED` | 403 | NV không được bật loại chiến dịch | Redirect / ẩn module |
| `CATEGORY_FORBIDDEN` | 403 | Sửa/xóa/log kịch bản không được phép | Disable nút |
| `NOT_FOUND` | 404 | Detail kịch bản người khác (NV) | Không navigate từ list |
| `RESULT_NOT_FOUND` | 404 | Xóa log id không hợp lệ | Toast |
| `EMPLOYEE_REQUIRED` | 400 | Thiếu `employee_id` | Validate form |
| `INVALID_ACCOUNTS` | 400 | Gán nick ngoài team | Highlight nick lỗi |
| `INVALID_CAMPAIGN_TYPE` | 400 | Key permission sai | Fix payload |

---

## 11. TypeScript (gợi ý FE)

```typescript
export type CampaignTypeKey =
  | 'add_friend' | 'join_group' | 'invite_group' | 'invite_phone_group'
  | 'mess_friend' | 'mess_group' | 'mess_member_group' | 'mess_phone'
  | 'mess_birthday' | 'spam_link_group' | 'auto_inbox';

export interface TeamUserRef {
  id: number;
  username: string;
  fullname: string | null;
}

export interface CategoryListItem {
  id: number;
  name: string;
  status: number;
  status_label: string;
  is_mine: boolean;
  created_by: TeamUserRef;
  // ... field loại cụ thể (phone_number_count, ...)
}

export interface CampaignPermissionsMap {
  [K in CampaignTypeKey]: boolean;
}

export interface SentByPayload {
  id: number;
  username: string;
  fullname: string;
}

export interface SetAccountAssignmentsBody {
  employee_id: number;
  account_ids: number[];
}

export interface SetCampaignPermissionsBody {
  employee_id: number;
  permissions: Partial<Record<CampaignTypeKey, boolean>>;
}

export interface DeleteCampaignResultsBody {
  id_results: number[];
}
```

---

## 12. Checklist chỉnh FE

### Manager — màn mới

- [ ] `GET get-employees` + `POST create-employee` / `edit-employee`
- [ ] Form gán nick: `employee-account-assignments` + `/set`
- [ ] Toggle 11 loại chiến dịch: `employee-campaign-permissions` + `/set`
- [ ] List kịch bản: cột `created_by`; vẫn mở detail kịch bản NV
- [ ] Detail kịch bản NV: **read-only** form (disable save)
- [ ] Nút stop/delete kịch bản NV
- [ ] Xóa log kết quả (chọn nhiều → DELETE results)

### Employee — hành vi

- [ ] Bootstrap: `my-account-assignments` + `my-campaign-permissions`
- [ ] Messenger / picker nick: chỉ nick assignment
- [ ] Danh bạ `/api/friend/`: **bỏ `type=simple`** nếu cần name/avatar ngay; hoặc `fetchs` sau bước 1
- [ ] Biết gap NV + friends (§2.1) — list có thể rỗng cho đến khi BE patch access layer
- [ ] Nhóm `/api/group/`: list OK với nick gán; **ẩn/disable sync** `POST get` cho NV (§2.2)
- [ ] Nhóm: `type=simple` + `fetchs` giống friends nếu cần virtual-scroll
- [ ] Campaign list: `is_mine=false` → không click vào detail
- [ ] Sau **start**: poll `GET .../results/` (§5.6) — không dùng `id_task`
- [ ] Celery sync (danh bạ, gợi ý KB): poll `id_task` theo §16
- [ ] Campaign create: `id_accounts` ⊆ nick gán
- [ ] Chat: hiển thị `sent_by` trên tin gửi (`get-message` + WS `new_global_update`)
- [ ] Messenger: `GET /api/message/conversations` + `get-message` với `id_account` ∈ assignment
- [ ] Fast reply / sticker: dùng nick gán; video/album là **của user đăng nhập** (§2.3)
- [ ] Ẩn block-member (`/api/message/block-member/*`)
- [ ] Nhãn: ẩn tạo/sửa/xóa; giữ gán/gỡ members
- [ ] Ẩn proxy, chatbot, channel, thêm nick

### Regression

- [ ] Manager flow cũ (tạo nick, campaign, chat) vẫn chạy
- [ ] Pagination results/statistics vẫn dùng envelope paginated (không đổi shape)

---

## 13. Method matrix — app `users` (team)

| Method | Path | Role |
|--------|------|------|
| `GET` | `/api/users/me` | All |
| `GET` | `/api/users/get-employees` | Manager |
| `POST` | `/api/users/create-employee` | Manager |
| `POST` | `/api/users/edit-employee` | Manager |
| `POST` | `/api/users/delete-employee` | Manager |
| `POST` | `/api/users/active-employee` | Manager |
| `GET` | `/api/users/employee-account-assignments?employee_id=` | Manager |
| `POST` | `/api/users/employee-account-assignments/set` | Manager |
| `GET` | `/api/users/my-account-assignments` | All |
| `GET` | `/api/users/employee-campaign-permissions?employee_id=` | Manager |
| `POST` | `/api/users/employee-campaign-permissions/set` | Manager |
| `GET` | `/api/users/my-campaign-permissions` | All |

---

## 14. Ngoài phạm vi / không đổi contract

| Hạng mục | Ghi chú |
|----------|---------|
| `GET /api/friend/?type=simple` | Chỉ trả `FriendModel.id[]` — hydrate qua §2.1 |
| Friends NV + nick gán | BE chưa `get_account_for_user` — backlog §2.1 |
| Groups `POST get` / `get/link` NV | Chưa assignment-aware — backlog §2.2 |
| `POST /api/message/pin/account` | Chưa `get_account_for_user` — backlog §2.3 |
| Legacy message routes | `get-conversations`, `show-all-account-mess`, `category/get` — giữ cho bundle cũ; FE mới dùng envelope §2.3 |
| `notif-campaign/*`, `notification/*` | URL giữ nguyên — ngoài scope team doc này |
| Fast reply | Scope nick qua `get_accessible_accounts` — chi tiết §2.3 |
| JWT login/refresh | Không đổi (`/api/token/`, `/api/token/refresh/`) |
| Upload file | Không đổi |
| `globalId` / backfill | §16 `backend_logic_guide` — FE chưa cần đổi |
| Coin khi NV chạy campaign | Không có logic trừ coin |

---

## 15. Bản đồ URL SSOT — audit đầy đủ

Mount gốc (`BE/Zalo/urls.py`):

| Prefix | App |
|--------|-----|
| `/api/users/` | `users.urls` |
| `/api/account/` | `account.urls` |
| `/api/friend/` | `friends.urls` |
| `/api/group/` | `groups.urls` |
| `/api/campaign/` | `campaign.urls` |
| `/api/message/` | `message.urls` |

**Không có thay đổi path** so với trước team collaboration — bảng dưới để FE đối chiếu route hiện tại.

### 15.1 `users` — team (§13) + các route khác (URL giữ nguyên)

| Method | Path | Role / ghi chú |
|--------|------|----------------|
| `GET` | `/api/users/me` | All — `is_manager`, `is_employee` |
| `GET` | `/api/users/get-employees` | Manager |
| `POST` | `/api/users/create-employee` | Manager |
| `POST` | `/api/users/edit-employee` | Manager |
| `POST` | `/api/users/delete-employee` | Manager |
| `POST` | `/api/users/active-employee` | Manager |
| `GET` | `/api/users/employee-account-assignments` | Manager — `?employee_id=` |
| `POST` | `/api/users/employee-account-assignments/set` | Manager |
| `GET` | `/api/users/my-account-assignments` | All — SSOT nick NV |
| `GET` | `/api/users/employee-campaign-permissions` | Manager — `?employee_id=` |
| `POST` | `/api/users/employee-campaign-permissions/set` | Manager |
| `GET` | `/api/users/my-campaign-permissions` | All |
| `POST` | `/api/users/login` | Auth |
| `POST` | `/api/users/logout` | Auth |
| `POST` | `/api/users/change-password` | Auth |
| `POST` | `/api/users/accept-terms` | Auth |
| `POST` | `/api/users/disable-message` | User-level listener |
| `GET` | `/api/users/token` | Token QR |
| *…* | `domain/*`, `reset-password/*`, admin `get-all-account`, … | Không đổi — ngoài team |

### 15.2 `account` — `BE/account/urls.py`

| Method | Path (sau `/api/account/`) | Manager | Employee (NV) |
|--------|----------------------------|---------|---------------|
| `GET` | `` | ✅ full nick | ✅ nick gán (`get_accessible_accounts`) |
| `GET` | `?scope=messenger` | ✅ | ✅ nick gán (lọc checkpoint/proxy) |
| `GET` | `employee` | ✅ | ❌ `NOT_MANAGER` |
| `GET` | `employee/summary` | ✅ paginated | ❌ `NOT_MANAGER` |
| `POST` | `add`, `add/result` | ✅ (`check_user_limit`) | ❌ |
| `POST` | `add-with-token`, `add-with-token/result` | Token flow | Token flow |
| `POST` | `edit` | ✅ | ❌ `NOT_OWNER` |
| `POST` | `delete`, `delete/result` | ✅ | ⚠️ Gọi được nhưng task theo `user.id` |
| `POST` | `toggle-message-listener` | ✅ | ❌ `NOT_MANAGER` |
| `POST` | `toggle-chatbot` | ✅ | ❌ `NOT_OWNER` |
| `GET`/`PUT` | `<pk>/chatbot-disabled-friends` | ✅ | ❌ `NOT_FOUND` |
| `POST` | `check-account`, `check-account/result` | ✅ | ✅ (nick gán trong task) |
| `POST` | `transfer-account` | Admin only | — |
| `POST` | `internal/*` | Internal | — |

**FE NV:** bootstrap nick = `GET /api/users/my-account-assignments` hoặc `GET /api/account/` (cùng phạm vi). Ẩn toàn bộ UI thêm/sửa/xóa nick, toggle listener/chatbot.

### 15.3 `friend` — xem §2.1 + bảng route §2.1

URL không đổi. **Response đổi:** không có field team mới — chỉ gap access khiến NV list rỗng.

### 15.4 `group` — xem §2.2

URL không đổi. NV: list + thao tác có `get_account_for_user` OK; sync `POST get` / `get/link` chưa OK.

### 15.5 `campaign` — pattern resource (URL không đổi)

Mọi loại team list dùng chung shape:

```
GET    /api/campaign/{prefix}/category/              → list + is_mine, created_by
POST   /api/campaign/{prefix}/category/              → tạo
GET    /api/campaign/{prefix}/category/{id}/         → detail
PUT    /api/campaign/{prefix}/category/{id}/         → sửa
DELETE /api/campaign/{prefix}/category/{id}/         → xóa
POST   /api/campaign/{prefix}/category/start/        → body id category
POST   /api/campaign/{prefix}/category/stop/         → body id category
POST   /api/campaign/{prefix}/category/{id}/copy/    → copy (nếu có)
GET    /api/campaign/{prefix}/category/{id}/results/ → log (DELETE §6)
GET    /api/campaign/{prefix}/statistics/            → thống kê
```

| Permission key | `{prefix}` URL | Ghi chú thêm |
|----------------|----------------|--------------|
| `add_friend` | `add-friend` | `account-limit`, `failed-campaigns-phone-numbers` |
| `join_group` | `join-group` | `account-limit`, `failed-campaigns-link-group` |
| `invite_group` | `invite-group` | `failed-campaigns-phone-numbers` |
| `invite_phone_group` | `invite-phone-group` | `failed-campaigns-phone-numbers` |
| `mess_friend` | `mess-friend` | — |
| `mess_group` | `mess-group` | — |
| `mess_member_group` | `mess-member-group` | — |
| `mess_phone` | **`mess-phone-number`** | `phone-numbers-error`, `failed-campaigns-phone-numbers`, `account-limit` |
| `mess_birthday` | `mess-birthday` | Singleton: `GET/DELETE .../results/` (không `category/{id}/results/`); `run-now/`; start cả `category/start/` và `category/{id}/start/` |
| `spam_link_group` | `spam-link-group` | `category/all-group/` |
| `auto_inbox` | `auto-inbox` | `get-script`, `save-script`, `start`, `stop`, `status` — không list team |

**Nhãn chat** (manager CRUD / NV members):

| Method | Path |
|--------|------|
| `GET`/`POST` | `/api/message/category/` |
| `GET`/`PUT`/`PATCH`/`DELETE` | `/api/message/category/{id}/` |
| `POST`/`DELETE` | `/api/message/category/{id}/members/` |

**Response đổi (team):** `is_mine`, `created_by` trên list; `sent_by` trên message (§7); quyền detail/results theo §5–§6. **URL không đổi.**

### 15.7 `message` — `BE/message/urls.py` (URL không đổi)

Chi tiết hành vi: **§2.3** · `sent_by`: **§7**.

| Method | Path (sau `/api/message/`) | Manager | Employee (NV) |
|--------|----------------------------|---------|---------------|
| `GET` | `conversations` | ✅ | ✅ nick gán |
| `POST` | `conversations/open` | ✅ | ✅ |
| `GET` | `get-message` | ✅ + `sent_by` | ✅ + `sent_by` |
| `POST` | `note`, `pin` | ✅ | ✅ |
| `POST` | `pin/account` | ✅ | ⚠️ gap access §2.3 |
| `GET` | `poll-detail` | ✅ | ✅ |
| `GET` | `get-conversations`, `get-conversation` | ✅ legacy | ✅ |
| `GET` | `show-all-account-mess` | ✅ legacy | ✅ nick gán |
| `GET` | `category/get` | ✅ legacy | ✅ đọc nhãn team |
| `GET`/`POST`/`PUT`/`PATCH`/`DELETE` | `fast-reply`, `fast-reply/<pk>` | ✅ | ✅ nick gán |
| `GET` | `stickers/search`, `suggest`, `category`, `detail` | ✅ | ✅ |
| `GET`/`POST`/`PUT`/`PATCH`/`DELETE` | `video`, `video/<pk>` | ✅ own | ✅ own |
| `GET`/`POST`/`PUT`/`PATCH`/`DELETE` | `album`, `album/<pk>` | ✅ own | ✅ own |
| `GET`/`POST` | `block-member/block-controls` | ✅ | ❌ `NOT_MANAGER` |
| `GET` | `block-member/admin-groups`, `group-members` | ✅ | ❌ |
| `POST` | `block-member/toggle-control` | ✅ | ❌ |
| `POST` | `block-member/scan-admin-group`, `…/result` | ✅ | ❌ |

**Gửi tin:** WebSocket only — không có REST send trong `message.urls`.

### 15.6 Tóm tắt cho FE — cần sửa gì

| Hạng mục | Đổi URL? | Đổi gì |
|----------|----------|--------|
| Users team endpoints | ❌ | UI mới: employees, assignments, permissions |
| `GET /api/account/` | ❌ | NV thấy subset nick; `scope=messenger` cùng logic |
| Friends | ❌ | Bỏ `type=simple` nếu cần name; **gap NV** §2.1 |
| Groups | ❌ | `type=simple`/`fetchs` giống friends; **gap sync NV** §2.2 |
| Campaign list | ❌ | Đọc `is_mine`, `created_by`; block detail khi `!is_mine` |
| Campaign results DELETE | ❌ | Thêm UI xóa log — path §6 / §15.5 |
| Mess birthday results | ❌ | Path **`/mess-birthday/results/`** — không theo `{category_id}` |
| Chat messenger REST | ❌ | `conversations` + `get-message` — `id_account` nick gán |
| Chat WS/REST | ❌ | Hiển thị `sent_by` trên outbound (§7) |
| Fast reply / sticker | ❌ | NV OK trên nick gán; video/album per-user |
| Block member | ❌ | Ẩn toàn module NV |
| Legacy message API | ❌ | Bundle cũ giữ alias; FE mới dùng envelope §2.3 |
| Permission key vs path | — | `mess_phone` → route `mess-phone-number` |
| Celery poll / campaign log | — | §16 (async task) vs §5.6 (results REST) |

---

## 16. Lấy kết quả async — Celery poll & tra cứu

FE cần **hai mô hình** — nhầm lẫn là lỗi 404 hoặc màn trống.

### 16.1 Hai mô hình

| Mô hình | Ví dụ | Start | Biết xong / lấy data |
|---------|-------|-------|----------------------|
| **A — Celery task** | Gợi ý KB, sync danh bạ/nhóm, thêm nick cookie | `POST` → `data.id_task` | Poll **cùng URL** (hoặc `*/result`) + `id_task` → `task_status === SUCCESS` → `data.result` |
| **B — Campaign worker** | Nhắn bạn, kết bạn, join group, … | `POST .../category/start/` | **Không** `id_task` — poll `GET .../results/` §5.6 |

### 16.2 Envelope poll Celery (mô hình A)

**Bước 1 — Start** (không có `id_task` trong body):

```http
POST /api/friend/friend-recommend/get
{ "id_account": 23 }
```

```json
{
  "success": true,
  "message": "Đã nhận",
  "data": { "id_task": "776e16d7-9a5a-4b01-b708-02525d3a92b2" }
}
```

HTTP **202** khi queue (`api_accepted`).

**Bước 2 — Poll** (body **chỉ** `id_task`):

```http
POST /api/friend/friend-recommend/get
{ "id_task": "776e16d7-..." }
```

| `data.task_status` | HTTP | FE |
|--------------------|------|-----|
| `PENDING` | 202 | Chờ ~1–2s, poll lại |
| `PROGRESS` | 202 | Poll lại |
| `SUCCESS` | 200 | Đọc **`data.result`** |
| *(lỗi)* | 500 | `success: false`, `error_code: CELERY_TASK_FAILED` |

**Khi SUCCESS:**

```json
{
  "success": true,
  "message": "Thành công",
  "data": {
    "task_status": "SUCCESS",
    "result": [ "... payload task ..." ]
  }
}
```

**Gợi ý FE:** interval 1–2s, timeout 60–90s, spinner + “Đang đồng bộ…”.

```typescript
async function pollCeleryTask<T>(
  pollFn: (idTask: string) => Promise<{ data: { task_status?: string; result?: T } }>,
  idTask: string,
): Promise<T> {
  for (let i = 0; i < 60; i++) {
    const res = await pollFn(idTask);
    const { task_status, result } = res.data.data ?? {};
    if (task_status === 'SUCCESS') return result as T;
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error('Task timeout');
}
```

### 16.3 Friends — bảng poll (`BE/friends/urls.py`)

| Mục đích | Start `POST` | Poll | Có `/result`? |
|----------|--------------|------|----------------|
| Gợi ý / lời mời KB | `/api/friend/friend-recommend/get` | **Cùng URL** + `id_task` | ❌ |
| Chấp nhận gợi ý | `/api/friend/friend-recommend/accept` | Cùng URL + `id_task` | ❌ |
| Xóa gợi ý | `/api/friend/friend-recommend/remove` | Cùng URL + `id_task` | ❌ |
| Sync danh bạ Zalo | `/api/friend/get` | Cùng URL + `id_task` | ❌ |
| Sync lời mời đã gửi | `/api/friend/sent-request/get` | Cùng URL + `id_task` | ❌ |
| UID info | `/api/friend/get/uid` | Cùng URL + `id_task` | ❌ |
| Unfriend | `/api/friend/unfriend` | Cùng URL + `id_task` | ❌ |
| Add friend | `/api/friend/add-friend` | Cùng URL + `id_task` | ❌ |
| **Danh bạ đã sync DB** | — | `GET /api/friend/?id_account=` (§2.1) | — |

**`friend-recommend` — shape `data.result`:** mảng item Zalo:

```json
{
  "userId": "2559106446855279908",
  "zaloName": "Đời Vô Thường Lắm",
  "avatar": "https://...",
  "type": "friend_request"
}
```

| `type` | Ý nghĩa |
|--------|---------|
| `friend_request` | Lời mời đến — BE ghi DB nền |
| `suggest` | Gợi ý kết bạn |

**Lỗi thường gặp:** gọi `/api/friend/friend-recommend/result` → **404** (route không tồn tại).

### 16.4 Groups — poll tách `result`

| Mục đích | Start | Poll |
|----------|-------|------|
| Sync list nhóm | `POST /api/group/get` `{ "id_accounts": [23] }` | `POST /api/group/get/result` `{ "id_task" }` |
| Link nhóm | `POST /api/group/get/link` | `POST /api/group/get/link/result` |
| Member nhóm | `POST /api/group/get-member` | `POST /api/group/get-member/result` |
| **List đã có DB** | — | `GET /api/group/?id_account=23` (§2.2) |

### 16.5 Account — poll tách `result`

| Mục đích | Start | Poll |
|----------|-------|------|
| Thêm nick cookie | `POST /api/account/add` | `POST /api/account/add/result` |
| Xóa nick | `POST /api/account/delete` | `POST /api/account/delete/result` |
| Check nick | `POST /api/account/check-account` | `POST /api/account/check-account/result` |

Sau login OK: BE tự `post_login_sync` (friends→groups→links→members) — FE có thể chỉ `GET /api/friend/` / `GET /api/group/` sau vài giây, không bắt buộc poll task login.

### 16.6 Campaign — tóm tắt (chi tiết §5.6)

```
POST .../category/start/  → 200 ngay
        ↓
Poll GET .../category/{id}/results/?page=1&number_per_page=50
        ↓
Hiển thị data.results (+ statistics nếu cần chart)
```

| Loại | Path results |
|------|----------------|
| Hầu hết | `/api/campaign/{prefix}/category/{id}/results/` |
| Mess birthday | `/api/campaign/mess-birthday/results/` |

Stop: `POST .../category/stop/` · Xóa log: `DELETE .../results/` + `id_results` §6.

### 16.7 Checklist nhanh FE

- [ ] Sync Zalo (friend/group/account): giữ `id_task`, poll đúng URL (bảng §16.3–16.5)
- [ ] Không invent path `*/result` nếu BE không khai báo (friend → 404)
- [ ] Campaign: sau start → poll **GET results**, không `id_task`
- [ ] Màn log campaign: auto-refresh 3–10s khi `status=1`; dừng khi stop hoặc user rời màn
- [ ] NV: chỉ hiện log được phép §5.2; `is_mine=false` → không mở màn results

---

*Cập nhật khi đổi `users/urls.py`, `account/access.py`, `campaign/access.py`, `CategoryTeamListMixin`, `friends/views/basic_views.py`, `groups/views/basic_views.py`, `message/views/*`, hoặc pattern poll Celery.*