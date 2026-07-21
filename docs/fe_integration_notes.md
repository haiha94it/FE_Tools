# Hướng dẫn FE — Multi-nick Mess Member Group + All-group chung + Excel

**Trạng thái:** Guide theo design **đã chốt** (BE implement sau APPROVED).  
**Ngày:** 2026-07-21  
**Design BE:** `campaign-mess-member-group-multi-nick-design.md`  
**Logic runtime cũ (sẽ thay):** `campaign-mess-member-group-logic.md`

Envelope API chung Care: `success` / `message` / `data` / `error_code` (xem skill `api-envelope` / pattern project).  
Mọi request dưới đây cần **auth** (token như các API campaign khác).

---

## 0. Tóm tắt thay đổi FE phải làm

| # | Việc | Ảnh hưởng màn |
|---|------|----------------|
| 1 | **Gom all-group** → 1 URL mới; **xóa** gọi path spam/invite cũ | Spam link, Invite SĐT nhóm, Mess TV nhóm, mọi picker “nhóm chung multi-nick” |
| 2 | **Mess-member** multi-nick + globalId (breaking form create/edit) | Màn Nhắn TV nhóm |
| 3 | API **members** mới (list TV theo global) | Màn Nhắn TV nhóm — bước chọn TV |
| 4 | `assign_mode` chia / all | Form mess-member |
| 5 | Edit khi **đang chạy**: chỉ tin/media | Form mess-member |
| 6 | Results: filter nick + thời gian; **Excel client** | Kết quả / thống kê mess-member |

**Không** còn:

- `id_account` (1 nick) → dùng `id_accounts[]`
- `id_group` + `uids[]` → `group_global_id` + `member_global_ids[]`
- `list_uid` trên detail

---

## 1. All-group dùng chung (bắt buộc đổi mọi màn liên quan)

### 1.1 URL

| Trước (XÓA — BE dọn code, không alias) | Sau (DÙNG) |
|----------------------------------------|------------|
| `POST /api/campaign/spam-link-group/category/all-group/` | **`POST /api/campaign/all-group/`** |
| `POST /api/campaign/invite-phone-group/category/all-group/` | **cùng URL trên** |
| (mess-member không có / hoặc path riêng) | **cùng URL trên** |

### 1.2 Request

```http
POST /api/campaign/all-group/
Authorization: Bearer <token>
Content-Type: application/json

{
  "id_accounts": [101, 102, 103],
  "keyword": ""
}
```

| Field | Bắt buộc | Mô tả |
|-------|----------|--------|
| `id_accounts` | Có | Mảng id nick Zalo user được phép dùng |
| `keyword` | Không | Lọc tên nhóm (icontains), `""` hoặc omit = full |

**Quyền:** user login + nick thuộc team/accessible.  
**Không** cần permission từng loại campaign (spam / invite / mess) để gọi picker này.

### 1.3 Response (chuẩn mới)

```json
{
  "success": true,
  "message": "OK",
  "data": [
    {
      "id": 55,
      "uid": "group_uid_cua_nick_dau",
      "name": "Nhóm bán hàng",
      "avt": "https://...",
      "total_member": 320,
      "link_group": "https://zalo.me/g/xxxx",
      "is_joined": true,
      "is_blocked_chat": false,
      "globalId": "GROUP_GLOBAL_XXX"
    }
  ]
}
```

| Field | Dùng cho |
|-------|----------|
| `globalId` | **Mess-member:** lưu `group_global_id` khi tạo kịch bản |
| `id` | Instance `GroupModel` của **nick đầu** trong `id_accounts` (tiện UI); **không** dùng làm identity multi-nick |
| `name`, `avt`, `total_member` | Render list |
| `link_group` | Invite/spam nếu cần link; mess-member **không bắt** link |

### 1.4 Hành vi match (BE)

