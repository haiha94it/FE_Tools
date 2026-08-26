"use client";

import { API_LICENSING_ADMIN } from "@/config/api";
import api from "@/lib/axios";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

type Customer = {
  id: number;
  phone_number: string;
  full_name: string;
  email?: string;
  agency?: number | null;
  agency_username?: string;
  agency_fullname?: string;
  referral_code: string;
  referral_reward_days: number;
  trial_granted: boolean;
  devices: Array<{ id: number; machine_fingerprint: string; os_name: string; hostname?: string; last_seen_at: string }>;
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

type AgencyCombo = {
  code: string;
  name: string;
  price_vnd: number;
  credit_vnd: number;
  duration_days: number;
  description: string;
};

type PricingPlan = {
  id: number;
  name: string;
  code: string;
  duration_days: number;
  price_vnd: number;
  is_active: boolean;
  sort_order: number;
};

export default function AdminLicensingPage() {
  const [activeTab, setActiveTab] = useState<"customers" | "orders" | "agencies" | "pricing">("customers");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [agencies, setAgencies] = useState<AgencyBalance[]>([]);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Customer Filter, Search & Edit State
  const [customerSearch, setCustomerSearch] = useState<string>("");
  const [customerAgencyFilter, setCustomerAgencyFilter] = useState<string>("DIRECT");
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editCustomerForm, setEditCustomerForm] = useState<{
    phone_number: string;
    full_name: string;
    email: string;
    agency_id: string | number;
    referral_reward_days: number;
  }>({
    phone_number: "",
    full_name: "",
    email: "",
    agency_id: "",
    referral_reward_days: 0,
  });
  const [savingCustomer, setSavingCustomer] = useState<boolean>(false);

  // Agency Combos State
  const [agencyCombos, setAgencyCombos] = useState<AgencyCombo[]>([
    {
      code: "COMBO_1",
      name: "Combo 1",
      price_vnd: 3000000,
      credit_vnd: 5000000,
      duration_days: 365,
      description: "Nạp 3.000.000 đ nhận 5.000.000 đ vào ví",
    },
    {
      code: "COMBO_2",
      name: "Combo 2",
      price_vnd: 5000000,
      credit_vnd: 10000000,
      duration_days: 365,
      description: "Nạp 5.000.000 đ nhận 10.000.000 đ vào ví",
    },
    {
      code: "COMBO_3",
      name: "Combo 3",
      price_vnd: 7000000,
      credit_vnd: 18000000,
      duration_days: 365,
      description: "Nạp 7.000.000 đ nhận 18.000.000 đ vào ví",
    },
  ]);
  const [savingCombos, setSavingCombos] = useState<boolean>(false);
  const [comboModalOpen, setComboModalOpen] = useState<boolean>(false);
  const [editingCombo, setEditingCombo] = useState<AgencyCombo | null>(null);
  const [comboForm, setComboForm] = useState<AgencyCombo>({
    code: "COMBO_1",
    name: "Combo 1",
    price_vnd: 3000000,
    credit_vnd: 5000000,
    duration_days: 365,
    description: "",
  });
  const [selectedAgencyForEdit, setSelectedAgencyForEdit] = useState<AgencyBalance | null>(null);
  const [agencyEditForm, setAgencyEditForm] = useState<{
    adjust_mode: "adjust" | "set";
    adjust_amount_vnd: string | number;
    set_balance_vnd: string | number;
  }>({
    adjust_mode: "adjust",
    adjust_amount_vnd: "",
    set_balance_vnd: "",
  });
  const [savingAgencyEdit, setSavingAgencyEdit] = useState<boolean>(false);

  // Issue License Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [issueForm, setIssueForm] = useState({ duration_days: 365, license_type: "PAID_1Y" });

  const loadData = async () => {
    setLoading(true);
    try {
      console.log(`[LICENSING] Đang tải dữ liệu cho tab=${activeTab}...`);
      if (activeTab === "customers") {
        const [resCust, resAgencies] = await Promise.all([
          api.get<Customer[]>(API_LICENSING_ADMIN.CUSTOMERS),
          api.get<AgencyBalance[]>(API_LICENSING_ADMIN.AGENCY_BALANCES),
        ]);
        const data = resCust.data ?? [];
        setCustomers(data);
        setAgencies(resAgencies.data ?? []);
        console.log(`[LICENSING] Đã tải ${data.length} khách hàng và ${resAgencies.data?.length ?? 0} đại lý`);
      } else if (activeTab === "orders") {
        const res = await api.get<PaymentOrder[]>(API_LICENSING_ADMIN.ORDERS);
        const data = res.data ?? [];
        setOrders(data);
        console.log(`[PAYMENT] Đã tải ${data.length} đơn hàng`);
      } else if (activeTab === "agencies") {
        const [resAgencies, resGlobal, resPlans] = await Promise.all([
          api.get<AgencyBalance[]>(API_LICENSING_ADMIN.AGENCY_BALANCES),
          api.get<{ combos: AgencyCombo[]; total_agencies: number }>(
            API_LICENSING_ADMIN.GLOBAL_AGENCY_SETTINGS
          ),
          api.get<PricingPlan[]>(API_LICENSING_ADMIN.PRICING_PLANS),
        ]);
        const dataAgencies = resAgencies.data ?? [];
        setAgencies(dataAgencies);
        if (Array.isArray(resGlobal.data?.combos) && resGlobal.data.combos.length > 0) {
          setAgencyCombos(resGlobal.data.combos);
        }
        setPricingPlans(resPlans.data ?? []);
        console.log(`[AGENCY] Đã tải ${dataAgencies.length} số dư ví đại lý và danh mục Combo 1, 2, 3`);
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

  // Filtered Customers
  const filteredCustomers = customers.filter((c) => {
    // Agency Filter
    if (customerAgencyFilter === "DIRECT") {
      if (c.agency) return false;
    } else if (customerAgencyFilter !== "ALL") {
      if (String(c.agency) !== customerAgencyFilter && c.agency_username !== customerAgencyFilter) {
        return false;
      }
    }

    // Search Filter
    if (customerSearch.trim()) {
      const q = customerSearch.trim().toLowerCase();
      const matchPhone = c.phone_number.toLowerCase().includes(q);
      const matchName = (c.full_name || "").toLowerCase().includes(q);
      const matchRef = (c.referral_code || "").toLowerCase().includes(q);
      const matchAgency = (c.agency_fullname || c.agency_username || "").toLowerCase().includes(q);
      if (!matchPhone && !matchName && !matchRef && !matchAgency) return false;
    }

    return true;
  });

  const openEditCustomerModal = (c: Customer) => {
    setEditingCustomer(c);
    setEditCustomerForm({
      phone_number: c.phone_number,
      full_name: c.full_name || "",
      email: c.email || "",
      agency_id: c.agency ?? "",
      referral_reward_days: c.referral_reward_days || 0,
    });
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setSavingCustomer(true);
    try {
      console.log(`[LICENSING] Đang cập nhật khách hàng customer_id=${editingCustomer.id}...`);
      await api.put(API_LICENSING_ADMIN.CUSTOMER_DETAIL(editingCustomer.id), {
        phone_number: editCustomerForm.phone_number,
        full_name: editCustomerForm.full_name,
        email: editCustomerForm.email,
        agency_id: editCustomerForm.agency_id === "" ? null : Number(editCustomerForm.agency_id),
        referral_reward_days: Number(editCustomerForm.referral_reward_days),
      });
      setMsg(`Đã cập nhật thông tin khách hàng "${editCustomerForm.phone_number}" thành công!`);
      setEditingCustomer(null);
      await loadData();
    } catch (err: any) {
      console.error("[LICENSING] Lỗi cập nhật khách hàng", err);
      alert(err?.response?.data?.message || "Không thể cập nhật khách hàng.");
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleDeleteCustomer = async (customerId: number, phone: string) => {
    if (!confirm(`⚠️ Xác nhận XÓA vĩnh viễn khách hàng "${phone}" và tất cả dữ liệu bản quyền liên quan? Thao tác này không thể khôi phục!`)) return;
    try {
      console.log(`[LICENSING] Đang xóa khách hàng customer_id=${customerId}...`);
      await api.delete(API_LICENSING_ADMIN.CUSTOMER_DETAIL(customerId));
      setMsg(`Đã xóa khách hàng "${phone}" thành công!`);
      await loadData();
    } catch (err) {
      console.error(`[LICENSING] Xóa khách hàng thất bại customer_id=${customerId}`, err);
      setMsg("Xóa khách hàng thất bại.");
    }
  };

  const handleExportExcel = () => {
    if (filteredCustomers.length === 0) {
      alert("Không có dữ liệu khách hàng nào phù hợp để xuất file.");
      return;
    }
    const excelData = filteredCustomers.map((c, idx) => ({
      "STT": idx + 1,
      "Số điện thoại": c.phone_number,
      "Họ và tên": c.full_name || "",
      "Đại lý bảo trợ": c.agency_fullname ? `${c.agency_fullname} (@${c.agency_username})` : c.agency_username || "Khách lẻ trực tiếp",
      "Mã giới thiệu": c.referral_code,
      "Thưởng GT (ngày)": c.referral_reward_days,
      "Gói bản quyền": c.current_license ? c.current_license.license_type : "Chưa có",
      "Trạng thái": c.current_license?.is_valid ? "Đang hoạt động" : "Hết hạn/Khóa",
      "Hạn sử dụng": c.current_license ? new Date(c.current_license.valid_until).toLocaleDateString("vi-VN") : "—",
      "Số thiết bị kích hoạt": c.devices?.length || 0,
      "Ngày đăng ký": new Date(c.created_at).toLocaleString("vi-VN"),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "KhachHang");

    // Auto column widths
    const colWidths = Object.keys(excelData[0] || {}).map((k) => ({
      wch: Math.max(k.length, 16),
    }));
    worksheet["!cols"] = colWidths;

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Danh_sach_khach_hang_GGMaps_${dateStr}.xlsx`);
  };

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

  const handleRejectOrder = async (orderId: number) => {
    if (!confirm("Xác nhận TỪ CHỐI / HỦY đơn hàng này?")) return;
    try {
      console.log(`[PAYMENT] Đang từ chối đơn hàng order_id=${orderId}...`);
      await api.post(API_LICENSING_ADMIN.REJECT_ORDER(orderId));
      setMsg("Đã từ chối đơn hàng thành công!");
      await loadData();
    } catch (err) {
      console.error(`[PAYMENT] Từ chối đơn hàng thất bại order_id=${orderId}`, err);
      setMsg("Từ chối đơn hàng thất bại.");
    }
  };

  const handleDeleteOrder = async (orderId: number, orderCode: string) => {
    if (!confirm(`Xác nhận XÓA vĩnh viễn đơn hàng "${orderCode}"?`)) return;
    try {
      console.log(`[PAYMENT] Đang xóa đơn hàng order_id=${orderId}...`);
      await api.delete(API_LICENSING_ADMIN.DELETE_ORDER(orderId));
      setMsg(`Đã xóa đơn hàng ${orderCode} thành công!`);
      await loadData();
    } catch (err) {
      console.error(`[PAYMENT] Xóa đơn hàng thất bại order_id=${orderId}`, err);
      setMsg("Xóa đơn hàng thất bại.");
    }
  };

  const handleDeleteAllOrders = async () => {
    if (!confirm("⚠️ CẢNH BÁO: Bạn có chắc chắn muốn XÓA TẤT CẢ đơn hàng trong hệ thống không? Thao tác này không thể hoàn tác!")) return;
    try {
      console.log("[PAYMENT] Đang xóa tất cả đơn hàng...");
      await api.delete(API_LICENSING_ADMIN.DELETE_ALL_ORDERS);
      setMsg("Đã xóa tất cả đơn hàng thành công!");
      await loadData();
    } catch (err) {
      console.error("[PAYMENT] Xóa tất cả đơn hàng thất bại", err);
      setMsg("Xóa tất cả đơn hàng thất bại.");
    }
  };

  const handleSaveAgencyCombos = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCombos(true);
    try {
      console.log("[AGENCY] Đang lưu cài đặt danh mục Combo đại lý...", agencyCombos);
      await api.post(API_LICENSING_ADMIN.GLOBAL_AGENCY_SETTINGS, {
        combos: agencyCombos,
      });
      setMsg("Đã lưu cài đặt gói Combo đại lý 1, 2, 3 thành công!");
      await loadData();
    } catch (err: any) {
      console.error("[AGENCY] Lỗi lưu gói Combo đại lý", err);
      alert("Không thể lưu gói Combo đại lý.");
    } finally {
      setSavingCombos(false);
    }
  };

  const openEditComboModal = (combo: AgencyCombo) => {
    setEditingCombo(combo);
    setComboForm({ ...combo });
    setComboModalOpen(true);
  };

  const handleSaveSingleCombo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCombo) return;

    const updatedCombos = agencyCombos.map((c) =>
      c.code === editingCombo.code
        ? {
            ...comboForm,
            price_vnd: Number(comboForm.price_vnd),
            credit_vnd: Number(comboForm.credit_vnd),
            duration_days: Number(comboForm.duration_days) || 365,
          }
        : c
    );

    setSavingCombos(true);
    try {
      console.log("[AGENCY] Đang lưu cập nhật combo...", updatedCombos);
      await api.post(API_LICENSING_ADMIN.GLOBAL_AGENCY_SETTINGS, {
        combos: updatedCombos,
      });
      setAgencyCombos(updatedCombos);
      setMsg(`Đã cập nhật "${comboForm.name}" thành công!`);
      setComboModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error("[AGENCY] Lỗi cập nhật combo", err);
      alert("Không thể lưu gói Combo đại lý.");
    } finally {
      setSavingCombos(false);
    }
  };

  const handleOpenAgencyEditModal = (a: AgencyBalance) => {
    setSelectedAgencyForEdit(a);
    setAgencyEditForm({
      adjust_mode: "adjust",
      adjust_amount_vnd: "",
      set_balance_vnd: a.balance_vnd,
    });
  };

  const handleSaveAgencyEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgencyForEdit) return;

    setSavingAgencyEdit(true);
    try {
      const payload: any = {
        agency_id: selectedAgencyForEdit.agency,
      };

      if (agencyEditForm.adjust_mode === "adjust" && agencyEditForm.adjust_amount_vnd !== "") {
        payload.adjust_amount_vnd = Number(agencyEditForm.adjust_amount_vnd);
      } else if (agencyEditForm.adjust_mode === "set" && agencyEditForm.set_balance_vnd !== "") {
        payload.set_balance_vnd = Number(agencyEditForm.set_balance_vnd);
      }

      console.log(`[AGENCY] Đang cập nhật số dư ví đại lý agency_id=${selectedAgencyForEdit.agency}...`, payload);
      await api.post(API_LICENSING_ADMIN.UPDATE_AGENCY_BALANCE, payload);
      setMsg(`Đã cập nhật số dư ví đại lý "${selectedAgencyForEdit.agency_username}" thành công!`);
      setSelectedAgencyForEdit(null);
      await loadData();
    } catch (err: any) {
      console.error("[AGENCY] Lỗi cập nhật số dư ví đại lý", err);
      alert("Không thể cập nhật số dư ví đại lý.");
    } finally {
      setSavingAgencyEdit(false);
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
          {/* Toolbar Tìm kiếm, Lọc đại lý & Xuất Excel */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="🔍 Tìm SĐT, họ tên, mã GT..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                />
                {customerSearch && (
                  <button
                    onClick={() => setCustomerSearch("")}
                    className="absolute right-2.5 top-2 text-xs text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Lọc Đại Lý */}
              <div className="w-full sm:w-64">
                <select
                  value={customerAgencyFilter}
                  onChange={(e) => setCustomerAgencyFilter(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 focus:border-brand-500 focus:outline-none dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
                >
                  <option value="DIRECT">👤 Khách hàng của Admin (Trực tiếp)</option>
                  <option value="ALL">🏢 Tất cả khách hàng (Toàn hệ thống - {customers.length})</option>
                  {agencies.map((a) => (
                    <option key={a.id} value={String(a.agency)}>
                      🏢 Đại lý: {a.agency_fullname || a.agency_username} (@{a.agency_username})
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-xs text-gray-500 font-medium">
                Hiển thị: <b>{filteredCustomers.length}</b> / {customers.length} khách
              </span>
            </div>

            {/* Nút Xuất Excel */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 rounded-xl border border-success-200 bg-success-50 px-3.5 py-2 text-xs font-bold text-success-700 shadow-2xs hover:bg-success-100 transition dark:border-success-900/50 dark:bg-success-950/40 dark:text-success-300"
              >
                <span>📥</span> Xuất File Excel ({filteredCustomers.length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-2xs">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-gray-500 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/30">
                <tr>
                  <th className="px-4 py-3">SĐT Khách hàng</th>
                  <th className="px-4 py-3">Họ và tên</th>
                  {customerAgencyFilter === "ALL" && (
                    <th className="px-4 py-3">Đại lý bảo trợ</th>
                  )}
                  <th className="px-4 py-3">Mã GT & Thưởng</th>
                  <th className="px-4 py-3">Bản quyền hiện tại</th>
                  <th className="px-4 py-3">Hạn sử dụng</th>
                  <th className="px-4 py-3">Thiết bị</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={customerAgencyFilter === "ALL" ? 8 : 7} className="px-4 py-8 text-center text-gray-400">
                      Không tìm thấy khách hàng nào phù hợp với điều kiện lọc.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => {
                    const lic = c.current_license;
                    return (
                      <tr key={c.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                          {c.phone_number}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                          {c.full_name || "—"}
                        </td>
                        {customerAgencyFilter === "ALL" && (
                          <td className="px-4 py-3 text-xs">
                            {c.agency_username ? (
                              <span className="rounded-md bg-purple-50 px-2 py-0.5 font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                                🏢 {c.agency_fullname || c.agency_username}
                              </span>
                            ) : (
                              <span className="text-gray-400 font-medium">Khách lẻ trực tiếp</span>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3 text-xs">
                          <span className="font-mono font-bold text-brand-600">{c.referral_code}</span>
                          <span className="ml-1 text-gray-500">(+{c.referral_reward_days}d)</span>
                        </td>
                        <td className="px-4 py-3">
                          {lic ? (
                            <span
                              className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold ${
                                lic.is_valid
                                  ? "bg-success-50 text-success-700 dark:bg-success-950/50 dark:text-success-300"
                                  : "bg-error-50 text-error-700 dark:bg-error-950/50 dark:text-error-300"
                              }`}
                            >
                              {lic.license_type}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">Chưa có</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {lic ? (
                            <span className={lic.is_valid ? "font-semibold text-gray-800 dark:text-gray-200" : "text-gray-400 line-through"}>
                              {new Date(lic.valid_until).toLocaleDateString("vi-VN")}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {c.devices?.length || 0} máy
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedCustomerId(c.id)}
                              title="Cấp / Gia hạn thêm ngày dùng"
                              className="rounded-lg bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-100 dark:bg-brand-950/50 dark:text-brand-300 transition"
                            >
                              + Cấp hạn
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditCustomerModal(c)}
                              title="Sửa thông tin chi tiết khách hàng"
                              className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 transition"
                            >
                              ✏️ Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomer(c.id, c.phone_number)}
                              title="Xóa khách hàng này"
                              className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 transition"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Modal Sửa Chi Tiết Khách Hàng */}
          {editingCustomer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>✏️</span> Chi Tiết Khách Hàng: {editingCustomer.phone_number}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingCustomer(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveCustomer} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Số điện thoại *
                      </label>
                      <input
                        type="text"
                        required
                        value={editCustomerForm.phone_number}
                        onChange={(e) => setEditCustomerForm({ ...editCustomerForm, phone_number: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-sm font-bold text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Họ và tên
                      </label>
                      <input
                        type="text"
                        value={editCustomerForm.full_name}
                        onChange={(e) => setEditCustomerForm({ ...editCustomerForm, full_name: e.target.value })}
                        placeholder="Nguyễn Văn A"
                        className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editCustomerForm.email}
                      onChange={(e) => setEditCustomerForm({ ...editCustomerForm, email: e.target.value })}
                      placeholder="example@gmail.com"
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Đại lý quản lý / bảo trợ
                      </label>
                      <select
                        value={editCustomerForm.agency_id}
                        onChange={(e) => setEditCustomerForm({ ...editCustomerForm, agency_id: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-xs font-medium focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                      >
                        <option value="">👤 Khách lẻ trực tiếp (Không có ĐL)</option>
                        {agencies.map((a) => (
                          <option key={a.id} value={a.agency}>
                            🏢 {a.agency_fullname || a.agency_username} (@{a.agency_username})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Thưởng giới thiệu (ngày)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editCustomerForm.referral_reward_days}
                        onChange={(e) => setEditCustomerForm({ ...editCustomerForm, referral_reward_days: Number(e.target.value) || 0 })}
                        className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-500 dark:bg-gray-800/50 space-y-1">
                    <div className="flex justify-between">
                      <span>Mã giới thiệu riêng:</span>
                      <span className="font-mono font-bold text-brand-600">{editingCustomer.referral_code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Thiết bị đăng nhập ({editingCustomer.devices?.length || 0}):</span>
                      <span>
                        {editingCustomer.devices?.map((d) => `${d.os_name || "PC"} (${d.machine_fingerprint.slice(0, 8)}...)`).join(", ") || "Chưa có thiết bị"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={() => setEditingCustomer(null)}
                      className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={savingCustomer}
                      className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-brand-600 transition disabled:opacity-50"
                    >
                      {savingCustomer ? "Đang lưu..." : "💾 Lưu Thay Đổi"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

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
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>📋</span> Danh Sách Đơn Hàng & Thanh Toán ({orders.length})
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Quản lý các đơn mua bản quyền khách hàng và đơn nạp ví combo của đại lý.
              </p>
            </div>
            {orders.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteAllOrders}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-600 shadow-2xs hover:bg-red-100 transition dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
              >
                <span>🗑️</span> Xóa Tất Cả Đơn Hàng
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-2xs">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-gray-100 text-gray-500 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/30">
                <tr>
                  <th className="px-4 py-3">Mã đơn (Nội dung CK)</th>
                  <th className="px-4 py-3">Loại đơn</th>
                  <th className="px-4 py-3">Khách / Đại lý</th>
                  <th className="px-4 py-3">Gói</th>
                  <th className="px-4 py-3">Số tiền</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Thời gian tạo</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                      Chưa có đơn hàng nào trên hệ thống.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3 font-mono font-bold text-brand-600">{o.order_code}</td>
                      <td className="px-4 py-3 text-xs">
                        {o.order_type === "LICENSE_PURCHASE" ? (
                          <span className="rounded-md bg-blue-50 px-2 py-0.5 font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            Mua bản quyền
                          </span>
                        ) : (
                          <span className="rounded-md bg-purple-50 px-2 py-0.5 font-semibold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                            Nạp ví đại lý
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {o.customer_phone || o.agency_username || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs">{o.plan_name || "—"}</td>
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
                            : "Đã từ chối"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {new Date(o.created_at).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {o.status === "PENDING" && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleCompleteOrder(o.id)}
                                title="Duyệt và cấp bản quyền/nạp ví"
                                className="inline-flex items-center gap-1 rounded-lg bg-success-500 px-2.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-success-600 transition"
                              >
                                <span>✓</span> Duyệt
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectOrder(o.id)}
                                title="Từ chối / Hủy đơn này"
                                className="inline-flex items-center gap-1 rounded-lg border border-warning-200 bg-warning-50 px-2.5 py-1.5 text-xs font-semibold text-warning-700 hover:bg-warning-100 transition dark:border-warning-900/50 dark:bg-warning-950/40 dark:text-warning-300"
                              >
                                <span>✕</span> Từ chối
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(o.id, o.order_code)}
                            title="Xóa đơn hàng này"
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
                          >
                            <span>🗑️</span> Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Agencies */}
      {activeTab === "agencies" && (
        <div className="space-y-6">
          {/* Card 1: Gói Nạp Tiền Đại Lý */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4 dark:border-gray-800">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>🏢</span> Gói Nạp Tiền Đại Lý
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Chính sách gói nạp tiền và hạn sử dụng dành riêng cho Đại lý. Bạn có thể bấm vào nút "Chỉnh sửa giá" trên từng gói để thay đổi giá nạp, số dư nhận hoặc hạn dùng.
                </p>
              </div>
            </div>

            {/* 3 Thẻ Combo Đại lý */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {agencyCombos.map((combo, idx) => {
                const bonus = combo.credit_vnd - combo.price_vnd;
                const bonusPercent = Math.round((bonus / combo.price_vnd) * 100);
                return (
                  <div
                    key={combo.code}
                    className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-linear-to-b from-gray-50/50 to-white p-5 shadow-xs transition hover:shadow-md dark:border-gray-800 dark:from-gray-950/40 dark:to-gray-900"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                          {combo.name}
                        </span>
                        <span className="rounded-full bg-success-50 px-2 py-0.5 text-[11px] font-bold text-success-600 dark:bg-success-950/50 dark:text-success-300">
                          +{bonusPercent}% Số dư
                        </span>
                      </div>

                      <div className="mt-4">
                        <p className="text-xs text-gray-500">Giá thanh toán nạp:</p>
                        <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
                          {combo.price_vnd.toLocaleString("vi-VN")} đ
                        </p>
                      </div>

                      <div className="mt-3 rounded-xl border border-success-100 bg-success-50/50 p-3 dark:border-success-900/40 dark:bg-success-950/20">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Nhận vào ví:</span>
                          <span className="text-lg font-black text-success-600 dark:text-success-400">
                            {combo.credit_vnd.toLocaleString("vi-VN")} đ
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
                          <span>Lợi nhuận cộng thêm:</span>
                          <span className="font-bold text-success-600">+{bonus.toLocaleString("vi-VN")} đ</span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-2 dark:border-gray-800">
                        <span>Thời hạn sử dụng:</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          {combo.duration_days >= 365 ? "1 Năm (365 ngày)" : `${combo.duration_days} ngày`}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openEditComboModal(combo)}
                      className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white py-2 text-xs font-semibold text-gray-700 shadow-2xs hover:bg-brand-50 hover:text-brand-600 hover:border-brand-300 transition dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    >
                      <span>✏️</span> Chỉnh sửa giá {combo.name}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 2: Danh Sách Đại Lý & Quản Lý Ví VNĐ */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>👥</span> Danh Sách Đại Lý & Quản Lý Ví VNĐ ({agencies.length})
              </h3>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-gray-100 text-gray-500 dark:border-gray-800">
                  <tr>
                    <th className="px-4 py-3">Username Đại lý</th>
                    <th className="px-4 py-3">Họ và tên</th>
                    <th className="px-4 py-3">Số dư ví khả dụng</th>
                    <th className="px-4 py-3">Chính sách áp dụng</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {agencies.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                        Chưa có đại lý nào trên hệ thống. Bạn có thể tạo tài khoản người dùng tại mục Người dùng.
                      </td>
                    </tr>
                  ) : (
                    agencies.map((a) => (
                      <tr key={a.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{a.agency_username}</td>
                        <td className="px-4 py-3">{a.agency_fullname || "—"}</td>
                        <td className="px-4 py-3 font-mono font-bold text-success-600">
                          {a.balance_vnd.toLocaleString("vi-VN")} đ
                        </td>
                        <td className="px-4 py-3 text-xs text-brand-600 font-semibold">
                          Gói Nạp Đại Lý
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleOpenAgencyEditModal(a)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-100 transition dark:bg-brand-950/50 dark:text-brand-300"
                          >
                            💵 Nạp / Điều chỉnh ví
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Điều Chỉnh Số Dư Ví Đại Lý */}
          {selectedAgencyForEdit && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <form
                onSubmit={handleSaveAgencyEdit}
                className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Điều Chỉnh Ví: <span className="text-brand-600">{selectedAgencyForEdit.agency_username}</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSelectedAgencyForEdit(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Số dư ví hiện tại
                  </label>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-base font-bold text-success-600 dark:border-gray-800 dark:bg-gray-950">
                    {selectedAgencyForEdit.balance_vnd.toLocaleString("vi-VN")} đ
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 dark:border-gray-800 dark:bg-gray-950/40 space-y-3">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Hình thức điều chỉnh số dư
                  </label>
                  <div className="flex gap-4 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="adjust_mode"
                        checked={agencyEditForm.adjust_mode === "adjust"}
                        onChange={() => setAgencyEditForm((f) => ({ ...f, adjust_mode: "adjust" }))}
                      />
                      <span>Cộng / Trừ thêm tiền (+ / -)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="adjust_mode"
                        checked={agencyEditForm.adjust_mode === "set"}
                        onChange={() => setAgencyEditForm((f) => ({ ...f, adjust_mode: "set" }))}
                      />
                      <span>Đặt lại số dư chính xác</span>
                    </label>
                  </div>

                  {agencyEditForm.adjust_mode === "adjust" ? (
                    <input
                      type="number"
                      placeholder="VD: 500000 hoặc -200000"
                      value={agencyEditForm.adjust_amount_vnd}
                      onChange={(e) =>
                        setAgencyEditForm((f) => ({ ...f, adjust_amount_vnd: e.target.value }))
                      }
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                      required
                    />
                  ) : (
                    <input
                      type="number"
                      placeholder="VD: 1000000"
                      value={agencyEditForm.set_balance_vnd}
                      onChange={(e) =>
                        setAgencyEditForm((f) => ({ ...f, set_balance_vnd: e.target.value }))
                      }
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                      required
                    />
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setSelectedAgencyForEdit(null)}
                    className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={savingAgencyEdit}
                    className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition disabled:opacity-50"
                  >
                    {savingAgencyEdit ? "Đang lưu..." : "💾 Cập Nhật Số Dư"}
                  </button>
                </div>
              </form>
            </div>
          )}
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

      {/* Modal Chỉnh Sửa Gói Combo Đại Lý */}
      {comboModalOpen && editingCombo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>✏️</span> Cấu Hình Gói: {editingCombo.name}
              </h3>
              <button
                type="button"
                onClick={() => setComboModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSingleCombo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Tên gói Combo *
                </label>
                <input
                  type="text"
                  required
                  value={comboForm.name}
                  onChange={(e) => setComboForm({ ...comboForm, name: e.target.value })}
                  placeholder="Ví dụ: Combo 1"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-sm font-semibold focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Mã Combo
                  </label>
                  <input
                    type="text"
                    disabled
                    value={comboForm.code}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-100 px-3 py-2 font-mono text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Hạn sử dụng (Ngày) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={comboForm.duration_days}
                    onChange={(e) => setComboForm({ ...comboForm, duration_days: Number(e.target.value) || 365 })}
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-sm font-bold focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
                  />
                  <p className="mt-1 text-[11px] text-gray-400">Số ngày có hiệu lực của gói nạp</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Giá thanh toán nạp (VNĐ) *
                </label>
                <input
                  type="number"
                  required
                  min="100000"
                  step="100000"
                  value={comboForm.price_vnd}
                  onChange={(e) => setComboForm({ ...comboForm, price_vnd: Number(e.target.value) || 0 })}
                  placeholder="Ví dụ: 3000000"
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-sm font-bold text-gray-900 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Số dư nhận vào ví (VNĐ) *
                </label>
                <input
                  type="number"
                  required
                  min="100000"
                  step="100000"
                  value={comboForm.credit_vnd}
                  onChange={(e) => setComboForm({ ...comboForm, credit_vnd: Number(e.target.value) || 0 })}
                  placeholder="Ví dụ: 5000000"
                  className="mt-1 w-full rounded-xl border border-success-200 bg-transparent px-3 py-2 text-sm font-black text-success-600 focus:border-success-500 focus:outline-none dark:border-success-800 dark:text-success-400"
                />
              </div>

              {/* Thống kê tỷ lệ ưu đãi realtime */}
              <div className="rounded-xl border border-success-100 bg-success-50/50 p-3 dark:border-success-900/40 dark:bg-success-950/20">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-300">Lợi nhuận thưởng thêm cho đại lý:</span>
                  <span className="font-bold text-success-600">
                    +{(Number(comboForm.credit_vnd) - Number(comboForm.price_vnd)).toLocaleString("vi-VN")} đ
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-300">Tỷ lệ nhân số dư:</span>
                  <span className="font-bold text-brand-600">
                    +{Number(comboForm.price_vnd) > 0 ? Math.round(((Number(comboForm.credit_vnd) - Number(comboForm.price_vnd)) / Number(comboForm.price_vnd)) * 100) : 0}%
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Mô tả gói
                </label>
                <input
                  type="text"
                  value={comboForm.description}
                  onChange={(e) => setComboForm({ ...comboForm, description: e.target.value })}
                  placeholder="Mô tả tóm tắt quyền lợi gói nạp..."
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-xs focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setComboModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingCombos}
                  className="rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-brand-600 transition disabled:opacity-50"
                >
                  {savingCombos ? "Đang lưu..." : "💾 Lưu Thay Đổi Gói"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

