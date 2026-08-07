"use client";

import { formatVnd, shopImageUrl } from "@/lib/shop-utils";
import { useShopCartStore } from "@/stores/use-shop-cart-store";
import Image from "next/image";

export default function StoreCartDrawer() {
  const isOpen = useShopCartStore((s) => s.isCartOpen);
  const cart = useShopCartStore((s) => s.cart);
  const isLoading = useShopCartStore((s) => s.isLoading);
  const closeCart = useShopCartStore((s) => s.closeCart);
  const openCheckout = useShopCartStore((s) => s.openCheckout);
  const updateQuantity = useShopCartStore((s) => s.updateQuantity);

  if (!isOpen) return null;

  const items = cart?.items ?? [];

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-[99998] bg-stone-950/70 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
        onClick={closeCart}
        aria-hidden
      />

      {/* Cart Drawer Shell */}
      <aside className="fixed inset-y-0 right-0 z-[99999] flex w-full max-w-md flex-col border-l border-stone-800 bg-stone-950 text-stone-100 shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-transform duration-300 animate-in slide-in-from-right">
        {/* Top Header Bar */}
        <div className="border-b border-stone-800/90 bg-stone-900/40 p-5 sm:p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-1 text-xs font-extrabold uppercase text-stone-950 shadow-md">
                🛒 Giỏ hàng
              </span>
              <span className="rounded-full bg-stone-800 px-2.5 py-0.5 text-xs font-bold text-stone-300">
                {items.reduce((s, i) => s + i.quantity, 0)} món
              </span>
            </div>
            <button
              type="button"
              onClick={closeCart}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-stone-800 bg-stone-900 text-stone-400 transition-all duration-200 hover:border-stone-700 hover:bg-stone-800 hover:text-white"
              aria-label="Đóng giỏ hàng"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Cart Items List Area */}
        <div className="custom-scrollbar flex-1 overflow-y-auto p-5 sm:p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-stone-800 bg-stone-900/80 text-stone-500 shadow-inner">
                <svg className="h-9 w-9 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-white">Giỏ hàng của bạn đang trống</h3>
              <p className="mt-1 text-xs text-stone-400">Khám phá các sản phẩm tuyệt vời của gian hàng ngay hôm nay!</p>
            </div>
          ) : (
            <ul className="space-y-3.5">
              {items.map((item) => {
                const price = Number(item.product_variant.price);
                const subtotal = price * item.quantity;
                const thumbSrc = item.image ? shopImageUrl(item.image) : null;
                const variantId = item.id_product_variant ?? item.product_variant.id!;

                return (
                  <li
                    key={item.id}
                    className="group relative flex gap-3.5 rounded-2xl border border-stone-800/80 bg-stone-900/50 p-3.5 shadow-sm transition-all duration-200 hover:border-stone-700 hover:bg-stone-900/90"
                  >
                    {thumbSrc ? (
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-stone-800 bg-stone-950">
                        <Image src={thumbSrc} alt={item.title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" unoptimized />
                      </div>
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-stone-800 bg-stone-900">
                        <svg className="h-8 w-8 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4" />
                        </svg>
                      </div>
                    )}

                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-2 text-sm font-bold text-stone-100 group-hover:text-amber-400 transition-colors">
                            {item.title}
                          </p>
                          <button
                            type="button"
                            onClick={() => void updateQuantity(variantId, 0)}
                            className="text-stone-500 hover:text-rose-400 transition-colors p-1"
                            title="Xóa sản phẩm"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        {item.product_variant.classify ? (
                          <span className="inline-block mt-1 rounded bg-stone-800 px-2 py-0.5 text-[10px] font-bold text-stone-300">
                            {item.product_variant.classify}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 rounded-xl border border-stone-800 bg-stone-950 p-0.5">
                          <button
                            type="button"
                            onClick={() => void updateQuantity(variantId, Math.max(0, item.quantity - 1))}
                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-sm font-bold text-stone-300 transition hover:bg-stone-800 hover:text-white"
                            aria-label="Giảm số lượng"
                          >
                            −
                          </button>
                          <span className="w-7 text-center text-xs font-bold tabular-nums text-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => void updateQuantity(variantId, item.quantity + 1)}
                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-sm font-bold text-stone-300 transition hover:bg-stone-800 hover:text-white"
                            aria-label="Tăng số lượng"
                          >
                            +
                          </button>
                        </div>

                        <p className="text-sm font-extrabold text-amber-400">
                          {formatVnd(subtotal)}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer Checkout Action */}
        {items.length > 0 ? (
          <div className="border-t border-stone-800/90 bg-stone-900/90 p-5 sm:p-6 backdrop-blur-xl space-y-4">
            <div className="space-y-1.5 text-xs text-stone-400">
              <div className="flex justify-between">
                <span>Tạm tính ({items.length} món):</span>
                <span className="font-semibold text-stone-200">{formatVnd(cart?.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Phí vận chuyển:</span>
                <span className="font-bold text-emerald-400">
                  Tính khi thanh toán
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-stone-800 text-sm font-bold text-white">
                <span>Tổng tiền hàng:</span>
                <span className="store-display text-xl font-black text-amber-400">
                  {formatVnd(cart?.total_amount)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={openCheckout}
              disabled={isLoading}
              className="store-btn-accent w-full cursor-pointer rounded-2xl py-4 text-sm font-extrabold uppercase tracking-wide shadow-xl transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Tiến hành thanh toán ⚡
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] font-medium text-stone-500">
              <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Thanh toán an toàn 100% • Bảo mật thông tin</span>
            </div>
          </div>
        ) : null}
      </aside>
    </>
  );
}