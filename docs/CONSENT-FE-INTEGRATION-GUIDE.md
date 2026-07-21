# Hướng dẫn FE — Hợp đồng xử lý tin nhắn Zalo

**SSOT logic:** `BE/docs/CONSENT-FE-BE-SIGNATURE.md`  
**Cập nhật:** 2026-07-20 — **không OTP**; user **Ký và xác nhận** → `pending_approval`; admin **duyệt**; notify **nhóm Zalo** cho admin.

Doc **thay** guide cũ (OTP / revoke / ký-xong-dùng-ngay). Path exact: `BE/consent/urls.py` khi BE merge.

---

## 1. Tóm tắt product

| | |
|--|--|
| Quét tin / chat | Chỉ `status === approved` **và** hệ thống đã kích hoạt |
| User submit | Form + chữ ký + **Ký và xác nhận** → `pending_approval` (**không OTP**) |
| Sau submit | Chỉ **trạng thái chờ duyệt** (không banner 24h) |
| Thu hồi | **Không** UI; admin **không** hủy sau đã duyệt |
| Không đồng ý | **Home**; không chat |
| Quay lại HĐ | Bỏ tick; **không** lưu BE |
| Admin biết hồ sơ mới | BE bắn tin **@All vào nhóm** (nick + group setup) — FE user **không** làm gì thêm |

---

## 2. Status machine (`GET status`)

```json
{
  "system_activated": true,
  "status": "none|pending_approval|approved|rejected",
  "can_use_chat": false,
  "need_wizard": true,
  "show_pending_status": true,
  "show_rejected_status": false,
  "pending_message": "Hồ sơ đang chờ duyệt.",
  "rejected_message": "Thỏa thuận không được duyệt. Vui lòng tạo / ký lại để dùng tin nhắn.",
  "submitted_at": null,
  "reviewed_at": null,
  "reject_reason": null,
  "form_defaults": {
    "full_name": "Nguyễn Văn A",
    "email": "user@mail.com",
    "phone": "09..."
  },
  "default_email": "user@mail.com",
  "default_full_name": "Nguyễn Văn A",
  "default_phone": "09..."
}
```

**Prefill form:** `form_defaults.email` / `default_email` = `UserAccount.mail`. FE **điền sẵn** ô email; user **sửa được**; **không** bắt nhập lại nếu đã có. Submit gửi giá trị trong ô (để nguyên hoặc đã sửa).

| `status` | Vào chat |
|----------|----------|
| `none` | Wizard: Đồng ý → HĐ → form → ký |
| `pending_approval` | **Chờ duyệt**; chặn chat/quét |
| `approved` | Chat OK |
| `rejected` | Không duyệt + **Tạo / ký lại** |

Ưu tiên `can_use_chat` / `need_wizard` từ BE.

---

## 3. Wizard user (thứ tự bắt buộc)

### Bước 0 — Đồng ý / Không đồng ý

- **Không** mở HĐ trước.  
- **Không đồng ý** → home.  
- **Đồng ý** → local `agreed=true` → Bước 1.  
- **Không** POST BE chỉ vì tick.

### Bước 1 — Đọc HĐ

- `GET .../terms/` — sanitize HTML +/hoặc PDF.  
- **Quay lại** → `agreed=false`, clear form/chữ ký local, về Bước 0.

### Bước 2 — Form + chữ ký + submit

```text
entity_type: personal | business

Luôn có:
  full_name, email, phone, address
  signature pad (bắt buộc nét)

Nếu business:
  company_name, tax_code, representative_name, representative_title,
  company_address, company_phone, company_email
```

- **Email:** init từ `status.form_defaults.email` (`UserAccount.mail`). Input editable. User có mail sẵn → **không bắt gõ lại**. Chỉ bắt nhập khi default rỗng.  
- full_name / phone: có thể prefill `form_defaults` tương tự.  
- Validate FE + BE.  
- Sửa form/chữ ký **đến khi submit thành công**.  
- Nút **Ký và xác nhận** → **một** `POST sign/` với full form + signature.  
- **Không** OTP / màn mã / “Người lạ”.

### Bước 3 — Chờ duyệt (sau submit OK)

- Toast / badge: **“Hồ sơ đang chờ duyệt.”**  
- Khóa form.  
- Poll `status` hoặc refetch khi vào lại chat.  
- **Không** quét tin / chat data.

### Bước 4 — Kết quả admin

- **Duyệt** → chat.  
- **Từ chối** → message + CTA **Tạo / ký lại** (reset wizard).  
- Admin FE: hồ sơ **approved** **không** nút Từ chối.

---

## 4. API user

Base: `/api/consent/` — JWT. Envelope `success` / `message` / `data`.

| Method | Path | Khi |
|--------|------|-----|
| GET | `message-processing/status/` | Vào chat / shell |
| GET | `message-processing/terms/` | Mở HĐ |
| POST | `message-processing/sign/` | Ký và xác nhận (submit) |
| GET | `message-processing/pdf/` | Có hồ sơ |

