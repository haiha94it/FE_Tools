"use client";

import {
  StoreField,
  StoreInput,
  StoreSelect,
} from "@/components/storefront/StoreFormControls";
import { formatVnd, getShopSessionKey } from "@/lib/shop-utils";
import { toast } from "@/lib/toast";
import { zaloShopService } from "@/services/zalo-shop.service";
import { useShopCartStore } from "@/stores/use-shop-cart-store";
import type { ShopLocation } from "@/types/zalo-shop";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

export default function StoreCheckoutModal() {
  const isOpen = useShopCartStore((s) => s.isCheckoutOpen);
  const cart = useShopCartStore((s) => s.cart);
  const sellerId = useShopCartStore((s) => s.sellerId);
  const closeCheckout = useShopCartStore((s) => s.closeCheckout);
  const clearAfterOrder = useShopCartStore((s) => s.clearAfterOrder);

  const [mounted, setMounted] = useState(false);
  const [cities, setCities] = useState<ShopLocation[]>([]);
  const [wards, setWards] = useState<ShopLocation[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [selectedWardId, setSelectedWardId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone_number: "",
    address: "",
    note: "",
  });

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    void zaloShopService.listCities().then(setCities);
  }, [isOpen]);

  useEffect(() => {
    if (!selectedCityId) return;
    void zaloShopService.listWards(selectedCityId).then(setWards);
  }, [selectedCityId]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const selectedCity = cities.find((c) => c.id === selectedCityId);
  const selectedWard = wards.find((w) => w.id === selectedWardId);
  const itemCount = cart?.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerId) return;
    if (!form.full_name || !form.phone_number || !form.address) {
      toast.error("Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ!");
      return;
    }
    if (!selectedCity?.city || !selectedWard?.ward) {
      toast.error("Vui lòng chọn Tỉnh/Thành phố và Phường/Xã!");
      return;
    }

    const description = cart?.items
      ?.map(
        (item) =>
          `+ ${item.title}\nPhân loại: ${item.product_variant.classify}\nSL: ${item.quantity} x ${formatVnd(item.product_variant.price)}`,
      )
      .join("\n");

    setSubmitting(true);
    try {
      await zaloShopService.createOrder({
        id_employee: sellerId,
        session_key: getShopSessionKey(),
        full_name: form.full_name,
        phone_number: form.phone_number,
        city: selectedCity.city,
        ward: selectedWard.ward,
        address: form.address,
        note: form.note,
        description,
        total_amount: cart?.total_amount,
      });
      setSuccess(true);
      clearAfterOrder();
      toast.success("Đặt hàng thành công!");
    } catch {
      toast.error("Đặt hàng thất bại, vui lòng thử lại sau!");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setForm({ full_name: "", phone_number: "", address: "", note: "" });
    setSelectedCityId(null);
    setSelectedWardId(null);
    closeCheckout();
  };

  if (!isOpen || !mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="store-checkout-root fixed inset-0 z-[100001] flex items-end justify-center p-0 sm:items-center sm:p-4 transition-all duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="store-checkout-title"
    >
      {/* Dark Glass Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/70 backdrop-blur-md transition-opacity duration-300"
        onClick={handleClose}
        aria-hidden
      />

      {/* Modal Surface Container */}
      <div
        className="relative z-10 flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl border border-stone-200/90 dark:border-stone-800 dark:bg-stone-900 sm:max-h-[90dvh] sm:rounded-3xl transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {success ? (
          <SuccessView onClose={handleClose} />
        ) : (
          <>
            {/* Modal Header */}
            <header className="flex shrink-0 items-center justify-between border-b border-stone-100 dark:border-stone-800 px-6 py-4.5 sm:px-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-500 border border-amber-400/30">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-500">
                      ⚡ Đơn Hàng B2B / Bán Lẻ
                    </span>
                    <span className="text-[10px] text-stone-400">| 🔒 Bảo mật 100%</span>
                  </div>
                  <h2
                    id="store-checkout-title"
                    className="text-lg sm:text-xl font-black text-stone-900 dark:text-white tracking-tight"
                  >
                    Thông Tin Giao Hàng
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-white transition-all"
                aria-label="Đóng"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            {/* Modal Body */}
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row">
              {/* Form Side */}
              <form
                id="store-checkout-form"
                onSubmit={(e) => void handleSubmit(e)}
                className="flex-1 space-y-4 px-6 py-5 sm:px-8 sm:py-6"
              >
                <StoreField label="Họ và tên người nhận *">
                  <StoreInput
                    value={form.full_name}
                    onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                    placeholder="Nhập họ và tên đầy đủ..."
                    autoComplete="name"
                  />
                </StoreField>

                <StoreField label="Số điện thoại liên hệ *">
                  <StoreInput
                    type="tel"
                    value={form.phone_number}
                    onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
                    placeholder="Số điện thoại nhận hàng (ví dụ: 0912 345 678)..."
                    autoComplete="tel"
                  />
                </StoreField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <StoreField label="Tỉnh / Thành phố *">
                    <StoreSelect
                      value={selectedCityId ?? ""}
                      onChange={(e) => {
                        setSelectedCityId(Number(e.target.value) || null);
                        setSelectedWardId(null);
                      }}
                    >
                      <option value="">-- Chọn tỉnh/thành --</option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.city}
                        </option>
                      ))}
                    </StoreSelect>
                  </StoreField>

                  <StoreField label="Phường / Xã *">
                    <StoreSelect
                      value={selectedWardId ?? ""}
                      onChange={(e) => setSelectedWardId(Number(e.target.value) || null)}
                      disabled={!selectedCityId}
                    >
                      <option value="">-- Chọn phường/xã --</option>
                      {wards.map((ward) => (
                        <option key={ward.id} value={ward.id}>
                          {ward.ward}
                        </option>
                      ))}
                    </StoreSelect>
                  </StoreField>
                </div>

                <StoreField label="Địa chỉ chi tiết *">
                  <StoreInput
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    placeholder="Số nhà, tên đường, tòa nhà, căn hộ..."
                    autoComplete="street-address"
                  />
                </StoreField>

                <StoreField label="Ghi chú đơn hàng (Tùy chọn)">
                  <StoreInput
                    value={form.note}
                    onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                    placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..."
                  />
                </StoreField>

                {/* Mobile Actions */}
                <div className="flex gap-3 pt-3 lg:hidden">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 cursor-pointer rounded-2xl border border-stone-200 py-3 text-xs font-bold text-stone-700 dark:border-stone-800 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-all"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 cursor-pointer rounded-2xl bg-amber-400 py-3 text-xs font-black text-stone-950 hover:bg-amber-300 shadow-md transition-all disabled:opacity-50"
                  >
                    {submitting ? "Đang xử lý..." : "Đặt hàng"}
                  </button>
                </div>
              </form>

              {/* Order Summary Sidebar */}
              <aside className="shrink-0 border-t border-stone-100 bg-stone-50 dark:bg-stone-950/60 dark:border-stone-800 px-6 py-5 sm:px-8 lg:w-80 lg:border-l lg:border-t-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black uppercase tracking-wider text-stone-400 dark:text-stone-500">
                      📦 Chi Tiết Đơn Hàng
                    </p>
                    <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-500 border border-amber-400/30">
                      {itemCount} sản phẩm
                    </span>
                  </div>

                  {/* Items List */}
                  <ul className="mt-4 max-h-48 space-y-2.5 overflow-y-auto custom-scrollbar pr-1 lg:max-h-60">
                    {cart?.items?.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start justify-between gap-3 text-xs font-medium text-stone-700 dark:text-stone-300 rounded-xl bg-white dark:bg-stone-900 p-2.5 border border-stone-200/80 dark:border-stone-800 shadow-2xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-stone-900 dark:text-white line-clamp-1">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-stone-400 mt-0.5">
                            {item.product_variant.classify || "Tiêu chuẩn"} × {item.quantity}
                          </p>
                        </div>
                        <span className="font-extrabold text-stone-950 dark:text-white shrink-0">
                          {formatVnd(Number(item.product_variant.price ?? 0) * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Payment Method Badge */}
                  <div className="mt-5 rounded-2xl bg-amber-400/10 p-3 border border-amber-400/20">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">💵</span>
                      <div>
                        <p className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">Hình Thức Thanh Toán</p>
                        <p className="text-xs font-bold text-stone-800 dark:text-stone-200">Thanh toán khi nhận hàng (COD)</p>
                      </div>
                    </div>
                  </div>

                  {/* Total summary */}
                  <div className="mt-5 border-t border-stone-200 dark:border-stone-800 pt-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-extrabold text-stone-500 dark:text-stone-400">Tổng thanh toán:</span>
                      <span className="text-xl sm:text-2xl font-black text-amber-500">
                        {formatVnd(cart?.total_amount)}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-stone-400 text-right">Miễn phí giao hàng cho đơn từ 500k</p>
                  </div>
                </div>

                {/* Desktop Actions */}
                <div className="mt-6 hidden gap-2.5 lg:flex lg:flex-col">
                  <button
                    type="submit"
                    form="store-checkout-form"
                    disabled={submitting}
                    className="w-full cursor-pointer rounded-2xl bg-amber-400 py-3.5 text-xs font-black text-stone-950 hover:bg-amber-300 shadow-md transition-all hover:scale-102 disabled:opacity-50"
                  >
                    {submitting ? "Đang xử lý..." : "⚡ Xác Nhận Đặt Hàng"}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full cursor-pointer rounded-2xl border border-stone-200 py-2.5 text-xs font-bold text-stone-600 dark:border-stone-800 dark:text-stone-400 hover:bg-white dark:hover:bg-stone-900 transition-all"
                  >
                    Quay lại
                  </button>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

function SuccessView({ onClose }: { onClose: () => void }) {
  return (
    <div className="px-6 py-12 text-center sm:px-12 sm:py-16">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-500 border border-emerald-400/30 shadow-lg">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-2xl font-black text-stone-900 dark:text-white tracking-tight sm:text-3xl">
        Đặt Hàng Thành Công! 🎉
      </h3>
      <p className="mx-auto mt-3 max-w-md text-xs sm:text-sm font-medium leading-relaxed text-stone-600 dark:text-stone-300">
        Cảm ơn bạn đã tin tưởng đơn hàng! Nhân viên tư vấn sẽ liên hệ với bạn trong thời gian sớm nhất để xác nhận và giao hàng.
      </p>
      <button
        type="button"
        onClick={onClose}
        className="mt-8 w-full max-w-xs cursor-pointer rounded-2xl bg-amber-400 py-3.5 text-xs font-black text-stone-950 hover:bg-amber-300 shadow-md transition-all hover:scale-105 sm:w-auto sm:px-10"
      >
        Tiếp Tục Mua Sắm →
      </button>
    </div>
  );
}