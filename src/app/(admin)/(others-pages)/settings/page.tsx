"use client";

import { API_SYSTEM } from "@/config/api";
import api from "@/lib/axios";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [siteName, setSiteName] = useState("Công cụ xanh");
  const [siteDomain, setSiteDomain] = useState("tools.dahangsi.com");
  const [contactEmail, setContactEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [publicEnabled, setPublicEnabled] = useState(true);
  const [publicStatusLoading, setPublicStatusLoading] = useState(true);
  const [publicStatusSaving, setPublicStatusSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [res, publicStatusRes] = await Promise.all([
          api.get<{
            site_name?: string;
            site_domain?: string;
            contact_email?: string;
          }>(API_SYSTEM.GET),
          api.get<{ enabled: boolean }>(API_SYSTEM.PUBLIC_UI_STATUS),
        ]);
        const d = res.data || {};
        if (d.site_name) setSiteName(d.site_name);
        if (d.site_domain) setSiteDomain(d.site_domain);
        if (d.contact_email) setContactEmail(d.contact_email);
        setPublicEnabled(publicStatusRes.data.enabled !== false);
      } catch {
        /* empty system ok */
      } finally {
        setPublicStatusLoading(false);
      }
    })();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await api.post(API_SYSTEM.EDIT, {
        site_name: siteName,
        site_domain: siteDomain,
        contact_email: contactEmail,
      });
      setMsg("Đã lưu cài đặt.");
    } catch {
      setMsg("Lưu thất bại.");
    }
  };

  const togglePublicUi = async () => {
    const nextEnabled = !publicEnabled;
    setPublicStatusSaving(true);
    setMsg(null);
    try {
      const response = await api.post<{ enabled: boolean }>(
        API_SYSTEM.PUBLIC_UI_STATUS,
        { enabled: nextEnabled },
      );
      setPublicEnabled(response.data.enabled);
      setMsg(
        response.data.enabled
          ? "Đã hiển thị giao diện public."
          : "Đã ẩn giao diện public.",
      );
    } catch {
      setMsg("Không thể đổi trạng thái giao diện public.");
    } finally {
      setPublicStatusSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Cài đặt hệ thống
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Brand tạm: Công cụ xanh · domain tools.dahangsi.com
        </p>
      </div>

      <form
        onSubmit={save}
        className="max-w-lg space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
      >
        <label className="block text-sm">
          <span className="text-gray-600 dark:text-gray-300">Tên site</span>
          <input
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700 dark:bg-gray-950"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-gray-600 dark:text-gray-300">Domain</span>
          <input
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700 dark:bg-gray-950"
            value={siteDomain}
            onChange={(e) => setSiteDomain(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-gray-600 dark:text-gray-300">Email liên hệ</span>
          <input
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700 dark:bg-gray-950"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
        >
          Lưu
        </button>
        {msg && <p className="text-sm text-gray-600">{msg}</p>}
      </form>

      <section className="max-w-lg rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Giao diện public</h2>
            <p className="mt-1 text-sm text-gray-500">
              {publicStatusLoading
                ? "Đang đọc trạng thái…"
                : publicEnabled
                  ? "Đang hiện"
                  : "Đang ẩn"}
            </p>
          </div>
          <button
            type="button"
            onClick={togglePublicUi}
            disabled={publicStatusLoading || publicStatusSaving}
            className={`min-h-11 rounded-lg px-4 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${publicEnabled ? "bg-error-600 hover:bg-error-700" : "bg-success-600 hover:bg-success-700"}`}
          >
            {publicStatusSaving
              ? "Đang cập nhật…"
              : publicEnabled
                ? "Ẩn giao diện public"
                : "Hiển thị giao diện public"}
          </button>
        </div>
      </section>
    </div>
  );
}
