# FE guide — Nhân viên & `account_limit` (team collab)

> **SSOT BE:** [`backend_logic_guide.md`](./backend_logic_guide.md) §15.2, §15.6  
> **Breaking nhẹ** so với Care cũ (NV từng có quota nick riêng / form gửi `account_limit`).

---

## Tóm tắt: FE **có cần sửa** không?

| Có / Không | Việc |
|------------|------|
| **Có** | Form **tạo / sửa NV**: bỏ field + body `account_limit` |
| **Có** | List NV (manager): hiển thị `account_count` / `account_limit` = **đã gán / gói manager** (vd `2/5`) |
| **Có (nếu đang sai)** | Màn nick NV: chỉ **tổng nick gán** — không form “thêm nick”, không quota X/Y |
| **Không bắt buộc** | TypeScript type: `account_limit` vẫn có trên response, **ý nghĩa đổi** (xem bảng) |
| **Không** | API gán nick / list nick NV path — contract giữ; chỉ bỏ validate “không vượt limit NV” nếu FE tự check |

---

## 1. Ý nghĩa field response (sau BE mới)

Áp dụng user **`is_employee: true`** trong:

- `GET /api/users/get-employees`
- `GET /api/users/me` (khi login NV)
- Response create/edit employee

| Field | Manager (`is_manager`) | Nhân viên (`is_employee`) |
|-------|------------------------|---------------------------|
| `account_limit` | Gói entitlement (max nick **sở hữu**) | **Luôn = `manager.account_limit`** |
| `account_count` | Số nick `ZaloAccount.user = manager` | Số nick **đã gán** (`EmployeeZaloAccountAssignment`) |
| `logged_account_count` | (get-employees alias) = `account_count` | = số nick đã gán |

**UI manager — cột hạn mức nick NV:**

```text
{account_count}/{account_limit}
// ví dụ: gán 2 nick, manager gói 5 → "2/5"
```

**Không** hiểu `account_limit` NV là “quota riêng NV được thêm nick” (đã bỏ).

---

## 2. Tạo nhân viên

### Cũ (sai với product mới)

```http
POST /api/users/create-employee
{
  "username": "tringu",
  "password": "12341234",
  "fullname": "Ho Minh Tri",
  "account_limit": 1,          // ❌ bỏ
  "listener_limit": 0
}
```

### Mới (đúng)

```http
POST /api/users/create-employee
Content-Type: application/json

{
  "username": "tringu",
  "password": "12341234",
  "fullname": "Ho Minh Tri",
  "listener_limit": 0
}
```

| Field body | Bắt buộc | Ghi chú |
|------------|----------|---------|
| `username` | ✅ | |
| `password` | ✅ | ≥ 8 ký tự, rule BE cũ |
| `fullname` | khuyến nghị | |
| `phone_number` | optional | |
| `listener_limit` | optional (default 0) | CarePro entitlement; **không** = “NV bật listener bao nick” |
| `account_limit` | ❌ **không gửi** | BE ignore; response vẫn trả `account_limit` = manager |

### UI form tạo NV

- [x] Xóa input “Giới hạn tài khoản” / “Số nick được cấp”
- [x] Không default `account_limit: 1` trong payload
- [x] (Optional) Hint: *Nick do quản lý gán sau khi tạo; hạn mức nick team theo gói quản lý*

### Response create (ví dụ manager gói 5, NV chưa gán nick)

```json
{
  "success": true,
  "data": {
    "id": 4,
    "is_employee": true,
    "account_count": 0,
    "account_limit": 5
  }
}
```

---

## 3. Sửa nhân viên

```http
POST /api/users/edit-employee
```

| Field | Cũ | Mới |
|-------|----|-----|
| `id_employee` | ✅ | ✅ |
| `password` | bắt buộc (tùy FE) | optional nếu BE cho trống = không đổi (FE gửi khi user đổi MK) |
| `account_limit` | bắt buộc | ❌ **không gửi** |
| `listener_limit` | có | giữ nếu form còn |
| `expiration_date` | có | theo form hiện tại |

- [x] Bỏ field `account_limit` trên form edit
- [x] Bỏ validate FE: “limit ≥ số nick đã gán” (BE không còn `ACCOUNT_LIMIT_TOO_LOW` cho case này)
- [x] Sau save: refresh list — `account_limit` vẫn = manager (không phụ thuộc body)

---

## 4. Danh sách NV (manager) — `GET /api/users/get-employees`

