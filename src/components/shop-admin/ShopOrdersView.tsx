"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal";
import { adminDataPanelClass } from "@/components/ui/table/ScrollableTableContainer";
import { formatVnd, shopImageUrl } from "@/lib/shop-utils";
import { toast } from "@/lib/toast";
import { teamPermissionsService } from "@/services/team-permissions.service";
import { zaloShopService } from "@/services/zalo-shop.service";
import { useAuthStore } from "@/stores/use-auth-store";
import type { ShopOrder, ShopOrderStatus } from "@/types/zalo-shop";
import type { TeamEmployee } from "@/types/team-collaboration";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

function orderStatusMeta(status: unknown): {
  label: string;
  color: "success" | "warning" | "error" | "light";
} {
  const s = Number(status);
  if (s === 1) return { label: "Đã xác nhận", color: "success" };
  if (s === 0) return { label: "Đã hủy", color: "error" };
  return { label: "Chờ xác nhận", color: "warning" };
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("vi-VN");
}

function orderAddress(order: ShopOrder): string {
  return [order.address, order.ward, order.district, order.city]
    .filter(Boolean)
    .join(", ");
}

function msgFlag(ok?: boolean): string {
  if (ok === true) return "Thành công";
  if (ok === false) return "Chưa / thất bại";
  return "—";
}

