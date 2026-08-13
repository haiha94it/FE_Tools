import { FiChevronRight, FiHome } from "react-icons/fi";
import Link from "next/link";

/** Breadcrumb semantic cho route public. */
export default function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Đường dẫn" className="mb-7">
      <ol className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <li><Link href="/" aria-label="Trang chủ" className="grid size-8 place-items-center rounded-lg hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"><FiHome aria-hidden="true" /></Link></li>
        {items.map((item) => <li key={item.label} className="flex items-center gap-2"><FiChevronRight aria-hidden="true" className="text-slate-300" />{item.href ? <Link className="rounded hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600" href={item.href}>{item.label}</Link> : <span className="font-medium text-slate-700" aria-current="page">{item.label}</span>}</li>)}
      </ol>
    </nav>
  );
}
