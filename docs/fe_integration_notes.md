# Hướng dẫn FE: Bổ sung trường Số điện thoại bắt buộc khi Đăng ký & Tạo/Sửa Manager

Tài liệu này hướng dẫn cách sửa đổi giao diện Đăng ký (Register Form), giao diện tạo và chỉnh sửa Manager trên Admin panel Frontend để bổ sung trường số điện thoại bắt buộc, khớp với sự thay đổi kiểm thử ở Backend.

---

## 1. Thông tin API cập nhật

### 1.1 API Đăng ký Công khai (Public Registration)
*   **Endpoint**: `POST /api/register/create` (AllowAny)
*   **Trường bổ sung bắt buộc**: `phone_number` hoặc `phone` (Khuyến nghị gửi key: `phone_number`)
*   **Kiểu dữ liệu**: `string`
*   **Format hợp lệ**: Bắt đầu bằng `0`, `+84` hoặc `84`, tiếp nối bằng 9 đến 10 chữ số (Regex: `^(0|\+84|84)\d{9,10}$`).

### 1.2 API Admin Tạo Manager (Admin panel)
*   **Endpoint**: `POST /api/users/create-manager` (Yêu cầu quyền Admin)
*   **Trường bổ sung bắt buộc**: `phone_number` hoặc `phone` khi tạo mới (`type != "extend"`)
*   **Format hợp lệ**: Tương tự như trên.

### 1.3 API Admin Sửa Manager (Admin panel)
*   **Endpoint**: `PATCH /api/users/edit-manager` (Yêu cầu quyền Admin/Saler)
*   **Trường bắt buộc khi cập nhật**: `phone_number` hoặc `phone` (Nếu có gửi trường này trong body payload thì bắt buộc không được rỗng và phải đúng định dạng).
*   **Format hợp lệ**: Tương tự như trên.

### 1.4 API External Tạo Manager
*   **Endpoint**: `POST /api/users/create-manager/external` (Encrypt AES payload, AllowAny)
*   **Trường bổ sung bắt buộc**: `phone_number` hoặc `phone` khi tạo mới (`action == "post"` và `type != "extend"`)
*   **Format hợp lệ**: Tương tự như trên.

---

## 2. Các lỗi Backend trả về (Error Envelope)

Nếu trường `phone_number` thiếu hoặc không hợp lệ, Backend sẽ trả về mã lỗi `400` với payload dạng:

### 2.1 Thiếu số điện thoại
```json
{
  "success": false,
  "message": "Bạn phải nhập số điện thoại",
  "error_code": "PHONE_REQUIRED"
}
```

### 2.2 Định dạng số điện thoại không hợp lệ
```json
{
  "success": false,
  "message": "Số điện thoại không hợp lệ",
  "error_code": "INVALID_PHONE"
}
```

---

## 3. Các bước cần thực hiện phía Frontend

### 3.1 Cập nhật Giao diện Đăng ký & Giao diện Admin Tạo/Sửa Manager
*   Thêm/Giữ ô nhập liệu (Input field): **Số điện thoại** kèm dấu hoa thị bắt buộc (`*`).
*   Placeholder ví dụ: `09xxxxxxxx` hoặc `+84xxxxxxxxx`.

### 3.2 Thêm Validation Client-side
Trước khi thực hiện gửi request, hãy kiểm tra dữ liệu ở Client:
```javascript
const validatePhone = (phone) => {
  const regex = /^(0|\+84|84)\d{9,10}$/;
  return regex.test(phone);
};

// Trong logic submit form (Đăng ký / Tạo / Sửa Manager)
if (isCreateMode || formData.phone_number !== undefined) {
  if (!formData.phone_number) {
    showError("Bạn phải nhập số điện thoại");
    return;
  }
  if (!validatePhone(formData.phone_number)) {
    showError("Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng ví dụ: 0912345678");
    return;
  }
}
```

### 3.3 Cập nhật Payload gửi đi
Đảm bảo payload có đầy đủ các trường bắt buộc bao gồm `phone_number`:
```json
{
  "fullname": "Họ và Tên",
  "mail": "example@gmail.com",
  "username": "example_username",
  "password": "ExamplePassword123",
  "phone_number": "0912345678"
}
```
