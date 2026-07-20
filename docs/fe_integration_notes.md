# FE — Album & Video (lưu trong chat + dùng lại ở campaign mess)

**Mục đích:** Hướng dẫn Frontend:
1. **Lưu** album/video từ hộp chat → thư viện per-user.
2. **Xem lại / chọn / xóa / preview** danh sách khi **setup chiến dịch gửi tin** (app campaign) — đây là chỗ user quản lý & chọn media chính.
3. Gắn `id_video` / `id_album` vào category mess để worker gửi kèm.

**Chỉ áp dụng chiến dịch gửi tin nhắn** (mess + spam-link có gửi media). **Không** thêm picker album/video vào add-friend / join-group / invite-group / notif thuần.

**Phạm vi code:**
- Model: `BE/message/models.py` — `VideoModel`, `AlbumImageModel`, `ImageModel`
- REST thư viện media: `BE/message/urls.py` → `/api/message/video`, `/api/message/album`
- View: `message/views/saved_video_views.py`, `message/views/handle_album_views.py`
- Serializer: `message/serializers.py`
- Gửi realtime trong chat (WS): `message/handlers.py` + `message/send_actions.py` (`forward-video`, `forward-album`, `share-video`)
- Campaign mess: `BE/campaign/views/mess_*`, `spam_link_group_*` + tasks `campaign/tasks/mess_*`

**Không nhầm với:**
- Nội dung tin trong hội thoại → `GlobalMessageDetailsModel.raw_payload` (xem `fe_chat_architecture.md` / `chat_payload.py`)
- Video kênh Zalo Channel → `channel_zalo` / `ZaloVideo.py` (khác domain)

---

## 0. Khái niệm nhanh

```
┌─────────────────── Hộp chat ───────────────────┐
│  Tin nhắn có video / album (payload Zalo)      │
│       │                                        │
│       ▼  User bấm "Lưu"                        │
│  POST /api/message/video  hoặc  /album         │
│       │                                        │
│       ▼                                        │
│  Thư viện per-user (VideoModel / AlbumImage)   │
└────────────────────┬───────────────────────────┘
                     │
                     ▼
┌──── Setup chiến dịch GỬI TIN (app Campaign) ────┐
│  Form category: chọn đính kèm                   │
│    type = video  → hiện LIST video đã lưu       │
│    type = album  → hiện LIST album đã lưu       │
│  Mỗi dòng: chọn · icon mắt (preview) · nút xóa  │
│  Submit: id_video / id_album + type             │
└─────────────────────────────────────────────────┘
```

| Khái niệm | Ý nghĩa |
|-----------|---------|
| **Thư viện media** | Media user đã lưu — **theo `request.user`**, **không** theo nick (`ZaloAccount`). API: `GET/POST/DELETE /api/message/video` · `/album` |
| **Chỗ user xem lại danh sách (chính)** | Form **setup / sửa** chiến dịch **gửi tin** — khi chọn “gửi kèm video” hoặc “gửi kèm album” → FE load list tương ứng (không có trang menu riêng bắt buộc) |
| **Attachment campaign** | Category trỏ FK `video` / `album` (id trong thư viện) + field `type` — **chỉ** campaign mess (§7.1) |
| **Gửi trong chat (phụ)** | Lưu từ bubble + optional forward WS; không thay picker campaign |

**Quyền team:** NV chỉ thấy / lưu / xóa media của chính mình (`user=actor`). Manager không share album/video cho NV qua assignment.

---

## 1. Envelope API chung

Mọi REST qua `api_success` / `api_error`:

```json
{
  "success": true,
  "message": "OK",
  "data": { }
}
```

Lỗi:

```json
{
  "success": false,
  "message": "...",
  "error_code": "OPTIONAL"
}
```

FE: unwrap `success` + `data`. Auth: JWT như các API khác.

Base path message:

```text
/api/message/
```

---

## 2. Model dữ liệu (để map UI)

### 2.1 `VideoModel`

| Field DB | Kiểu | Ý nghĩa |
|----------|------|---------|
| `id` | int | PK — dùng làm `id_video` khi gắn campaign |
| `user` | FK User | Chủ sở hữu |
| `video_url` | URL | URL video Zalo / CDN |
| `thumb_url` | URL | Thumbnail |
| `duration` | int | **milliseconds** |
| `width`, `height` | int | Kích thước |
| `file_size` | int | Bytes |
| `name_video` | string | Tên hiển thị do user đặt |

