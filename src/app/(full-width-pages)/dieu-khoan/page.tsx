import TermsContent from "@/components/auth/TermsContent";
import { LEGAL_BRAND_NAME } from "@/constants/brand";
import { createPublicMetadata } from "@/lib/seo/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = createPublicMetadata({
  title: "Điều khoản sử dụng",
  description: `Điều khoản sử dụng dịch vụ CSKH — ${LEGAL_BRAND_NAME}. Quy định về tài khoản, quyền và trách nhiệm khi sử dụng nền tảng quản trị Zalo.`,
  path: "/dieu-khoan",
  ogType: "article",
  keywords: ["điều khoản CSKH", "điều khoản sử dụng", "chính sách dịch vụ Zalo"],
});

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 dark:bg-gray-900 sm:px-6">
      <div className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow-theme-sm dark:bg-gray-800 sm:p-10">
        <h1 className="mb-6 text-title-sm font-semibold text-gray-800 dark:text-white/90">
          Điều khoản sử dụng
        </h1>
        <TermsContent />
      </div>
    </div>
  );
}