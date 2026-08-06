"use client";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/lib/toast";
import { useZaloShopAdminStore } from "@/stores/use-zalo-shop-admin-store";
import { useEffect, useState } from "react";

/** CNAME trỏ về gateway Shop (đồng bộ Care1 ManageDomain). */
const CNAME_TARGET = "gate.chotnhanh.vn";

interface ShopDomainSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function normalizeDomainInput(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\s+/g, "");
}

export default function ShopDomainSettingsModal({
  isOpen,
  onClose,
}: ShopDomainSettingsModalProps) {
  const domain = useZaloShopAdminStore((s) => s.domain);
  const saveDomain = useZaloShopAdminStore((s) => s.saveDomain);
  const isLoading = useZaloShopAdminStore((s) => s.isLoading);

  const [value, setValue] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setValue(domain ?? "");
      setGuideOpen(!domain);
    }
  }, [isOpen, domain]);

  const handleCopyCname = async () => {
    try {
      await navigator.clipboard.writeText(CNAME_TARGET);
      toast.success("Đã sao chép CNAME");
    } catch {
      toast.error("Không sao chép được");
    }
  };

  const handleSave = async () => {
    const next = normalizeDomainInput(value);
    if (!next) {
      toast.error("Vui lòng nhập tên miền");
      return;
    }
    if (next.includes("zalo")) {
      toast.error("Vui lòng không đặt tên miền có từ khóa Zalo");
      return;
    }

    setSaving(true);
    try {
      await saveDomain(next);
      toast.success("Cập nhật tên miền thành công");
      onClose();
    } catch {
      // Lỗi đã toast qua runAsyncAction / handleApiError
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      layer="top"
      className="max-w-2xl p-5 sm:p-6"
    >
      <div className="custom-scrollbar max-h-[min(80dvh,40rem)] overflow-y-auto overscroll-contain pr-0.5">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Cấu hình tên miền
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Gắn domain riêng cho cửa hàng (Shop) và link chia sẻ sản phẩm. Trỏ DNS
          CNAME về{" "}
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {CNAME_TARGET}
          </span>{" "}
          trước khi cập nhật trên hệ thống.
        </p>

        <div className="mt-4 rounded-xl border border-dashed border-brand-200 bg-brand-50/60 p-4 dark:border-brand-800 dark:bg-brand-500/10">
          <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            <li>Vào trang quản lý DNS nơi bạn mua/đăng ký domain.</li>
            <li>
              <span>
                Tạo bản ghi{" "}
                <span className="font-semibold text-error-600">CNAME</span> →
                giá trị:
              </span>
              <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg border border-brand-200 bg-white px-3 py-2 font-mono text-sm font-semibold text-gray-800 dark:border-brand-800 dark:bg-gray-900 dark:text-white/90 sm:flex-none">
                  {CNAME_TARGET}
                </code>
                <button
                  type="button"
                  onClick={() => void handleCopyCname()}
                  className="inline-flex min-h-10 shrink-0 touch-manipulation items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-brand-600"
                >
                  <CopyIcon />
                  Sao chép
                </button>
              </div>
            </li>
            <li>
              Đợi DNS cập nhật, rồi nhập domain bên dưới và bấm Cập nhật.
            </li>
          </ol>
          <button
            type="button"
            onClick={() => setGuideOpen((v) => !v)}
            className="mt-3 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            {guideOpen ? "Thu gọn hướng dẫn chi tiết" : "Xem hướng dẫn chi tiết"}
          </button>

          {guideOpen ? (
            <div className="mt-3 space-y-3 border-t border-brand-200/70 pt-3 text-sm leading-relaxed text-gray-600 dark:border-brand-800/60 dark:text-gray-400">
              <div>
                <p className="font-medium text-gray-800 dark:text-white/90">
                  Domain chính (vd: shopthoitrang.com)
                </p>
                <ul className="mt-1 list-inside list-disc space-y-0.5">
                  <li>
                    Host: <code className="rounded bg-white/80 px-1 dark:bg-gray-900">@</code>
                  </li>
                  <li>
                    Loại: <span className="font-semibold text-error-600">CNAME</span>
                  </li>
                  <li className="flex flex-wrap items-center gap-2">
                    <span>
                      Giá trị:{" "}
                      <code className="rounded bg-white/80 px-1 font-semibold dark:bg-gray-900">
                        {CNAME_TARGET}
                      </code>
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleCopyCname()}
                      className="inline-flex items-center gap-1 rounded-md border border-brand-200 bg-white px-2 py-1 text-xs font-medium text-brand-600 transition hover:bg-brand-50 dark:border-brand-800 dark:bg-gray-900 dark:text-brand-400 dark:hover:bg-brand-500/10"
                    >
                      <CopyIcon className="h-3.5 w-3.5" />
                      Copy
                    </button>
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-white/90">
                  Subdomain (vd: aotayngan.shopthoitrang.com)
                </p>
                <ul className="mt-1 list-inside list-disc space-y-0.5">
                  <li>
                    Host: tên subdomain (vd:{" "}
                    <code className="rounded bg-white/80 px-1 dark:bg-gray-900">
                      aotayngan
                    </code>
                    )
                  </li>
                  <li>
                    Loại: <span className="font-semibold text-error-600">CNAME</span>
                  </li>
                  <li className="flex flex-wrap items-center gap-2">
                    <span>
                      Giá trị:{" "}
                      <code className="rounded bg-white/80 px-1 font-semibold dark:bg-gray-900">
                        {CNAME_TARGET}
                      </code>
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleCopyCname()}
                      className="inline-flex items-center gap-1 rounded-md border border-brand-200 bg-white px-2 py-1 text-xs font-medium text-brand-600 transition hover:bg-brand-50 dark:border-brand-800 dark:bg-gray-900 dark:text-brand-400 dark:hover:bg-brand-500/10"
                    >
                      <CopyIcon className="h-3.5 w-3.5" />
                      Copy
                    </button>
                  </li>
                </ul>
              </div>
              <p>
                Gợi ý mua domain: pavietnam.vn, matbao.net, tenten.vn. Hệ thống
                không bán/quản lý domain — bạn tự gia hạn và bảo mật với nhà cung
                cấp.
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-5">
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tên miền
          </label>
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="vd: shopthoitrang.com hoặc shop.mydomain.com"
          />
          <p className="mt-1.5 text-xs text-gray-500">
            Không thêm http/https. Domain phải trỏ CNAME về {CNAME_TARGET} trước
            khi lưu.
          </p>
          {domain ? (
            <p className="mt-2 text-xs text-success-600 dark:text-success-400">
              Đang dùng: <span className="font-medium">{domain}</span>
            </p>
          ) : (
            <p className="mt-2 text-xs text-warning-600 dark:text-warning-400">
              Chưa cấu hình tên miền — link chia sẻ sẽ dùng domain hệ thống tạm
              thời.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
          Đóng
        </Button>
        <Button
          onClick={() => void handleSave()}
          disabled={isLoading || saving}
          className="w-full sm:w-auto"
        >
          {saving ? "Đang cập nhật…" : "Cập nhật tên miền"}
        </Button>
      </div>
    </Modal>
  );
}

function CopyIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