### 2.2 `AlbumImageModel` + `ImageModel`

**Album:**

| Field | Ý nghĩa |
|-------|---------|
| `id` | PK — dùng làm `id_album` campaign |
| `name` | Tên album (user đặt) |
| `groupLayoutId` | ID layout album Zalo (bắt buộc khi forward) |
| `totalItemInGroup` | Số ảnh trong album (string) |

**Ảnh con (`images[]`):**

| Field | Ý nghĩa |
|-------|---------|
| `id` | PK ảnh |
| `url` | URL ảnh |
| `width`, `height` | string |
| `file_size` | string |
| `idInGroup` | Thứ tự trong album Zalo |
| `previewThumb` | Thumb (optional) |

---

## 3. API Video — CRUD thư viện

Prefix: **`/api/message/video`**

Code: `saved_video_api_view`.

### 3.1 List — `GET /api/message/video`

**Response `data`:** mảng (không paginate):

```json
[
  {
    "id": 12,
    "video_url": "https://...",
    "name_video": "QC tháng 7"
  }
]
```

**Lưu ý UI:** list **không** trả `thumb_url` / `duration`.  
→ Card list: hiện tên + icon; cần thumb thì `GET /video/<id>` hoặc cache sau khi save.

### 3.2 Detail — `GET /api/message/video/<pk>`

**Response `data`:** full fields (snake_case):

```json
{
  "id": 12,
  "user": 5,
  "video_url": "https://...",
  "thumb_url": "https://...",
  "duration": 15200,
  "width": 720,
  "height": 1280,
  "file_size": 2345678,
  "name_video": "QC tháng 7"
}
```

404 nếu không thuộc user hiện tại.

### 3.3 Lưu video — `POST /api/message/video`

Dùng khi user lưu video từ tin nhắn chat (hoặc nguồn có đủ metadata).

**Body — camelCase (WriteSerializer):**

```json
{
  "videoUrl": "https://...",
  "thumbUrl": "https://...",
  "duration": 15200,
  "width": 720,
  "height": 1280,
  "fileSize": 2345678,
  "nameVideo": "QC tháng 7"
}
```

| Field body | Required | Map DB |
|------------|----------|--------|
| `videoUrl` | ✓ | `video_url` |
| `thumbUrl` | ✓ | `thumb_url` |
| `duration` | ✓ | ms |
| `width`, `height` | ✓ | |
| `fileSize` | ✓ | `file_size` |
| `nameVideo` | ✓ | `name_video` |

**Nguồn field từ tin chat:** parse `raw_payload` / attachment video Zalo (cùng shape khi forward). FE copy metadata từ bubble đang xem → form đặt tên → POST.

**Response success (201):**

```json
{
  "success": true,
  "message": "Video đã được lưu thành công",
  "data": {
    "video_id": 12,
    "id": 12,
    "user": 5,
    "video_url": "...",
    "thumb_url": "...",
    "duration": 15200,
    "width": 720,
    "height": 1280,
    "file_size": 2345678,
    "name_video": "QC tháng 7"
  }
}
```

**Lỗi nghiệp vụ:**

| Message | Khi |
|---------|-----|
| `Tên video đã tồn tại` | Cùng `name_video` + cùng user |
| `Video đã được lưu với tên "..."` | Trùng `video_url` đã lưu |

### 3.4 Đổi tên — `PUT|PATCH /api/message/video/<pk>`

**Body (snake_case — ModelSerializer):**

```json
{ "name_video": "Tên mới" }
```

**Response:** full detail (như GET detail).

### 3.5 Xóa một — `DELETE /api/message/video/<pk>`

Success: `"Video đã được xóa thành công"`.

### 3.6 Xóa nhiều — `DELETE /api/message/video`

**Body:**

```json
{ "ids": [12, 15, 20] }
```

Success: `"Đã xóa N video"`.

---

## 4. API Album — CRUD thư viện

Prefix: **`/api/message/album`**

Code: `saved_album_api_view` + Celery `image_tasks` (persist từng ảnh).

### 4.1 List — `GET /api/message/album`

