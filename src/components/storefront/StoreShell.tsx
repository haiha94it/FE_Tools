"use client";

import StoreCartDrawer from "@/components/storefront/StoreCartDrawer";
import StoreCheckoutModal from "@/components/storefront/StoreCheckoutModal";
import StoreHeader from "@/components/storefront/StoreHeader";
import { useShopCartStore } from "@/stores/use-shop-cart-store";
import type { ShopCover } from "@/types/zalo-shop";
import { useEffect } from "react";

interface StoreShellProps {
  sellerId: string;
  cover: ShopCover | null;
  children: React.ReactNode;
  headerVariant?: "light" | "dark";
}

export default function StoreShell({
  sellerId,
  cover,
  children,
  headerVariant = "light",
}: StoreShellProps) {
  const setSellerId = useShopCartStore((s) => s.setSellerId);
  const fetchCart = useShopCartStore((s) => s.fetchCart);
  const openCart = useShopCartStore((s) => s.openCart);

  useEffect(() => {
    setSellerId(sellerId);
    void fetchCart();
  }, [sellerId, setSellerId, fetchCart]);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Ambient orbs */}
      <div
        className="pointer-events-none fixed -left-32 top-20 h-96 w-96 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(236,72,153,0.25) 0%, transparent 70%)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed -right-24 bottom-32 h-80 w-80 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(24,24,27,0.12) 0%, transparent 70%)" }}
        aria-hidden
      />

      <StoreHeader
        sellerId={sellerId}
        cover={cover}
        onCartClick={openCart}
        variant={headerVariant}
      />
      <main className="relative">{children}</main>
      <StoreCartDrawer />
      <StoreCheckoutModal />

      <footer className="relative mt-20 border-t border-[var(--store-border)]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="text-center sm:text-left">
              <p className="store-display text-xl text-[var(--store-primary)]">
                {cover?.name || "Cửa hàng"}
              </p>
              <p className="mt-1 text-sm text-[var(--store-muted)]">
                Trải nghiệm mua sắm cao cấp — giao hàng tận nơi
              </p>
            </div>
            <div className="flex items-center gap-6 text-xs font-medium uppercase tracking-widest text-[var(--store-muted)]">
              <span>COD</span>
              <span className="h-1 w-1 rounded-full bg-[var(--store-accent)]" />
              <span>Đổi trả 7 ngày</span>
              <span className="h-1 w-1 rounded-full bg-[var(--store-accent)]" />
              <span>Hỗ trợ 24/7</span>
            </div>
          </div>
          <p className="mt-10 text-center text-xs text-[var(--store-muted)]">
            © {new Date().getFullYear()} Zalo Commerce
          </p>
        </div>
      </footer>
    </div>
  );
}