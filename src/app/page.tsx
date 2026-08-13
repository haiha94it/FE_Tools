import { APP_NAME } from "@/constants/brand";
import { createPublicMetadata } from "@/lib/seo/metadata";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = createPublicMetadata({
  title: `${APP_NAME} — Công cụ đa ngành nghề`,
  description:
    "Nền tảng công cụ tính toán và hỗ trợ đa ngành nghề: kế toán, xây dựng, nông nghiệp, F&B…",
  path: "/",
  absoluteTitle: true,
  keywords: ["công cụ", "calculator", "đa ngành nghề", APP_NAME],
});

/** Tạm: chỉ hiện nút đăng nhập admin. Khôi phục hero + danh mục nghề khi mở public. */
export default function PublicHomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-white dark:from-gray-950 dark:to-gray-900">
      <Link
        href="/signin"
        className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
      >
        Đăng nhập admin
      </Link>
    </div>
  );
}