**Response `data`:** mảng album + nested `images` (prefetch):

```json
[
  {
    "id": 3,
    "user": 5,
    "name": "Album sản phẩm",
    "groupLayoutId": "1234567890",
    "totalItemInGroup": "4",
    "images": [
      {
        "id": 10,
        "album": 3,
        "url": "https://...",
        "width": "1080",
        "height": "1080",
        "file_size": "120000",
        "idInGroup": "0",
        "previewThumb": null
      }
    ]
  }
]
```

### 4.2 Detail — `GET /api/message/album/<pk>`

Cùng shape 1 object (có `images`).

### 4.3 Lưu album — `POST /api/message/album`

**Body:**

```json
{
  "groupLayoutId": "1234567890",
  "totalItemInGroup": "4",
  "nameAlbum": "Album sản phẩm",
  "images": [
    {
      "url": "https://...",
      "width": "1080",
      "height": "1080",
      "file_size": "120000",
      "idInGroup": "0"
    },
    {
      "url": "https://...",
      "width": "1080",
      "height": "1080",
      "idInGroup": "1"
    }
  ]
}
```

| Field | Required | Ghi chú |
|-------|----------|---------|
| `groupLayoutId` | ✓ | Từ payload album Zalo |
| `totalItemInGroup` | ✓ | Thường = số phần tử `images` |
| `images` | ✓, non-empty | List dict |
| `nameAlbum` | optional | Map → `name` |

**Mỗi phần tử `images[]` (task đọc):**

| Key | Required logic | Ghi chú |
|-----|----------------|---------|
| `url` | ✓ | URL ảnh |
| `width`, `height` | nên có | |
| `idInGroup` | nên có | Thứ tự album Zalo |
| `file_size` | optional | Nếu **thiếu**, worker tự HEAD/GET lấy `Content-Length` (chậm hơn, cần proxy user) |

**Response (201):**

```json
{
  "success": true,
  "message": "Album đã được lưu thành công"
}
```

**Quan trọng — async images:**

1. View **tạo album ngay** (`AlbumImageModel`).
2. Ảnh ghi DB qua **`image_tasks.delay`** (Celery) — **không** nằm trong response POST.
3. FE sau POST:
   - Toast success “đang lưu ảnh…”
   - Poll `GET /album/<id>` đến khi `images.length` khớp `totalItemInGroup`, **hoặc**
   - Refresh list sau vài giây.

Không có `album_id` trong body response success hiện tại — FE nên:

- **Cách ổn định:** `GET /api/message/album` sau POST, tìm album mới nhất (`order_by -id`) cùng `name` / `groupLayoutId`, **hoặc**
- Mở rộng BE sau (trả `data: { id }`) nếu product cần id ngay — hiện code chưa trả id.

> Agent/dev: nếu FE cần `id` đồng bộ, bổ sung `data=AlbumImageSerializer(album).data` vào response POST là cải tiến nhỏ — ngoài scope doc này nếu chưa đổi code.

### 4.4 Đổi tên — `PUT|PATCH /api/message/album/<pk>`

**Body:**

```json
{ "name": "Tên album mới" }
```

Response: full album + images.

### 4.5 Xóa một — `DELETE /api/message/album/<pk>`

Cascade xóa `ImageModel` con.

### 4.6 Xóa nhiều — `DELETE /api/message/album`

```json
{ "ids": [3, 4] }
```

---

## 5. UX hộp chat — lưu từ tin nhắn

### 5.1 Nhận diện bubble có video / album

Trong `message_details` / `raw_payload` (schema `chat_payload.py`), các type media liên quan thường gồm:

- `chat.video.msg` — video
- `chat.photo` — ảnh đơn / có thể group layout album
- (các share media khác tùy parse hiện có trên FE)

FE lấy metadata đủ field §3.3 / §4.3 từ payload bubble (URL, size, `groupLayoutId`, …).

### 5.2 Flow “Lưu video”

```text
User long-press / menu bubble video
  → Modal nhập nameVideo
  → POST /api/message/video  (metadata từ bubble)
  → success → invalidate cache list video
```

### 5.3 Flow “Lưu album”

```text
User menu bubble album (≥2 ảnh / groupLayout)
  → Modal nhập nameAlbum
  → POST /api/message/album
  → poll GET detail đến khi có images
```