- Gộp nhóm theo **`globalId`**, **không** còn so tên + avatar.  
- 1 nick → mọi nhóm joined (đã có global).  
- ≥2 nick → chỉ nhóm **mọi nick đều join** (cùng globalId).  
- Nhóm chưa gắn global → **không hiện** (user cần sync/quét nhóm).

### 1.5 Checklist FE all-group

- [ ] Thay base URL / function API chung `fetchCommonGroups(id_accounts, keyword)`  
- [ ] Xóa call path `spam-link-group/.../all-group/` và `invite-phone-group/.../all-group/`  
- [ ] Spam link form: dùng `name`/`avt`/`link_group` như product hiện tại (từ response mới)  
- [ ] Invite phone: tương tự  
- [ ] Mess-member: **bắt buộc** lấy `globalId` → state `group_global_id`  
- [ ] Empty state: “Không có nhóm chung / chưa sync global”  

---

## 2. Luồng UI Mess-member (multi-nick) — end to end

```text
1. Chọn nhiều nick (id_accounts)
2. POST /api/campaign/all-group/ → list nhóm chung
3. User chọn 1 nhóm → lưu group_global_id (= data[i].globalId)
4. POST .../mess-member-group/category/members/
      { id_accounts, group_global_id }
   → list TV (member_global_id, name, avatar, accounts_ready…)
5. User chọn TV → member_global_ids[]
6. Chọn assign_mode: "distribute" | "all"
7. Bật send_message / add_friend + nội dung + media + khung giờ
8. POST category/ (tạo) hoặc PUT category/<id>/
9. POST category/start/ { id_categories, type: "new" }
10. WS status + GET results / statistics + Excel client
```

### 2.1 `assign_mode` (giải thích UI)

| Value | Label UI gợi ý | Ý nghĩa |
|-------|----------------|---------|
| `distribute` | **Chia thành viên cho các nick** | Mỗi TV chỉ **1 nick** xử lý; mỗi nhịp BE gán động cho nick đang “đạt” |
| `all` | **Mọi nick gửi tất cả thành viên** | Mỗi TV bị **mọi nick** tương tác (nhiều lượt hơn) |

**Không nhầm** với API `all-group` (chỉ là picker nhóm).

### 2.2 Gợi ý copy UI

- Chia: *“Hệ thống chia TV cho các nick còn hoạt động mỗi phiên; nick lỗi không ‘ôm’ TV.”*  
- All: *“Mỗi nick sẽ lần lượt nhắn/kết bạn toàn bộ TV đã chọn (số lượt ≈ nick × TV).”*  
- Cảnh báo mode all khi `id_accounts.length * member_global_ids.length` lớn (vd > 2000) — optional toast.

---

## 3. API Mess-member chi tiết

Base: `/api/campaign/mess-member-group/`

### 3.1 List kịch bản

```http
GET /api/campaign/mess-member-group/category/
```

**Response item (basic) — field quan trọng:**

| Field | Ghi chú |
|-------|---------|
| `id`, `name`, `status`, `start_time` | Như cũ |
| `member_count` | `len(list_member_global)` — **không** còn `list_uid_count` |
| `is_mine`, `created_by`, `status_label` | Team collab |
| (detail) `assign_mode`, `accounts`, `group_global_id` | Lấy ở GET detail |

**Status category (giữ):**

| status | UI |
|--------|-----|
| 4 | Chưa chạy |
| 1 | Đang chạy |
| 0 | Tạm dừng |
| 2 | Hoàn thành |
| 3 | Dừng do limit/chặn |

WS (như cũ): event `status_category_mess_mem_group` trên group `campaign_{userId}` — payload `{ id, status }`.

### 3.2 List thành viên nhóm (API mới)

```http
POST /api/campaign/mess-member-group/category/members/
Content-Type: application/json

{
  "id_accounts": [101, 102],
  "group_global_id": "GROUP_GLOBAL_XXX"
}
```

**Response `data`:** mảng

