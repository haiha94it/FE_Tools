"use client";

import { API_CATALOG } from "@/config/api";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/use-auth-store";
import { useEffect, useState } from "react";

type Analytics = {
  professions: number;
  tools: number;
  usage_24h: number;
  usage_7d: number;
  usage_total: number;
  top_tools: { slug: string; name: string; usage_count: number }[];
};

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await api.get<Analytics>(API_CATALOG.ADMIN_ANALYTICS);
        setStats(res.data);
      } catch {
        setError("Chưa lấy được analytics (cần quyền admin).");
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Tổng quan
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Xin chào {user?.name ?? user?.username} — bảng điều khiển{" "}
          <strong>Công cụ xanh</strong>
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-warning-50 px-4 py-3 text-sm text-warning-700">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Ngành nghề", value: stats?.professions ?? "—" },
          { label: "Tools", value: stats?.tools ?? "—" },
          { label: "Lượt dùng 24h", value: stats?.usage_24h ?? "—" },
          { label: "Lượt dùng 7 ngày", value: stats?.usage_7d ?? "—" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          Top tools
        </h2>
        {!stats?.top_tools?.length ? (
          <p className="mt-3 text-sm text-gray-500">
            Chưa có dữ liệu usage. Thêm tool sau khi hệ thống ổn định.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100 dark:divide-gray-800">
            {stats.top_tools.map((t) => (
              <li
                key={t.slug}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span>{t.name}</span>
                <span className="text-gray-500">{t.usage_count} lượt</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
