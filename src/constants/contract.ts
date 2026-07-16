/** Mẫu điều khoản PDF — đồng bộ ZaloCN `public/file/dksd.pdf` (14 trang nội dung) */
export const CONTRACT_PDF_URL = "/contracts/hop-dong-su-dung.pdf";

/** Số trang nội dung gốc; trang 15 (chữ ký Bên A/B) được ghép khi xem/ký */
export const CONTRACT_CONTENT_PAGE_COUNT = 14;

/** Layout trang chữ ký test — tọa độ pt, gốc trên-trái (dùng khi vẽ canvas) */
export const CONTRACT_SIGNATURE_PAGE_LAYOUT = {
  pageWidth: 612,
  pageHeight: 792,
  partyBSignatureBox: {
    x: 320,
    y: 410,
    width: 230,
    height: 80,
  },
} as const;

/**
 * Vùng ghép ảnh chữ ký Bên B trên trang cuối.
 * Khớp `partyBSignatureBox` — đơn vị pt, gốc dưới-trái (pdf-lib).
 */
export const CONTRACT_USER_SIGNATURE_SLOT = {
  pageFromEnd: 1,
  x: CONTRACT_SIGNATURE_PAGE_LAYOUT.partyBSignatureBox.x,
  y:
    CONTRACT_SIGNATURE_PAGE_LAYOUT.pageHeight -
    CONTRACT_SIGNATURE_PAGE_LAYOUT.partyBSignatureBox.y -
    CONTRACT_SIGNATURE_PAGE_LAYOUT.partyBSignatureBox.height,
  width: CONTRACT_SIGNATURE_PAGE_LAYOUT.partyBSignatureBox.width,
  height: CONTRACT_SIGNATURE_PAGE_LAYOUT.partyBSignatureBox.height,
} as const;