### Hiển thị

```tsx
// Pseudo
const label = `${emp.account_count}/${emp.account_limit}`;
// 2/5 = đã gán 2 nick / manager được tối đa 5 nick
```

| Cột gợi ý | Nguồn |
|-----------|--------|
| Đã gán / hạn mức gói | `account_count` / `account_limit` |
| (Optional) Tổng nick manager đang login | `GET /api/account/` length hoặc `me.account_count` **của manager** — **không** nhầm với `emp.account_count` |

### Copy UI

- Đúng: *“2/5 nick gói”* / *“Đã gán 2 · Gói quản lý 5”*
- Sai: *“Nhân viên được cấp 5 slot tự thêm nick”*

---

## 5. Màn nick phía nhân viên

| Việc | FE |
|------|-----|
| List nick | `GET /api/users/my-account-assignments` (hoặc `/api/account/` nếu đã team-aware) |
| Stats “Tổng tài khoản N” | `data.length` hoặc `me.account_count` (NV = số gán) |
| Thêm / xóa / bật listener nick | **Ẩn** — chỉ manager |
| Hiển thị X/Y gói | **Không bắt buộc** (hình: chỉ tổng 2) |

Copy gợi ý (đã đúng hướng):

> Xem nick Zalo manager đã gán cho bạn. Không thể thêm, sửa hoặc bật listener.

---

## 6. Gán nick (manager)

```http
GET  /api/users/employee-account-assignments?employee_id=
POST /api/users/employee-account-assignments/set
{ "employee_id": 4, "account_ids": [21, 25] }
```

- [ ] **Không** chặn `account_ids.length > employee.account_limit` (field đó giờ là gói manager, không phải cap gán)
- [ ] Vẫn chỉ chọn nick thuộc manager (`GET /api/account/`)
- [ ] Sau gán: `get-employees` → `account_count` tăng

---

## 7. Checklist FE

### Manager — Team / Employees

- [x] Create: payload **không** có `account_limit`
- [x] Edit: payload **không** có `account_limit`
- [x] List: `account_count/account_limit` = đã gán / gói manager
- [x] Gán nick: multi-select không cap theo limit NV cũ
- [x] Copy/tooltip cập nhật (không “phân bổ slot nick cho NV”)

### Nhân viên — Zalo accounts

- [x] Chỉ list nick gán + stats tổng
- [x] Không CTA thêm nick / bật listener
- [x] Không phụ thuộc `account_limit` để disable UI list

### Types / store (nếu có)

```ts
/** User employee trong get-employees / me */
type EmployeeRow = {
  id: number;
  is_employee: true;
  /** Số nick manager đã gán */
  account_count: number;
  /** = manager.account_limit (gói chủ team), KHÔNG phải quota riêng NV */
  account_limit: number;
  logged_account_count?: number; // alias account_count trên get-employees
};
```

---

## 8. Lỗi BE liên quan (FE đừng map sai)

| `error_code` | Còn dùng? | Ghi chú |
|--------------|-----------|---------|
| `ACCOUNT_LIMIT_EXCEEDED` (create/edit NV phân bổ) | ❌ bỏ path NV | Chỉ còn khi **manager thêm nick** vượt gói |
| `ACCOUNT_LIMIT_TOO_LOW` (edit NV) | ❌ | Không còn |
| `LISTENER_LIMIT_EXCEEDED` | ✅ (CarePro) | Phân bổ `listener_limit` NV vs gói manager — khác nick |
| `INVALID_ACCOUNTS` | ✅ | Gán nick không thuộc manager |

---

## 9. Smoke test FE

1. Manager gói 5 nick, login 3 nick → create NV **không** gửi `account_limit` → OK.  
2. Gán 2 nick cho NV → `get-employees` → `account_count: 2`, `account_limit: 5` → UI **2/5**.  
3. Login NV → list nick 2; “Tổng tài khoản 2”; không nút thêm nick.  
4. Edit NV đổi tên/MK **không** gửi `account_limit` → OK; list vẫn 2/5.

---

## 10. Liên quan doc

| Doc | Nội dung |
|-----|----------|
| [`backend_logic_guide.md`](./backend_logic_guide.md) §15 | Team collab SSOT |
| [`fe_integration_notes.md`](./fe_integration_notes.md) | Living FE migrate |

**BE đã ship:** create/edit ignore `account_limit`; serializer NV resolve limit = manager.
