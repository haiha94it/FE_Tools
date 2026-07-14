export const CONTACT_LABEL_OPTIONS = [
  { id: 1, label: "Nhắn tin liên hệ" },
  { id: 3, label: "Nhắn tin đặt tuor" },
  { id: 7, label: "Nhắn tin tư vấn" },
  { id: 9, label: "Nhắn tin đặt chỗ" },
  { id: 10, label: "Nhắn tin đặt hàng" },
  { id: 11, label: "Nhắn tin công việc" },
  { id: 8, label: "Nhắn tin" },
] as const;

export function getContactLabelText(id?: number): string {
  if (id == null) return "Nhãn liên hệ";
  return CONTACT_LABEL_OPTIONS.find((item) => item.id === id)?.label ?? "Nhãn liên hệ";
}