/** Tên thương hiệu hiển thị */
export const APP_NAME = "CSKH tự động";

/** Tên pháp lý trong điều khoản đăng ký — đồng bộ ZaloCN (titleIntruc) */
export const LEGAL_BRAND_NAME = "Chốt Nhanh";

export function pageTitle(page: string): string {
  return `${page} | ${APP_NAME}`;
}