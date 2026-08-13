"use client";

import { API_SYSTEM } from "@/config/api";
import api from "@/lib/axios";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [siteName, setSiteName] = useState("Công cụ xanh");
  const [siteDomain, setSiteDomain] = useState("tools.dahangsi.com");
  const [contactEmail, setContactEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await api.get<{
          site_name?: string;
          site_domain?: string;
          contact_email?: string;
        }>(API_SYSTEM.GET);
        const d = res.data || {};
        if (d.site_name) setSiteName(d.site_name);
        if (d.site_domain) setSiteDomain(d.site_domain);
        if (d.contact_email) setContactEmail(d.contact_email);
      } catch {
        /* empty system ok */
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
    </div>
  );
}
