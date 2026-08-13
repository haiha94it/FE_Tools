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

export default function PublicHomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white dark:from-gray-950 dark:to-gray-900">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-xl font-bold text-brand-600 dark:text-brand-400">
          {APP_NAME}
        </span>
        <Link
          href="/signin"
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          Đăng nhập admin
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-20 pt-10">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          Công cụ tính toán & hỗ trợ{" "}
          <span className="text-brand-600">đa ngành nghề</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-gray-600 dark:text-gray-300">
          Hầu hết tool dùng miễn phí, không cần đăng nhập. Hệ thống đang được
          xây dựng — danh mục nghề và tool sẽ bổ sung dần.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Kế toán",
            "Xây dựng",
            "Nông nghiệp",
            "F&B / Ẩm thực",
            "May mặc",
            "Điện nước",
          ].map((name) => (
            <div
              key={name}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {name}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Tool đang được chuẩn bị…
              </p>
            </div>
          ))}
        </div>

        <p className="mt-12 text-sm text-gray-400">
          Domain: tools.dahangsi.com · {APP_NAME}
        </p>
      </main>
    </div>
  );
}