### 5.4 Xem lại danh sách — ưu tiên ở campaign mess

**User xem / chọn / xóa / preview list video·album chủ yếu khi setup chiến dịch gửi tin** (§7.4) — không bắt buộc màn “Thư viện” riêng trong menu app.

Chat chỉ cần: **lưu** từ bubble (+ optional forward §6). Quản lý list (list + mắt + xóa) làm **trong form campaign mess**.

---

## 6. Gửi lại trong hộp chat (WebSocket)

Không REST. FE gửi command qua WS consumer (`ws/`, group `chat_{user_id}`).

### 6.1 `forward-video`

Handler: `handle_forward_video` → `forward_video`.

**Payload gợi ý:**

```json
{
  "command_type": "forward-video",
  "requestId": "uuid-fe",
  "id_account": 101,
  "id_conversation": 555,
  "info": {
    "videoUrl": "https://...",
    "thumbUrl": "https://...",
    "duration": 15200,
    "width": 720,
    "height": 1280,
    "fileSize": 2345678,
    "title": ""
  }
}
```

`info` shape khớp `build_video_info` / ZMessage `forward_media(kind="video")`.  
Nguồn: `GET /video/<id>` map snake → camel:

| DB / GET | `info` forward |
|----------|----------------|
| `video_url` | `videoUrl` |
| `thumb_url` | `thumbUrl` |
| `duration` | `duration` |
| `width` / `height` | `width` / `height` |
| `file_size` | `fileSize` |
| (optional caption) | `title` |

### 6.2 `forward-album`

Handler: `handle_forward_album` → `forward_album`.

**Payload:**

```json
{
  "command_type": "forward-album",
  "requestId": "uuid-fe",
  "id_account": 101,
  "id_conversation": 555,
  "groupLayoutId": "1234567890",
  "totalItemInGroup": "4",
  "message": "Caption tùy chọn (gửi text trước album)",
  "info": [
    {
      "url": "https://...",
      "width": "1080",
      "height": "1080",
      "file_size": "120000",
      "idInGroup": "0"
    }
  ]
}
```

Map từ `GET /album/<id>`:

| Album / Image | Forward field |
|---------------|---------------|
| `groupLayoutId` | `groupLayoutId` (top-level) |
| `totalItemInGroup` | `totalItemInGroup` |
| `images[].url` | `info[].url` |
| `images[].width` … | `info[]` tương ứng |
| `images[].idInGroup` | `info[].idInGroup` |
| optional text | `message` |

Thiếu `id_conversation` / `info` / layout → BE fail validation.

### 6.3 `share-video`

Command `share-video` + `share_info` — chia sẻ kiểu share Zalo (khác forward media). Dùng khi UI share link/video object; không thay cho picker thư viện `forward-video`.

---

## 7. Campaign mess — chọn album/video đã lưu để gửi

### 7.0 UX bắt buộc — “Xem lại list ở đâu?”

**Đúng chỗ:** màn **tạo / sửa kịch bản** các chiến dịch **gửi tin nhắn** trong app Campaign.

```text
App Campaign → [chiến dịch mess] → Setup category
  → Khối “Đính kèm”
       ○ Không / chỉ text
       ○ 1 ảnh          → upload 1 URL (không list thư viện)
       ○ Gửi kèm video  → hiện panel DANH SÁCH VIDEO
       ○ Gửi kèm album  → hiện panel DANH SÁCH ALBUM
```

| Hành vi UI | Chi tiết | API |
|------------|----------|-----|
| Chọn “Gửi kèm video” | Load + render list video đã lưu | `GET /api/message/video` |
| Chọn “Gửi kèm album” | Load + render list album đã lưu | `GET /api/message/album` |
| Click **dòng / radio** item | Chọn media gắn kịch bản → `id_video` hoặc `id_album` | (state form; submit category) |
| Icon **mắt** (preview) | Xem trước: video play/thumb full; album grid ảnh | `GET /api/message/video/<id>` hoặc `GET /api/message/album/<id>` (album list đã có `images` — detail khi cần) |
| Nút **xóa** cạnh dòng | Xóa khỏi thư viện user (confirm) → refresh list | `DELETE /api/message/video/<id>` hoặc `DELETE /api/message/album/<id>` (hoặc bulk `DELETE` + `ids`) |
| Empty list | CTA: “Chưa có media — lưu từ hộp chat trước” | — |

