import { createPublicMetadata, NOINDEX_ROBOTS } from "@/lib/seo/metadata";
import GridShape from "@/components/common/GridShape";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = createPublicMetadata({
  title: "Không tìm thấy trang",
  description: "Trang bạn tìm kiếm không tồn tại trên CSKH.",
  robots: NOINDEX_ROBOTS,
  skipCanonical: true,
});

export default function NotFound() {
  return (
    <div className="relative z-1 flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
      <GridShape />
      <div className="mx-auto w-full max-w-[242px] text-center sm:max-w-[472px]">
        <h1 className="mb-8 text-title-md font-bold text-gray-800 xl:text-title-2xl dark:text-white/90">
          Không tìm thấy trang
        </h1>

        <Image
          src="/images/error/404.svg"
          alt="Minh họa lỗi 404 — trang không tồn tại"
          className="dark:hidden"
          width={472}
          height={152}
        />
        <Image
          src="/images/error/404-dark.svg"
          alt="Minh họa lỗi 404 — trang không tồn tại"
          className="hidden dark:block"
          width={472}
          height={152}
        />

        <p className="mt-10 mb-6 text-base text-gray-700 sm:text-lg dark:text-gray-400">
          Trang bạn đang tìm không tồn tại hoặc đã được di chuyển.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
        >
          Về trang chủ
        </Link>
      </div>
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} — CSKH
      </p>
    </div>
  );
}