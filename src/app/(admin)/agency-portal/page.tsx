"use client";

import { API_AGENCY } from "@/config/api";
import api from "@/lib/axios";
import { useEffect, useState } from "react";

type AgencyData = {
  agency: { id: number; username: string; fullname: string };
  balance: { balance_vnd: number; discount_percentage: number };
  total_customers: number;
  active_licenses_count: number;
  plans: Array<{ id: number; name: string; code: string; price_vnd: number; duration_days: number }>;
};

type Customer = {
  id: number;
  phone_number: string;
  full_name: string;
  created_at: string;
  current_license?: {
    license_type: string;
    valid_until: string;
    is_valid: boolean;
  };
};

type TopupOrder = {
  order_code: string;
  amount_vnd: number;
  qr_content: string;
  qr_image_base64: string;
};

export default function AgencyPortalPage() {
  const [data, setData] = useState<AgencyData | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  // Topup Modal State
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState(1000000);
  const [topupOrder, setTopupOrder] = useState<TopupOrder | null>(null);

  // Activate Modal State
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [activateForm, setActivateForm] = useState({
    phone_number: "",
    full_name: "",
    plan_code: "MONTH_1",
  });

  const load = async () => {
    setLoading(true);
    try {
      console.log("[AGENCY] Đang tải dữ liệu cổng đại lý...");
      const [resMe, resCust] = await Promise.all([
        api.get<AgencyData>(API_AGENCY.ME),
        api.get<Customer[]>(API_AGENCY.CUSTOMERS),
      ]);
      setData(resMe.data ?? null);
      setCustomers(resCust.data ?? []);
      console.log(`[AGENCY] Đã tải thông tin đại lý và ${resCust.data?.length ?? 0} khách hàng`);
    } catch (err) {
      console.error("[AGENCY] Lỗi tải dữ liệu đại lý", err);
      setMsg("Không thể tải thông tin đại lý.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreateTopup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log(`[AGENCY] Đang tạo yêu cầu nạp số dư ví amount=${topupAmount} đ...`);
      const res = await api.post<TopupOrder>(API_AGENCY.TOPUP, { amount_vnd: topupAmount });
      setTopupOrder(res.data ?? null);
      console.log(`[AGENCY] Đã tạo đơn nạp số dư thành công order_code=${res.data?.order_code}`);
    } catch (err) {
      console.error("[AGENCY] Tạo đơn nạp số dư thất bại", err);
      setMsg("Tạo đơn nạp số dư thất bại.");
    }
  };

  const handleActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log(`[AGENCY] Đang kích hoạt bản quyền phone=${activateForm.phone_number} plan=${activateForm.plan_code}...`);
      await api.post(API_AGENCY.ACTIVATE, activateForm);
      console.log(`[AGENCY] Kích hoạt bản quyền thành công cho phone=${activateForm.phone_number}`);
      setMsg("Kích hoạt bản quyền cho khách hàng thành công!");
      setShowActivateModal(false);
      setActivateForm({ phone_number: "", full_name: "", plan_code: "MONTH_1" });
      await load();
    } catch (err: any) {
      console.error("[AGENCY] Kích hoạt bản quyền thất bại", err);
      setMsg(err?.response?.data?.message || "Kích hoạt thất bại (kiểm tra lại số dư).");
    }
  };

  if (loading && !data) {
    return <div className="p-8 text-center text-gray-500">Đang tải thông tin đại lý...</div>;
  }

  const selectedPlan = data?.plans.find((p) => p.code === activateForm.plan_code);
  const discount = data?.balance.discount_percentage || 0;
  const discountedPrice = selectedPlan ? Math.round(selectedPlan.price_vnd * (1 - discount / 100)) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Agency Portal — Cổng Đại lý Phân phối
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Quản lý ví tiền, chiết khấu và kích hoạt trực tiếp bản quyền GGMaps cho khách hàng.
        </p>
      </div>

      {msg && (
        <div className="flex items-center justify-between rounded-lg bg-brand-50 p-4 text-sm text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
          <span>{msg}</span>
          <button onClick={() => setMsg(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Cards thống kê số dư */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500">Số dư ví khả dụng</p>
          <p className="mt-2 text-3xl font-extrabold text-success-600">
            {(data?.balance.balance_vnd || 0).toLocaleString("vi-VN")} đ
          </p>
          <button
            onClick={() => {
              setShowTopupModal(true);
              setTopupOrder(null);
            }}
            className="mt-4 w-full rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600"
          >
            + Nạp tiền vào ví
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500">Mức chiết khấu đại lý</p>
          <p className="mt-2 text-3xl font-extrabold text-brand-600">{discount}%</p>
          <p className="mt-4 text-xs text-gray-400">Được tự động áp dụng khi kích hoạt gói cho khách</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500">Khách hàng của bạn</p>
          <p className="mt-2 text-3xl font-extrabold text-gray-800 dark:text-white">
            {data?.total_customers || 0}
          </p>
          <button
            onClick={() => setShowActivateModal(true)}
            className="mt-4 w-full rounded-lg bg-success-500 px-3 py-2 text-xs font-semibold text-white hover:bg-success-600"
          >
            ⚡ Kích hoạt gói cho khách
          </button>
        </div>
      </div>

      {/* Danh sách khách hàng */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Danh sách Khách hàng của bạn</h2>
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-gray-500 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3">SĐT Khách hàng</th>
                <th className="px-4 py-3">Họ tên</th>
                <th className="px-4 py-3">Gói bản quyền</th>
                <th className="px-4 py-3">Hạn sử dụng</th>
                <th className="px-4 py-3">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-400">
                    Chưa có khách hàng nào. Hãy bấm "Kích hoạt gói cho khách" để bắt đầu.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="px-4 py-3 font-semibold">{c.phone_number}</td>
                    <td className="px-4 py-3">{c.full_name || "—"}</td>
                    <td className="px-4 py-3">
                      {c.current_license ? (
                        <span className="rounded bg-success-50 px-2 py-0.5 text-xs font-semibold text-success-700">
                          {c.current_license.license_type}
                        </span>
                      ) : (
                        <span className="text-gray-400">Hết hạn</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {c.current_license ? new Date(c.current_license.valid_until).toLocaleDateString("vi-VN") : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(c.created_at).toLocaleDateString("vi-VN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nạp số dư */}
      {showTopupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 dark:bg-gray-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Nạp tiền vào Ví Đại lý</h3>

            {!topupOrder ? (
              <form onSubmit={handleCreateTopup} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Số tiền muốn nạp (VNĐ)</label>
                  <input
                    type="number"
                    step={100000}
                    min={100000}
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                    required
                  />
                  <div className="mt-2 flex gap-2">
                    {[500000, 1000000, 2000000, 5000000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setTopupAmount(amt)}
                        className="rounded border border-gray-200 px-2 py-1 text-xs hover:bg-gray-50 dark:border-gray-700"
                      >
                        {amt.toLocaleString("vi-VN")} đ
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTopupModal(false)}
                    className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                  >
                    Tạo mã VietQR
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <p className="text-sm text-gray-600">Quét mã QR dưới đây để chuyển khoản tự động:</p>
                {topupOrder.qr_image_base64 && (
                  <img
                    src={topupOrder.qr_image_base64}
                    alt="VietQR Topup"
                    className="mx-auto h-52 w-52 rounded-xl border p-2"
                  />
                )}
                <div className="rounded-lg bg-gray-50 p-3 font-mono text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  <p>Số tiền: <b>{topupOrder.amount_vnd.toLocaleString("vi-VN")} đ</b></p>
                  <p>Nội dung CK: <b className="text-brand-600">{topupOrder.order_code}</b></p>
                </div>
                <button
                  onClick={() => {
                    setShowTopupModal(false);
                    void load();
                  }}
                  className="w-full rounded-lg bg-brand-500 py-2 text-sm font-semibold text-white"
                >
                  Đã chuyển khoản xong
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Kích hoạt bản quyền */}
      {showActivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleActivateLicense}
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 dark:bg-gray-900"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Kích hoạt / Gia hạn gói cho Khách
            </h3>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Số điện thoại khách hàng</label>
              <input
                type="tel"
                placeholder="0912345678"
                value={activateForm.phone_number}
                onChange={(e) => setActivateForm((f) => ({ ...f, phone_number: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Tên khách hàng</label>
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                value={activateForm.full_name}
                onChange={(e) => setActivateForm((f) => ({ ...f, full_name: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Gói bản quyền</label>
              <select
                value={activateForm.plan_code}
                onChange={(e) => setActivateForm((f) => ({ ...f, plan_code: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
              >
                {data?.plans.map((p) => (
                  <option key={p.id} value={p.code}>
                    {p.name} — Niêm yết: {p.price_vnd.toLocaleString("vi-VN")} đ
                  </option>
                ))}
              </select>
            </div>

            {/* Chi tiết khấu trừ */}
            <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              <div className="flex justify-between">
                <span>Giá niêm yết:</span>
                <span>{(selectedPlan?.price_vnd || 0).toLocaleString("vi-VN")} đ</span>
              </div>
              <div className="flex justify-between text-success-600">
                <span>Chiết khấu đại lý ({discount}%):</span>
                <span>-{((selectedPlan?.price_vnd || 0) * (discount / 100)).toLocaleString("vi-VN")} đ</span>
              </div>
              <div className="mt-1 flex justify-between border-t pt-1 font-bold text-gray-900 dark:text-white">
                <span>Tiền trừ ví đại lý:</span>
                <span className="text-brand-600">{discountedPrice.toLocaleString("vi-VN")} đ</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowActivateModal(false)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-lg bg-success-500 px-4 py-2 text-sm font-medium text-white hover:bg-success-600"
              >
                Xác nhận kích hoạt
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