**Payload submit (gợi ý):**

```json
{
  "full_name": "...",
  "email": "...",
  "phone": "09...",
  "address": "...",
  "entity_type": "personal",
  "company_name": "",
  "tax_code": "",
  "representative_name": "",
  "representative_title": "",
  "company_address": "",
  "company_phone": "",
  "company_email": "",
  "signature": {
    "image_base64": "data:image/png;base64,...",
    "width": 600,
    "height": 200,
    "stroke_count": 3
  },
  "client_platform": "web_desktop"
}
```

**Cấm FE gọi:** `otp/*`, `revoke/*` (đã gỡ / không dùng).

### Lỗi chat

| `error_code` | FE |
|--------------|-----|
| `CONSENT_PENDING_APPROVAL` | UI chờ duyệt |
| `CONSENT_REJECTED` | Không duyệt + ký lại |
| `CONSENT_CHAT_REQUIRED` | Wizard / chưa approved |

---

## 5. Admin FE

### 5.1. Setup điều khoản + bên A

- GET/POST `admin/setup/` — title, body_html, PDF, company_*, company_signature.  
- Giữ như trước.

### 5.2. Setup nick + nhóm thông báo (bắt buộc)

Mục đích: mỗi khi **user submit HĐ**, BE gửi tin **@All vào nhóm** từ nick này (admin theo dõi hồ sơ chờ duyệt). **Không** gửi OTP cho user.

**UI flow (bắt buộc thứ tự):**

```text
[1] Chọn nick Zalo (list account admin / hệ thống, nick login được)
        ↓
[2] Load danh sách nhóm của nick
        ↓
[3] Admin chọn 1 nhóm nhận thông báo
        ↓
[4] Lưu setup (account_id + group_id [+ group_name])
```

**Nếu list nhóm trống / thiếu nhóm:**

- Hiện empty state: “Chưa có nhóm — bấm Quét lại danh sách nhóm”.  
- Nút **Quét lại danh sách nhóm** → gọi reload/sync group của nick → refresh list.  
- Loading + toast lỗi nếu quét fail (nick checkpoint, limit, …).

**API gợi ý (hoặc reuse API group sẵn có — đối chiếu BE):**

| Method | Path | Mô tả |
|--------|------|--------|
| GET | `admin/notify/groups/?account_id=` | List nhóm nick |
| POST | `admin/notify/groups/reload/` | `{ "account_id" }` quét lại |
| GET/POST | `admin/setup/` | Lưu `notify_zalo_account_id`, `notify_group_id`, … |

Field setup response gợi ý:

```json
{
  "notify_zalo_account_id": 123,
  "notify_zalo_account": { "id": 123, "uid": "...", "name": "..." },
  "notify_group_id": "g123...",
  "notify_group_name": "Nhóm nội bộ Care",
  "is_activated": false
}
```

**Activate — chặn nếu setup chưa đủ**

`POST admin/activate/` **chỉ OK** khi đủ **tất cả**:

| Bắt buộc | Field |
|----------|--------|
| Nội dung HĐ | `body_html` **hoặc** `contract_pdf` |
| Thông tin CT bên A | `company_name`, `company_tax_code`, `company_address` |
| Ảnh chữ ký + dấu | `company_signature` |
| Nick notify | `notify_zalo_account_id` (nick không checkpoint) |
| Nhóm notify | `notify_group_id` |

Thiếu bất kỳ mục → **HTTP 400**, `success: false`, `error_code: CONSENT_SETUP_INCOMPLETE`, `message` liệt kê thiếu, `data` = setup (có checklist).

**FE bắt buộc:**

1. `GET admin/setup/` → đọc `can_activate`.  
2. `can_activate === false` → **disable** nút Kích hoạt; show `activate_missing` / `activate_checklist` (hoặc `activate_block_reason`).  
3. **Không** gọi `activate/` khi disable (tránh spam 400).  
4. Vẫn handle 400 nếu race: toast `message`, refresh checklist từ `data`.

Field setup (bổ sung):

```json
{
  "can_activate": false,
  "activate_block_reason": "Chưa đủ cấu hình để kích hoạt: ...",
  "activate_missing": [
    "Chưa có nội dung hợp đồng (soạn rich text hoặc upload PDF)",
    "Chưa nhập tên công ty (bên A)",
    "Chưa chọn nhóm nhận thông báo (sau khi chọn nick)"
  ],
  "activate_checklist": [
    { "key": "terms", "ok": false, "message": "..." },
    { "key": "company_name", "ok": true, "message": "..." },
    { "key": "company_tax_code", "ok": false, "message": "..." },
    { "key": "company_address", "ok": false, "message": "..." },
    { "key": "company_signature", "ok": false, "message": "..." },
    { "key": "notify_zalo_account", "ok": false, "message": "..." },
    { "key": "notify_group", "ok": false, "message": "..." }
  ]
}
```

