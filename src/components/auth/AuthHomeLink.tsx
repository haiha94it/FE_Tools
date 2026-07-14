import { ChevronLeftIcon } from "@/icons";
import Link from "next/link";

export default function AuthHomeLink() {
  return (
    <Link
      href="/"
      aria-label="Về trang chủ"
      className="group -ml-1 inline-flex min-h-11 items-center gap-1.5 rounded-lg py-2 pr-2 text-sm font-medium text-gray-500 transition-colors duration-200 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/25 dark:text-gray-400 dark:hover:text-white/90"
    >
      <ChevronLeftIcon
        aria-hidden
        className="size-4 shrink-0 text-gray-400 transition-[transform,color] duration-200 group-hover:-translate-x-0.5 group-hover:text-brand-500 dark:text-gray-500 dark:group-hover:text-brand-400"
      />
      <span>Trang chủ</span>
    </Link>
  );
}