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
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    void zaloShopService.listCities().then(setCities);
  }, [isOpen]);

  useEffect(() => {
    if (!selectedCityId) {
      setWards([]);
      return;
    }
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
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (!selectedCity?.city || !selectedWard?.ward) {
      toast.error("Vui lòng chọn tỉnh/thành và phường/xã");
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
      toast.error("Đặt hàng thất bại");
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
      className="store-checkout-root fixed inset-0 z-[100001] flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="store-checkout-title"
    >
      <div
        className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden
      />

      <div
        className="relative z-10 flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[1.75rem] bg-white shadow-2xl sm:max-h-[90dvh] sm:rounded-[1.75rem]"
        onClick={(e) => e.stopPropagation()}
      >
        {success ? (
          <SuccessView onClose={handleClose} />
        ) : (
          <>
            <header className="flex shrink-0 items-start justify-between border-b border-zinc-100 px-6 py-5 sm:px-8">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ec4899]">
                  Thanh toán
                </p>
                <h2
                  id="store-checkout-title"
                  className="mt-1 font-[family-name:var(--font-calistoga,'Calistoga',Georgia,serif)] text-2xl text-zinc-900"
                >
                  Thông tin giao hàng
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-800"
                aria-label="Đóng"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row">
              <form
                id="store-checkout-form"
                onSubmit={(e) => void handleSubmit(e)}
                className="flex-1 space-y-4 px-6 py-5 sm:px-8 sm:py-6"
              >
                <StoreField label="Họ và tên *">
                  <StoreInput
                    value={form.full_name}
                    onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                    placeholder="Nguyễn Văn A"
                    autoComplete="name"
                  />
                </StoreField>

                <StoreField label="Số điện thoại *">
                  <StoreInput
                    type="tel"
                    value={form.phone_number}
                    onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
                    placeholder="09xx xxx xxx"
                    autoComplete="tel"
                  />
                </StoreField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <StoreField label="Tỉnh / Thành *">
                    <StoreSelect
                      value={selectedCityId ?? ""}
                      onChange={(e) => {
                        setSelectedCityId(Number(e.target.value) || null);
                        setSelectedWardId(null);
                      }}
                    >
                      <option value="">Chọn tỉnh/thành</option>
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
                      <option value="">Chọn phường/xã</option>
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
                    placeholder="Số nhà, tên đường, tòa nhà..."
                    autoComplete="street-address"
                  />
                </StoreField>

                <StoreField label="Ghi chú đơn hàng">
                  <StoreInput
                    value={form.note}
                    onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                    placeholder="Thời gian giao hàng, hướng dẫn tìm nhà..."
                  />
                </StoreField>

                <div className="flex gap-3 pt-2 lg:hidden">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 cursor-pointer rounded-xl border border-zinc-200 py-3.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 cursor-pointer rounded-xl bg-zinc-900 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {submitting ? "Đang xử lý..." : "Đặt hàng"}
                  </button>
                </div>
              </form>

              <aside className="shrink-0 border-t border-zinc-100 bg-zinc-50 px-6 py-5 sm:px-8 lg:w-72 lg:border-l lg:border-t-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Đơn hàng
                </p>
                <p className="mt-2 text-sm text-zinc-600">
                  {itemCount} sản phẩm
                </p>

                <ul className="mt-4 max-h-40 space-y-2 overflow-y-auto lg:max-h-52">
                  {cart?.items?.map((item) => (
                    <li
                      key={item.id}
                      className="flex justify-between gap-2 text-sm text-zinc-700"
                    >
                      <span className="line-clamp-2 min-w-0 flex-1">
                        {item.title}
                        <span className="text-zinc-400"> ×{item.quantity}</span>
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 border-t border-zinc-200 pt-4">
                  <div className="flex items-end justify-between">
                    <span className="text-sm text-zinc-500">Tổng thanh toán</span>
                    <span className="font-[family-name:var(--font-calistoga,'Calistoga',Georgia,serif)] text-2xl text-zinc-900">
                      {formatVnd(cart?.total_amount)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">Thanh toán khi nhận hàng (COD)</p>
                </div>

                <div className="mt-5 hidden gap-3 lg:flex lg:flex-col">
                  <button
                    type="submit"
                    form="store-checkout-form"
                    disabled={submitting}
                    className="w-full cursor-pointer rounded-xl bg-zinc-900 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {submitting ? "Đang xử lý..." : "Xác nhận đặt hàng"}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full cursor-pointer rounded-xl border border-zinc-200 py-3.5 text-sm font-medium text-zinc-600 transition hover:bg-white"
                  >
                    Hủy
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
    <div className="px-6 py-12 text-center sm:px-10 sm:py-14">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#fce7f3]">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ec4899] text-white">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
      </div>
      <h3 className="font-[family-name:var(--font-calistoga,'Calistoga',Georgia,serif)] text-2xl text-zinc-900">
        Đặt hàng thành công!
      </h3>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-zinc-500">
        Cảm ơn bạn đã tin tưởng. Chúng tôi sẽ liên hệ xác nhận và giao hàng trong thời gian sớm nhất.
      </p>
      <button
        type="button"
        onClick={onClose}
        className="mt-8 w-full max-w-xs cursor-pointer rounded-xl bg-[#ec4899] py-3.5 text-sm font-semibold text-white transition hover:bg-[#db2777] sm:w-auto sm:px-10"
      >
        Tiếp tục mua sắm
      </button>
    </div>
  );
}