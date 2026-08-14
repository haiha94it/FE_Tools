import Breadcrumbs from "@/components/public/Breadcrumbs";
import { CatalogEmpty, ToolCard } from "@/components/public/CatalogCards";
import PublicShell from "@/components/public/PublicShell";
import VatCalculator, { VatUsageGuide } from "@/features/calculators/vat/ui/VatCalculator";
import { fetchProfessions, fetchToolDetail, fetchTools } from "@/services/catalog.service";
import type { Profession, ToolDetail, ToolListItem } from "@/types/catalog";
import { FiCheckCircle, FiClock, FiInfo, FiLock } from "react-icons/fi";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

/** SEO title/description lấy từ cùng catalog API, không hardcode slug public. */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const professions = await fetchProfessions();
    const profession = professions.find((item) => item.slug === slug);
    if (profession) {
      return {
        title: profession.seo_title || profession.name,
        description: profession.seo_description || profession.description,
      };
    }
    const tool = await fetchToolDetail(slug);
    return { title: tool.name, description: tool.short_description };
  } catch {
    return { title: "Không tìm thấy nội dung" };
  }
}

/** Render route SEO ngắn: profession hoặc tool, phân loại hoàn toàn bằng catalog API. */
export default async function PublicCatalogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let professions: Profession[];
  try {
    professions = await fetchProfessions();
  } catch {
    return <PublicShell><div className="mx-auto min-h-[65vh] max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><CatalogEmpty message="Chưa thể tải nội dung. Vui lòng thử lại sau." /></div></PublicShell>;
  }

  const profession = professions.find((item) => item.slug === slug);
  if (profession) {
    const tools = await fetchTools({ profession: slug }).catch(() => [] as ToolListItem[]);
    return <ProfessionContent profession={profession} tools={tools} />;
  }

  let tool: ToolDetail;
  try {
    tool = await fetchToolDetail(slug);
  } catch {
    notFound();
  }
  const related = (await fetchTools({ profession: tool.profession_slug }).catch(() => [] as ToolListItem[])).filter((item) => item.slug !== tool.slug).slice(0, 3);
  return <ToolContent tool={tool} related={related} />;
}

/** Nội dung trang nghề cho route ngắn. */
function ProfessionContent({ profession, tools }: { profession: Profession; tools: ToolListItem[] }) {
  return <PublicShell><div className="mx-auto min-h-[65vh] max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8"><Breadcrumbs items={[{ label: profession.name }]} /><div className="max-w-3xl"><span className="text-sm font-bold text-emerald-700">{profession.tool_count ?? tools.length} công cụ tính toán</span><h1 className="mt-2 text-3xl font-extrabold tracking-[-0.04em] text-slate-900 sm:text-5xl">{profession.name}</h1><p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">{profession.description}</p></div>{tools.length ? <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tools.map((tool) => <ToolCard key={tool.slug} tool={tool} />)}</div> : <div className="mt-10"><CatalogEmpty message="Công cụ trong ngành này đang được cập nhật." /></div>}</div></PublicShell>;
}

/** Skeleton tool trung thực, chưa chạy calculator. */
function ToolContent({ tool, related }: { tool: ToolDetail; related: ToolListItem[] }) {
  if (tool.slug === "tinh-thue-gtgt") return <VatToolContent tool={tool} related={related} />;
  return <PublicShell><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8"><Breadcrumbs items={[{ label: tool.profession_name, href: `/${tool.profession_slug}` }, { label: tool.name }]} /><div className="max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800"><FiClock aria-hidden="true" /> Đang hoàn thiện</span><h1 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-slate-900 sm:text-5xl">{tool.name}</h1><p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">{tool.short_description}</p></div><div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_.9fr]"><section aria-labelledby="form-title" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_50px_-35px_rgba(15,23,42,.35)] sm:p-7"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.12em] text-emerald-700">Thông tin đầu vào</p><h2 id="form-title" className="mt-1 text-xl font-bold">Nhập số liệu</h2></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">Sắp có</span></div><fieldset disabled className="mt-7 space-y-5 opacity-65"><label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Giá trị cần tính</span><input className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm" placeholder="Tính năng đang được xây dựng" /></label><label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Tùy chọn</span><select className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm"><option>Chưa khả dụng</option></select></label><button className="h-12 w-full rounded-xl bg-emerald-800 text-sm font-bold text-white">Tính kết quả</button></fieldset></section><section aria-labelledby="result-title" className="flex min-h-[330px] flex-col justify-center rounded-3xl border border-emerald-800/10 bg-emerald-950 p-7 text-white shadow-[0_22px_55px_-35px_rgba(6,78,59,.7)]"><span className="grid size-12 place-items-center rounded-2xl bg-white/10"><FiLock aria-hidden="true" className="size-5" /></span><p className="mt-6 text-xs font-bold uppercase tracking-[.13em] text-lime-300">Vùng kết quả</p><h2 id="result-title" className="mt-2 text-2xl font-extrabold tracking-[-0.025em]">Công cụ đang được hoàn thiện</h2><p className="mt-3 leading-7 text-emerald-100">Chúng tôi chưa mở phép tính để tránh đưa ra kết quả chưa được kiểm chứng.</p></section></div><aside className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"><FiInfo aria-hidden="true" className="mt-0.5 size-5 shrink-0" /><p><strong>Lưu ý:</strong> {tool.long_description || "Kết quả sau này chỉ mang tính tham khảo. Hãy đối chiếu quy định và điều kiện thực tế trước khi quyết định."}</p></aside><section className="mt-16 border-t border-slate-200 pt-12"><h2 className="text-2xl font-extrabold tracking-[-0.025em]">Công cụ liên quan</h2><p className="mt-2 text-sm text-slate-600">Các công cụ khác trong {tool.profession_name}.</p>{related.length ? <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{related.map((item) => <ToolCard key={item.slug} tool={item} />)}</div> : <div className="mt-7"><CatalogEmpty message="Chưa có công cụ liên quan để hiển thị." /></div>}</section></div></PublicShell>;
}

/** Trang VAT thật: metadata vẫn từ API, phép tính chỉ chạy client-side. */
function VatToolContent({ tool, related }: { tool: ToolDetail; related: ToolListItem[] }) {
  return (
    <PublicShell>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Breadcrumbs items={[{ label: tool.profession_name, href: `/${tool.profession_slug}` }, { label: tool.name }]} />
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-900"><FiCheckCircle aria-hidden="true" /> Tính trực tiếp trên trình duyệt</span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-slate-900 sm:text-5xl">{tool.name}</h1>
          <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">{tool.short_description}</p>
        </div>
        <VatCalculator />
        <VatUsageGuide />
        <section className="mt-16 border-t border-slate-200 pt-12">
          <h2 className="text-2xl font-extrabold tracking-[-0.025em]">Công cụ liên quan</h2>
          <p className="mt-2 text-sm text-slate-600">Các công cụ khác trong {tool.profession_name}.</p>
          {related.length ? <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{related.map((item) => <ToolCard key={item.slug} tool={item} />)}</div> : <div className="mt-7"><CatalogEmpty message="Chưa có công cụ liên quan để hiển thị." /></div>}
        </section>
      </div>
    </PublicShell>
  );
}
