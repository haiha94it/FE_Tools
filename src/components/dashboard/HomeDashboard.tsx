"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import { APP_NAME } from "@/constants/brand";
import { useAuthStore } from "@/stores/use-auth-store";

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("vi-VN");
  } catch {
    return value;
  }
}

export default function HomeDashboard() {
  const user = useAuthStore((s) => s.user);
  const isCareReady = useAuthStore((s) => s.isCareReady);

  return (
    <div>
      <PageBreadCrumb pageTitle="Trang chủ" />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-r from-brand-500 to-brand-700 p-6 text-white md:p-8 dark:border-gray-800">
            <p className="text-sm text-white/80">Xin chào,</p>
            <h2 className="mt-1 text-2xl font-semibold md:text-3xl">
              {user?.name ?? user?.username ?? "Quản trị viên"}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/80">
              Chào mừng đến {APP_NAME} — trung tâm quản lý tài khoản, tin nhắn
              và chiến dịch.
            </p>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500 dark:text-gray-400">Tài khoản</p>
            <p className="mt-2 font-semibold text-gray-800 dark:text-white/90">
              {user?.username ?? "—"}
            </p>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
            <p className="mt-2 truncate font-semibold text-gray-800 dark:text-white/90">
              {user?.email || "—"}
            </p>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500 dark:text-gray-400">Hạn sử dụng</p>
            <p className="mt-2 font-semibold text-gray-800 dark:text-white/90">
              {formatDate(user?.expirationDate)}
            </p>
          </div>
        </div>

        <div className="col-span-12 sm:col-span-6 xl:col-span-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-500 dark:text-gray-400">Care API</p>
            <p
              className={`mt-2 font-semibold ${
                isCareReady ? "text-success-600" : "text-warning-600"
              }`}
            >
              {isCareReady ? "Đã kết nối" : "Chưa sẵn sàng"}
            </p>
          </div>
        </div>

        <div className="col-span-12">
          <ComponentCard
            title="Bắt đầu"
            desc="Các module Zalo sẽ được thêm vào sidebar khi triển khai"
          >
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                Tài khoản Zalo — quản lý tài khoản đã kết nối
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                Tin nhắn — hộp thư đa kênh Zalo
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                Nhóm &amp; chiến dịch — gửi tin, quản lý nhóm
              </li>
            </ul>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}