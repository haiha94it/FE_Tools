import { toast as sonnerToast } from "sonner";

/** Toast chuẩn dự án — dùng Sonner, không dùng alert hay toast tự viết */
export const toast = {
  success: (message: string) => sonnerToast.success(message),
  error: (message: string) => sonnerToast.error(message),
  info: (message: string) => sonnerToast.info(message),
  warning: (message: string) => sonnerToast.warning(message),
};