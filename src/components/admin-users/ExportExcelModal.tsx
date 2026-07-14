"use client";

import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { EXPORT_PERMISSION_OPTIONS } from "@/lib/zalo-user-admin-utils";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { zaloUserAdminService } from "@/services/zalo-user-admin.service";
import { useState } from "react";

interface ExportExcelModalProps {
  open: boolean;
  onClose: () => void;
}

function toInputDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function downloadCsv(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) return;
  const headers = [
    "Họ tên",
    "Tên đăng nhập",
    "Mật khẩu",
    "Số điện thoại",
    "Email",
    "Quyền hiện tại",
    "Số dư coin",
    "Giới hạn TK",
    "Ngày tạo",
    "Ngày hết hạn",
  ];
  const lines = [
    headers.join(","),
    ...rows.map((item) =>
      [
        item.fullname,
        item.username,
        item.raw_password,
        item.phone_number,
        item.mail,
        item.permission,
        item.coin_balance,
        item.account_limit,
        item.created_at,
        item.expiration_date,
      ]
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(","),
    ),
  ];
  const blob = new Blob([`\uFEFF${lines.join("\n")}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ExportExcelModal({ open, onClose }: ExportExcelModalProps) {
  const [permission, setPermission] = useState("is_manager");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState(toInputDate(new Date()));
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast.error("Vui lòng chọn đầy đủ khoảng thời gian.");
      return;
    }
    setLoading(true);
    try {
      const data = await zaloUserAdminService.exportUsers({
        permission,
        startDate,
        endDate,
      });
      if (!data.length) {
        toast.error("Không tìm thấy dữ liệu phù hợp trong khoảng thời gian này.");
        return;
      }
      downloadCsv(data, `Export_${permission}_${startDate}.csv`);
      toast.success("Xuất file thành công.");
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-md p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Xuất dữ liệu Excel
      </h3>

      <div className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Loại tài khoản
          </span>
          <Select
            options={EXPORT_PERMISSION_OPTIONS.map((item) => ({
              value: item.value,
              label: item.label,
            }))}
            value={permission}
            onChange={setPermission}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Từ ngày</span>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Đến ngày</span>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Hủy
        </Button>
        <Button onClick={() => void handleExport()} disabled={loading}>
          {loading ? "Đang xử lý..." : "Xuất file"}
        </Button>
      </div>
    </Modal>
  );
}