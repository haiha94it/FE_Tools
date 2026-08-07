"use client";

import { useShopCartStore } from "@/stores/use-shop-cart-store";
import Link from "next/link";
import { useState } from "react";

interface MobilePwaBottomNavProps {
  sellerId: string;
  contactZalo?: string;
}

export default function MobilePwaBottomNav({
  sellerId,
  contactZalo,
}: MobilePwaBottomNavProps) {
  const openCart = useShopCartStore((s) => s.openCart);
  const cart = useShopCartStore((s) => s.cart);
  const itemCount = cart?.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
  const [activeTab, setActiveTab] = useState<"home" | "products" | "cart" | "zalo">("home");

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <nav className="fixed bottom-4 left-3 right-3 z-40 md:hidden animate-in slide-in-from-bottom-5 duration-300">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around rounded-full border border-stone-800/90 bg-stone-950/92 px-2 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl ring-1 ring-white/10">
        {/* Home Button */}
        <Link
          href={`/store/${sellerId}`}
          onClick={() => setActiveTab("home")}
          className={`relative flex flex-col items-center justify-center px-3 py-1 text-center transition-all duration-200 ${
            activeTab === "home" ? "text-amber-400 scale-105" : "text-stone-400 hover:text-stone-200"
          }`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          <span className="mt-1 text-[10px] font-bold">Trang chủ</span>
        </Link>

        {/* Products Section */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("products");
            scrollToSection("products");
          }}
          className={`relative flex flex-col items-center justify-center px-3 py-1 text-center transition-all duration-200 ${
            activeTab === "products" ? "text-amber-400 scale-105" : "text-stone-400 hover:text-stone-200"
          }`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
          <span className="mt-1 text-[10px] font-bold">Sản phẩm</span>
        </button>

        {/* Cart Button */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("cart");
            openCart();
          }}
          className={`relative flex flex-col items-center justify-center px-3 py-1 text-center transition-all duration-200 ${
            activeTab === "cart" ? "text-amber-400 scale-105" : "text-stone-400 hover:text-stone-200"
          }`}
        >
          <div className="relative">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
            </svg>
            {itemCount > 0 ? (
              <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-600 px-1 text-[9px] font-extrabold text-white shadow-sm ring-1 ring-stone-950">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            ) : null}
          </div>
          <span className="mt-1 text-[10px] font-bold">Giỏ hàng</span>
        </button>

        {/* Zalo Chat Button */}
        {contactZalo ? (
          <a
            href={contactZalo.startsWith("http") ? contactZalo : `https://zalo.me/${contactZalo}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setActiveTab("zalo")}
            className="flex flex-col items-center justify-center px-3 py-1 text-center text-blue-400 transition-all duration-200 hover:scale-105"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-black text-white shadow-xs">
              Z
            </span>
            <span className="mt-1 text-[10px] font-bold">Tư vấn Zalo</span>
          </a>
        ) : null}
      </div>
    </nav>
  );
}
