"use client";

import Input from "@/components/form/input/InputField";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Button from "@/components/ui/button/Button";
import Image from "next/image";
import { Modal } from "@/components/ui/modal";
import { confirm } from "@/lib/confirm";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { zaloUserAdminService } from "@/services/zalo-user-admin.service";
import type { CheckedZaloAccount } from "@/types/zalo-user-admin";
import { useState } from "react";

interface CheckAccountModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CheckAccountModal({ open, onClose }: CheckAccountModalProps) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [results, setResults] = useState<CheckedZaloAccount[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    setLoading(true);
    try {
      const data = await zaloUserAdminService.checkAccounts(phone, name);
      setResults(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: CheckedZaloAccount) => {
    if (
      !(await confirm({
        title: "Xóa tài khoản Zalo",
        message: `Xóa tài khoản "${item.name ?? item.phone_number}" khỏi hệ thống?`,
        confirmText: "Xóa",
        variant: "danger",
      }))
    ) {
      return;
    }
    try {
      await zaloUserAdminService.deleteCheckedAccount(item.id);
      setResults((prev) => prev.filter((row) => row.id !== item.id));
      toast.success("Đã xóa tài khoản.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-2xl p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Kiểm tra tài khoản trong hệ thống
      </h3>

      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          placeholder="Số điện thoại"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Input placeholder="Tên" value={name} onChange={(e) => setName(e.target.value)} />
        <Button onClick={() => void handleCheck()} disabled={loading}>
          {loading ? "Đang kiểm tra..." : "Kiểm tra"}
        </Button>
      </div>

      <div className="space-y-3">
        {results.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-white/[0.02]"
          >
            <div className="mb-3 flex items-center justify-between gap-3 border-b border-gray-200 pb-3 dark:border-gray-700">
              <div className="flex items-center gap-3">
                {item.avatar ? (
                  <Image
                    src={item.avatar}
                    alt={item.name ?? "avatar"}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <AvatarText name={item.name ?? "?"} size="md" />
                )}
                <p className="font-semibold text-gray-800 dark:text-white/90">
                  {item.name ?? "—"}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="!text-error-600 !ring-error-300"
                onClick={() => void handleDelete(item)}
              >
                Xóa
              </Button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Số điện thoại: {item.phone_number ?? "—"}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Checkpoint: {item.checkpoint ? "Chết" : "Sống"}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Proxy: {item.proxy?.proxy ?? "N/A"}{" "}
              <span className={item.proxy?.status ? "text-success-600" : "text-error-600"}>
                {item.proxy?.status ? "- Sống" : "- Chết"}
              </span>
            </p>
          </div>
        ))}
      </div>
    </Modal>
  );
}