import { APP_NAME, LEGAL_BRAND_NAME } from "@/constants/brand";
import { FiActivity } from "react-icons/fi";
import Link from "next/link";

/** Khung public sáng, tách biệt hoàn toàn khỏi admin shell. */
export default function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8faf6] text-slate-900">
      <header className="border-b border-emerald-950/8 bg-[#fbfcf9]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex min-h-11 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-700 text-white shadow-sm transition-colors group-hover:bg-emerald-800">
              <FiActivity aria-hidden="true" className="size-5" strokeWidth={2.2} />
            </span>
            <span className="text-[17px] font-bold tracking-[-0.02em]">{APP_NAME}</span>
          </Link>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-emerald-950/8 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 font-semibold text-slate-700"><FiActivity aria-hidden="true" className="text-emerald-700" /> {LEGAL_BRAND_NAME}</div>
          <nav aria-label="Liên kết cuối trang" className="flex flex-wrap gap-x-6 gap-y-3">
            <Link className="rounded hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600" href="/dieu-khoan">Điều khoản</Link>
            <a className="rounded hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600" href="https://zalo.me/g/m7q5sdrvbdlmrmu590t6" target="_blank" rel="noreferrer">Góp ý</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
