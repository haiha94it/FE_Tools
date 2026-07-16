"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Badge from "@/components/ui/badge/Badge";
import { adminDataPanelClass } from "@/components/ui/table/ScrollableTableContainer";
import { formatVnd } from "@/lib/shop-utils";
import { zaloShopService } from "@/services/zalo-shop.service";
import type { ShopOrder } from "@/types/zalo-shop";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ShopOrdersView() {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const response = await zaloShopService.listOrders({ pageSize: 50 });
        setOrders(response.results);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden">
      <PageBreadcrumb
        pageTitle="Đơn hàng"
        parents={[{ label: "Cửa hàng", href: "/shop" }]}
      />

      <div className={`custom-scrollbar ${adminDataPanelClass} overflow-y-auto overscroll-contain`}>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Danh sách đơn hàng
          </h2>
          <Link
            href="/shop"
            className="inline-flex min-h-11 touch-manipulation items-center text-sm font-medium text-brand-600 hover:text-brand-700 sm:min-h-0"
          >
            ← Quay lại cửa hàng
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-500">Chưa có đơn hàng</p>
        ) : (
          <div className="custom-scrollbar overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-800">
                  <th className="px-3 py-3 font-medium">Mã</th>
                  <th className="px-3 py-3 font-medium">Khách hàng</th>
                  <th className="px-3 py-3 font-medium">SĐT</th>
                  <th className="px-3 py-3 font-medium">Tổng tiền</th>
                  <th className="px-3 py-3 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td className="px-3 py-3 font-medium text-gray-800 dark:text-white/90">
                      #{order.id}
                    </td>
                    <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
                      {order.full_name || "—"}
                    </td>
                    <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
                      {order.phone_number || "—"}
                    </td>
                    <td className="px-3 py-3 font-medium text-brand-600">
                      {formatVnd(order.total_amount)}
                    </td>
                    <td className="px-3 py-3">
                      <Badge size="sm" color="light">
                        {String(order.status ?? "Mới")}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}