```json
[
  {
    "member_global_id": "MEM_G1",
    "name": "Nguyễn Văn A",
    "avatar": "https://...",
    "is_admin": false,
    "is_creator": false,
    "accounts_ready": [101, 102],
    "accounts_missing_friend": []
  }
]
```

| Field | FE dùng |
|-------|---------|
| `member_global_id` | Checkbox value → `member_global_ids` lúc save |
| `name`, `avatar` | Render list |
| `accounts_ready` | Nick đã quét/có Friend với TV này (chỉ gợi ý UI) |
| `accounts_missing_friend` | Nick chưa có Friend — **không chặn chọn/lưu** |

**UI gợi ý (chốt product):**

- Hiện badge “X/Y nick sẵn sàng” = `accounts_ready.length / id_accounts.length`  
- **Cho chọn & lưu** kể cả `0/Y` hoặc `k/Y` (k &lt; Y) — **không** disable, **không** chặn submit vì “chưa quét”  
- Tooltip gợi ý: *“Nick chưa quét TV này sẽ tự bỏ qua khi chạy; không bắt quét lại mới lưu.”*  
- Optional filter UI “chỉ hiện TV ≥1 nick sẵn sàng” — **không** bắt buộc  
- Disable / ẩn chính các nick (self) — BE đã exclude  

**Runtime BE:**

- Chỉ gán TV cho nick **có Friend** với TV đó  
- TV **0 nick** quét được → **bỏ khỏi queue** (skip), kịch bản chạy TV còn lại  
- Nick thiếu Friend với 1 TV → **không gán** cặp đó; mode chia: nick khác (có Friend) vẫn có thể nhận TV; mode all: cặp nick×TV đó skip  

**Lưu ý:** Không dùng `friend.uid` từ API group cũ làm identity lưu. Chỉ **`member_global_id`**.

### 3.3 Tạo kịch bản

```http
POST /api/campaign/mess-member-group/category/
```

```json
{
  "name": "Chào TV nhóm VIP",
  "id_accounts": [101, 102],
  "group_global_id": "GROUP_GLOBAL_XXX",
  "member_global_ids": ["MEM_G1", "MEM_G2", "MEM_G3"],
  "assign_mode": "distribute",
  "send_message": true,
  "add_friend": true,
  "contents": ["Chào [name]! [r]"],
  "first_messages": ["Xin chào [name], cho mình kết bạn nhé"],
  "type": null,
  "images": [],
  "id_video": null,
  "id_album": null,
  "delay_time": 90,
  "number_count": 30,
  "from_time": "08:00:00",
  "to_time": "21:00:00"
}
```

#### Field bắt buộc / rule

| Field | Rule |
|-------|------|
| `name` | Có, unique theo user |
| `id_accounts` | ≥1, nick hợp lệ team |
| `group_global_id` | Có — từ all-group |
| `member_global_ids` | ≥1 — từ members/ |
| `assign_mode` | `distribute` \| `all` (default BE: `distribute` nếu omit) |
| `send_message` / `add_friend` | Ít nhất **1** true |
| `first_messages` | Bắt buộc non-empty nếu `add_friend` |
| `contents` / media | Nếu `send_message`: có text hoặc `type` image/video/album |
| `delay_time`, `number_count` | Số nguyên > 0 |
| `from_time`, `to_time` | **`HH:MM:SS`** (vd `08:00:00`) |

#### Media (giống campaign mess khác)

| `type` | Field |
|--------|--------|
| omit / null | Chỉ text `contents` |
| `"image"` | `images: ["media/..."]` — tối đa 1 ảnh jpg/jpeg/png |
| `"video"` | `id_video` |
| `"album"` | `id_album` |

Placeholder: `[name]`, `[r]`, `[gender]`.

#### Lỗi hay gặp (handle UI)

| error / message | Hành động FE |
|-----------------|--------------|
| Nick chưa join / chưa global group | Bỏ nick hoặc sync nhóm |
| (đã bỏ) ACCOUNTS_NOT_SCANNED | **Không còn** reject vì nick chưa quét Friend — cho lưu, runtime skip |
| Phải chọn nhắn tin hoặc kết bạn | Bật 1 flag |
| TIME_WINDOW_* | Nới khung giờ hoặc giảm `number_count`/`delay_time` |

