import { ChevronLeftIcon } from "@/icons";
import Link from "next/link";

export default function AuthHomeLink() {
  return (
    <Link
      href="/"
      className="fixed top-5 left-5 z-50 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-200 bg-white/90 px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm backdrop-blur-sm transition hover:border-brand-200 hover:bg-white hover:text-brand-600 dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-300 dark:hover:border-brand-500/40 dark:hover:text-brand-400 sm:top-6 sm:left-6"
    >
      <ChevronLeftIcon className="h-4 w-4 shrink-0" />
      Về trang chủ
    </Link>
  );
}