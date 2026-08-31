"use client";

import { API_AGENCY, API_SYSTEM } from "@/config/api";
import api from "@/lib/axios";
import { useEffect, useState } from "react";

type BankItem = {
  code: string;
  name: string;
  short_name: string;
  bin: string;
};

type AgencyCombo = {
  code: string;
  name: string;
  price_vnd: number;
  credit_vnd: number;
  duration_days: number;
  description: string;
};

type AgencyData = {
  agency: {
    id: number;
    username: string;
    fullname: string;
    bank_name?: string;
    bank_bin?: string;
    bank_account_number?: string;
    bank_account_name?: string;
  };
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

type CustomerOrder = {
  id: number;
  order_code: string;
  customer_phone?: string;
  customer_name?: string;
  plan_name?: string;
  plan_code?: string;
  amount_vnd: number;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  created_at: string;
  completed_at?: string;
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
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"customers" | "orders" | "banking">("customers");

  // Banking state for Agency
  const [bankName, setBankName] = useState("");
  const [bankBin, setBankBin] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [banksList, setBanksList] = useState<BankItem[]>([]);
  const [savingBanking, setSavingBanking] = useState(false);
  const [bankingMsg, setBankingMsg] = useState<string | null>(null);

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

  // Approve Order Modal State
  const [approvingOrder, setApprovingOrder] = useState<CustomerOrder | null>(null);
  const [isApproving, setIsApproving] = useState(false);

  const downloadAgencyJson = (agencyCode: string) => {
    const data = JSON.stringify({ agency_code: agencyCode }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "agency.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  const load = async () => {
    setLoading(true);
    setMsg(null);
    try {
      console.log("[AGENCY] Đang tải dữ liệu cổng đại lý...");
      const [resMe, resCust, resOrders, resBanks] = await Promise.allSettled([
        api.get<AgencyData>(API_AGENCY.ME),
        api.get<Customer[]>(API_AGENCY.CUSTOMERS),
        api.get<CustomerOrder[]>(API_AGENCY.ORDERS),
        api.get<BankItem[]>(API_SYSTEM.BANKS),
      ]);

      let hasMeSuccess = false;
      let hasCustSuccess = false;

      if (resMe.status === "fulfilled" && resMe.value.data) {
        hasMeSuccess = true;
        const agencyData = resMe.value.data;
        setData(agencyData);
        if (agencyData.agency) {
          if (agencyData.agency.bank_name) setBankName(agencyData.agency.bank_name);
          if (agencyData.agency.bank_bin) setBankBin(agencyData.agency.bank_bin);
          if (agencyData.agency.bank_account_number) setBankAccountNumber(agencyData.agency.bank_account_number);
          if (agencyData.agency.bank_account_name) setBankAccountName(agencyData.agency.bank_account_name);
        }
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

      if (resOrders.status === "fulfilled" && resOrders.value.data) {
        setOrders(Array.isArray(resOrders.value.data) ? resOrders.value.data : []);
      } else if (resOrders.status === "rejected") {
        console.error("[AGENCY] Lỗi tải danh sách đơn hàng khách (API_AGENCY.ORDERS):", resOrders.reason);
      }

      if (resBanks.status === "fulfilled" && Array.isArray(resBanks.value.data)) {
        setBanksList(resBanks.value.data);
        if (resBanks.value.data.length > 0 && !bankBin) {
          setBankBin(resBanks.value.data[0].bin);
          setBankName(resBanks.value.data[0].short_name || resBanks.value.data[0].name);
        }
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

  const handleSaveBanking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBanking(true);
    setBankingMsg(null);
    try {
      await api.post(API_AGENCY.BANKING, {
        bank_name: bankName,
        bank_bin: bankBin,
        bank_account_number: bankAccountNumber.trim(),
        bank_account_name: bankAccountName.trim().toUpperCase(),
      });
      setBankingMsg("Đã lưu thông tin tài khoản nhận tiền thành công!");
      if (data?.agency) {
        setData({
          ...data,
          agency: {
            ...data.agency,
            bank_name: bankName,
            bank_bin: bankBin,
            bank_account_number: bankAccountNumber.trim(),
            bank_account_name: bankAccountName.trim().toUpperCase(),
          },
        });
      }
    } catch (err) {
      console.error("[AGENCY] Lỗi lưu STK ngân hàng:", err);
      setBankingMsg("Lưu thông tin ngân hàng thất bại. Vui lòng thử lại.");
    } finally {
      setSavingBanking(false);
    }
  };

  const onSelectBank = (binValue: string) => {
    setBankBin(binValue);
    const found = banksList.find((b) => b.bin === binValue);
    if (found) {
      setBankName(found.short_name || found.name);
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

  const handleConfirmApproveOrder = async () => {
    if (!approvingOrder) return;
    setIsApproving(true);
    try {
      console.log(`[AGENCY] Đại lý đang duyệt đơn hàng id=${approvingOrder.id} code=${approvingOrder.order_code}...`);
      await api.post(API_AGENCY.APPROVE_ORDER(approvingOrder.id));
      setMsg(`Đã duyệt đơn hàng ${approvingOrder.order_code} và kích hoạt bản quyền thành công!`);
      setApprovingOrder(null);
      await load();
    } catch (err: any) {
      console.error("[AGENCY] Lỗi duyệt đơn hàng", err);
      setMsg(err?.response?.data?.message || "Duyệt đơn hàng thất bại (vui lòng kiểm tra số dư ví).");
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectOrder = async (order: CustomerOrder) => {
    if (!confirm(`Bạn có chắc muốn từ chối / hủy đơn hàng ${order.order_code} của khách ${order.customer_phone}?`)) {
      return;
    }
    try {
      console.log(`[AGENCY] Đại lý đang từ chối đơn hàng id=${order.id}...`);
      await api.post(API_AGENCY.REJECT_ORDER(order.id));
      setMsg(`Đã từ chối đơn hàng ${order.order_code}.`);
      await load();
    } catch (err: any) {
      console.error("[AGENCY] Lỗi từ chối đơn hàng", err);
      setMsg(err?.response?.data?.message || "Từ chối đơn hàng thất bại.");
    }
  };

  if (loading && !data) {
    return <div className="p-8 text-center text-gray-500">Đang tải thông tin đại lý...</div>;
  }

  const selectedPlan = data?.plans?.find((p) => p.code === activateForm.plan_code);
  const pendingOrdersCount = orders.filter((o) => o.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Agency Portal — Cổng Đại lý Phân phối
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Quản lý ví tiền, duyệt đơn hàng từ khách và kích hoạt trực tiếp bản quyền GGMaps.
        </p>
      </div>

      {msg && (
        <div className="flex items-center justify-between rounded-xl bg-brand-50 p-4 text-sm font-medium text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
          <span>{msg}</span>
          <button onClick={() => setMsg(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Welcome Banner cho Đại lý mới (Số dư 0đ) */}
      {data && data.balance.balance_vnd === 0 && (
        <div className="rounded-2xl border border-brand-200 bg-linear-to-r from-brand-50 via-white to-brand-50 p-5 dark:border-brand-900/50 dark:from-brand-950/40 dark:via-gray-900 dark:to-brand-950/30 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">★</span>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">
                  Chào mừng đối tác Đại lý mới — Bắt đầu nạp ví để bán bản quyền!
                </h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Hãy chọn một trong 3 Gói Combo ưu đãi (Nhân đôi số dư ví) bên dưới để nạp tiền qua VietQR tự động. Sau khi Admin duyệt, bạn có thể kích hoạt trực tiếp bản quyền cho khách hàng.
              </p>
            </div>
            <button
              onClick={() => {
                setShowTopupModal(true);
                setTopupOrder(null);
              }}
              className="rounded-xl bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-600 transition shadow whitespace-nowrap"
            >
              🚀 Mua Gói Combo Ngay
            </button>
          </div>
        </div>
      )}

      {/* Cards thống kê số dư */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 shadow-2xs">
          <p className="text-xs text-gray-500 dark:text-gray-400">Số dư ví khả dụng</p>
          <p className="mt-2 text-3xl font-extrabold text-success-600 dark:text-success-400">
            {(data?.balance.balance_vnd || 0).toLocaleString("vi-VN")} đ
          </p>
          <button
            onClick={() => {
              setShowTopupModal(true);
              setTopupOrder(null);
            }}
            className="mt-4 w-full rounded-xl bg-brand-500 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-600 transition shadow-2xs"
          >
            + Nạp Gói Đại Lý
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 shadow-2xs">
          <p className="text-xs text-gray-500 dark:text-gray-400">Chính sách ưu đãi ví</p>
          <p className="mt-2 text-2xl font-extrabold text-brand-600 dark:text-brand-400">Gói Nạp Đại Lý</p>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            Nạp tiền theo gói để nhận thêm số dư ví thưởng và thời hạn sử dụng.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 shadow-2xs">
          <p className="text-xs text-gray-500 dark:text-gray-400">Khách hàng của bạn</p>
          <p className="mt-2 text-3xl font-extrabold text-gray-800 dark:text-white">
            {data?.total_customers || 0}
          </p>
          <button
            onClick={() => setShowActivateModal(true)}
            className="mt-4 w-full rounded-xl bg-success-500 px-3 py-2 text-xs font-semibold text-white hover:bg-success-600 transition shadow-2xs"
          >
            ⚡ Kích hoạt gói cho khách
          </button>
        </div>
      </div>

      {/* Widget Gói Phân Phối Ứng Dụng (Initial Distribution Tag) */}
      <div className="rounded-2xl border border-blue-200/80 bg-linear-to-r from-blue-50/70 via-white to-indigo-50/70 p-5 dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 shadow-2xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-500 text-sm text-white font-bold shadow-2xs">
                📦
              </span>
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                Gói Phân Phối Ứng Dụng — File Cấu Hình Định Danh
              </h3>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
              Tải file <code className="rounded bg-white px-1.5 py-0.5 font-mono font-bold text-brand-600 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-brand-400">agency.json</code> này và đặt vào cùng thư mục chứa app <code className="rounded bg-white px-1.5 py-0.5 font-mono text-gray-800 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">ggmaps.exe</code> trước khi nén/gửi cho khách hàng của bạn. Khi khách mở app lần đầu, hệ thống sẽ tự động liên kết tài khoản khách và đơn mua về cho đại lý của bạn.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Mã đại lý của bạn:</span>
              <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md dark:bg-brand-950/50 dark:text-brand-400 border border-brand-200/50 dark:border-brand-900/50">
                {data?.agency.username}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => data?.agency.username && downloadAgencyJson(data.agency.username)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-600 transition shadow whitespace-nowrap"
          >
            <span>📥</span> Tải File agency.json
          </button>
        </div>
      </div>

      {/* Tabs Chuyển đổi Khách hàng / Đơn hàng */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800">

        <button
          onClick={() => setActiveTab("customers")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
            activeTab === "customers"
              ? "border-brand-500 text-brand-600 dark:text-brand-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <span>👥</span> Danh sách Khách hàng ({customers.length})
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
            activeTab === "orders"
              ? "border-brand-500 text-brand-600 dark:text-brand-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <span>📋</span> Đơn hàng của khách ({orders.length})
          {pendingOrdersCount > 0 && (
            <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-2xs">
              {pendingOrdersCount} chờ duyệt
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("banking")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
            activeTab === "banking"
              ? "border-brand-500 text-brand-600 dark:text-brand-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <span>💳</span> Cài đặt Nhận tiền VietQR
          {!data?.agency?.bank_account_number && (
            <span className="rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 text-[10px] font-bold border border-blue-200 dark:border-blue-800">
              Chưa cài STK
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Danh sách khách hàng */}
      {activeTab === "customers" && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-2xs">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-950/30">
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
                    <td colSpan={5} className="p-8 text-center text-gray-400">
                      Chưa có khách hàng nào. Hãy bấm "Kích hoạt gói cho khách" để bắt đầu.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{c.phone_number}</td>
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{c.full_name || "—"}</td>
                      <td className="px-4 py-3">
                        {c.current_license ? (
                          <span className="rounded bg-success-50 px-2 py-0.5 text-xs font-semibold text-success-700 dark:bg-success-950/50 dark:text-success-300">
                            {c.current_license.license_type}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 text-xs">Hết hạn</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-800 dark:text-gray-200">
                        {c.current_license ? new Date(c.current_license.valid_until).toLocaleDateString("vi-VN") : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(c.created_at).toLocaleDateString("vi-VN")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Đơn hàng của khách */}
      {activeTab === "orders" && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-2xs">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-gray-500 dark:border-gray-800 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-950/30">
                <tr>
                  <th className="px-4 py-3">Mã đơn</th>
                  <th className="px-4 py-3">Khách hàng</th>
                  <th className="px-4 py-3">Gói bản quyền</th>
                  <th className="px-4 py-3">Số tiền</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Thời gian tạo</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400">
                      Chưa có đơn hàng nào từ khách hàng của bạn.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3 font-mono font-bold text-brand-600 dark:text-brand-400">{o.order_code}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 dark:text-white">{o.customer_phone || "—"}</div>
                        {o.customer_name && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">{o.customer_name}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-gray-800 dark:text-gray-200">{o.plan_name || "—"}</td>
                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                        {o.amount_vnd.toLocaleString("vi-VN")} đ
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                            o.status === "COMPLETED"
                              ? "bg-success-50 text-success-700 dark:bg-success-950/50 dark:text-success-300"
                              : o.status === "PENDING"
                              ? "bg-warning-50 text-warning-700 dark:bg-warning-950/50 dark:text-warning-300"
                              : "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                          }`}
                        >
                          {o.status === "COMPLETED"
                            ? "Đã duyệt"
                            : o.status === "PENDING"
                            ? "Chờ duyệt"
                            : "Đã hủy"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(o.created_at).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {o.status === "PENDING" ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setApprovingOrder(o)}
                              className="inline-flex items-center gap-1 rounded-lg bg-success-500 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-success-600 transition"
                            >
                              <span>✓</span> Duyệt đơn
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectOrder(o)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
                            >
                              <span>✕</span> Từ chối
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Cấu hình Tài khoản Nhận tiền VietQR */}
      {activeTab === "banking" && (
        <div className="max-w-2xl space-y-6">
          <form
            onSubmit={handleSaveBanking}
            className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 shadow-2xs"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-base text-white font-bold shadow-2xs">
                  💳
                </span>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">
                    Cấu hình Tài khoản Nhận tiền Khách hàng
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Mã VietQR sẽ tự động chuyển khoản về số tài khoản này khi khách hàng của bạn mua gói trên Desktop App.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300 leading-relaxed">
              💡 <strong>Cơ chế hoạt động:</strong> Khi khách hàng sử dụng app có file <code className="font-mono font-bold">agency.json</code> của bạn và bấm tạo đơn nâng cấp bản quyền, phần mềm sẽ tạo mã <strong>VietQR Động</strong> dẫn trực tiếp về tài khoản ngân hàng dưới đây. Nếu chưa cài đặt, hệ thống sẽ tự động fallback về STK của Tổng Admin để đảm bảo đơn hàng không bị gián đoạn.
            </div>

            <div className="space-y-4 pt-2">
              <label className="block text-sm">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Ngân hàng thụ hưởng</span>
                <select
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white focus:border-brand-500 focus:outline-none"
                  value={bankBin}
                  onChange={(e) => onSelectBank(e.target.value)}
                >
                  {banksList.length > 0 ? (
                    banksList.map((b) => (
                      <option key={`${b.bin}-${b.code}`} value={b.bin}>
                        {b.short_name} — {b.name} (BIN: {b.bin})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="970422">MBBank (Quân Đội) - 970422</option>
                      <option value="970436">Vietcombank - 970436</option>
                      <option value="970415">VietinBank - 970415</option>
                      <option value="970418">BIDV - 970418</option>
                      <option value="970407">Techcombank - 970407</option>
                      <option value="970416">ACB - 970416</option>
                      <option value="970432">VPBank - 970432</option>
                      <option value="970423">TPBank - 970423</option>
                    </>
                  )}
                </select>
              </label>

              <label className="block text-sm">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Số tài khoản ngân hàng (STK)</span>
                <input
                  type="text"
                  placeholder="Ví dụ: 0988123456"
                  className="mt-1.5 w-full font-mono rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white focus:border-brand-500 focus:outline-none"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  required
                />
              </label>

              <label className="block text-sm">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Tên chủ tài khoản (Viết hoa không dấu)</span>
                <input
                  type="text"
                  placeholder="Ví dụ: NGUYEN VAN A"
                  className="mt-1.5 w-full uppercase rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white focus:border-brand-500 focus:outline-none"
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                />
              </label>

              {bankAccountNumber && (
                <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3 dark:border-gray-800 dark:bg-gray-800/40 text-xs space-y-1">
                  <div className="text-gray-500 dark:text-gray-400">Xem trước thông tin thanh toán:</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {bankName || "Ngân hàng"} · STK: <span className="font-mono text-brand-600 dark:text-brand-400 font-bold">{bankAccountNumber}</span>
                    {bankAccountName && <span> ({bankAccountName})</span>}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={savingBanking}
                className="w-full rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition shadow-2xs disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>💾</span> {savingBanking ? "Đang lưu..." : "Lưu thông tin nhận tiền"}
              </button>

              {bankingMsg && (
                <div
                  className={`rounded-xl p-3 text-xs font-medium ${
                    bankingMsg.includes("thất bại")
                      ? "bg-error-50 text-error-700 dark:bg-error-950/40 dark:text-error-300 border border-error-200 dark:border-error-800"
                      : "bg-success-50 text-success-700 dark:bg-success-950/40 dark:text-success-300 border border-success-200 dark:border-success-800"
                  }`}
                >
                  {bankingMsg}
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Modal Duyệt Đơn Hàng Của Khách */}
      {approvingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>✓</span> Duyệt Đơn Mua Bản Quyền
              </h3>
              <button
                type="button"
                onClick={() => setApprovingOrder(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Xác nhận bạn đã nhận được tiền thanh toán từ khách hàng cho đơn này:
              </p>

              <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3.5 dark:border-gray-800 dark:bg-gray-800/40 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Mã đơn hàng:</span>
                  <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{approvingOrder.order_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Khách hàng:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{approvingOrder.customer_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Gói đăng ký:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{approvingOrder.plan_name}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200/60 pt-2 dark:border-gray-700">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Tiền trừ ví đại lý:</span>
                  <span className="font-bold text-red-600 dark:text-red-400">-{approvingOrder.amount_vnd.toLocaleString("vi-VN")} đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Số dư ví hiện tại:</span>
                  <span className="font-mono font-bold text-success-600 dark:text-success-400">{(data?.balance.balance_vnd || 0).toLocaleString("vi-VN")} đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Số dư ví sau khi duyệt:</span>
                  <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                    {((data?.balance.balance_vnd || 0) - approvingOrder.amount_vnd).toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>

              {(data?.balance.balance_vnd || 0) < approvingOrder.amount_vnd && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                  ⚠️ Số dư ví không đủ để duyệt đơn này. Vui lòng nạp thêm gói Combo đại lý trước khi duyệt.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setApprovingOrder(null)}
                className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-750"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isApproving || (data?.balance.balance_vnd || 0) < approvingOrder.amount_vnd}
                onClick={handleConfirmApproveOrder}
                className="rounded-xl bg-success-500 px-4 py-2 text-sm font-semibold text-white hover:bg-success-600 transition shadow disabled:opacity-50"
              >
                {isApproving ? "Đang xử lý..." : "✓ Xác Nhận Duyệt & Kích Hoạt"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold"
              >
                ✕
              </button>
            </div>

            {!topupOrder ? (
              <div className="space-y-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">
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
                            <span className="font-bold text-brand-600 dark:text-brand-400 text-sm">{combo.name}</span>
                            <span className="text-[10px] font-bold bg-success-50 text-success-600 dark:bg-success-950/50 dark:text-success-300 px-1.5 py-0.5 rounded">
                              Hạn {combo.duration_days >= 365 ? `${Math.round(combo.duration_days / 365)} năm` : `${combo.duration_days} ngày`}
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Thanh toán nạp:</div>
                          <div className="text-base font-extrabold text-gray-900 dark:text-white">
                            {combo.price_vnd.toLocaleString("vi-VN")} đ
                          </div>
                          <div className="mt-2 rounded-lg bg-success-50/80 p-2 dark:bg-success-950/40">
                            <div className="text-[11px] text-gray-600 dark:text-gray-300">Nhận vào ví:</div>
                            <div className="text-sm font-black text-success-600 dark:text-success-400">
                              {combo.credit_vnd.toLocaleString("vi-VN")} đ
                            </div>
                            <div className="text-[10px] text-success-700 dark:text-success-300 font-semibold mt-0.5">
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
                <p className="text-sm text-gray-600 dark:text-gray-300">Quét mã QR dưới đây để chuyển khoản tự động:</p>
                {topupOrder.qr_image_base64 && (
                  <img
                    src={topupOrder.qr_image_base64}
                    alt="VietQR Topup"
                    className="mx-auto h-52 w-52 rounded-xl border bg-white p-2"
                  />
                )}
                <div className="rounded-lg bg-gray-50 p-3 font-mono text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                  <p>Số tiền: <b>{topupOrder.amount_vnd.toLocaleString("vi-VN")} đ</b></p>
                  <p>Nội dung CK: <b className="text-brand-600 dark:text-brand-400">{topupOrder.order_code}</b></p>
                </div>
                <button
                  onClick={() => {
                    setShowTopupModal(false);
                    setTopupOrder(null);
                    void load();
                  }}
                  className="w-full rounded-lg bg-brand-500 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition"
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
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">Số điện thoại khách hàng</label>
              <input
                type="tel"
                placeholder="0912345678"
                value={activateForm.phone_number}
                onChange={(e) => setActivateForm((f) => ({ ...f, phone_number: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">Tên khách hàng</label>
              <input
                type="text"
                placeholder="Nguyễn Văn A"
                value={activateForm.full_name}
                onChange={(e) => setActivateForm((f) => ({ ...f, full_name: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">Gói bản quyền</label>
              <select
                value={activateForm.plan_code}
                onChange={(e) => setActivateForm((f) => ({ ...f, plan_code: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
              <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300 space-y-1 border border-gray-100 dark:border-gray-700/60">
                <div className="flex justify-between">
                  <span>Giá gói bản quyền:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedPlan.price_vnd.toLocaleString("vi-VN")} đ</span>
                </div>
                <div className="flex justify-between">
                  <span>Số dư ví hiện có:</span>
                  <span className="font-mono font-bold text-success-600 dark:text-success-400">
                    {(data?.balance?.balance_vnd || 0).toLocaleString("vi-VN")} đ
                  </span>
                </div>
                <div className="mt-1 flex justify-between border-t border-gray-200 pt-1 font-bold text-gray-900 dark:text-white dark:border-gray-700">
                  <span>Tiền trừ ví khả dụng:</span>
                  <span className="text-brand-600 dark:text-brand-400">-{selectedPlan.price_vnd.toLocaleString("vi-VN")} đ</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setShowActivateModal(false)}
                className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="rounded-xl bg-success-500 px-4 py-2 text-sm font-semibold text-white hover:bg-success-600 transition shadow"
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

