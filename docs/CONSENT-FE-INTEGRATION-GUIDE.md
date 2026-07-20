# Hướng dẫn FE — Đồng thuận xử lý tin nhắn Zalo (ký + popup + PDF)

**Dành cho:** team Frontend ChotCare (`FE_ZALO_V2` hoặc FE đang dùng).  
**SSOT logic product:** `BE/docs/CONSENT-FE-BE-SIGNATURE.md`  
**BE phase 1:** **đã code** — path khớp `BE/consent/urls.py`.

**Không** gọi “chữ ký số”. Dùng: **đồng ý / ký xác nhận / chữ ký điện tử**.

**Cập nhật:** Admin soạn điều khoản theo **2 cách (dùng cùng lúc được)**:

| | Tên | Admin làm gì | Lưu BE |
|---|-----|--------------|--------|
| **A** | Rich text | Soạn trong trình soạn thảo (in đậm, list…) — **không gõ HTML tay** | `body_html` (editor sinh HTML) |
| **B** | Upload PDF | Upload file PDF hợp đồng đã soạn (Word → Export PDF) | `contract_pdf` |

---

## 1. FE cần làm gì (tóm tắt)

| # | Việc |
|---|------|
| 1 | Vào **Tin nhắn** → `GET status` → `need_sign` → modal ký |
| 2 | Modal: xem điều khoản (**rich text và/hoặc PDF**) + **họ tên + SĐT** + vẽ chữ ký + phóng to + xác nhận |
| 3 | Sau ký: toast, chat; nút tải PDF chứng từ (BE generate / kèm PDF gốc) |
| 4 | Admin setup: **rich text editor** + **upload PDF** + **1 ảnh** chữ ký+dấu CT + Kích hoạt |
| 5 | Admin list user: cột Đã ký/Chưa + Chi tiết + PDF |

**Chưa làm phase 1:** thu hồi, DocuSeal, convert Word→PDF server-side.

---

## 2. Quy tắc nghiệp vụ

1. **Chưa kích hoạt** → không popup, chat bình thường.  
2. **Đã kích hoạt + chưa ký** → modal + chặn chat; BE gate `CONSENT_CHAT_REQUIRED`.  
3. **Khi ký bắt buộc** — họ tên đầy đủ + SĐT + chữ ký tay (pad không trống). Thiếu một → không submit.  
4. **Bên A:** **một ảnh** chữ ký kèm con dấu (admin ghép sẵn). **Bên B:** form họ tên/SĐT + canvas user.  
5. Nội dung **luôn bản mới** (GET terms mỗi lần mở) — không cache lâu.  
6. Ký một chiều — không thu hồi phase 1.  
7. **Nội dung điều khoản:** đủ **A hoặc B** (hoặc cả hai) mới cho admin kích hoạt. FE validate tương tự trước khi bật.

---

## 3. Envelope API

```json
{ "success": true, "message": "...", "data": { } }
{ "success": false, "message": "...", "error_code": "CODE" }
```

- OK: `unwrapApiData`  
- Lỗi: `getApiErrorMessage(err)`  
- List user: `unwrapPaginatedPayload` nếu có page  

---

## 4. API contract

Base: **`/api/consent/`** — JWT. Admin: `is_admin` / staff.

### 4.1. Status (vào Tin nhắn)

`GET /api/consent/message-processing/status/`

```json
{
  "system_activated": false,
  "user_signed": false,
  "need_sign": false,
  "signed_at": null,
  "can_use_chat": true
}
```

`need_sign = system_activated && !user_signed`

### 4.2. Terms (mở modal / preview)

`GET /api/consent/message-processing/terms/`

```json
{
  "title": "Đồng thuận xử lý tin nhắn Zalo",
  "body_html": "<p>...</p>",
  "has_body_html": true,
  "contract_pdf_url": "https://.../media/consent/company/contract_1_xxx.pdf",
  "has_contract_pdf": true,
  "display_mode": "pdf_and_html",
  "company_name": "...",
  "company_tax_code": "...",
  "company_address": "...",
  "company_signature_url": "...",
  "updated_at": "...",
  "system_activated": false
}
```

