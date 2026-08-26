"use client";

import { API_AGENCY } from "@/config/api";
import api from "@/lib/axios";
import { useEffect, useState } from "react";

type AgencyCombo = {
  code: string;
  name: string;
  price_vnd: number;
  credit_vnd: number;
  duration_days: number;
  description: string;
};

type AgencyData = {
  agency: { id: number; username: string; fullname: string };
  balance: { balance_vnd: number; discount_percentage: number };
  combos?: AgencyCombo[];
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
  const [selectedComboCode, setSelectedComboCode] = useState<string>("COMBO_1");
  const [topupOrder, setTopupOrder] = useState<TopupOrder | null>(null);
  const [creatingTopup, setCreatingTopup] = useState(false);

  // Activate Modal State
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [activateForm, setActivateForm] = useState({
    phone_number: "",
    full_name: "",
    plan_code: "",
  });

  const load = async () => {
    setLoading(true);
    setMsg(null);
    try {
      console.log("[AGENCY] Đang tải dữ liệu cổng đại lý...");
      const [resMe, resCust] = await Promise.allSettled([
        api.get<AgencyData>(API_AGENCY.ME),
        api.get<Customer[]>(API_AGENCY.CUSTOMERS),
      ]);

      let hasMeSuccess = false;
      let hasCustSuccess = false;

      if (resMe.status === "fulfilled" && resMe.value.data) {
        hasMeSuccess = true;
        const agencyData = resMe.value.data;
        setData(agencyData);
        if (agencyData.plans && agencyData.plans.length > 0 && !activateForm.plan_code) {
          setActivateForm((f) => ({ ...f, plan_code: agencyData.plans[0].code }));
        }
      } else if (resMe.status === "rejected") {
        console.error("[AGENCY] Lỗi tải thông tin đại lý (API_AGENCY.ME):", resMe.reason);
      }

      if (resCust.status === "fulfilled" && resCust.value.data) {
        hasCustSuccess = true;
        setCustomers(Array.isArray(resCust.value.data) ? resCust.value.data : []);
      } else if (resCust.status === "rejected") {
        console.error("[AGENCY] Lỗi tải danh sách khách hàng (API_AGENCY.CUSTOMERS):", resCust.reason);
      }

      if (!hasMeSuccess && !hasCustSuccess) {
        setMsg("Không thể tải thông tin đại lý. Vui lòng kiểm tra lại kết nối hoặc quyền truy cập.");
      }
      console.log("[AGENCY] Hoàn tất quá trình tải dữ liệu cổng đại lý");
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

  const handleCreateTopupCombo = async (comboCode: string) => {
    setCreatingTopup(true);
    try {
      console.log(`[AGENCY] Đang tạo yêu cầu nạp gói combo=${comboCode}...`);
      const res = await api.post<TopupOrder>(API_AGENCY.TOPUP, { combo_code: comboCode });
      setTopupOrder(res.data ?? null);
      setSelectedComboCode(comboCode);
      console.log(`[AGENCY] Đã tạo đơn nạp combo thành công order_code=${res.data?.order_code}`);
    } catch (err) {
      console.error("[AGENCY] Tạo đơn nạp gói combo thất bại", err);
      setMsg("Tạo đơn nạp combo thất bại.");
    } finally {
      setCreatingTopup(false);
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

  const selectedPlan = data?.plans?.find((p) => p.code === activateForm.plan_code);
  const discount = data?.balance?.discount_percentage || 0;
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
            className="mt-4 w-full rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600 transition shadow-sm"
          >
            + Nạp Gói Đại Lý
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500">Chính sách ưu đãi ví</p>
          <p className="mt-2 text-2xl font-extrabold text-brand-600">Gói Nạp Đại Lý</p>
          <p className="mt-2 text-xs text-gray-400">
            Nạp tiền theo gói để nhận thêm số dư ví thưởng và thời hạn sử dụng.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500">Khách hàng của bạn</p>
          <p className="mt-2 text-3xl font-extrabold text-gray-800 dark:text-white">
            {data?.total_customers || 0}
          </p>
          <button
            onClick={() => setShowActivateModal(true)}
            className="mt-4 w-full rounded-lg bg-success-500 px-3 py-2 text-xs font-semibold text-white hover:bg-success-600 transition shadow-sm"
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

      {/* Modal Nạp Gói Đại lý */}
      {showTopupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl space-y-4 rounded-2xl bg-white p-6 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Nạp Gói Đại Lý
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowTopupModal(false);
                  setTopupOrder(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {!topupOrder ? (
              <div className="space-y-4">
                <p className="text-xs text-gray-500">
                  Chọn gói nạp tiền phù hợp bên dưới để nạp vào ví:
                </p>

                <div className="grid gap-3 sm:grid-cols-3">
                  {(data?.combos && data.combos.length > 0
                    ? data.combos
                    : [
                        {
                          code: "COMBO_1",
                          name: "Combo 1",
                          price_vnd: 3000000,
                          credit_vnd: 5000000,
                          duration_days: 365,
                          description: "Nạp 3tr nhận 5tr",
                        },
                        {
                          code: "COMBO_2",
                          name: "Combo 2",
                          price_vnd: 5000000,
                          credit_vnd: 10000000,
                          duration_days: 365,
                          description: "Nạp 5tr nhận 10tr",
                        },
                        {
                          code: "COMBO_3",
                          name: "Combo 3",
                          price_vnd: 7000000,
                          credit_vnd: 18000000,
                          duration_days: 365,
                          description: "Nạp 7tr nhận 18tr",
                        },
                      ]
                  ).map((combo) => {
                    const bonus = combo.credit_vnd - combo.price_vnd;
                    return (
                      <div
                        key={combo.code}
                        className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-950 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-brand-600 text-sm">{combo.name}</span>
                            <span className="text-[10px] font-bold bg-success-50 text-success-600 px-1.5 py-0.5 rounded">
                              Hạn {combo.duration_days >= 365 ? `${Math.round(combo.duration_days / 365)} năm` : `${combo.duration_days} ngày`}
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">Thanh toán nạp:</div>
                          <div className="text-base font-extrabold text-gray-900 dark:text-white">
                            {combo.price_vnd.toLocaleString("vi-VN")} đ
                          </div>
                          <div className="mt-2 rounded-lg bg-success-50/80 p-2 dark:bg-success-950/40">
                            <div className="text-[11px] text-gray-600 dark:text-gray-300">Nhận vào ví:</div>
                            <div className="text-sm font-black text-success-600 dark:text-success-400">
                              {combo.credit_vnd.toLocaleString("vi-VN")} đ
                            </div>
                            <div className="text-[10px] text-success-700 font-semibold mt-0.5">
                              (+{bonus.toLocaleString("vi-VN")} đ)
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={creatingTopup}
                          onClick={() => handleCreateTopupCombo(combo.code)}
                          className="mt-4 w-full rounded-lg bg-brand-500 py-2 text-xs font-semibold text-white hover:bg-brand-600 transition disabled:opacity-50"
                        >
                          {creatingTopup && selectedComboCode === combo.code ? "Đang tạo QR..." : `Chọn ${combo.name}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
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
                    setTopupOrder(null);
                    void load();
                  }}
                  className="w-full rounded-lg bg-brand-500 py-2 text-sm font-semibold text-white"
                >
                  Đã chuyển khoản xong (Chờ duyệt)
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
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Kích hoạt / Gia hạn gói cho Khách
              </h3>
              <button
                type="button"
                onClick={() => setShowActivateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

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
                {data?.plans?.map((p) => (
                  <option key={p.id} value={p.code}>
                    {p.name} ({p.duration_days >= 365 ? "1 Năm" : `${p.duration_days} ngày`}) — {p.price_vnd.toLocaleString("vi-VN")} đ
                  </option>
                ))}
              </select>
            </div>

            {/* Chi tiết khấu trừ */}
            {selectedPlan && (
              <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300 space-y-1">
                <div className="flex justify-between">
                  <span>Giá gói bản quyền:</span>
                  <span className="font-semibold">{selectedPlan.price_vnd.toLocaleString("vi-VN")} đ</span>
                </div>
                <div className="flex justify-between">
                  <span>Số dư ví hiện có:</span>
                  <span className="font-mono font-bold text-success-600">
                    {(data?.balance?.balance_vnd || 0).toLocaleString("vi-VN")} đ
                  </span>
                </div>
                <div className="mt-1 flex justify-between border-t border-gray-200 pt-1 font-bold text-gray-900 dark:text-white dark:border-gray-700">
                  <span>Tiền trừ ví khả dụng:</span>
                  <span className="text-brand-600">-{selectedPlan.price_vnd.toLocaleString("vi-VN")} đ</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setShowActivateModal(false)}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-lg bg-success-500 px-4 py-2 text-sm font-medium text-white hover:bg-success-600 transition"
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
