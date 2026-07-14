/** Tên thương hiệu hiển thị — tạm dùng CAREVIPPRO */
export const APP_NAME = "CAREVIPPRO";

/** Tên pháp lý trong điều khoản đăng ký — đồng bộ ZaloCN (titleIntruc) */
export const LEGAL_BRAND_NAME = "Chốt Nhanh";

export function pageTitle(page: string): string {
  return `${page} | ${APP_NAME}`;
}