| Field | FE |
|-------|-----|
| `display_mode` | `empty` \| `html` \| `pdf` \| `pdf_and_html` |
| `body_html` | Render **an toàn** (DOMPurify) khi `has_body_html` |
| `contract_pdf_url` | Viewer PDF / iframe / `embed` / nút mở tab khi `has_contract_pdf` |

**Cách hiển thị modal user (khuyến nghị):**

```
if display_mode === 'empty' → báo “Chưa cấu hình điều khoản” (edge; không nên xảy ra khi đã activate)
if has_contract_pdf → khối xem PDF (ưu tiên cao nếu legal coi PDF là bản chính)
if has_body_html → khối nội dung rich text (cuộn)
luôn: Bên A (1 ảnh chữ ký+dấu) + Bên B (canvas ký)
```

### 4.3. Sign

`POST /api/consent/message-processing/sign/`

JSON:

```json
{
  "full_name": "Nguyễn Văn A",
  "phone": "0912345678",
  "signature": {
    "format": "png",
    "image_base64": "data:image/png;base64,...",
    "width": 600,
    "height": 200,
    "stroke_count": 3
  },
  "client_platform": "web_desktop"
}
```

Hoặc multipart: `full_name`, `phone`, `signature` file + `stroke_count`, `width`, `height`, `client_platform`.

| Field | Bắt buộc | Rule |
|-------|----------|------|
| `full_name` | **Có** | ≥ 2 ký tự sau trim |
| `phone` | **Có** | 9–11 chữ số (cho phép `+`, khoảng, `-`) |
| chữ ký | **Có** | `stroke_count >= 1`, PNG &lt; 500KB |

**Success `data`:** `signed_at`, `signer_full_name`, `signer_phone`, `status`.

**Lỗi 400:** message từ BE (vd. “Vui lòng nhập họ tên đầy đủ”, “Số điện thoại không hợp lệ”, thiếu chữ ký).

### 4.4. PDF chứng từ user (sau khi ký)

`GET /api/consent/message-processing/pdf/`  
→ `application/pdf` attachment (BE generate: terms hiện hành + chữ ký).

Ngoài ra user có thể **mở `contract_pdf_url`** (PDF gốc admin upload) nếu có — đó là bản form CT.

### 4.5. Admin setup

`GET /api/consent/admin/setup/` — giống terms + `is_activated`, `activated_at`, `activated_by_id`.

`POST /api/consent/admin/setup/` — **multipart/form-data** khi có file.

| Field | Kiểu | Mô tả |
|-------|------|--------|
| `title` | text | Tiêu đề |
| `body_html` | text | HTML **do rich-text editor xuất** (không bắt admin gõ HTML) |
| `company_name`, `company_tax_code`, `company_address` | text | Bên A |
| `company_signature` | file ảnh | **1 ảnh** chữ ký + con dấu ghép sẵn |
| `contract_pdf` | file PDF | **Phương án B** — max 20MB, `.pdf` |
| `clear_contract_pdf` | `1` / `true` | Xóa PDF đã upload (không gửi file mới) |

`POST /api/consent/admin/activate/` — cần: (body_html **hoặc** contract_pdf) + **1 ảnh** bên A (`company_signature`).  
`POST /api/consent/admin/deactivate/`

### 4.6. List user

`GET /api/users/get-all-account?number_per_page=50&page=1`

```json
{
  "message_processing_signed": false,
  "message_processing_signed_at": null
}
```

### 4.7. Admin contract + PDF user

`GET /api/consent/admin/users/<user_id>/contract/`  
`GET /api/consent/admin/users/<user_id>/pdf/`

Contract có `terms.body_html`, `terms.contract_pdf_url`, `terms.has_contract_pdf`, …

### 4.8. Gate chat

```json
{
  "success": false,
  "message": "Bạn cần ký đồng ý xử lý tin nhắn Zalo trước khi sử dụng chat.",
  "error_code": "CONSENT_CHAT_REQUIRED"
}
```

→ mở modal ký, toast `message`.

---

## 5. Admin UI — soạn điều khoản (A + B)

**Không** dùng placeholder “Nhập HTML điều khoản…”.

### 5.1. Layout form setup (gợi ý)

