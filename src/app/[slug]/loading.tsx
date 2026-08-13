import PublicShell from "@/components/public/PublicShell";

/** Skeleton dùng chung khi tải profession hoặc tool route ngắn. */
export default function PublicCatalogLoading() {
  return <PublicShell><div className="mx-auto min-h-[70vh] max-w-7xl animate-pulse px-4 py-10 sm:px-6 lg:px-8"><div className="h-8 w-56 rounded-lg bg-slate-200" /><div className="mt-8 h-12 w-3/4 rounded-xl bg-slate-200" /><div className="mt-5 h-5 w-full max-w-xl rounded bg-slate-200" /><div className="mt-10 grid gap-5 md:grid-cols-2"><div className="h-72 rounded-3xl bg-white ring-1 ring-slate-200" /><div className="h-72 rounded-3xl bg-emerald-950/90" /></div></div></PublicShell>;
}
