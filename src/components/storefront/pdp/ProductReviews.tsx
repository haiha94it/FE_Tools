"use client";

import { productSocialProof } from "@/components/storefront/pdp/pdp-utils";
import type { ShopProduct } from "@/types/zalo-shop";
import Image from "next/image";

const SAMPLE = [
  {
    name: "Minh Anh",
    rating: 5,
    date: "2 ngày trước",
    text: "Hàng chính hãng, đóng gói cẩn thận. Giao nhanh trong 2h nội thành.",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80",
    photos: true,
  },
  {
    name: "Quốc Bảo",
    rating: 5,
    date: "1 tuần trước",
    text: "Chất lượng vượt mong đợi. Shop hỗ trợ Zalo nhiệt tình.",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80",
    photos: false,
  },
  {
    name: "Thu Hà",
    rating: 4,
    date: "3 ngày trước",
    text: "Giá tốt, COD kiểm hàng trước. Sẽ ủng hộ tiếp.",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&auto=format&fit=crop&q=80",
    photos: true,
  },
];

export default function ProductReviews({ product }: { product: ShopProduct }) {
  const proof = productSocialProof(product);
  const bars = [
    { star: 5, pct: 78 },
    { star: 4, pct: 14 },
    { star: 3, pct: 5 },
    { star: 2, pct: 2 },
    { star: 1, pct: 1 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="text-center sm:min-w-[120px]">
          <p className="text-4xl font-extrabold text-[var(--store-primary)]">
            {proof.rating}
          </p>
          <div className="mt-1 flex justify-center gap-0.5 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="mt-1 text-xs text-[var(--store-muted)]">
            {proof.reviews} đánh giá
          </p>
        </div>
        <div className="flex-1 space-y-1.5">
          {bars.map((b) => (
            <div key={b.star} className="flex items-center gap-2 text-xs">
              <span className="w-8 font-medium text-slate-500">{b.star}★</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${b.pct}%` }}
                />
              </div>
              <span className="w-8 text-right text-slate-400">{b.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {SAMPLE.map((r) => (
          <article
            key={r.name}
            className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9 overflow-hidden rounded-full bg-slate-200">
                <Image src={r.avatar} alt="" fill className="object-cover" unoptimized sizes="36px" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-slate-900">{r.name}</p>
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    Đã mua
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="text-amber-400">
                    {"★".repeat(r.rating)}
                  </span>
                  {r.date}
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              {r.text}
            </p>
            {r.photos ? (
              <div className="mt-3 flex gap-2">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="h-14 w-14 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300"
                  />
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