**Chỉ** wire UI này cho campaign **gửi tin** (§7.1).  
**Không** thêm block đính kèm video/album vào: kết bạn, join nhóm, mời nhóm, invite SĐT, notif campaign (trừ khi product mở rộng + BE đã có FK — hiện mess/spam-link).

### 7.1 Campaign nào hỗ trợ (đúng scope)

| Prefix REST | Tên | Picker video/album |
|-------------|-----|--------------------|
| `/api/campaign/mess-friend/` | Nhắn bạn bè | ✓ |
| `/api/campaign/mess-group/` | Nhắn nhóm | ✓ |
| `/api/campaign/mess-member-group/` | Nhắn TV nhóm | ✓ |
| `/api/campaign/mess-phone-number/` | Nhắn SĐT | ✓ |
| `/api/campaign/mess-birthday/` | Sinh nhật | ✓ |
| `/api/campaign/spam-link-group/` | Spam link nhóm (+ gửi tin) | ✓ |
| `add-friend`, `join-group`, `invite-group`, … | Không phải “gửi tin media” | ✗ không làm |

Pattern category (chung):

```text
GET|POST   /api/campaign/{prefix}/category/
GET|PUT|PATCH|DELETE  /api/campaign/{prefix}/category/{id}/
POST       /api/campaign/{prefix}/category/start|stop/
GET|DELETE /api/campaign/{prefix}/category/{id}/results/
GET        /api/campaign/{prefix}/statistics/
```

(`mess-birthday` results path hơi khác — xem `campaign/urls.py`.)

### 7.2 Attachment trên category (create / update)

Field attachment **chung** các form mess:

| Field body | Ý nghĩa |
|------------|---------|
| `type` | `"image"` \| `"video"` \| `"album"` \| `null`/omit nếu chỉ text |
| `contents` | `string[]` — mẫu tin (placeholder `[name]`, `[r]`, …) |
| `images` | `string[]` URL — **chỉ** khi `type === "image"`; **tối đa 1** ảnh |
| `id_video` | int — PK `VideoModel` của **user hiện tại** khi `type === "video"` |
| `id_album` | int — PK `AlbumImageModel` của user khi `type === "album"` |

Helper BE: `resolve_attachment_fields` — khi chọn 1 type, các field type khác bị clear.

**Validate quan trọng:**

| Rule | Message / code |
|------|----------------|
| Không `contents` và không `type` | `Phải có nội dung hoặc hình ảnh hoặc video` |
| `type=image` mà `images` rỗng | `Vui lòng thêm ảnh` |
| `type=image` mà `images.length > 1` | `Chỉ chấp nhận 1 ảnh. Từ 2 ảnh trở lên vui lòng gửi dạng album.` (`IMAGE_COUNT_INVALID`) |
| `type=image` extension không jpg/jpeg/png | `IMAGE_FORMAT_INVALID` |
| `type=video` thiếu `id_video` | `Vui lòng chọn video` |
| `type=album` thiếu `id_album` | `Vui lòng chọn album ảnh` |
| `id_video` / `id_album` không thuộc user | 404 |
| Nội dung > 2200 ký tự | `CONTENT_TOO_LONG` |

**Ví dụ POST category mess-friend (rút gọn attachment):**

```json
{
  "name": "Chào KH video",
  "contents": ["Xin chào [name]!"],
  "type": "video",
  "id_video": 12,
  "id_album": null,
  "images": [],
  "id_account": 101,
  "id_friends": [1, 2, 3],
  "delay_time": 60,
  "number_count": 1,
  "from_time": "08:00",
  "to_time": "22:00"
}
```

Album:

```json
{
  "name": "Chào KH album",
  "contents": ["Xem album nhé [name]"],
  "type": "album",
  "id_album": 3,
  "id_video": null,
  "images": [],
  "id_account": 101,
  "id_friends": [1, 2]
}
```

Chỉ 1 ảnh (không album):

```json
{
  "type": "image",
  "images": ["media/uploads/abc.jpg"],
  "contents": ["..."]
}
```

Các field target (`id_friends` / `id_groups` / `phone_numbers` / …) **khác nhau theo loại campaign** — giữ như form hiện có; doc này chỉ chuẩn hóa phần media.

