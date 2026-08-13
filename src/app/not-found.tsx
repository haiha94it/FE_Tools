import PublicShell from "@/components/public/PublicShell";
import { FiArrowLeft } from "react-icons/fi";
import Link from "next/link";

/** 404 tiếng Việt cho route public. */
export default function NotFound() {
  return <PublicShell><div className="mx-auto flex min-h-[68vh] max-w-xl flex-col items-center justify-center px-4 py-20 text-center"><span className="text-sm font-extrabold uppercase tracking-[.18em] text-emerald-700">Lỗi 404</span><h1 className="mt-4 text-4xl font-extrabold tracking-[-0.04em] text-slate-900">Không tìm thấy trang</h1><p className="mt-4 leading-7 text-slate-600">Đường dẫn có thể đã thay đổi hoặc công cụ chưa được công khai.</p><Link href="/" className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-800 px-6 text-sm font-bold text-white hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"><FiArrowLeft aria-hidden="true" /> Về trang chủ</Link></div></PublicShell>;
}