```
[ Tiêu đề hợp đồng ]

── Nội dung điều khoản ──────────────────────
Tab hoặc 2 block:

[A] Soạn thảo văn bản
  ┌─────────────────────────────────────────┐
  │ [B] [I] [H2] [List] [Link] …            │  ← toolbar rich text
  │                                         │
  │  (vùng soạn như Word nhẹ)               │
  │                                         │
  └─────────────────────────────────────────┘
  Ghi chú: “Soạn như văn bản thường. Hệ thống tự lưu định dạng.”

[B] File PDF hợp đồng (bản chính / form đẹp)
  [ Chọn file PDF ]  hoặc kéo-thả
  Preview: tên file + dung lượng + [Xóa PDF]
  Ghi chú: “Có thể soạn Word rồi File → Save as PDF rồi upload.”

── Thông tin / chữ ký bên A ─────────────────
  Tên CT | MST | Địa chỉ
  Upload 1 ảnh: chữ ký + con dấu (ghép sẵn)

[ Lưu cấu hình ]

Trạng thái: Đang tắt / Đang bật
[ Kích hoạt ]  [ Tắt kích hoạt ]
```

### 5.2. Rich text (A) — library gợi ý

| Lib | Ghi chú |
|-----|---------|
| TipTap | Hiện đại, headless, React/Next tốt |
| Quill | Nhanh, API đơn giản |
| Lexical | Meta, linh hoạt |
| CKEditor 5 | Giống Word hơn, nặng hơn |

**Bắt buộc:**

- Export HTML vào field `body_html` khi **Lưu**.  
- **Không** hiện raw HTML cho admin (trừ “Nâng cao” optional).  
- Sanitize khi **hiển thị user** (DOMPurify).  
- Cho phép: heading, bold/italic, list, paragraph, link; **cấm** script/iframe lạ.

```ts
// pseudo lưu
const html = editor.getHTML(); // hoặc getSemanticHTML()
formData.append('body_html', html);
```

### 5.3. Upload PDF (B)

```ts
formData.append('contract_pdf', file); // File type application/pdf
// Xóa:
formData.append('clear_contract_pdf', '1');
```

Validate FE: extension `.pdf`, size ≤ 20MB, MIME `application/pdf`.

Preview admin: link mở tab / object embed nhỏ.

### 5.4. Khi nào bắt buộc A / B

| Tình huống | FE |
|------------|-----|
| Lưu setup | Cho phép lưu nháp (BE chấp nhận) |
| Bấm **Kích hoạt** | Cần `has_body_html || has_contract_pdf` + đã có ảnh bên A `company_signature` |
| Chỉ PDF, không soạn text | OK |
| Chỉ rich text, không PDF | OK |
| Cả hai | OK — modal user hiện cả hai (PDF ưu tiên visual) |

---

## 6. User modal — xem nội dung + ký

```
┌──────────────────────────────────────────┐
│ Đồng thuận xử lý tin nhắn Zalo        ✕  │
├──────────────────────────────────────────┤
│ (scroll)                                 │
│ [Nếu PDF]  Viewer PDF / “Mở PDF full”    │
│ [Nếu HTML]  Nội dung đã sanitize         │
│                                          │
│ Bên A — Công ty                          │
│ [1 ảnh chữ ký+dấu]  Tên / MST / Địa chỉ │
├──────────────────────────────────────────┤
│ Bên B — Thông tin người ký *             │
│ Họ tên đầy đủ  [________________]        │
│ Số điện thoại  [________________]        │
│ (gợi ý prefill từ profile user nếu có)   │
│                                          │
│ Chữ ký tay *                             │
│ [ canvas ]  [Phóng to] [Xóa]             │
│ ☑ Tôi đã đọc và đồng ý...                │
│ [ Ký và đồng ý ]                         │
└──────────────────────────────────────────┘
```

**Submit disabled khi:** `!full_name.trim()` \|\| `!phoneValid` \|\| pad trống \|\| !checkbox.

Prefill gợi ý: `user.fullname` / `user.phone_number` từ session profile — user **vẫn sửa được**; BE lưu đúng giá trị gửi lúc ký (snapshot).

### 6.1. PDF viewer gợi ý

