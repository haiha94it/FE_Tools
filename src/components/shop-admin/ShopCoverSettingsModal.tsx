"use client";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { Modal } from "@/components/ui/modal";
import { STORE_PUBLIC_BASE } from "@/config/api";
import { shopImageUrl } from "@/lib/shop-utils";
import { toast } from "@/lib/toast";
import { zaloAccountService } from "@/services/zalo-account.service";
import { zaloShopService } from "@/services/zalo-shop.service";
import { useAuthStore } from "@/stores/use-auth-store";
import { useZaloShopAdminStore } from "@/stores/use-zalo-shop-admin-store";
import type { ShopCoupon } from "@/types/zalo-shop";
import type { ZaloAccount } from "@/types/zalo-account";
import Image from "next/image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const DEFAULT_ORDER_SUCCESS = `📣 📣 📣 Thông báo đặt hàng thành công:
- Thông tin đơn hàng:
- Người nhận: [name]
- Số ĐT: [phone_number]
- Địa chỉ: [address], [ward], [district], [city]
- Sản phẩm:
[description]
- Thành tiền: [total_amount]₫
- Ghi chú: [note]
Chúng tôi sẽ liên hệ quý khách để xác nhận đơn hàng. Chân thành cảm ơn!`;

const DEFAULT_ORDER_CONFIRM = `Cảm ơn quý khách [name] đã đặt mua sản phẩm.
Chúng tôi đã xác nhận đơn đặt hàng của quý khách và sẽ gửi hàng cho quý khách trong hôm nay.
Kính chúc quý khách sức khỏe!`;

interface ShopCoverSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
          {title}
        </h4>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function ShopCoverSettingsModal({
  isOpen,
  onClose,
  userId,
}: ShopCoverSettingsModalProps) {
  const cover = useZaloShopAdminStore((s) => s.cover);
  const domain = useZaloShopAdminStore((s) => s.domain);
  const updateCover = useZaloShopAdminStore((s) => s.updateCover);
  const isLoading = useZaloShopAdminStore((s) => s.isLoading);
  const user = useAuthStore((s) => s.user);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  const bannerRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [banner, setBanner] = useState<string | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [accounts, setAccounts] = useState<ZaloAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number>(0);
  const [savingAccount, setSavingAccount] = useState(false);

  const [orderSuccessMsg, setOrderSuccessMsg] = useState("");
  const [orderConfirmMsg, setOrderConfirmMsg] = useState("");
  const [savingSuccessMsg, setSavingSuccessMsg] = useState(false);
  const [savingConfirmMsg, setSavingConfirmMsg] = useState(false);

  const [coupons, setCoupons] = useState<ShopCoupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [couponFormOpen, setCouponFormOpen] = useState(false);
  const [creatingCoupons, setCreatingCoupons] = useState(false);
  const [couponForm, setCouponForm] = useState({
    quantity: 5,
    discount_percentage: 10,
    max_discount_amount: "" as string | number,
    min_order_amount: 0,
    expires_days: 30,
  });

  const usableAccounts = useMemo(
    () => accounts.filter((a) => !a.checkpoint),
    [accounts],
  );

  const selectedAccount = useMemo(
    () => usableAccounts.find((a) => a.id === selectedAccountId) ?? null,
    [usableAccounts, selectedAccountId],
  );

  // Link gắn id user đăng nhập (manager hoặc NV) → đơn về đúng người
  const storeLink = useMemo(() => {
    const path = `${STORE_PUBLIC_BASE}/${userId}`;
    if (domain) return `https://${domain}${path}`;
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${path}`;
  }, [domain, userId]);

  useEffect(() => {
    if (!isOpen) return;
    setName(cover?.name ?? "");
    setBanner(cover?.image ?? null);
    setLogo(cover?.image_logo ?? null);
    setOrderSuccessMsg(user?.orderSuccessfulMessage ?? "");
    setOrderConfirmMsg(user?.confirmMessage ?? "");
    setSelectedAccountId(Number(user?.idOrderNotificationAccount ?? 0));
    setCouponFormOpen(false);

    let cancelled = false;
    void (async () => {
      try {
        const list = await zaloAccountService.list();
        if (!cancelled) setAccounts(list);
      } catch {
        if (!cancelled) setAccounts([]);
      }
      setLoadingCoupons(true);
      try {
        const list = await zaloShopService.listCoupons();
        if (!cancelled) setCoupons(list);
      } catch {
        if (!cancelled) setCoupons([]);
      } finally {
        if (!cancelled) setLoadingCoupons(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOpen, cover, user]);

  const handleUpload = async (file: File, type: "banner" | "logo") => {
    setUploading(true);
    try {
      const path = await zaloShopService.uploadFile(file);
      if (type === "banner") setBanner(path);
      else setLogo(path);
      toast.success("Tải ảnh thành công");
    } catch {
      toast.error("Tải ảnh thất bại");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveCover = async () => {
    try {
      await updateCover({
        id_user: userId,
        name: name.trim(),
        image: banner,
        image_logo: logo,
        ...(cover?.id ? { id_cover: cover.id } : {}),
      });
      toast.success("Đã lưu thông tin shop");
    } catch {
      toast.error("Lưu thông tin shop thất bại");
    }
  };

  const handleSelectAccount = async (id: number) => {
    setSelectedAccountId(id);
    setSavingAccount(true);
    try {
      await zaloShopService.setOrderNotificationAccount(id);
      await fetchProfile({ force: true });
      toast.success(
        id === 0
          ? "Đã tắt gửi tin nhắn đơn hàng"
          : "Đã chọn tài khoản gửi tin nhắn",
      );
    } catch {
      toast.error("Không cập nhật được tài khoản gửi tin");
    } finally {
      setSavingAccount(false);
    }
  };

  const handleSaveSuccessMsg = async () => {
    if (!orderSuccessMsg.trim()) {
      toast.error("Nội dung không được để trống");
      return;
    }
    setSavingSuccessMsg(true);
    try {
      await zaloShopService.updateOrderSuccessfulMessage(orderSuccessMsg.trim());
      await fetchProfile({ force: true });
      toast.success("Đã lưu tin nhắn đặt hàng thành công");
    } catch {
      toast.error("Lưu tin nhắn thất bại");
    } finally {
      setSavingSuccessMsg(false);
    }
  };

  const handleSaveConfirmMsg = async () => {
    if (!orderConfirmMsg.trim()) {
      toast.error("Nội dung không được để trống");
      return;
    }
    setSavingConfirmMsg(true);
    try {
      await zaloShopService.updateOrderConfirmMessage(orderConfirmMsg.trim());
      await fetchProfile({ force: true });
      toast.success("Đã lưu tin nhắn xác nhận đơn");
    } catch {
      toast.error("Lưu tin nhắn thất bại");
    } finally {
      setSavingConfirmMsg(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(storeLink);
      toast.success("Đã sao chép link shop");
    } catch {
      toast.error("Không sao chép được");
    }
  };

  const refreshCoupons = async () => {
    setLoadingCoupons(true);
    try {
      setCoupons(await zaloShopService.listCoupons());
    } catch {
      /* keep */
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleCreateCoupons = async () => {
    setCreatingCoupons(true);
    try {
      const codes = await zaloShopService.createCoupons({
        quantity: Number(couponForm.quantity) || 1,
        discount_percentage: Number(couponForm.discount_percentage) || 0,
        max_discount_amount: couponForm.max_discount_amount
          ? Number(couponForm.max_discount_amount)
          : null,
        min_order_amount: Number(couponForm.min_order_amount) || 0,
        expires_days: Number(couponForm.expires_days) || 30,
      });
      toast.success(
        codes.length
          ? `Đã tạo ${codes.length} mã giảm giá`
          : "Đã tạo mã giảm giá",
      );
      setCouponFormOpen(false);
      await refreshCoupons();
    } catch {
      toast.error("Tạo mã giảm giá thất bại");
    } finally {
      setCreatingCoupons(false);
    }
  };

  const handleDeleteCoupon = async (id: number) => {
    if (!window.confirm("Xóa mã giảm giá này?")) return;
    try {
      await zaloShopService.deleteCoupons([id]);
      toast.success("Đã xóa mã");
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } catch {
      toast.error("Xóa mã thất bại");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      layer="top"
      className="max-h-[90vh] max-w-3xl overflow-y-auto p-5 sm:p-6"
    >
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Thiết lập thông tin shop
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        Quy trình: Banner/logo → Cập nhật → Chọn nick gửi tin → Mẫu tin đặt
        hàng/xác nhận → Link shop → Mã giảm giá
      </p>

      <div className="mt-5 space-y-4">
        {/* 1. Branding */}
        <Section
          title="Thông tin hiển thị"
          action={
            <Button
              size="sm"
              onClick={() => void handleSaveCover()}
              disabled={isLoading || uploading}
            >
              Cập nhật
            </Button>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tên shop
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tên hiển thị trên storefront"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ảnh banner{" "}
                  <span className="font-normal text-gray-400">
                    (gợi ý 720×360)
                  </span>
                </label>
                <div
                  className="relative flex h-32 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                  onClick={() => bannerRef.current?.click()}
                >
                  {banner ? (
                    <Image
                      src={shopImageUrl(banner)}
                      alt="Banner"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="text-xs text-gray-400">
                      Nhấn để tải ảnh bìa
                    </span>
                  )}
                </div>
                <input
                  ref={bannerRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleUpload(file, "banner");
                  }}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ảnh logo{" "}
                  <span className="font-normal text-gray-400">
                    (gợi ý 175×50)
                  </span>
                </label>
                <div
                  className="relative flex h-32 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                  onClick={() => logoRef.current?.click()}
                >
                  {logo ? (
                    <Image
                      src={shopImageUrl(logo)}
                      alt="Logo"
                      fill
                      className="object-contain p-2"
                      unoptimized
                    />
                  ) : (
                    <span className="text-xs text-gray-400">
                      Nhấn để tải logo
                    </span>
                  )}
                </div>
                <input
                  ref={logoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleUpload(file, "logo");
                  }}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* 2. Nick gửi tin */}
        <Section title="Tài khoản gửi tin nhắn đơn hàng">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Chọn tài khoản
              </label>
              <select
                value={selectedAccountId}
                disabled={savingAccount}
                onChange={(e) =>
                  void handleSelectAccount(Number(e.target.value))
                }
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value={0}>Tắt gửi tin nhắn đơn hàng</option>
                {usableAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name || acc.phone_number || `Nick #${acc.id}`}
                    {acc.checkpoint ? " (checkpoint)" : ""}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Nick dùng để Zalo tin khách khi có đơn mới / xác nhận đơn.
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tài khoản đã chọn
              </label>
              {selectedAccountId && selectedAccount ? (
                <div className="flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 px-3 dark:border-gray-700">
                  {selectedAccount.avatar ? (
                    <Image
                      src={selectedAccount.avatar}
                      alt=""
                      width={28}
                      height={28}
                      className="rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs dark:bg-gray-700">
                      Z
                    </span>
                  )}
                  <span className="text-sm text-gray-800 dark:text-white/90">
                    {selectedAccount.name ||
                      selectedAccount.phone_number ||
                      `Nick ${selectedAccount.id}`}
                  </span>
                </div>
              ) : (
                <p className="flex min-h-11 items-center text-sm text-gray-500">
                  Chưa chọn tài khoản
                </p>
              )}
            </div>
          </div>
        </Section>

        {/* 3. Tin đặt hàng thành công */}
        <Section
          title="Tin nhắn xác nhận đặt hàng"
          action={
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setOrderSuccessMsg(DEFAULT_ORDER_SUCCESS)}
              >
                Mẫu
              </Button>
              <Button
                size="sm"
                onClick={() => void handleSaveSuccessMsg()}
                disabled={savingSuccessMsg}
              >
                {savingSuccessMsg ? "Đang lưu…" : "Cập nhật"}
              </Button>
            </div>
          }
        >
          <p className="mb-2 text-xs text-gray-500">
            Placeholder: [name], [phone_number], [address], [ward], [district],
            [city], [description], [total_amount], [discount], [note],
            [coupon_code], [coupon_discount], [final_amount]
          </p>
          <textarea
            value={orderSuccessMsg}
            onChange={(e) => setOrderSuccessMsg(e.target.value)}
            rows={8}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            placeholder="Nội dung tin khi khách đặt hàng thành công"
          />
        </Section>

        {/* 4. Tin xác nhận đơn (seller confirm) */}
        <Section
          title="Tin nhắn xác nhận đơn hàng"
          action={
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setOrderConfirmMsg(DEFAULT_ORDER_CONFIRM)}
              >
                Mẫu
              </Button>
              <Button
                size="sm"
                onClick={() => void handleSaveConfirmMsg()}
                disabled={savingConfirmMsg}
              >
                {savingConfirmMsg ? "Đang lưu…" : "Cập nhật"}
              </Button>
            </div>
          }
        >
          <p className="mb-2 text-xs text-gray-500">
            Gửi khi bạn bấm xác nhận đơn trên admin. Placeholder: [name]
          </p>
          <textarea
            value={orderConfirmMsg}
            onChange={(e) => setOrderConfirmMsg(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            placeholder="Nội dung tin xác nhận đơn"
          />
        </Section>

        {/* 5. Link shop */}
        <Section title="Link shop của bạn">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input value={storeLink} readOnly className="flex-1" />
            <Button
              variant="outline"
              onClick={() => void handleCopyLink()}
              className="w-full shrink-0 sm:w-auto"
            >
              Copy
            </Button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Mỗi người dùng (manager / NV) một link <code>/store/{"{id}"}</code>.
            Khách mua qua link này → đơn gắn đúng người đó. NV không thấy đơn
            manager; manager thấy hết + cột Nhân viên (trống = đơn của manager).
          </p>
          {!domain ? (
            <p className="mt-1 text-xs text-warning-600 dark:text-warning-400">
              Chưa cấu hình tên miền riêng — vẫn dùng path /store. Setup domain
              ở nút <strong>Tên miền</strong>.
            </p>
          ) : null}
        </Section>

        {/* 6. Coupons */}
        <Section
          title="Mã giảm giá"
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCouponFormOpen((v) => !v)}
            >
              {couponFormOpen ? "Đóng form" : "Thêm mã"}
            </Button>
          }
        >
          {couponFormOpen ? (
            <div className="mb-4 grid gap-3 rounded-lg border border-gray-100 bg-gray-50/80 p-3 sm:grid-cols-2 dark:border-gray-800 dark:bg-gray-800/40">
              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Số lượng mã
                </label>
                <Input
                  type="number"
                  value={String(couponForm.quantity)}
                  onChange={(e) =>
                    setCouponForm((p) => ({
                      ...p,
                      quantity: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  % giảm
                </label>
                <Input
                  type="number"
                  value={String(couponForm.discount_percentage)}
                  onChange={(e) =>
                    setCouponForm((p) => ({
                      ...p,
                      discount_percentage: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Giảm tối đa (₫, tùy chọn)
                </label>
                <Input
                  type="number"
                  value={String(couponForm.max_discount_amount)}
                  onChange={(e) =>
                    setCouponForm((p) => ({
                      ...p,
                      max_discount_amount: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Đơn tối thiểu (₫)
                </label>
                <Input
                  type="number"
                  value={String(couponForm.min_order_amount)}
                  onChange={(e) =>
                    setCouponForm((p) => ({
                      ...p,
                      min_order_amount: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Hết hạn sau (ngày)
                </label>
                <Input
                  type="number"
                  value={String(couponForm.expires_days)}
                  onChange={(e) =>
                    setCouponForm((p) => ({
                      ...p,
                      expires_days: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => void handleCreateCoupons()}
                  disabled={creatingCoupons}
                  className="w-full"
                >
                  {creatingCoupons ? "Đang tạo…" : "Tạo mã"}
                </Button>
              </div>
            </div>
          ) : null}

          {loadingCoupons ? (
            <p className="text-sm text-gray-500">Đang tải mã…</p>
          ) : coupons.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có mã giảm giá</p>
          ) : (
            <ul className="max-h-48 space-y-2 overflow-y-auto">
              {coupons.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm dark:border-gray-800"
                >
                  <div className="min-w-0">
                    <button
                      type="button"
                      className="font-mono font-semibold text-brand-600 hover:underline"
                      onClick={() => {
                        void navigator.clipboard.writeText(c.code).then(
                          () => toast.success("Đã copy mã"),
                          () => toast.error("Copy thất bại"),
                        );
                      }}
                    >
                      {c.code}
                    </button>
                    <p className="text-xs text-gray-500">
                      Giảm {c.discount_percentage ?? c.discount_percent ?? 0}%
                      {c.is_used ? " · Đã dùng" : " · Còn dùng"}
                      {c.expires_at
                        ? ` · HSD ${new Date(c.expires_at).toLocaleDateString("vi-VN")}`
                        : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDeleteCoupon(c.id)}
                    className="text-xs text-error-600 hover:underline"
                  >
                    Xóa
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
          Đóng
        </Button>
      </div>
    </Modal>
  );
}