function toCsvCell(value: unknown): string {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function ShopOrdersView() {
  const user = useAuthStore((s) => s.user);
  const isManager = Boolean(user?.isManager);

  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const [statusFilter, setStatusFilter] = useState<"" | "0" | "1" | "2">("");
  const [employeeFilter, setEmployeeFilter] = useState<"" | number>("");
  const [employees, setEmployees] = useState<TeamEmployee[]>([]);
  const [keyword, setKeyword] = useState("");
  const [keywordApplied, setKeywordApplied] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [detail, setDetail] = useState<ShopOrder | null>(null);
  const [editOrder, setEditOrder] = useState<ShopOrder | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone_number: "",
    address: "",
    ward: "",
    district: "",
    city: "",
    note: "",
    discount: "0",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await zaloShopService.listOrders({
        page,
        pageSize,
        status: statusFilter === "" ? undefined : statusFilter,
        key: keywordApplied || undefined,
        id_employee:
          isManager && employeeFilter !== "" ? employeeFilter : undefined,
      });
      setOrders(response.results);
      setCount(response.count);
      setSelectedIds([]);
    } catch {
      toast.error("Không tải được danh sách đơn hàng");
      setOrders([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, keywordApplied, employeeFilter, isManager]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (!isManager) return;
    let cancelled = false;
    void (async () => {
      try {
        const list = await teamPermissionsService.listEmployees();
        if (!cancelled) setEmployees(list);
      } catch {
        if (!cancelled) setEmployees([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isManager]);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === orders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(orders.map((o) => o.id));
    }
  };

  const handleConfirm = async (order: ShopOrder) => {
    if (!window.confirm(`Xác nhận nhận đơn #${order.id}?`)) return;
    setActionId(order.id);
    try {
      await zaloShopService.confirmOrder(order.id);
      toast.success("Đã xác nhận đơn hàng");
      await loadOrders();
      if (detail?.id === order.id) setDetail(null);
    } catch {
      toast.error("Xác nhận đơn thất bại");
    } finally {
      setActionId(null);
    }
  };

  const handleCancel = async (order: ShopOrder) => {
    if (!window.confirm(`Hủy đơn #${order.id}? (chỉ đơn đã xác nhận)`)) return;
    setActionId(order.id);
    try {
      await zaloShopService.cancelOrder(order.id);
      toast.success("Đã hủy đơn hàng");
      await loadOrders();
      if (detail?.id === order.id) setDetail(null);
    } catch {
      toast.error("Hủy đơn thất bại");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (ids: number[]) => {
    if (!ids.length) return;
    if (!isManager) {
      toast.error("Chỉ quản lý được xóa đơn");
      return;
    }
    if (!window.confirm(`Xóa ${ids.length} đơn hàng?`)) return;
    setActionId(ids[0] ?? null);
    try {
      await zaloShopService.deleteOrders(ids);
      toast.success("Đã xóa đơn hàng");
      await loadOrders();
      if (detail && ids.includes(detail.id)) setDetail(null);
    } catch {
      toast.error("Xóa đơn thất bại");
    } finally {
      setActionId(null);
    }
  };

  const openEdit = (order: ShopOrder) => {
    setEditOrder(order);
    setEditForm({
      full_name: order.full_name ?? "",
      phone_number: order.phone_number ?? "",
      address: order.address ?? "",
      ward: order.ward ?? "",
      district: order.district ?? "",
      city: order.city ?? "",
      note: order.note ?? "",
      discount: String(order.discount ?? 0),
    });
  };

  const handleSaveEdit = async () => {
    if (!editOrder) return;
    setSavingEdit(true);
    try {
      const items = (editOrder.items ?? []).map((it) => ({
        id: it.id,
        quantity: it.quantity ?? 1,
        price: it.price,
        classify: it.classify,
      }));
      await zaloShopService.updateOrder({
        id_order: editOrder.id,
        full_name: editForm.full_name.trim(),
        phone_number: editForm.phone_number.trim(),
        address: editForm.address.trim(),
        ward: editForm.ward.trim(),
        district: editForm.district.trim(),
        city: editForm.city.trim(),
        note: editForm.note.trim(),
        discount: Number(editForm.discount) || 0,
        items,
      });
      toast.success("Đã cập nhật đơn hàng");
      setEditOrder(null);
      await loadOrders();
    } catch {
      toast.error("Cập nhật đơn thất bại");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleExportCsv = () => {
    if (!orders.length) {
      toast.error("Không có đơn để xuất");
      return;
    }
    const header = [
      "Mã",
      "Người nhận",
      "SĐT",
      "Địa chỉ",
      "Sản phẩm",
      "Số lượng",
      "Đơn giá",
      "Giảm giá",
      "Thành tiền đơn",
      "Ngày đặt",
      "Trạng thái",
    ];
    const rows: string[][] = [];
    for (const order of orders) {
      const statusLabel = orderStatusMeta(order.status).label;
      const items = order.items?.length
        ? order.items
        : [{ title: order.description || "", quantity: 1, price: order.total_amount }];
      items.forEach((item, idx) => {
        rows.push([
          String(order.id),
          order.full_name ?? "",
          order.phone_number ?? "",
          orderAddress(order),
          item.title ?? "",
          String(item.quantity ?? ""),
          String(item.price ?? ""),
          idx === 0 ? String(order.discount ?? 0) : "",
          idx === 0 ? String(order.total_amount ?? "") : "",
          formatDateTime(order.created_at),
          statusLabel,
        ]);
      });
    }
    const csv = [header, ...rows]
      .map((r) => r.map(toCsvCell).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `don-hang-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Đã xuất CSV");
  };

  const statusTabs = useMemo(
    () =>
      [
        { value: "" as const, label: "Tất cả" },
        { value: "2" as const, label: "Chờ xác nhận" },
        { value: "1" as const, label: "Đã xác nhận" },
        { value: "0" as const, label: "Đã hủy" },
      ] as const,
    [],
  );

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden">
      <PageBreadcrumb
        pageTitle="Đơn hàng"
        parents={[{ label: "Cửa hàng", href: "/shop" }]}
      />

      <div
        className={`custom-scrollbar ${adminDataPanelClass} flex min-h-0 flex-1 flex-col overflow-hidden`}
      >
        <div className="mb-4 flex shrink-0 flex-col gap-3 border-b border-gray-100 pb-4 dark:border-gray-800">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
                Quản lý đơn hàng
              </h2>
              <p className="text-xs text-gray-500">
                {count} đơn · status 0 hủy · 1 xác nhận · 2 chờ
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => void loadOrders()}>
                Làm mới
              </Button>
              <Button size="sm" variant="outline" onClick={handleExportCsv}>
                Xuất CSV
              </Button>
              {isManager && selectedIds.length > 0 ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void handleDelete(selectedIds)}
                  className="!text-error-600"
                >
                  Xóa đã chọn ({selectedIds.length})
                </Button>
              ) : null}
              <Link
                href="/shop"
                className="inline-flex min-h-9 items-center text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                ← Cửa hàng
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="flex flex-wrap gap-1.5">
              {statusTabs.map((tab) => (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.value);
                    setPage(1);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    statusFilter === tab.value
                      ? "bg-brand-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {isManager && employees.length > 0 ? (
              <select
                value={employeeFilter === "" ? "" : String(employeeFilter)}
                onChange={(e) => {
                  const v = e.target.value;
                  setEmployeeFilter(v === "" ? "" : Number(v));
                  setPage(1);
                }}
                className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="">Tất cả nhân viên + tôi</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullname || emp.username}
                  </option>
                ))}
              </select>
            ) : null}
            <div className="flex min-w-0 flex-1 gap-2 lg:max-w-md lg:ml-auto">
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm SP / phân loại…"
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={() => {
                  setKeywordApplied(keyword.trim());
                  setPage(1);
                }}
              >
                Tìm
              </Button>
            </div>
          </div>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
          ) : orders.length === 0 ? (
            <p className="py-16 text-center text-sm text-gray-500">
              Chưa có đơn hàng
            </p>
          ) : (
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-white dark:bg-gray-900">
                <tr className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-800">
                  {isManager ? (
                    <th className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={
                          orders.length > 0 &&
                          selectedIds.length === orders.length
                        }
                        onChange={toggleSelectAll}
                      />
                    </th>
                  ) : null}
                  <th className="px-3 py-3 font-medium">Mã</th>
                  {isManager ? (
                    <th className="px-3 py-3 font-medium">Nhân viên</th>
                  ) : null}
                  <th className="px-3 py-3 font-medium">Người nhận</th>
                  <th className="px-3 py-3 font-medium">SĐT</th>
                  <th className="px-3 py-3 font-medium">Thành tiền</th>
                  <th className="px-3 py-3 font-medium">Ngày đặt</th>
                  <th className="px-3 py-3 font-medium">Trạng thái</th>
                  <th className="px-3 py-3 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const meta = orderStatusMeta(order.status);
                  const st = Number(order.status) as ShopOrderStatus;
                  const busy = actionId === order.id;
                  return (
                    <tr
                      key={order.id}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      {isManager ? (
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(order.id)}
                            onChange={() => toggleSelect(order.id)}
                          />
                        </td>
                      ) : null}
                      <td className="px-3 py-3 font-medium text-gray-800 dark:text-white/90">
                        #{order.id}
                      </td>
                      {isManager ? (
                        <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {order.employee
                            ? order.employee_name ||
                              order.employee_username ||
                              `#${order.employee}`
                            : (
                              <span className="text-gray-400">—</span>
                            )}
                        </td>
                      ) : null}
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => setDetail(order)}
                          className="text-left font-medium text-brand-600 hover:underline"
                        >
                          {order.full_name || "—"}
                        </button>
                        <p className="mt-0.5 max-w-[200px] truncate text-xs text-gray-400">
                          {orderAddress(order) || "—"}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
                        {order.phone_number || "—"}
                      </td>
                      <td className="px-3 py-3 font-medium text-brand-600">
                        {formatVnd(order.total_amount)}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-500">
                        {formatDateTime(order.created_at)}
                      </td>
                      <td className="px-3 py-3">
                        <Badge size="sm" color={meta.color}>
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetail(order)}
                            className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                          >
                            Chi tiết
                          </button>
                          {st === 2 ? (
                            <>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void handleConfirm(order)}
                                className="rounded-md bg-brand-500 px-2 py-1 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                              >
                                Nhận đơn
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => openEdit(order)}
                                className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                              >
                                Sửa
                              </button>
                            </>
                          ) : null}
                          {st === 1 ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handleCancel(order)}
                              className="rounded-md border border-error-200 px-2 py-1 text-xs font-medium text-error-600 hover:bg-error-50 disabled:opacity-50"
                            >
                              Hủy
                            </button>
                          ) : null}
                          {st !== 1 && isManager ? (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handleDelete([order.id])}
                              className="rounded-md border border-error-200 px-2 py-1 text-xs font-medium text-error-600 hover:bg-error-50 disabled:opacity-50"
                            >
                              Xóa
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 ? (
          <div className="mt-3 flex shrink-0 items-center justify-between border-t border-gray-100 pt-3 text-sm dark:border-gray-800">
            <span className="text-gray-500">
              Trang {page}/{totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Sau
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Detail modal */}
      <Modal
        isOpen={Boolean(detail)}
        onClose={() => setDetail(null)}
        layer="top"
        className="max-h-[90vh] max-w-3xl overflow-y-auto p-5 sm:p-6"
      >
        {detail ? (
          <>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Đơn hàng #{detail.id}
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-500">Người nhận: </span>
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    {detail.full_name}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">SĐT: </span>
                  {detail.phone_number}
                </p>
                <p>
                  <span className="text-gray-500">Địa chỉ: </span>
                  {orderAddress(detail) || "—"}
                </p>
                {detail.note ? (
                  <p>
                    <span className="text-gray-500">Ghi chú: </span>
                    {detail.note}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-500">Ngày đặt: </span>
                  {formatDateTime(detail.created_at)}
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-gray-500">Trạng thái: </span>
                  <Badge size="sm" color={orderStatusMeta(detail.status).color}>
                    {orderStatusMeta(detail.status).label}
                  </Badge>
                </p>
                {isManager ? (
                  <p>
                    <span className="text-gray-500">Nhân viên: </span>
                    {detail.employee
                      ? detail.employee_name ||
                        detail.employee_username ||
                        `#${detail.employee}`
                      : "— (đơn quản lý / không gắn NV)"}
                  </p>
                ) : null}
                <p>
                  <span className="text-gray-500">Tin đặt hàng Zalo: </span>
                  {msgFlag(detail.order_successful_message)}
                </p>
                <p>
                  <span className="text-gray-500">Tin xác nhận Zalo: </span>
                  {msgFlag(detail.confirm_message_successful)}
                </p>
                <p className="text-base font-semibold text-brand-600">
                  Tổng: {formatVnd(detail.total_amount)}
                  {Number(detail.discount) > 0
                    ? ` (giảm ${formatVnd(detail.discount)})`
                    : ""}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">
                Sản phẩm
              </h4>
              {(detail.items ?? []).length === 0 ? (
                <p className="text-sm text-gray-500">
                  {detail.description || "Không có chi tiết sản phẩm"}
                </p>
              ) : (
                <ul className="space-y-3">
                  {detail.items!.map((item) => (
                    <li
                      key={item.id}
                      className="flex gap-3 rounded-xl border border-gray-100 p-3 dark:border-gray-800"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                        {item.image ? (
                          <Image
                            src={shopImageUrl(item.image)}
                            alt=""
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.classify}
                          {item.options?.length
                            ? ` · ${item.options
                                .map((o) => `${o.name}: ${o.value}`)
                                .join(", ")}`
                            : ""}
                        </p>
                        <p className="mt-1 text-sm text-brand-600">
                          {item.quantity} × {formatVnd(item.price)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              {Number(detail.status) === 2 ? (
                <Button
                  size="sm"
                  onClick={() => void handleConfirm(detail)}
                  disabled={actionId === detail.id}
                >
                  Nhận đơn
                </Button>
              ) : null}
              {Number(detail.status) === 1 ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void handleCancel(detail)}
                  disabled={actionId === detail.id}
                >
                  Hủy đơn
                </Button>
              ) : null}
              <Button size="sm" variant="outline" onClick={() => setDetail(null)}>
                Đóng
              </Button>
            </div>
          </>
        ) : null}
      </Modal>

      {/* Edit pending order */}
      <Modal
        isOpen={Boolean(editOrder)}
        onClose={() => setEditOrder(null)}
        layer="top"
        className="max-w-lg p-5 sm:p-6"
      >
        {editOrder ? (
          <>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Sửa đơn #{editOrder.id}
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Chỉ sửa khi đơn còn chờ xác nhận
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["full_name", "Họ tên"],
                  ["phone_number", "SĐT"],
                  ["address", "Địa chỉ"],
                  ["ward", "Phường/Xã"],
                  ["district", "Quận/Huyện"],
                  ["city", "Tỉnh/TP"],
                  ["discount", "Giảm giá (₫)"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className={key === "address" ? "sm:col-span-2" : ""}>
                  <label className="mb-1 block text-xs text-gray-500">{label}</label>
                  <Input
                    value={editForm[key]}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, [key]: e.target.value }))
                    }
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-gray-500">Ghi chú</label>
                <textarea
                  value={editForm.note}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, note: e.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditOrder(null)}
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={() => void handleSaveEdit()}
                disabled={savingEdit}
              >
                {savingEdit ? "Đang lưu…" : "Lưu"}
              </Button>
            </div>
          </>
        ) : null}
      </Modal>
    </div>
  );
}