- Desktop: `<iframe src={contract_pdf_url}>` hoặc `react-pdf`  
- Mobile: nút **Mở PDF** (tab mới / full screen) + vẫn bắt ký bên dưới  
- Auth: URL media cần cookie/token theo cách app đang serve `/media/` (nếu media public theo path có chữ ký path — OK; nếu private thì BE phải stream có auth)

### 6.2. Pad chữ ký

- pointer events, `touch-action: none`  
- Phóng to full màn (mobile + desktop)  
- `signature_pad` npm hoặc canvas tự viết  

---

## 7. Flow tin nhắn + admin list

Giữ như trước:

- Mount chat → status → modal nếu `need_sign`  
- List user: cột Đã ký / Chưa + Chi tiết (họ tên/SĐT lúc ký + HTML/PDF + chữ ký + tải PDF BE)  

---

## 8. Service / component gợi ý

```text
src/services/consent.service.ts

components/consent/
  MessageConsentModal.tsx
  SignaturePad.tsx
  SignaturePadFullscreen.tsx
  ConsentTermsViewer.tsx      # HTML sanitize + PDF viewer theo display_mode
admin:
  ConsentSetupPage.tsx
  ConsentRichTextEditor.tsx   # TipTap/Quill wrap
  ConsentPdfUploadField.tsx
  UserConsentDetailDrawer.tsx
```

---

## 9. Copy VI

| Chỗ | Text |
|-----|------|
| Label A | Soạn nội dung điều khoản |
| Hint A | Soạn như văn bản. Không cần biết HTML. |
| Label B | Upload file PDF hợp đồng |
| Hint B | Soạn trên Word rồi “Lưu thành PDF” và chọn file tại đây. |
| Bỏ | “Nhập HTML điều khoản…” |
| Kích hoạt confirm | User chưa ký sẽ bị chặn quét tin / chat. Tiếp tục? |
| Label họ tên | Họ tên đầy đủ |
| Label SĐT | Số điện thoại |
| Nút submit | Ký và đồng ý |
| Lỗi họ tên | Vui lòng nhập họ tên đầy đủ |
| Lỗi SĐT | Vui lòng nhập số điện thoại hợp lệ |
| Lỗi chữ ký trống | Vui lòng ký tên trước khi xác nhận |

---

## 10. Checklist FE

| # | Kịch bản | Pass |
|---|----------|------|
| F1 | Admin soạn rich text, không đụng HTML raw | |
| F2 | Admin upload PDF ≤20MB | |
| F3 | Chỉ A hoặc chỉ B vẫn Kích hoạt được (đủ 1 ảnh bên A) | |
| F4 | Modal user: PDF và/hoặc HTML + ký | |
| F5 | Thiếu họ tên / SĐT / pad trống → không submit; BE 400 nếu lách | |
| F6 | Phóng to ký mobile/desktop | |
| F7 | Gate `CONSENT_CHAT_REQUIRED` → modal | |
| F8 | List user cột ký + chi tiết + PDF | |
| F9 | Chưa activate → không popup chat | |

---

## 11. BE liên quan (FE biết để gọi đúng)

| Việc | Ghi chú |
|------|---------|
| Field `contract_pdf` | Migration `0002_consentsetup_contract_pdf` |
| `signer_full_name`, `signer_phone` | Migration `0003_messageprocessingsignature_signer_info` |
| Activate | Cần HTML **hoặc** PDF + 1 ảnh bên A (`company_signature`) |
| Sign body | `full_name` + `phone` + signature |
| PDF download user | Generate; PDF gốc = `contract_pdf_url` |

Deploy server:

```bash
docker compose exec web python manage.py migrate consent
# gồm 0002 PDF, 0003 họ tên/SĐT, 0004 bỏ company_stamp (1 ảnh bên A)
```

---

## 12. Liên hệ file

| File | Vai trò |
|------|---------|
| `BE/docs/CONSENT-FE-BE-SIGNATURE.md` | Logic product |
| `BE/docs/CONSENT-FE-INTEGRATION-GUIDE.md` | Guide FE (file này) |
| `BE/consent/` | API + model |

**Không** dùng `popup/decree` cho flow ký này.
