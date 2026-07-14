"use client";

import { formatVnd } from "@/lib/shop-utils";
import { useShopCartStore } from "@/stores/use-shop-cart-store";

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
      <div
        className="fixed inset-0 z-[99998] bg-black/55 backdrop-blur-md"
        onClick={closeCart}
        aria-hidden
      />
      <aside className="fixed inset-y-0 right-0 z-[99999] flex w-full max-w-md flex-col bg-[var(--store-primary)] text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--store-accent)]">
              Giỏ hàng
            </p>
            <h2 className="store-display mt-1 text-xl">Đơn của bạn</h2>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
            aria-label="Đóng"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                <svg className="h-7 w-7 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                </svg>
              </div>
              <p className="text-sm text-white/60">Giỏ hàng trống</p>
              <p className="mt-1 text-xs text-white/40">Thêm sản phẩm để bắt đầu</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => {
                const price = Number(
                  item.product_variant.promotion_price || item.product_variant.price,
                );
                return (
                  <li
                    key={item.id}
                    className="flex gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
                  >
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white/10">
                      <svg className="h-6 w-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium">{item.title}</p>
                      <p className="mt-0.5 text-xs text-white/50">{item.product_variant.classify}</p>
                      <p className="mt-1.5 text-sm font-semibold text-[var(--store-accent)]">
                        {formatVnd(price)}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            void updateQuantity(item.id, Math.max(0, item.quantity - 1))
                          }
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-white/10 text-sm transition hover:bg-white/20"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            void updateQuantity(item.id, item.quantity + 1)
                          }
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-white/10 text-sm transition hover:bg-white/20"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 ? (
          <div className="border-t border-white/10 px-6 py-6">
            <div className="mb-5 flex items-end justify-between">
              <span className="text-sm text-white/60">Tổng thanh toán</span>
              <span className="store-display text-2xl">{formatVnd(cart?.total_amount)}</span>
            </div>
            <button
              type="button"
              onClick={openCheckout}
              disabled={isLoading}
              className="store-btn-accent w-full cursor-pointer rounded-2xl py-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Tiến hành đặt hàng
            </button>
          </div>
        ) : null}
      </aside>
    </>
  );
}