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
2. **HĐ** `GET .../terms/` (đọc điều khoản mẫu chung, chưa điền thông tin). Quay lại = clear tick.  
3. **Form thông tin**: Thiết kế form đơn giản gộp chung thông tin liên hệ và người đại diện:
   - Nếu `entity_type === 'personal'`:
     - Họ tên cá nhân -> Gửi làm `full_name`
     - Số điện thoại -> Gửi làm `phone`
     - Email -> Gửi làm `email`
     - Địa chỉ -> Gửi làm `address`
   - Nếu `entity_type === 'business'`:
     - Tên công ty / HKD -> Gửi làm `company_name`
     - Mã số thuế -> Gửi làm `tax_code`
     - Họ tên Người đại diện -> Gửi làm `full_name` (BE tự động copy vào `representative_name`)
     - Chức vụ -> Gửi làm `representative_title`
     - Số điện thoại liên hệ -> Gửi làm `phone` (BE tự động copy vào `company_phone`)
     - Email liên hệ -> Gửi làm `email` (BE tự động copy vào `company_email`)
     - Địa chỉ công ty / HKD -> Gửi làm `address` (BE tự động copy vào `company_address`)
4. **Nút Xem trước hợp đồng**:
   - Sau khi điền đủ form, có nút "Xem trước hợp đồng". Bấm nút sẽ trigger gọi API preview:
     `POST /api/consent/message-processing/preview/` gửi kèm dữ liệu form.
   - Response trả về `{ success: true, message: "...", data: { body_html: "..." } }`.
   - FE hiển thị `body_html` này vào Modal/Popup để user kiểm tra văn bản HĐ đã điền thông tin của họ.
5. **Ký và xác nhận**: Vẽ chữ ký tay -> Bấm nút **"Ký và xác nhận"** (gửi `POST .../sign/`).
6. Toast chờ duyệt; poll `status`.

### Form (Quy tắc mapping cho FE)

- Chỉ hiển thị các ô tương ứng với loại hình cá nhân/doanh nghiệp đã chọn.
- FE không cần gửi các trường `company_phone`, `company_email`, `company_address` và `representative_name` lên nữa. FE chỉ cần gửi các trường cơ bản `full_name`, `phone`, `email`, `address` cùng với `company_name`, `tax_code`, `representative_title` (đối với doanh nghiệp). BE sẽ tự động copy map giá trị sang tương thích.

### Preview & Sign body (JSON)
Request body gửi lên API Preview và API Sign giống nhau (API Preview không cần trường `signature`):
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

NV gọi sign → BE **400** (không cần ký).

---

## 4. API user (path)

| Method | Path | Mô tả |
|--------|------|------|
| GET | `/api/consent/message-processing/status/` | Trạng thái hiện hành |
| GET | `/api/consent/message-processing/terms/` | Lấy HĐ gốc (chưa điền thông tin) |
| POST | `/api/consent/message-processing/preview/` | **Xem trước** HĐ đã điền thông tin (mới) |
| POST | `/api/consent/message-processing/sign/` | Ký và gửi hồ sơ |
| GET | `/api/consent/message-processing/pdf/` | Tải PDF hợp đồng đã ký |

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

### Thanh công cụ Quick-Insert trong Editor soạn thảo HĐ của Admin
Tại màn cấu hình Admin Setup, FE thiết kế các nút bấm để chèn nhanh các biến placeholder vào Rich Text Editor tại vị trí con trỏ:
* **Thông tin Khách hàng (Bên B) - Đã gộp**:
  - Nút "Tên đơn vị / Cá nhân" -> chèn `{{ entity_name }}`
  - Nút "Mã số thuế" -> chèn `{{ tax_code }}`
  - Nút "Dòng Đại diện & Chức vụ" -> chèn `{{ representative_row }}`
  - Nút "Địa chỉ" -> chèn `{{ address }}`
  - Nút "Số điện thoại" -> chèn `{{ phone }}`
  - Nút "Email" -> chèn `{{ email }}`
* **Thời gian hiện tại / Ngày ký**:
  - Nút "Ngày hiện tại" -> chèn `{{ current_day }}`
  - Nút "Tháng hiện tại" -> chèn `{{ current_month }}`
  - Nút "Năm hiện tại" -> chèn `{{ current_year }}`

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
