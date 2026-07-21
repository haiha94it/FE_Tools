# Hướng dẫn FE — Consent tin nhắn Zalo (đọc file này là đủ)

**Cập nhật:** 2026-07-21  
**SSOT dài (BE/product):** `BE/docs/CONSENT-FE-BE-SIGNATURE.md` — FE **không bắt buộc** đọc.  
Base API: `/api/consent/` · JWT · envelope `{ success, message, data }`.

---

## 1. Rule product (nhớ 5 dòng)

1. Gate bật khi `system_activated === true`.  
2. **Quản lý / user thường:** phải wizard ký → submit → chờ admin duyệt → `approved` mới chat.  
3. **Nhân viên:** **không ký**. Dùng theo HĐ **quản lý**.  
4. QL **approved** → NV chat được. QL chưa đủ HĐ → NV **chặn** + message *báo quản lý ký*.  
5. **Không** OTP · **không** revoke sau duyệt.

---

## 2. Vào Chat — `GET /api/consent/message-processing/status/`

Gọi khi vào chat / shell. Ưu tiên field BE.

### Field quan trọng

| Field | Ý FE |
|-------|------|
| `system_activated` | Policy on/off |
| `can_use_chat` | `true` → vào chat |
| `need_wizard` | `true` → wizard ký (chỉ non-NV) |
| `is_employee` | `true` = NV |
| `consent_subject` | `"manager"` \| `"self"` |
| `status` | HĐ **subject**: `none` \| `pending_approval` \| `approved` \| `rejected` |
| `show_wait_manager` | NV: QL chưa có hồ sơ |
| `show_pending_status` | Chờ duyệt (QL self hoặc QL của NV) |
| `show_rejected_status` | Bị từ chối |
| `employee_message` / `manager_message` | Copy hiển thị NV (cùng nội dung) |
| `pending_message` / `rejected_message` | Copy pending/reject |
| `form_defaults` | Prefill form (email = `user.mail`) |

### Nhánh FE

```
if !system_activated || can_use_chat → Chat OK

if is_employee:
  // KHÔNG wizard ký, KHÔNG gọi sign/
  show banner employee_message (hoặc manager_message)
  block chat
  return

// User / quản lý
if need_wizard → Wizard ký (mục 3)
if show_pending_status → "Hồ sơ đang chờ duyệt."
if show_rejected_status → rejected_message + CTA ký lại
```

### Lỗi API chat (403)

| `error_code` | FE |
|--------------|-----|
| `CONSENT_MANAGER_REQUIRED` | Banner **báo quản lý ký HĐ** (NV) |
| `CONSENT_PENDING_APPROVAL` | Chờ duyệt |
| `CONSENT_REJECTED` | Ký lại |
| `CONSENT_CHAT_REQUIRED` | Mở wizard / need sign |

---

## 3. Wizard (chỉ khi `need_wizard` — không áp NV)

Thứ tự:

1. **Đồng ý / Không đồng ý** (local; không POST). Không đồng ý → home.  
2. **HĐ** `GET .../terms/` — Quay lại = clear tick.  
3. **Form + chữ ký** → `POST .../sign/` một lần (**Ký và xác nhận**).  
4. Toast chờ duyệt; poll `status`.

### Form

- Luôn: `full_name`, `email`, `phone`, `address`, signature (`stroke_count` ≥ 1)  
- `entity_type`: `personal` \| `business` (+ field CTY nếu business)  
- Email: prefill `form_defaults.email`, sửa được  

### Sign body (JSON)

```json
{
  "full_name": "...",
  "email": "...",
  "phone": "09...",
  "address": "...",
  "entity_type": "personal",
  "signature": {
    "image_base64": "data:image/png;base64,...",
    "width": 600,
    "height": 200,
    "stroke_count": 3
  },
  "client_platform": "web_desktop"
}
```

NV gọi sign → BE **400** (không cần ký).

---

## 4. API user (path)

| Method | Path |
|--------|------|
| GET | `/api/consent/message-processing/status/` |
| GET | `/api/consent/message-processing/terms/` |
| POST | `/api/consent/message-processing/sign/` |
| GET | `/api/consent/message-processing/pdf/` |

**Cấm:** `otp/*`, `revoke/*`.

---

## 5. Admin FE (tóm tắt)

| Việc | API |
|------|-----|
| Setup HĐ + CT + nick + nhóm notify | `GET/POST /api/consent/admin/setup/` |
| List nick / nhóm | Reuse API account + group product (không path consent riêng) |
| Kích hoạt | `POST .../admin/activate/` chỉ khi `can_activate` |
| Duyệt user | List `GET /api/users/get-all-account` → `message_processing_status` |
| Approve / reject | `POST .../admin/users/<id>/approve/` · `reject/` |

Activate cần: nội dung HĐ, tên+MST+địa chỉ CT, stamp, nick, nhóm.  
`can_activate` / `activate_checklist` / `activate_missing` trên setup.  
List ẩn self, `is_admin`, `is_developer`.

Notify @All nhóm sau user submit = **BE Celery** — FE không gọi.

---

## 6. Checklist FE

| # | |
|---|--|
| F1 | `can_use_chat` / `need_wizard` theo BE |
| F2 | NV: không wizard, không sign; banner `employee_message` |
| F3 | NV + QL approved → chat |
| F4 | Non-NV: wizard → sign → pending |
| F5 | 403 `CONSENT_MANAGER_REQUIRED` = copy nhờ QL |
| F6 | Prefill email; business fields |
| F7 | Admin: activate disable nếu `!can_activate` |
| F8 | Admin list: `message_processing_status` + approve/reject |

---

## 7. Copy gợi ý (NV)

BE đã trả sẵn `employee_message`. Nội dung dạng:

> Tài khoản quản lý chưa hoàn tất thỏa thuận xử lý tin nhắn Zalo.  
> Vui lòng báo quản lý ký và được duyệt thỏa thuận để bạn được sử dụng tin nhắn.

Pending QL:

> Hồ sơ thỏa thuận của quản lý đang chờ duyệt. …

---

## 8. Kỹ thuật

- Sanitize HTML terms (DOMPurify).  
- Signature pad: bắt buộc nét.  
- Path exact: `BE/consent/urls.py`.  
- Chi tiết BE/model/notify: SSOT dài nếu cần dev BE.