### 7.3 Response category detail — hydrate media cho form edit

Serializer category mess: `fields = "__all__"` → `video` và `album` thường là **integer FK** (id), không nested object.

```json
{
  "id": 9,
  "name": "Chào KH video",
  "type": "video",
  "video": 12,
  "album": null,
  "images": [],
  "contents": ["..."]
}
```

**FE edit form:**

```text
if (category.type === "video" && category.video)
  → GET /api/message/video/{category.video}
  → hiện thumb + name_video trong picker

if (category.type === "album" && category.album)
  → GET /api/message/album/{category.album}
  → hiện grid ảnh + name
```

Khi submit lại: gửi `id_video` / `id_album` (không gửi full object).

### 7.4 Picker UI trong form campaign (chuẩn product)

**Scope:** chỉ form category các prefix §7.1.

```text
[Đính kèm]
  ( ) Không / chỉ text
  ( ) 1 ảnh          → upload → images[0]  (max 1; ≥2 → bảo chọn album)
  ( ) Gửi kèm video  → panel list video (inline hoặc drawer)
  ( ) Gửi kèm album  → panel list album
```

#### Panel list video (khi `type === "video"`)

1. Mount panel → `GET /api/message/video`
2. Mỗi dòng list:
   - Tên (`name_video`) + optional icon video
   - **Chọn** (click row / radio) → `type=video`, `id_video=<id>`, clear `id_album` + `images`
   - **Mắt** → preview modal: `GET /api/message/video/<id>` (thumb, play URL, duration…)
   - **Xóa** → confirm → `DELETE /api/message/video/<id>` → bỏ chọn nếu đang chọn id đó → reload list
3. List response mỏng (`id`, `video_url`, `name_video`) — thumb preview nên lấy từ detail hoặc cache lúc save

#### Panel list album (khi `type === "album"`)

1. Mount → `GET /api/message/album` (đã nested `images`)
2. Mỗi dòng:
   - Tên (`name`) + số ảnh / cover `images[0].url`
   - **Chọn** → `type=album`, `id_album=<id>`, clear `id_video` + `images`
   - **Mắt** → preview grid toàn bộ `images[]` (detail `GET /album/<id>` nếu list thiếu)
   - **Xóa** → confirm → `DELETE /api/message/album/<id>` → clear selection nếu trùng → reload

#### Empty state

“Chưa có video/album đã lưu — mở hộp chat, lưu media từ tin nhắn rồi quay lại.” (+ deep-link chat nếu có)

#### Reuse component

Cùng 1 component list (video | album mode) dùng cho **cả 6** form mess/spam-link — không copy 6 lần.

### 7.5 Log results campaign

Serializer log (`CampaignMess*Serializer`) có:

- `images` — URL ảnh nếu gửi type image
- `thumb_url` — **chỉ từ `video.thumb_url`** nếu row gắn video
- **Không** nested album preview sẵn

UI log:

| `type` / data | Hiển thị |
|---------------|----------|
| có `thumb_url` | thumbnail video |
| `images.length` | preview ảnh |
| album (không thumb) | icon album / “Album” — hoặc hydrate `campaign.album` nếu sau này BE expose |

### 7.6 Runtime gửi (BE — FE không gọi)

Task Celery khi category chạy:

- `type=video` → `zmessage.forward_media(build_video_info(video), …, kind="video")`
- `type=album` → loop `build_album_info` → `forward_media(..., kind="image")` từng ảnh
- `type=image` → gửi 1 ảnh URL trong `images`

FE chỉ cần **lưu đúng id + type** lúc tạo category + start.

---

## 8. Bảng map field FE ↔ BE (tóm tắt)

### 8.1 Lưu video

| UI | POST body | GET list/detail |
|----|-----------|-----------------|
| URL video | `videoUrl` | `video_url` |
| Thumb | `thumbUrl` | `thumb_url` |
| Tên | `nameVideo` | `name_video` |
| Size | `fileSize` | `file_size` |
| Đổi tên | — | body PATCH: `name_video` |

### 8.2 Lưu album