### 3.4 Chi tiết / Sửa

```http
GET /api/campaign/mess-member-group/category/<id>/
PUT|PATCH /api/campaign/mess-member-group/category/<id>/
```

**GET detail:** full fields gồm `accounts` (ids), `group_global_id`, `list_member_global`, `assign_mode`, media, times, `status`…

**Khi `status === 1` (đang chạy):**

| Cho sửa | Không cho sửa (disable UI + BE reject) |
|---------|----------------------------------------|
| `contents`, `first_messages` | `id_accounts` |
| `type`, `images`, `id_video`, `id_album` | `group_global_id` |
| | `member_global_ids` / list TV |
| | `assign_mode` |
| | (không đổi cấu trúc queue) |

Nhịp **sau** dùng nội dung/media mới.

**Khi `status` ∈ {0, 2, 3, 4}:** cho sửa full (rồi start lại `type: "new"` nếu cần rebuild queue).

### 3.5 Copy

```http
POST /api/campaign/mess-member-group/category/<id>/copy/
{ "name": "Tên mới" }
```

Copy accounts, group, members, mode, media… — status chưa chạy.

### 3.6 Start / Stop

```http
POST /api/campaign/mess-member-group/category/start/
{
  "id_categories": [10],
  "type": "new"
}
```

| `type` | Ý nghĩa |
|--------|---------|
| `"new"` | Chạy lại từ đầu: pool TV = full `member_global_ids` đã lưu |
| omit / khác | Tiếp tục queue còn lại (nếu đã hết → lỗi hoàn thành) |

```http
POST /api/campaign/mess-member-group/category/stop/
{ "id_categories": [10] }
```

### 3.7 Xóa kịch bản

```http
DELETE /api/campaign/mess-member-group/category/<id>/
```

### 3.8 Kết quả (results)

```http
GET /api/campaign/mess-member-group/category/<id>/results/?page=1&number_per_page=100&id_account=101&start_time=...&end_time=...
```

| Query | Mô tả |
|-------|--------|
| `page`, `number_per_page` | Phân trang (default ~100) |
| `id_account` | Optional — lọc log theo **1 nick** |
| `start_time`, `end_time` | Optional — lọc theo thời gian tạo log (BE: format thống nhất; FE pad full ngày nếu chỉ chọn 1 ngày — vd 20/07 00:00–23:59:59) |

**Item log (giữ UX cũ):**

| Field | Ý nghĩa UI |
|-------|------------|
| `created_at` | Thời điểm |
| `account` | Nick gửi (id) — map tên/avatar nick từ store nick |
| `name` | Tên người nhận (snapshot) |
| `content` / `first_message` | Nội dung đã gửi / lời KB |
| `images`, `thumb_url` | Media |
| `status_send_message` | 1 OK · 0 lỗi · 3 limit · 2 N/A |
| `status_send_message_message` | Lý do fail tin |
| `status_add_friend` | tương tự |
| `status_add_friend_message` | Lý do fail KB / “Đã là bạn bè” |

**Xóa log:**

```http
DELETE /api/campaign/mess-member-group/category/<id>/results/
{ "id_results": [1, 2, 3] }
```

### 3.9 Statistics

```http
GET /api/campaign/mess-member-group/statistics/?id_category=10&start_time=20-07-2026&end_time=20-07-2026
```

Format ngày thống kê (BE hiện tại): **`%d-%m-%Y`**.

**Response `data`:**

```json
{
  "add_friend_success": 10,
  "add_friend_failure": 2,
  "send_message_success": 12,
  "send_message_failure": 1
}
```

(FE có thể thêm card theo nick bằng cách aggregate client từ results `?id_account=` nếu cần.)

---

## 4. Xuất Excel (client-side — không API file BE)

