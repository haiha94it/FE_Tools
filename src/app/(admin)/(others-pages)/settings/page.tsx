"use client";

import { API_SYSTEM } from "@/config/api";
import api from "@/lib/axios";
import { useEffect, useState } from "react";

type BankItem = {
  code: string;
  name: string;
  short_name: string;
  bin: string;
};

export default function SettingsPage() {
  const [siteName, setSiteName] = useState("Công Cụ Nghề");
  const [siteDomain, setSiteDomain] = useState("tools.dahangsi.com");
  const [contactEmail, setContactEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [bankMsg, setBankMsg] = useState<string | null>(null);
  const [publicEnabled, setPublicEnabled] = useState(true);
  const [publicStatusLoading, setPublicStatusLoading] = useState(true);
  const [publicStatusSaving, setPublicStatusSaving] = useState(false);

  // VietQR Admin Banking State
  const [bankName, setBankName] = useState("MBBank");
  const [bankBin, setBankBin] = useState("970422");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [banksList, setBanksList] = useState<BankItem[]>([]);
  const [savingBanking, setSavingBanking] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [res, publicStatusRes, banksRes] = await Promise.allSettled([
          api.get<{
            site_name?: string;
            site_domain?: string;
            contact_email?: string;
            bank_name?: string;
            bank_bin?: string;
            bank_account_number?: string;
            bank_account_name?: string;
          }>(API_SYSTEM.GET),
          api.get<{ enabled: boolean }>(API_SYSTEM.PUBLIC_UI_STATUS),
          api.get<BankItem[]>(API_SYSTEM.BANKS),
        ]);

        if (res.status === "fulfilled" && res.value.data) {
          const d = res.value.data;
          if (d.site_name) setSiteName(d.site_name);
          if (d.site_domain) setSiteDomain(d.site_domain);
          if (d.contact_email) setContactEmail(d.contact_email);
          if (d.bank_name) setBankName(d.bank_name);
          if (d.bank_bin) setBankBin(d.bank_bin);
          if (d.bank_account_number) setBankAccountNumber(d.bank_account_number);
          if (d.bank_account_name) setBankAccountName(d.bank_account_name);
        }

        if (publicStatusRes.status === "fulfilled" && publicStatusRes.value.data) {
          setPublicEnabled(publicStatusRes.value.data.enabled !== false);
        }

        if (banksRes.status === "fulfilled" && Array.isArray(banksRes.value.data)) {
          setBanksList(banksRes.value.data);
        }
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
      setMsg("Đã lưu cài đặt chung.");
    } catch {
      setMsg("Lưu thất bại.");
    }
  };

  const saveBanking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankMsg(null);
    setSavingBanking(true);
    try {
      await api.post(API_SYSTEM.EDIT, {
        bank_name: bankName,
        bank_bin: bankBin,
        bank_account_number: bankAccountNumber.trim(),
        bank_account_name: bankAccountName.trim().toUpperCase(),
      });
      setBankMsg("Đã lưu thông tin tài khoản nhận tiền VietQR của Tổng Admin.");
    } catch {
      setBankMsg("Lưu thông tin ngân hàng thất bại.");
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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Cài đặt hệ thống
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Công Cụ Nghề · domain tools.dahangsi.com
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form 1: Cài đặt site chung */}
        <form
          onSubmit={save}
          className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 shadow-2xs"
        >
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
            <span className="text-lg">⚙️</span>
            <h2 className="font-semibold text-gray-900 dark:text-white">Cấu hình Site</h2>
          </div>

          <label className="block text-sm">
            <span className="text-gray-600 dark:text-gray-300">Tên site</span>
            <input
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600 dark:text-gray-300">Domain</span>
            <input
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              value={siteDomain}
              onChange={(e) => setSiteDomain(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600 dark:text-gray-300">Email liên hệ</span>
            <input
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition"
          >
            Lưu cài đặt site
          </button>
          {msg && <p className="text-sm font-medium text-success-600 dark:text-success-400">{msg}</p>}
        </form>

        {/* Form 2: Cài đặt VietQR Tổng Admin */}
        <form
          onSubmit={saveBanking}
          className="space-y-4 rounded-2xl border border-blue-200/80 bg-linear-to-b from-blue-50/40 via-white to-white p-5 dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 shadow-2xs"
        >
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">💳</span>
              <h2 className="font-semibold text-gray-900 dark:text-white">Tài khoản VietQR Tổng Admin</h2>
            </div>
            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              EMVCo Chuẩn
            </span>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            STK này nhận tiền từ khách hàng mua trực tiếp từ Admin và các đơn nạp ví Combo của Đại lý (<code className="font-mono text-brand-600">AGW_XXXXXX</code>).
          </p>

          <label className="block text-sm">
            <span className="text-gray-600 dark:text-gray-300 font-medium">Ngân hàng nhận tiền</span>
            <select
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
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
            <span className="text-gray-600 dark:text-gray-300 font-medium">Số tài khoản (STK)</span>
            <input
              type="text"
              placeholder="Ví dụ: 0988123456"
              className="mt-1 w-full font-mono rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
              required
            />
          </label>

          <label className="block text-sm">
            <span className="text-gray-600 dark:text-gray-300 font-medium">Tên chủ tài khoản (Viết hoa không dấu)</span>
            <input
              type="text"
              placeholder="Ví dụ: NGUYEN VAN A"
              className="mt-1 w-full uppercase rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              value={bankAccountName}
              onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
            />
          </label>

          <button
            type="submit"
            disabled={savingBanking}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
          >
            {savingBanking ? "Đang lưu..." : "💾 Lưu thông tin nhận tiền"}
          </button>
          {bankMsg && (
            <p className={`text-sm font-medium ${bankMsg.includes("thất bại") ? "text-error-600" : "text-success-600 dark:text-success-400"}`}>
              {bankMsg}
            </p>
          )}
        </form>
      </div>

      <section className="max-w-md rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 shadow-2xs">
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
