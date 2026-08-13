import type { Profession, ToolListItem } from "@/types/catalog";
import { FiArrowRight, FiBriefcase, FiCheckCircle, FiHome, FiTool, FiTrendingUp } from "react-icons/fi";
import Link from "next/link";

const professionIcons = { calculator: FiTrendingUp, "hard-hat": FiHome } as const;

/** Card ngành lấy toàn bộ nội dung từ catalog API. */
export function ProfessionCard({ profession }: { profession: Profession }) {
  const Icon = professionIcons[profession.icon as keyof typeof professionIcons] ?? FiBriefcase;
  return (
    <Link href={`/${profession.slug}`} className="group flex min-h-[238px] flex-col rounded-3xl border border-emerald-950/10 bg-white p-6 shadow-[0_14px_40px_-28px_rgba(6,78,59,.45)] transition duration-200 hover:-translate-y-1 hover:border-emerald-700/25 hover:shadow-[0_22px_50px_-28px_rgba(6,78,59,.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-4 sm:p-7">
      <div className="mb-7 flex items-start justify-between">
        <span className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><Icon aria-hidden="true" className="size-6" /></span>
        <span className="rounded-full bg-lime-50 px-3 py-1.5 text-xs font-bold text-emerald-800">{profession.tool_count ?? 0} công cụ</span>
      </div>
      <h3 className="text-xl font-bold tracking-[-0.025em] text-slate-900">{profession.name}</h3>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{profession.description}</p>
      <span className="mt-auto flex items-center gap-2 pt-6 text-sm font-bold text-emerald-800">Xem công cụ <FiArrowRight aria-hidden="true" className="transition-transform group-hover:translate-x-1" /></span>
    </Link>
  );
}

/** Card tool dùng chung trang chủ, nghề và related tools. */
export function ToolCard({ tool }: { tool: ToolListItem }) {
  return (
    <Link href={`/${tool.slug}`} className="group flex min-h-[210px] flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_-24px_rgba(15,23,42,.35)] transition duration-200 hover:-translate-y-0.5 hover:border-emerald-700/30 hover:shadow-[0_18px_36px_-24px_rgba(6,78,59,.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-4 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><FiTool aria-hidden="true" className="size-5" /></span>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[.08em] text-emerald-700"><FiCheckCircle aria-hidden="true" /> Miễn phí</span>
      </div>
      <h3 className="mt-5 text-lg font-bold tracking-[-0.02em] text-slate-900">{tool.name}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{tool.short_description}</p>
      <span className="mt-auto flex items-center gap-2 pt-5 text-sm font-bold text-emerald-800">Mở công cụ <FiArrowRight aria-hidden="true" className="transition-transform group-hover:translate-x-1" /></span>
    </Link>
  );
}

export function CatalogEmpty({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-600">{message}</div>;
}
