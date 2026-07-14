"use client";

import { shopImageUrl } from "@/lib/shop-utils";
import type { ShopCover } from "@/types/zalo-shop";
import Image from "next/image";

interface StoreHeroProps {
  cover: ShopCover | null;
  productCount?: number;
  categoryCount?: number;
}

export default function StoreHero({
  cover,
  productCount = 0,
  categoryCount = 0,
}: StoreHeroProps) {
  const banner = cover?.image ? shopImageUrl(cover.image) : null;

  return (
    <section className="relative pt-4 sm:pt-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-[var(--store-primary)]">
          {banner ? (
            <>
              <Image
                src={banner}
                alt=""
                fill
                className="object-cover opacity-50 mix-blend-luminosity"
                priority
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--store-primary)] via-[var(--store-primary)]/85 to-[var(--store-primary)]/40" />
            </>
          ) : (
            <div
              className="absolute inset-0 opacity-60"
              style={{
                background:
                  "linear-gradient(135deg, #18181b 0%, #3f3f46 50%, #18181b 100%)",
              }}
            />
          )}

          <div className="absolute left-0 top-1/3 h-px w-full bg-gradient-to-r from-transparent via-[var(--store-accent)] to-transparent opacity-60" />

          <div className="relative flex flex-col gap-8 p-6 sm:gap-10 sm:p-10 lg:p-12">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--store-accent)]" />
                <span className="text-xs font-medium uppercase tracking-[0.15em] text-white/80">
                  New Season
                </span>
              </div>

              <h1 className="store-display mt-5 text-3xl leading-[1.15] text-white sm:text-4xl lg:text-5xl">
                {cover?.name || "Khám phá bộ sưu tập"}
              </h1>

              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70 sm:text-base">
                Sản phẩm được tuyển chọn — thiết kế tinh tế, chất lượng đảm bảo, giao hàng nhanh chóng.
              </p>

              <a
                href="#products"
                className="store-btn-accent mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold sm:mt-8"
              >
                Khám phá ngay
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-4">
              <StatCard label="Sản phẩm" value={productCount} />
              <StatCard label="Danh mục" value={categoryCount} />
              <div className="store-glass col-span-2 flex items-center gap-3 rounded-2xl px-4 py-3.5 sm:col-span-1 sm:px-5 sm:py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--store-accent-soft)] sm:h-10 sm:w-10">
                  <svg className="h-5 w-5 text-[var(--store-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[var(--store-muted)]">Giao hàng</p>
                  <p className="truncate text-sm font-semibold text-[var(--store-primary)]">
                    Toàn quốc · COD
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="store-glass rounded-2xl px-4 py-3.5 sm:min-w-[120px] sm:px-5 sm:py-4">
      <p className="store-display text-2xl text-[var(--store-primary)] sm:text-3xl">{value}</p>
      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-[var(--store-muted)] sm:text-xs">
        {label}
      </p>
    </div>
  );
}