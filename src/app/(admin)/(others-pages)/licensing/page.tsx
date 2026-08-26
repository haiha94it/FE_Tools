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

  // Pricing Plan Management State
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [planForm, setPlanForm] = useState<{
    name: string;
    code: string;
    price_vnd: number | string;
    duration_days: number | string;
    is_lifetime: boolean;
    is_active: boolean;
    sort_order: number;
  }>({
    name: "",
    code: "",
    price_vnd: "",
    duration_days: "",
    is_lifetime: false,
    is_active: true,
    sort_order: 1,
  });

  const openCreatePlanModal = () => {
    if (pricingPlans.length >= 3) {
      alert("Hệ thống đã đạt giới hạn tối đa 3 gói giá. Vui lòng chỉnh sửa hoặc xóa bớt gói hiện có.");
      return;
    }
    setEditingPlan(null);
    setPlanForm({
      name: "",
      code: "",
      price_vnd: "",
      duration_days: "",
      is_lifetime: false,
      is_active: true,
      sort_order: pricingPlans.length + 1,
    });
    setPlanModalOpen(true);
  };

  const openEditPlanModal = (p: PricingPlan) => {
    setEditingPlan(p);
    const isLife = p.duration_days >= 36500;
    setPlanForm({
      name: p.name,
      code: p.code,
      price_vnd: p.price_vnd,
      duration_days: isLife ? "" : p.duration_days,
      is_lifetime: isLife,
      is_active: p.is_active,
      sort_order: 1,
    });
    setPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = planForm.name.trim();
    const code = planForm.code.trim().toUpperCase();
    const price = Number(planForm.price_vnd);
    const duration = planForm.is_lifetime ? 36500 : Number(planForm.duration_days);

    if (!name) {
      alert("Vui lòng nhập tên gói giá.");
      return;
    }
    if (!code) {
      alert("Vui lòng nhập mã định danh gói (ví dụ: VIP_1M).");
      return;
    }
    if (isNaN(price) || price < 0) {
      alert("Giá bán phải là số nguyên không âm.");
      return;
    }
    if (!planForm.is_lifetime && (isNaN(duration) || duration < 1)) {
      alert("Số ngày sử dụng phải từ 1 ngày trở lên.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name,
        code,
        price_vnd: price,
        duration_days: duration,
        is_active: planForm.is_active,
        sort_order: planForm.sort_order || 1,
      };

      if (editingPlan) {
        console.log(`[LICENSING] Đang cập nhật gói giá id=${editingPlan.id}...`, payload);
        await api.patch(API_LICENSING_ADMIN.PRICING_PLAN_DETAIL(editingPlan.id), payload);
        setMsg("Đã cập nhật gói giá thành công!");
      } else {
        console.log("[LICENSING] Đang tạo gói giá mới...", payload);
        await api.post(API_LICENSING_ADMIN.PRICING_PLANS, payload);
        setMsg("Đã tạo gói giá mới thành công!");
      }
      setPlanModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error("[LICENSING] Lỗi lưu gói giá", err);
      const errorMsg = err?.response?.data?.message || err?.response?.data?.detail || "Lỗi khi lưu gói giá.";
      alert(`Không thể lưu gói giá: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePlanActive = async (p: PricingPlan) => {
    setLoading(true);
    try {
      const newActive = !p.is_active;
      console.log(`[LICENSING] Chuyển trạng thái gói id=${p.id} sang is_active=${newActive}`);
      await api.patch(API_LICENSING_ADMIN.PRICING_PLAN_DETAIL(p.id), { is_active: newActive });
      setMsg(`Đã ${newActive ? "mở bán" : "tắt bán"} gói "${p.name}"!`);
      await loadData();
    } catch (err: any) {
      console.error("[LICENSING] Lỗi đổi trạng thái gói giá", err);
      alert("Lỗi khi cập nhật trạng thái gói giá.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (p: PricingPlan) => {
    if (!confirm(`Xác nhận xóa gói giá "${p.name}" (Mã: ${p.code})?\n\nLưu ý: Nếu gói đã có giao dịch hoặc bản quyền liên kết, hệ thống sẽ không cho xóa mà yêu cầu Tắt bán.`)) {
      return;
    }
    setLoading(true);
    try {
      console.log(`[LICENSING] Đang xóa gói giá id=${p.id} code=${p.code}`);
      await api.delete(API_LICENSING_ADMIN.PRICING_PLAN_DETAIL(p.id));
      setMsg(`Đã xóa gói giá "${p.name}" thành công!`);
      await loadData();
    } catch (err: any) {
      console.error("[LICENSING] Lỗi xóa gói giá", err);
      const serverMsg = err?.response?.data?.message;
      if (serverMsg) {
        alert(serverMsg);
      } else {
        alert("Gói giá đã có dữ liệu giao dịch hoặc bản quyền liên kết, không thể xóa vĩnh viễn. Vui lòng chuyển trạng thái sang Tắt bán.");
      }
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
            Hệ thống cấp phép Ed25519, duyệt đơn VietQR và quản lý bảng giá thủ công.
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === "pricing" && (
            <button
              onClick={openCreatePlanModal}
              disabled={pricingPlans.length >= 3}
              className={`rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition ${
                pricingPlans.length >= 3
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600"
                  : "bg-brand-500 text-white hover:bg-brand-600"
              }`}
            >
              ➕ Thêm Gói Mới ({pricingPlans.length}/3)
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
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Bảng Giá Niêm Yết ({pricingPlans.length}/3 gói)
              </h2>
              <p className="text-xs text-gray-500">
                Quản lý các gói giá bán cho khách hàng Desktop (Tối đa 3 gói).
              </p>
            </div>
            <button
              onClick={openCreatePlanModal}
              disabled={pricingPlans.length >= 3}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                pricingPlans.length >= 3
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600"
                  : "bg-brand-500 text-white shadow-sm hover:bg-brand-600"
              }`}
            >
              ➕ Thêm Gói Mới
            </button>
          </div>

          {pricingPlans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-900">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-2xl text-brand-600 dark:bg-brand-950/50">
                🏷️
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Chưa có gói giá niêm yết nào</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                Bạn có thể tạo từ 1 đến tối đa 3 gói giá thủ công theo nhu cầu kinh doanh.
              </p>
              <button
                onClick={openCreatePlanModal}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 font-medium text-white shadow hover:bg-brand-600 transition"
              >
                ➕ Tạo Gói Giá Đầu Tiên
              </button>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {pricingPlans.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{p.name}</h3>
                        <p className="text-xs font-mono text-gray-400">Mã: {p.code}</p>
                      </div>
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          p.is_active
                            ? "bg-success-50 text-success-700 dark:bg-success-950/40 dark:text-success-300"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {p.is_active ? "Đang mở bán" : "Tạm ngưng"}
                      </span>
                    </div>

                    <div className="my-5">
                      <span className="text-2xl font-bold text-brand-600">
                        {p.price_vnd.toLocaleString("vi-VN")} đ
                      </span>
                      <span className="text-sm text-gray-500">
                        {" "}/ {p.duration_days >= 36500 ? "Vĩnh viễn" : `${p.duration_days} ngày`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                    <button
                      onClick={() => handleTogglePlanActive(p)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        p.is_active
                          ? "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300"
                          : "bg-success-50 text-success-700 hover:bg-success-100 dark:bg-success-950/40 dark:text-success-300"
                      }`}
                    >
                      {p.is_active ? "⏸️ Tắt bán" : "▶️ Mở bán"}
                    </button>
                    <button
                      onClick={() => openEditPlanModal(p)}
                      className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200"
                    >
                      ✏️ Sửa
                    </button>
                    <button
                      onClick={() => handleDeletePlan(p)}
                      className="rounded-lg bg-error-50 px-3 py-1.5 text-xs font-medium text-error-600 hover:bg-error-100 dark:bg-error-950/40 dark:text-error-400"
                    >
                      🗑️ Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Add / Edit Pricing Plan */}
      {planModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingPlan ? "Chỉnh sửa Gói Giá" : "Thêm Gói Giá Mới"}
              </h2>
              <button
                onClick={() => setPlanModalOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Tên gói hiển thị *
                </label>
                <input
                  type="text"
                  required
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="Ví dụ: Gói Cơ Bản 1 Tháng"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Mã định danh gói (Code) *
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingPlan}
                  value={planForm.code}
                  onChange={(e) => setPlanForm({ ...planForm, code: e.target.value.toUpperCase().replace(/\s+/g, "_") })}
                  placeholder="Ví dụ: MONTH_1 hoặc VIP_1"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 font-mono text-sm uppercase focus:border-brand-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:text-white dark:disabled:bg-gray-800"
                />
                {editingPlan && (
                  <p className="mt-1 text-[11px] text-gray-400">Mã gói cố định để bảo toàn lịch sử đơn hàng.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Giá bán (VNĐ) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  value={planForm.price_vnd}
                  onChange={(e) => setPlanForm({ ...planForm, price_vnd: e.target.value })}
                  placeholder="Ví dụ: 150000"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_lifetime"
                    checked={planForm.is_lifetime}
                    onChange={(e) => setPlanForm({ ...planForm, is_lifetime: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="is_lifetime" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Gói Vĩnh Viễn (Không giới hạn ngày)
                  </label>
                </div>

                {!planForm.is_lifetime && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Số ngày sử dụng *
                    </label>
                    <input
                      type="number"
                      required={!planForm.is_lifetime}
                      min="1"
                      value={planForm.duration_days}
                      onChange={(e) => setPlanForm({ ...planForm, duration_days: e.target.value })}
                      placeholder="Ví dụ: 30"
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={planForm.is_active}
                  onChange={(e) => setPlanForm({ ...planForm, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="is_active" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Mở bán ngay (Hiển thị cho khách hàng mua trên Desktop)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setPlanModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-medium text-white shadow hover:bg-brand-600 transition disabled:opacity-50"
                >
                  {loading ? "Đang lưu..." : editingPlan ? "Lưu Thay Đổi" : "Tạo Gói Giá"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

