const PHONE_REGEX = /^(0[1|3|5|7|8|9])+([0-9]{8})$/;
const USERNAME_REGEX = /^[a-zA-Z0-9]+$/;

export function validatePhone(phone: string): string | null {
  if (!phone.trim()) return "Vui lòng nhập số điện thoại";
  if (!PHONE_REGEX.test(phone.trim())) {
    return "Số điện thoại không hợp lệ. Vui lòng nhập 10 số.";
  }
  return null;
}

export function validateGmail(mail: string): string | null {
  if (!mail.trim()) return "Vui lòng nhập Gmail";
  if (!mail.trim().includes("@gmail.com")) {
    return "Mail phải có định dạng @gmail.com";
  }
  return null;
}

export function validateUsername(username: string): string | null {
  if (!username.trim()) return "Vui lòng nhập tên đăng nhập";
  if (!USERNAME_REGEX.test(username.trim())) {
    return "Tên đăng nhập không được chứa dấu và ký tự đặc biệt";
  }
  return null;
}

export function containsDiacritics(value: string): boolean {
  return /[^\u0000-\u007E]/.test(value);
}

export function validatePassword(password: string): string | null {
  if (!password) return "Vui lòng nhập mật khẩu";
  if (containsDiacritics(password)) {
    return "Mật khẩu không được chứa ký tự có dấu";
  }
  return null;
}