### 5.3. Duyệt HĐ

| Method | Path |
|--------|------|
| GET | `admin/users/<id>/contract/` |
| POST | `admin/users/<id>/approve/` | Chỉ `pending_approval` |
| POST | `admin/users/<id>/reject/` | Body optional `{ "reason": "..." }` — **ẩn** khi approved |
| GET | `admin/users/<id>/pdf/` | |

### 5.3b. List user `GET /api/users/get-all-account`

Response mỗi user (kèm field cũ) có:

```json
{
  "id": 1,
  "username": "...",
  "is_admin": true,
  "message_processing_status": "none|pending_approval|approved|rejected",
  "message_processing_submitted_at": "2026-07-20T...",
  "message_processing_reviewed_at": null,
  "message_processing_reject_reason": null,
  "message_processing_signed": false,
  "message_processing_signed_at": null
}
```

| `message_processing_status` | FE |
|-----------------------------|-----|
| `none` | Chưa ký |
| `pending_approval` | **Duyệt** / **Từ chối** → consent admin approve/reject API |
| `approved` | Đã duyệt; **không** nút từ chối |
| `rejected` | Hiện lý do; user ký lại |

User **admin** vẫn nằm trong list (trừ chính mình + developer) — duyệt HĐ cho admin khác được.

### 5.3c. Notify sau submit (BE)

User `POST sign/` OK → Celery bắn @All vào nhóm setup. FE **không** gọi thêm API.  
Cần: setup đã lưu nick + nhóm; Celery worker chạy; nick login/proxy OK.

### 5.4. Nội dung tin nhóm (tham chiếu — BE gửi, FE không soạn)

Sau user submit, admin thấy trên Zalo nhóm (mẫu):

```text
@All Chốt Nhanh
📋 THÔNG BÁO THỎA THUẬN XỬ LÝ TIN NHẮN ZALO
━━━━━━━━━━━━━━━━━━
👤 Tài khoản: {username}
📞 SĐT: {phone}
📧 Email: {email}
⭐ Hệ thống: {host}
━━━━━━━━━━━━━━━━━━
🔄 Loại: Ký thỏa thuận xử lý tin nhắn (mới / ký lại)
━━━━━━━━━━━━━━━━━━
⏰ Thời gian: {time}
⚠️ Trạng thái: Chờ duyệt
```

Style giống thông báo đăng ký AI Video (`@All` + card field). FE admin **không** cần UI soạn tin này.

---

## 6. Wireframe

```
USER
[Chat] need_wizard?
  → [ ] Đồng ý   [ ] Không đồng ý → Home
  → Đồng ý
      → [HĐ] [Quay lại]
      → Form CN/CTY + SignaturePad
      → [Ký và xác nhận] → pending (không OTP)
  → pending → Status "Chờ duyệt"
  → approved → Chat
  → rejected → Status + Ký lại

ADMIN SETUP
  Điều khoản + ảnh A
  → Chọn nick
  → List nhóm  [Quét lại danh sách nhóm]
  → Chọn nhóm → Lưu
  → [Kích hoạt policy] (cần đủ nick+nhóm)

ADMIN DUYỆT
  List status → Chi tiết → Duyệt | Từ chối (pending only)
```

---

## 7. Checklist FE

| # | Pass |
|---|------|
| F1 | Không đồng ý → home, không chat |
| F2 | Quay lại HĐ → clear tick, không submit |
| F3 | business hiện field CTY; personal ẩn |
| F3b | Email prefill `user.mail`; sửa được; không force retype nếu đã có |
| F4 | Submit một nút; **không** màn/API OTP |
| F5 | Pending: chờ duyệt, khóa form |
| F6 | Rejected: message + ký lại |
| F7 | Approved: chat OK |
| F8 | Không UI thu hồi; approved không nút từ chối |
| F9 | Admin: chọn nick → list nhóm → chọn nhóm |
| F10 | Admin: **Quét lại danh sách nhóm** khi thiếu/rỗng |
| F11 | Activate: disable khi `can_activate=false` (HĐ + CT + stamp + nick + nhóm); handle 400 `CONSENT_SETUP_INCOMPLETE` |
| F12 | Không copy “kiểm tra Người lạ” (không còn OTP 1-1) |

---

## 8. Ghi chú kỹ thuật

- Sanitize `body_html` (DOMPurify).  
- Signature pad: pointer + phóng to.  
- Sau deploy BE: đối chiếu path/field `urls.py`.  
- List account nick: có thể reuse pattern campaign-notification / list ZaloAccount admin.  
- List/reload group: ưu tiên reuse API group của product; nếu BE expose `admin/notify/groups*` thì dùng path đó.  
- Notify group: **side-effect BE** sau submit (`consent.notify_group_after_submit`) — FE user chỉ toast chờ duyệt; fail notify **không** chặn pending.  
- List user admin: dùng `message_processing_status` (không chỉ `message_processing_signed`) để hiện nút duyệt.