### 4.1 Nguyên tắc

- BE **không** trả file `.xlsx`.  
- FE gọi **results** (và/hoặc statistics) → build sheet → download (SheetJS / ExcelJS / CSV).  
- Giống hướng “lấy data statistics/results rồi FE tự xuất” trước đây.

### 4.2 Excel theo khung thời gian (use case)

User chạy 3 ngày nhưng chỉ muốn **ngày 20/7**:

1. Date range picker: start = `20/07/2026 00:00:00`, end = `20/07/2026 23:59:59` (hoặc map sang query BE).  
2. Optional: filter `id_account` nếu chỉ 1 nick.  
3. Fetch results (có thể multi-page):

```text
page=1..N, number_per_page=200
id_account?
start_time / end_time = range đã chọn
```

4. Gộp `data.results` (hoặc field paginated envelope project) thành 1 mảng.  
5. Map cột Excel → download.

### 4.3 Cột Excel gợi ý (1 sheet “Kết quả”)

| Cột | Nguồn field |
|-----|-------------|
| Thời gian | `created_at` (format `DD/MM/YYYY HH:mm:ss`) |
| Nick (id) | `account` |
| Nick (tên) | map từ cache ZaloAccount FE |
| Người nhận | `name` |
| Nội dung tin | `content` |
| Lời kết bạn | `first_message` |
| TT gửi tin | map status_send_message → text |
| Lý do tin | `status_send_message_message` |
| TT kết bạn | map status_add_friend |
| Lý do KB | `status_add_friend_message` |
| Ảnh/Video | có/không hoặc URL |

**Map status → text:**

| Code | Text |
|------|------|
| 1 | Thành công |
| 0 | Thất bại |
| 3 | Hạn chế / limit |
| 2 | Không chạy |

### 4.4 Sheet “Tóm tắt” (optional)

Gọi `statistics` cùng range (nếu stats filter theo ngày) hoặc đếm client từ rows:

| Metric | |
|--------|--|
| Gửi tin OK / fail | count status |
| Kết bạn OK / fail | count status |
| Tổng dòng | length |
| Theo nick | groupBy `account` |

### 4.5 Pseudo-code FE

```javascript
async function exportMessMemberResultsExcel({
  categoryId,
  idAccount,      // optional
  startTime,      // Date
  endTime,        // Date
}) {
  const rows = [];
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const res = await api.get(
      `/api/campaign/mess-member-group/category/${categoryId}/results/`,
      {
        params: {
          page,
          number_per_page: 200,
          id_account: idAccount || undefined,
          start_time: formatForApi(startTime),
          end_time: formatForApi(endTime),
        },
      }
    );
    const chunk = unwrapPaginated(res); // theo envelope project
    rows.push(...chunk.items);
    hasMore = chunk.hasNext;
    page += 1;
  }
  const sheetData = rows.map((r) => ({
    "Thời gian": formatDt(r.created_at),
    "Nick ID": r.account,
    "Người nhận": r.name,
    "Nội dung": r.content || "",
    "Lời KB": r.first_message || "",
    "TT tin": statusLabel(r.status_send_message),
    "Lý do tin": r.status_send_message_message || "",
    "TT KB": statusLabel(r.status_add_friend),
    "Lý do KB": r.status_add_friend_message || "",
  }));
  downloadXlsx(sheetData, `mess-member-${categoryId}-${dateStamp()}.xlsx`);
}
```

### 4.6 UX nút Excel

- Đặt cạnh bảng results: **Xuất Excel**  
- Modal: từ ngày-giờ → đến ngày-giờ (+ optional nick)  
- Loading khi fetch multi-page  
- Empty: “Không có kết quả trong khoảng thời gian”  

---

## 5. Mapping breaking: form cũ → form mới