| UI | POST body | GET |
|----|-----------|-----|
| Tên | `nameAlbum` | `name` |
| Layout | `groupLayoutId` | `groupLayoutId` |
| Số ảnh | `totalItemInGroup` | `totalItemInGroup` |
| Ảnh | `images[]` | `images[]` (sau async) |
| Đổi tên | — | body: `name` |

### 8.3 Gắn campaign

| UI | Body category |
|----|---------------|
| Chọn video id | `type: "video"`, `id_video` |
| Chọn album id | `type: "album"`, `id_album` |
| 1 ảnh | `type: "image"`, `images: [url]` |
| Chỉ text | omit `type` / null, có `contents` |

### 8.4 Forward chat WS

| Thư viện | Command | Payload chính |
|----------|---------|---------------|
| Video detail | `forward-video` | `info` camelCase |
| Album detail | `forward-album` | `groupLayoutId`, `totalItemInGroup`, `info[]` |

---

## 9. Checklist implement FE

### Chat (lưu nguồn)

- [ ] Menu bubble video → form tên → `POST /api/message/video`
- [ ] Menu bubble album → form tên → `POST /api/message/album` + poll images
- [ ] Optional: forward lại conversation (§6)
- [ ] Xử lý lỗi trùng tên / trùng URL video
- [ ] Scope **user**, không filter `id_account`

### Campaign form — chỗ xem list (bắt buộc, chỉ mess)

- [ ] **Chỉ** 6 prefix §7.1 — không add picker vào add-friend / join / invite…
- [ ] Radio đính kèm: none | image | **video** | **album**
- [ ] Chọn video → hiện list `GET /video`; chọn album → list `GET /album`
- [ ] Mỗi dòng: **chọn** + **mắt (preview)** + **xóa** (DELETE message API + confirm)
- [ ] Xóa item đang chọn → clear `id_video`/`id_album`
- [ ] `type=image`: max 1 URL; ≥2 → hướng dẫn album
- [ ] Submit: `type` + `id_video`/`id_album` + clear field type khác
- [ ] Edit category: hydrate FK → highlight item đã chọn + preview mắt
- [ ] Empty CTA → hướng lưu từ chat
- [ ] 1 component list reuse cho mọi form mess

### Team / NV

- [ ] NV chỉ thấy media của mình (BE filter `user=request.user`)
- [ ] Campaign permission §15; media picker **không** thay quyền category

---

## 10. Lỗi thường gặp

| Triệu chứng | Nguyên nhân | Xử lý FE |
|-------------|-------------|----------|
| POST album OK nhưng list không có ảnh | `image_tasks` async / worker chậm | Poll GET detail |
| Campaign 404 khi chọn video | Video của user khác / đã xóa | Refresh picker; clear selection |
| `IMAGE_COUNT_INVALID` | Gửi ≥2 URL type image | Ép flow album |
| Forward album fail “Thiếu thông tin” | Thiếu `groupLayoutId` / `totalItemInGroup` / `info` | Chỉ forward từ album đã lưu đủ field |
| List video không có thumb | Serializer list cố ý mỏng | GET detail hoặc cache lúc save |
| Đổi tên video 400 | Gửi `nameVideo` thay `name_video` | PATCH body snake_case |

---

## 11. File tham chiếu nhanh

| Việc | Path |
|------|------|
| Model | `BE/message/models.py` |
| URL message | `BE/message/urls.py` |
| Video view | `BE/message/views/saved_video_views.py` |
| Album view | `BE/message/views/handle_album_views.py` |
| Serializer | `BE/message/serializers.py` (`Video*`, `Album*`, `Image*`) |
| Persist ảnh album | `BE/message/tasks/basic_tasks.py` → `image_tasks` |
| WS forward | `BE/message/handlers.py`, `BE/message/send_actions.py` |
| Campaign attachment helper | `BE/campaign/views/campaign_category_common.py` |
| Campaign URLs | `BE/campaign/urls.py` |
| Build payload gửi Zalo | `BE/campaign/tasks/common.py` (`build_video_info`, `build_album_info`) |
| Logic BE tổng | `BE/docs/backend_logic_guide.md` §2.4, §15 media |
| Chat payload tin nhắn | `BE/docs/fe_chat_architecture.md`, `BE/message/chat_payload.py` |

---

*Cập nhật khi đổi contract video/album/campaign attachment — commit kèm diff view/serializer.*
