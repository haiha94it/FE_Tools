"use client";

interface StockUrgencyBarProps {
  stock: number;
  soldPct?: number;
  showProgress?: boolean;
}

export default function StockUrgencyBar({
  stock,
  soldPct = 72,
  showProgress = true,
}: StockUrgencyBarProps) {
  if (stock <= 0) return null;
  const urgent = stock <= 10;
  const pct = Math.min(95, Math.max(15, soldPct));

  return (
    <div
      className={`rounded-xl border px-3.5 py-3 ${
        urgent
          ? "border-rose-200 bg-rose-50/80"
          : "border-amber-100 bg-amber-50/60"
      }`}
    >
      <p
        className={`text-xs font-bold ${
          urgent ? "text-rose-700" : "text-amber-800"
        }`}
      >
        {urgent
          ? `Chỉ còn ${stock} sản phẩm giá ưu đãi!`
          : `Còn ${stock} sản phẩm · đang bán chạy`}
      </p>
      {showProgress ? (
        <div className="mt-2">
          <div className="h-2 overflow-hidden rounded-full bg-white/80">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                urgent
                  ? "bg-gradient-to-r from-rose-500 to-orange-400"
                  : "bg-gradient-to-r from-amber-400 to-orange-500"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-[10px] font-medium text-[var(--store-muted)]">
            Đã bán ~{pct}% suất ưu đãi
          </p>
        </div>
      ) : null}
    </div>
  );
}
