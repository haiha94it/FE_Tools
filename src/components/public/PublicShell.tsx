import { LEGAL_BRAND_NAME } from "@/constants/brand";
import { API_SYSTEM } from "@/config/api";
import publicApi from "@/lib/public-api";
import BrandLogo from "@/components/common/BrandLogo";
import Link from "next/link";
import { connection } from "next/server";

/** Khung public sáng, tách biệt hoàn toàn khỏi admin shell. */
export default async function PublicShell({ children }: { children: React.ReactNode }) {
  // Buộc kiểm tra status theo từng request, không đóng băng trạng thái lúc build.
  await connection();
  let enabled = true;
  try {
    const response = await publicApi.get<{ enabled: boolean }>(
      API_SYSTEM.PUBLIC_UI_STATUS,
    );
    enabled = response.data.enabled !== false;
  } catch {
    // Fail-open: lỗi status tạm thời không làm mất toàn bộ website public.
  }

  if (!enabled) {
    return <div className="min-h-screen bg-white" aria-hidden="true" />;
  }

  return (
    <div className="min-h-screen bg-[#f8faf6] text-slate-900">
      <header className="border-b border-emerald-950/8 bg-[#fbfcf9]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex min-h-11 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">
            <BrandLogo variant="icon" className="size-10 object-contain sm:hidden" />
            <BrandLogo className="hidden h-10 w-auto object-contain sm:block" priority />
          </Link>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-emerald-950/8 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <BrandLogo className="h-8 w-auto object-contain" alt={LEGAL_BRAND_NAME} />
          <nav aria-label="Liên kết cuối trang" className="flex flex-wrap gap-x-6 gap-y-3">
            <Link className="rounded hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600" href="/dieu-khoan">Điều khoản sử dụng</Link>
            <Link className="rounded hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600" href="/bao-mat">Chính sách bảo mật</Link>
            <a className="rounded hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600" href="https://zalo.me/g/m7q5sdrvbdlmrmu590t6" target="_blank" rel="noreferrer">Góp ý</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
