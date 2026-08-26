"use client";

import { API_LICENSING_ADMIN } from "@/config/api";
import api from "@/lib/axios";
import { useEffect, useState } from "react";

type Customer = {
  id: number;
  phone_number: string;
  full_name: string;
  agency_username?: string;
  referral_code: string;
  referral_reward_days: number;
  trial_granted: boolean;
  devices: Array<{ id: number; machine_fingerprint: string; os_name: string; last_seen_at: string }>;
  current_license?: {
    id: number;
    license_type: string;
    valid_until: string;
    is_valid: boolean;
    status: string;
  };
  created_at: string;
};

type PaymentOrder = {
  id: number;
  order_code: string;
  customer_phone?: string;
  agency_username?: string;
  plan_name?: string;
  order_type: string;
  amount_vnd: number;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  qr_image_base64?: string;
  created_at: string;
  completed_at?: string;
};

type AgencyBalance = {
  id: number;
  agency: number;
  agency_username: string;
  agency_fullname: string;
  balance_vnd: number;
  discount_percentage: number;
};

type PricingPlan = {
  id: number;
  name: string;
  code: string;
  duration_days: number;
  price_vnd: number;
  is_active: boolean;
};

export default function AdminLicensingPage() {
  const [activeTab, setActiveTab] = useState<"customers" | "orders" | "agencies" | "pricing">("customers");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [agencies, setAgencies] = useState<AgencyBalance[]>([]);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Issue License Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [issueForm, setIssueForm] = useState({ duration_days: 30, license_type: "PAID_1M" });

  const loadData = async () => {
    setLoading(true);
    try {
      console.log(`[LICENSING] Đang tải dữ liệu cho tab=${activeTab}...`);
      if (activeTab === "customers") {
        const res = await api.get<Customer[]>(API_LICENSING_ADMIN.CUSTOMERS);
        const data = res.data ?? [];
        setCustomers(data);
        console.log(`[LICENSING] Đã tải ${data.length} khách hàng`);
      } else if (activeTab === "orders") {
        const res = await api.get<PaymentOrder[]>(API_LICENSING_ADMIN.ORDERS);
        const data = res.data ?? [];
        setOrders(data);
        console.log(`[PAYMENT] Đã tải ${data.length} đơn hàng`);
      } else if (activeTab === "agencies") {
        const res = await api.get<AgencyBalance[]>(API_LICENSING_ADMIN.AGENCY_BALANCES);
        const data = res.data ?? [];
        setAgencies(data);
        console.log(`[AGENCY] Đã tải ${data.length} số dư ví đại lý`);
      } else if (activeTab === "pricing") {
        const res = await api.get<PricingPlan[]>(API_LICENSING_ADMIN.PRICING_PLANS);
        const data = res.data ?? [];
        setPricingPlans(data);
        console.log(`[LICENSING] Đã tải ${data.length} gói giá`);
      }
    } catch (err) {
      console.error(`[LICENSING] Lỗi tải dữ liệu cho tab=${activeTab}`, err);
      setMsg("Lỗi tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [activeTab]);

  const handleIssueLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;
    try {
      console.log(`[LICENSING] Đang cấp bản quyền customer_id=${selectedCustomerId} type=${issueForm.license_type} days=${issueForm.duration_days}`);
      await api.post(API_LICENSING_ADMIN.ISSUE_LICENSE, {
        customer_id: selectedCustomerId,
        duration_days: issueForm.duration_days,
        license_type: issueForm.license_type,
      });
      console.log(`[LICENSING] Cấp bản quyền thành công cho customer_id=${selectedCustomerId}`);
      setMsg("Đã cấp bản quyền thành công!");
      setSelectedCustomerId(null);
      await loadData();
    } catch (err) {
      console.error(`[LICENSING] Cấp bản quyền thất bại cho customer_id=${selectedCustomerId}`, err);
      setMsg("Cấp bản quyền thất bại.");
    }
  };

  const handleCompleteOrder = async (orderId: number) => {
    if (!confirm("Xác nhận duyệt hoàn thành đơn hàng này?")) return;
    try {
      console.log(`[PAYMENT] Đang duyệt hoàn thành order_id=${orderId}...`);
      await api.post(API_LICENSING_ADMIN.COMPLETE_ORDER(orderId));
      console.log(`[PAYMENT] Duyệt hoàn thành đơn hàng thành công order_id=${orderId}`);
      setMsg("Đã duyệt đơn hàng thành công!");
      await loadData();
    } catch (err) {
      console.error(`[PAYMENT] Duyệt đơn hàng thất bại order_id=${orderId}`, err);
      setMsg("Duyệt đơn hàng thất bại.");
    }
  };

  const handleSeedDefaultPlans = async () => {
    if (!confirm("Khởi tạo 3 gói giá niêm yết chuẩn (1 Tháng: 150k, 3 Tháng: 290k, Vĩnh Viễn: 390k)?")) return;
    setLoading(true);
    try {
      const defaultPlans = [
        { name: "Gói 1 Tháng", code: "MONTH_1", duration_days: 30, price_vnd: 150000, sort_order: 1 },
        { name: "Gói 3 Tháng", code: "MONTH_3", duration_days: 90, price_vnd: 290000, sort_order: 2 },
        { name: "Gói Vĩnh Viễn", code: "LIFETIME", duration_days: 36500, price_vnd: 390000, sort_order: 3 },
      ];
      for (const p of defaultPlans) {
        await api.post(API_LICENSING_ADMIN.PRICING_PLANS, p);
      }
      setMsg("Đã khởi tạo thành công 3 gói giá niêm yết chuẩn!");
      await loadData();
    } catch (err) {
      console.error("[LICENSING] Lỗi khởi tạo gói giá", err);
      setMsg("Lỗi khi khởi tạo gói giá.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Quản trị Bản quyền & Đại lý GGMaps
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Hệ thống cấp phép Ed25519, duyệt đơn VietQR và quản lý số dư ví đại lý.
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === "pricing" && (
            <button
              onClick={handleSeedDefaultPlans}
              className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 shadow-sm"
            >
              ➕ Khởi tạo 3 Gói Chuẩn
            </button>
          )}
          <button
            onClick={loadData}
            className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
          >
            🔄 Làm mới
          </button>
        </div>
      </div>

      {msg && (
        <div className="flex items-center justify-between rounded-lg bg-brand-50 p-4 text-sm text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
          <span>{msg}</span>
          <button onClick={() => setMsg(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        {[
          { id: "customers", label: "Khách hàng & Bản quyền" },
          { id: "orders", label: "Đơn hàng & Thanh toán" },
          { id: "agencies", label: "Quản lý Đại lý (Ví VNĐ)" },
          { id: "pricing", label: "Gói giá & Bảng giá" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Customers */}
      {activeTab === "customers" && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-gray-500 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-3">SĐT Khách hàng</th>
                  <th className="px-4 py-3">Tên</th>
                  <th className="px-4 py-3">Mã GT</th>
                  <th className="px-4 py-3">Thưởng GT</th>
                  <th className="px-4 py-3">Bản quyền hiện tại</th>
                  <th className="px-4 py-3">Hạn dùng</th>
                  <th className="px-4 py-3">Thiết bị</th>
                  <th className="px-4 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => {
                  const lic = c.current_license;
                  return (
                    <tr key={c.id} className="border-b border-gray-50 dark:border-gray-800">
                      <td className="px-4 py-3 font-semibold">{c.phone_number}</td>
                      <td className="px-4 py-3">{c.full_name || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-brand-600">{c.referral_code}</td>
                      <td className="px-4 py-3">+{c.referral_reward_days} ngày</td>
                      <td className="px-4 py-3">
                        {lic ? (
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                              lic.is_valid
                                ? "bg-success-50 text-success-700 dark:bg-success-950/50 dark:text-success-300"
                                : "bg-error-50 text-error-700 dark:bg-error-950/50 dark:text-error-300"
                            }`}
                          >
                            {lic.license_type} ({lic.status})
                          </span>
                        ) : (
                          <span className="text-gray-400">Chưa có</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {lic ? new Date(lic.valid_until).toLocaleDateString("vi-VN") : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {c.devices?.length || 0} máy
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedCustomerId(c.id)}
                          className="rounded bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-600 hover:bg-brand-100 dark:bg-brand-950/50 dark:text-brand-300"
                        >
                          + Cấp hạn
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Modal Cấp License */}
          {selectedCustomerId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <form
                onSubmit={handleIssueLicense}
                className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 dark:bg-gray-900"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Cấp / Gia hạn Bản quyền thủ công
                </h3>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Loại bản quyền</label>
                  <select
                    value={issueForm.license_type}
                    onChange={(e) => setIssueForm((f) => ({ ...f, license_type: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                  >
                    <option value="TRIAL">Dùng thử (TRIAL)</option>
                    <option value="PAID_1M">Gói 1 Tháng (PAID_1M)</option>
                    <option value="PAID_3M">Gói 3 Tháng (PAID_3M)</option>
                    <option value="PAID_LIFETIME">Gói Vĩnh viễn (PAID_LIFETIME)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Số ngày cấp thêm</label>
                  <input
                    type="number"
                    value={issueForm.duration_days}
                    onChange={(e) => setIssueForm((f) => ({ ...f, duration_days: parseInt(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCustomerId(null)}
                    className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
                  >
                    Xác nhận cấp
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Orders */}
      {activeTab === "orders" && (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-gray-500 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3">Mã đơn (Nội dung CK)</th>
                <th className="px-4 py-3">Loại đơn</th>
                <th className="px-4 py-3">Khách / Đại lý</th>
                <th className="px-4 py-3">Gói</th>
                <th className="px-4 py-3">Số tiền</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Thời gian tạo</th>
                <th className="px-4 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-gray-50 dark:border-gray-800">
                  <td className="px-4 py-3 font-mono font-bold text-brand-600">{o.order_code}</td>
                  <td className="px-4 py-3 text-xs">
                    {o.order_type === "LICENSE_PURCHASE" ? "Mua bản quyền" : "Nạp ví đại lý"}
                  </td>
                  <td className="px-4 py-3">{o.customer_phone || o.agency_username || "—"}</td>
                  <td className="px-4 py-3">{o.plan_name || "—"}</td>
                  <td className="px-4 py-3 font-semibold">{o.amount_vnd.toLocaleString("vi-VN")} đ</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold ${
                        o.status === "COMPLETED"
                          ? "bg-success-50 text-success-700 dark:bg-success-950/50 dark:text-success-300"
                          : o.status === "PENDING"
                          ? "bg-warning-50 text-warning-700 dark:bg-warning-950/50 dark:text-warning-300"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(o.created_at).toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-3">
                    {o.status === "PENDING" && (
                      <button
                        onClick={() => handleCompleteOrder(o.id)}
                        className="rounded bg-success-500 px-3 py-1 text-xs font-medium text-white hover:bg-success-600"
                      >
                        ✓ Duyệt ngay
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Agencies */}
      {activeTab === "agencies" && (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 text-gray-500 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3">Username Đại lý</th>
                <th className="px-4 py-3">Họ và tên</th>
                <th className="px-4 py-3">Số dư ví (VNĐ)</th>
                <th className="px-4 py-3">Chiết khấu (%)</th>
              </tr>
            </thead>
            <tbody>
              {agencies.map((a) => (
                <tr key={a.id} className="border-b border-gray-50 dark:border-gray-800">
                  <td className="px-4 py-3 font-semibold">{a.agency_username}</td>
                  <td className="px-4 py-3">{a.agency_fullname || "—"}</td>
                  <td className="px-4 py-3 font-mono font-bold text-success-600">
                    {a.balance_vnd.toLocaleString("vi-VN")} đ
                  </td>
                  <td className="px-4 py-3 font-semibold text-brand-600">{a.discount_percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Pricing */}
      {activeTab === "pricing" && (
        <>
          {pricingPlans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-2xl text-brand-600 dark:bg-brand-950/50">
                🏷️
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Chưa có gói giá niêm yết nào</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                Hệ thống cần 3 gói giá niêm yết chuẩn để người dùng Desktop có thể mua và thanh toán qua VietQR.
              </p>
              <button
                onClick={handleSeedDefaultPlans}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 font-medium text-white shadow hover:bg-brand-600 transition"
              >
                🚀 Khởi tạo 3 Gói Giá Niêm Yết Chuẩn
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {pricingPlans.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
                >
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{p.name}</h3>
                  <p className="text-xs font-mono text-gray-400">Mã: {p.code}</p>
                  <div className="my-4">
                    <span className="text-2xl font-bold text-brand-600">{p.price_vnd.toLocaleString("vi-VN")} đ</span>
                    <span className="text-xs text-gray-500"> / {p.duration_days >= 36500 ? "Vĩnh viễn" : `${p.duration_days} ngày`}</span>
                  </div>
                  <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${p.is_active ? "bg-success-50 text-success-700" : "bg-gray-100 text-gray-500"}`}>
                    {p.is_active ? "Đang mở bán" : "Tạm ngưng"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
