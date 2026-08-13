import { CatalogEmpty, ProfessionCard, ToolCard } from "@/components/public/CatalogCards";
import PublicShell from "@/components/public/PublicShell";
import { APP_NAME } from "@/constants/brand";
import { fetchFeaturedTools, fetchProfessions } from "@/services/catalog.service";
import { createPublicMetadata } from "@/lib/seo/metadata";
import { FiArrowRight, FiCheck, FiMessageSquare } from "react-icons/fi";
import type { Metadata } from "next";
import type { Profession, ToolListItem } from "@/types/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = createPublicMetadata({ title: `${APP_NAME} — Công cụ miễn phí cho người làm nghề`, description: "Công cụ tính toán miễn phí cho kế toán hộ, thợ xây và người làm nghề. Không cần đăng nhập.", path: "/", absoluteTitle: true });

/** Trang chủ public, dữ liệu nghề và tool lấy từ catalog API. */
export default async function PublicHomePage() {
  let professions: Profession[] = [];
  let featuredTools: ToolListItem[] = [];
  let loadFailed = false;
  try {
    [professions, featuredTools] = await Promise.all([fetchProfessions(), fetchFeaturedTools()]);
  } catch {
    loadFailed = true;
  }

  return (
    <PublicShell>
      <section className="relative overflow-hidden border-b border-emerald-950/8 bg-[#f2f7ed]">
        <div aria-hidden="true" className="absolute -right-28 -top-32 size-[420px] rounded-full bg-lime-200/45 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:px-8 lg:py-28">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-700/15 bg-white/80 px-3 py-2 text-xs font-bold text-emerald-800 shadow-sm"><span className="size-2 rounded-full bg-lime-500" /> Dễ dùng · Minh bạch · Tiếng Việt</div>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.12] tracking-[-0.045em] text-emerald-950 sm:text-5xl lg:text-6xl">Công cụ tính toán miễn phí cho người làm nghề</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">Tính nhanh việc thường ngày, trình bày rõ ràng và không cần đăng nhập. Chọn đúng ngành nghề để bắt đầu.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#danh-muc" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-6 text-sm font-bold text-white shadow-lg shadow-emerald-900/15 transition-colors hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">Khám phá công cụ <FiArrowRight aria-hidden="true" /></a>
              <a href="https://zalo.me/g/m7q5sdrvbdlmrmu590t6" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-900/15 bg-white px-6 text-sm font-bold text-emerald-900 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">Đề xuất công cụ</a>
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-[0_30px_80px_-35px_rgba(6,78,59,.45)] backdrop-blur sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-emerald-700">Cam kết trải nghiệm</p>
            <div className="mt-5 space-y-4">
              {["Không cần tạo tài khoản", "Nội dung ngắn gọn, dễ hiểu", "Kết quả luôn kèm lưu ý tham khảo"].map((item) => <div key={item} className="flex items-center gap-3 rounded-xl bg-[#f7faf4] p-4 text-sm font-semibold text-slate-700"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-700 text-white"><FiCheck aria-hidden="true" /></span>{item}</div>)}
            </div>
          </div>
        </div>
      </section>

      <section id="danh-muc" className="scroll-mt-6 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 max-w-2xl"><p className="text-sm font-bold text-emerald-700">Danh mục theo nghề</p><h2 className="mt-2 text-3xl font-extrabold tracking-[-0.035em] text-slate-900 sm:text-4xl">Chọn công việc bạn đang làm</h2><p className="mt-3 leading-7 text-slate-600">Mỗi nhóm gom những phép tính gần với công việc thực tế.</p></div>
          {loadFailed ? <CatalogEmpty message="Chưa thể tải danh mục. Vui lòng thử lại sau." /> : professions.length ? <div className="grid gap-5 md:grid-cols-2">{professions.map((p) => <ProfessionCard key={p.slug} profession={p} />)}</div> : <CatalogEmpty message="Danh mục đang được cập nhật." />}
        </div>
      </section>

      <section className="border-y border-emerald-950/8 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold text-emerald-700">Dùng nhiều trước tiên</p><h2 className="mt-2 text-3xl font-extrabold tracking-[-0.035em] text-slate-900 sm:text-4xl">Công cụ nổi bật</h2></div></div>
          {featuredTools.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{featuredTools.map((tool) => <ToolCard key={tool.slug} tool={tool} />)}</div> : <CatalogEmpty message={loadFailed ? "Chưa thể tải công cụ nổi bật." : "Công cụ nổi bật đang được cập nhật."} />}
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 overflow-hidden rounded-[2rem] bg-emerald-900 p-7 text-white shadow-xl shadow-emerald-950/10 sm:p-10 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl"><span className="grid size-11 place-items-center rounded-xl bg-white/10"><FiMessageSquare aria-hidden="true" className="size-5" /></span><h2 className="mt-5 text-2xl font-extrabold tracking-[-0.025em] sm:text-3xl">Bạn muốn thêm công cụ gì?</h2><p className="mt-3 leading-7 text-emerald-100">Gửi bài toán bạn thường gặp. Ý kiến thực tế giúp chúng tôi ưu tiên công cụ hữu ích hơn.</p></div>
          <a href="https://zalo.me/g/m7q5sdrvbdlmrmu590t6" target="_blank" rel="noreferrer" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-lime-300 px-6 text-sm font-extrabold text-emerald-950 transition-colors hover:bg-lime-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Vào nhóm Zalo <FiArrowRight aria-hidden="true" /></a>
        </div>
      </section>
    </PublicShell>
  );
}
