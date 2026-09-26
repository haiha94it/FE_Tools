"use client";

import { API_SYSTEM } from "@/config/api";
import api from "@/lib/axios";
import { useEffect, useRef, useState } from "react";

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

  // Kênh Hỗ Trợ & Ảnh QR Zalo Admin State (Độc lập 100%)
  const [adminHotline, setAdminHotline] = useState("");
  const [adminZaloLink, setAdminZaloLink] = useState("");
  const [adminTelegramLink, setAdminTelegramLink] = useState("");
  const [currentQrUrl, setCurrentQrUrl] = useState("");
  const [currentQrHash, setCurrentQrHash] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [supportMsg, setSupportMsg] = useState<string | null>(null);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [savingSupport, setSavingSupport] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            admin_hotline?: string;
            admin_zalo_link?: string;
            admin_telegram_link?: string;
            admin_zalo_qr_url?: string;
            admin_zalo_qr_hash?: string;
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
          // Kênh Hỗ Trợ & Ảnh QR Zalo Admin
          if (d.admin_hotline) setAdminHotline(d.admin_hotline);
          if (d.admin_zalo_link) setAdminZaloLink(d.admin_zalo_link);
          if (d.admin_telegram_link) setAdminTelegramLink(d.admin_telegram_link);
          if (d.admin_zalo_qr_url) setCurrentQrUrl(d.admin_zalo_qr_url);
          if (d.admin_zalo_qr_hash) setCurrentQrHash(d.admin_zalo_qr_hash);
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

  const handleFileSelect = (file: File | null) => {
    setSupportError(null);
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    const validExtensions = [".png", ".jpg", ".jpeg", ".webp"];
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
      setSupportError("Định dạng tệp không hợp lệ. Vui lòng chọn ảnh .png, .jpg, .jpeg hoặc .webp.");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setSupportError(`Kích thước tệp quá lớn (${(file.size / (1024 * 1024)).toFixed(1)}MB). Vui lòng chọn tệp nhỏ hơn 5MB.`);
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const cancelSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setSupportError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const saveSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupportMsg(null);
    setSupportError(null);
    setSavingSupport(true);

    try {
      const formData = new FormData();
      formData.append("admin_hotline", adminHotline.trim());
      formData.append("admin_zalo_link", adminZaloLink.trim());
      formData.append("admin_telegram_link", adminTelegramLink.trim());
      if (selectedFile) {
        formData.append("admin_zalo_qr_image", selectedFile);
      }

      const response = await api.post<{
        admin_hotline?: string;
        admin_zalo_link?: string;
        admin_telegram_link?: string;
        admin_zalo_qr_url?: string;
        admin_zalo_qr_hash?: string;
      }>(API_SYSTEM.SUPPORT, formData);

      if (response.data) {
        if (response.data.admin_hotline !== undefined) setAdminHotline(response.data.admin_hotline);
        if (response.data.admin_zalo_link !== undefined) setAdminZaloLink(response.data.admin_zalo_link);
        if (response.data.admin_telegram_link !== undefined) setAdminTelegramLink(response.data.admin_telegram_link);
        if (response.data.admin_zalo_qr_url !== undefined) setCurrentQrUrl(response.data.admin_zalo_qr_url);
        if (response.data.admin_zalo_qr_hash !== undefined) setCurrentQrHash(response.data.admin_zalo_qr_hash);
      }

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setSupportMsg("Đã lưu kênh hỗ trợ và cập nhật ảnh mã QR Zalo thành công.");
    } catch {
      setSupportError("Lưu kênh hỗ trợ thất bại. Vui lòng thử lại.");
    } finally {
      setSavingSupport(false);
    }
  };

  const removeQrImage = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ảnh mã QR Zalo hiện tại trên hệ thống?")) {
      return;
    }

    setSupportMsg(null);
    setSupportError(null);
    setSavingSupport(true);

    try {
      const formData = new FormData();
      formData.append("admin_hotline", adminHotline.trim());
      formData.append("admin_zalo_link", adminZaloLink.trim());
      formData.append("admin_telegram_link", adminTelegramLink.trim());
      formData.append("remove_zalo_qr", "true");

      await api.post(API_SYSTEM.SUPPORT, formData);

      setCurrentQrUrl("");
      setCurrentQrHash("");
      cancelSelectedFile();
      setSupportMsg("Đã xóa ảnh mã QR Zalo thành công.");
    } catch {
      setSupportError("Xóa ảnh mã QR Zalo thất bại. Vui lòng thử lại.");
    } finally {
      setSavingSupport(false);
    }
  };

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

      {/* Form 3: Kênh Hỗ Trợ & Ảnh QR Zalo Admin (Độc lập 100%) */}
      <form
        onSubmit={saveSupport}
        className="rounded-2xl border border-emerald-200/80 bg-linear-to-b from-emerald-50/40 via-white to-white p-5 dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 shadow-2xs space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">💬</span>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Kênh Hỗ Trợ & Ảnh Mã QR Zalo Admin
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Cấu hình thông tin liên hệ và ảnh mã QR Zalo đồng bộ xuống ứng dụng máy tính (Desktop App).
              </p>
            </div>
          </div>
          {currentQrHash && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Smart Cache Hash: <code className="font-mono">{currentQrHash}</code>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cột trái: Các kênh liên lạc */}
          <div className="lg:col-span-7 space-y-4">
            <label className="block text-sm">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Số điện thoại Hotline Admin</span>
              <input
                type="text"
                placeholder="Ví dụ: 0911223344"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                value={adminHotline}
                onChange={(e) => setAdminHotline(e.target.value)}
              />
              <span className="text-xs text-gray-400 mt-1 block">
                Số hotline chăm sóc khách hàng và hỗ trợ kỹ thuật trên Desktop App.
              </span>
            </label>

            <label className="block text-sm">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Đường dẫn / SĐT Zalo hỗ trợ</span>
              <input
                type="text"
                placeholder="Ví dụ: https://zalo.me/0911223344 hoặc 0911223344"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                value={adminZaloLink}
                onChange={(e) => setAdminZaloLink(e.target.value)}
              />
              <span className="text-xs text-gray-400 mt-1 block">
                Khi khách hàng bấm nút &quot;Liên Hệ Hỗ Trợ Qua Zalo&quot;, liên kết này sẽ được mở trực tiếp.
              </span>
            </label>

            <label className="block text-sm">
              <span className="text-gray-700 dark:text-gray-300 font-medium">Đường dẫn Telegram Admin (Tùy chọn)</span>
              <input
                type="text"
                placeholder="Ví dụ: https://t.me/admin_tools"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                value={adminTelegramLink}
                onChange={(e) => setAdminTelegramLink(e.target.value)}
              />
              <span className="text-xs text-gray-400 mt-1 block">
                Kênh liên hệ phụ qua Telegram (nếu có).
              </span>
            </label>
          </div>

          {/* Cột phải: Upload file & Live Preview */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Ảnh Mã QR Zalo (Tệp ảnh thật)
            </span>

            {/* Dropzone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-all ${
                dragActive
                  ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                  : "border-gray-300 hover:border-emerald-400 dark:border-gray-700 dark:hover:border-emerald-500"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
              <div className="flex flex-col items-center justify-center space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                <span className="text-2xl">📷</span>
                <p className="font-medium text-gray-700 dark:text-gray-200">
                  Kéo thả ảnh QR vào đây hoặc <span className="text-emerald-600 underline">chọn từ máy</span>
                </p>
                <p className="text-[11px] text-gray-400">
                  Hỗ trợ PNG, JPG, JPEG, WEBP (Tối đa 5MB)
                </p>
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-3 flex items-center gap-4 min-h-[110px]">
              {previewUrl ? (
                <>
                  <div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-900 p-1 flex items-center justify-center shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Ảnh xem trước QR"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-xs space-y-1">
                    <span className="inline-block px-2 py-0.5 rounded font-semibold text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Ảnh mới chọn (Chưa lưu)
                    </span>
                    <p className="font-medium text-gray-800 dark:text-gray-200 truncate">
                      {selectedFile?.name}
                    </p>
                    <p className="text-gray-400 text-[11px]">
                      Dung lượng: {selectedFile ? (selectedFile.size / 1024).toFixed(1) : 0} KB
                    </p>
                    <button
                      type="button"
                      onClick={cancelSelectedFile}
                      className="text-error-600 hover:underline text-[11px] font-medium cursor-pointer"
                    >
                      Hủy chọn ảnh này
                    </button>
                  </div>
                </>
              ) : currentQrUrl ? (
                <>
                  <div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1 flex items-center justify-center shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentQrUrl}
                      alt="Mã QR Zalo Admin hiện tại"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-xs space-y-1">
                    <span className="inline-block px-2 py-0.5 rounded font-semibold text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Đang áp dụng trên hệ thống
                    </span>
                    <p className="text-gray-500 dark:text-gray-400 text-[11px] truncate">
                      {currentQrUrl.split("/").pop()}
                    </p>
                    {currentQrHash && (
                      <p className="text-gray-400 text-[10px] font-mono">
                        Hash: {currentQrHash}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={removeQrImage}
                      disabled={savingSupport}
                      className="text-error-600 hover:text-error-700 text-[11px] font-medium flex items-center gap-1 hover:underline disabled:opacity-50 cursor-pointer"
                    >
                      🗑️ Xóa ảnh QR hiện tại
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full text-center py-4 text-xs text-gray-400">
                  <span className="text-2xl block mb-1 opacity-50">📱</span>
                  Chưa có ảnh mã QR Zalo Admin.
                  <br />
                  <span className="text-[11px] text-gray-500">
                    Ứng dụng máy tính sẽ hiển thị thông tin dạng chữ.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Thông báo lỗi / thành công */}
        {supportError && (
          <div className="rounded-lg bg-error-50 dark:bg-error-950/40 p-3 text-sm font-medium text-error-700 dark:text-error-400 border border-error-200 dark:border-error-900 flex items-center gap-2">
            <span>⚠️</span>
            <span>{supportError}</span>
          </div>
        )}
        {supportMsg && (
          <div className="rounded-lg bg-success-50 dark:bg-success-950/40 p-3 text-sm font-medium text-success-700 dark:text-success-400 border border-success-200 dark:border-success-900 flex items-center gap-2">
            <span>✅</span>
            <span>{supportMsg}</span>
          </div>
        )}

        {/* Nút hành động */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={savingSupport}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xs"
          >
            {savingSupport ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang lưu cấu hình...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Lưu Kênh Hỗ Trợ & QR</span>
              </>
            )}
          </button>
        </div>
      </form>

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