| Form / state cũ | Form mới |
|-----------------|----------|
| `id_account: number` | `id_accounts: number[]` |
| `id_group: number` | `group_global_id: string` (từ all-group `globalId`) |
| `uids: string[]` | `member_global_ids: string[]` |
| — | `assign_mode: "distribute" \| "all"` |
| List TV từ `show_group_member` + friend.uid | `POST .../members/` + `member_global_id` |
| all-group spam/invite path riêng | `POST /api/campaign/all-group/` |

**Kịch bản cũ trên server:** coi như test — user **tạo lại** sau deploy BE. FE có thể ẩn/xóa cache local category mess-member cũ.

---

## 6. Checklist FE theo màn

### 6.1 Shared

- [ ] `api.campaignAllGroup({ id_accounts, keyword })` → `/api/campaign/all-group/`  
- [ ] Xóa constant URL all-group spam & invite  
- [ ] Parse `data[].globalId`  

### 6.2 Spam-link & Invite-phone

- [ ] Picker nhóm trỏ URL mới  
- [ ] Vẫn save field product riêng (group_invite name\|avt, group_link, …) từ item response — **không** đổi contract save spam/invite trừ khi product yêu cầu  
- [ ] Smoke: 2 nick → chỉ nhóm chung global  

### 6.3 Mess-member

- [ ] Multi-select nick  
- [ ] All-group → chọn nhóm → `group_global_id`  
- [ ] Members API → multi-select TV → `member_global_ids`  
- [ ] Radio/toggle `assign_mode`  
- [ ] Create/update body mới  
- [ ] Disable fields cấu trúc khi `status===1`  
- [ ] Start/stop/copy/delete  
- [ ] WS status  
- [ ] Results: filter nick + date range  
- [ ] Excel client §4  
- [ ] Statistics cards  

### 6.4 Regression

- [ ] 1 nick only vẫn chạy (distribute ≈ all về số lượt)  
- [ ] Empty nhóm chung  
- [ ] TV `0/N` hoặc `k/N` nick sẵn sàng: **vẫn chọn + lưu được**  
- [ ] Không bắt user quét lại mới lưu (badge chỉ cảnh báo)  

---

## 7. Timeline phối hợp BE/FE

| Phase | BE | FE |
|-------|----|----|
| Doc | Design + guide này | Review guide |
| Code BE | all-group 1 path + **xóa** path cũ; mess-member multi-nick; members; results filter | — |
| FE | — | Đổi all-group **trước** (spam/invite/mess) để không 404 khi BE xóa path cũ |
| | Deploy BE + FE **cùng cửa sổ** hoặc FE feature-flag URL mới trước cutover | |

**Cảnh báo deploy:** BE xóa `.../spam-link-group/.../all-group/` và `.../invite-phone-group/.../all-group/` → FE **phải** ship URL mới cùng lúc (hoặc trước với dual-call tạm — không khuyến nghị nếu BE đã dọn).

---

## 8. FAQ nhanh

**Q: all-group và assign_mode all có giống nhau không?**  
A: Không. all-group = chọn nhóm. assign_mode all = mọi nick × mọi TV khi chạy.

**Q: Cần link nhóm mess-member không?**  
A: Không. Chỉ `group_global_id`.

**Q: UID TV lấy ở đâu?**  
A: FE **không** lưu UID. BE lúc chạy lấy UID theo từng nick qua Friend + globalId.

**Q: Excel BE?**  
A: Không. FE fetch results theo filter → xuất file.

**Q: Path all-group cũ còn không?**  
A: **Không** — BE dọn; FE chỉ còn `/api/campaign/all-group/`.

---

## 9. Tham chiếu

| Doc | Nội dung |
|------|----------|
| `campaign-mess-member-group-multi-nick-design.md` | Spec BE đầy đủ |
| `campaign-mess-member-group-logic.md` | Runtime **cũ** 1 nick (tham chiếu đến khi BE xong) |
| `campaign-spam-link-group-logic.md` | Spam (đổi URL all-group) |

---

*Guide FE — cập nhật khi BE ship field/format thực tế nếu lệch (ghi changelog dưới).*
