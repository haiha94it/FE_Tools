"use client";

import AuthFeedbackModal from "@/components/auth/AuthFeedbackModal";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import PasswordInput from "@/components/form/input/PasswordInput";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { APP_NAME, LEGAL_BRAND_NAME } from "@/constants/brand";
import { STORAGE_KEYS } from "@/constants/storage-keys";
import {
  validateGmail,
  validatePassword,
  validateUsername,
} from "@/lib/auth-validation";
import { popupService } from "@/services/popup.service";
import { useAuthStore } from "@/stores/use-auth-store";
import type { RegisterPopupItem } from "@/types/auth";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function SignUpForm() {
  const searchParams = useSearchParams();
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [mail, setMail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const [popupOpen, setPopupOpen] = useState(false);
  const [popupData, setPopupData] = useState<RegisterPopupItem | null>(null);
  const [popupMessage, setPopupMessage] = useState("");

  const refFromUrl = searchParams.get("ref");
  const referralLocked = Boolean(refFromUrl);

  useEffect(() => {
    if (refFromUrl) {
      setReferralCode(refFromUrl);
      localStorage.setItem(STORAGE_KEYS.REFERRAL_CODE, refFromUrl);
      return;
    }
    const saved = localStorage.getItem(STORAGE_KEYS.REFERRAL_CODE);
    if (saved) setReferralCode(saved);
  }, [refFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFieldError(null);

    const mailError = validateGmail(mail);
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);

    if (mailError || usernameError || passwordError) {
      setFieldError(mailError || usernameError || passwordError);
      return;
    }

    if (!fullname.trim()) {
      setFieldError("Vui lòng nhập họ tên");
      return;
    }

    if (password !== confirmPassword) {
      setFieldError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (!acceptTerms) {
      setFieldError("Vui lòng đồng ý với điều khoản sử dụng");
      return;
    }

    try {
      await register({
        fullname: fullname.trim(),
        username: username.trim(),
        password,
        mail: mail.trim(),
        referral_code: referralCode.trim(),
      });

      const popup = await popupService.getRegisterPopup().catch(() => null);
      setPopupData(popup);
      setPopupMessage(
        popupService.resolvePopupContent(popup?.content),
      );
      setPopupOpen(true);

      setFullname("");
      setUsername("");
      setMail("");
      setPassword("");
      setConfirmPassword("");
      if (!referralLocked) setReferralCode("");
      setAcceptTerms(false);
    } catch {
      // error trong store
    }
  };

  return (
    <>
      <AuthFeedbackModal
        isOpen={popupOpen}
        onClose={() => setPopupOpen(false)}
        message={popupMessage}
        imageUrl={popupService.resolvePopupImage(popupData?.image)}
      />

      <div className="flex w-full flex-1 flex-col">
        <div className="mx-auto mb-5 w-full max-w-lg px-5 sm:px-0">
          <p className="text-sm text-gray-500 dark:text-gray-400">{APP_NAME}</p>
        </div>

        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-5 pb-10 sm:px-0">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2 sm:mb-8">
            <div>
              <h1 className="mb-2 text-title-sm font-semibold text-gray-800 sm:text-title-md dark:text-white/90">
                Đăng ký miễn phí
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tạo tài khoản {APP_NAME} để bắt đầu sử dụng
              </p>
            </div>
            <Link
              href="/signin"
              className="cursor-pointer text-sm text-brand-500 hover:text-brand-600"
            >
              Đã có tài khoản?
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label>
                Họ tên <span className="text-error-500">*</span>
              </Label>
              <Input
                placeholder="Nguyễn Văn A"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <Label>
                Tên đăng nhập <span className="text-error-500">*</span>
              </Label>
              <Input
                placeholder="Chỉ chữ và số, không dấu"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <Label>
                Gmail <span className="text-error-500">*</span>
              </Label>
              <Input
                placeholder="example@gmail.com"
                type="email"
                value={mail}
                onChange={(e) => setMail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <Label>Mã giới thiệu (nếu có)</Label>
              <Input
                placeholder="Mã giới thiệu"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                disabled={isLoading || referralLocked}
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label>
                  Mật khẩu <span className="text-error-500">*</span>
                </Label>
                <PasswordInput
                  placeholder="Không dùng ký tự có dấu"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label>
                  Xác nhận mật khẩu <span className="text-error-500">*</span>
                </Label>
                <PasswordInput
                  placeholder="Nhập lại mật khẩu"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="rounded-xl border border-[#86aff3] bg-[#d0e1fd] p-4 text-gray-800 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-gray-200">
              <div className="mb-3 flex items-center gap-3">
                <Checkbox checked={acceptTerms} onChange={setAcceptTerms} />
                <p className="text-sm font-semibold">
                  Tôi đồng ý với điều khoản
                </p>
              </div>
              <p className="mb-3 text-sm leading-6">
                - Bằng việc tích chọn vào ô đồng ý. Tôi đồng ý cho Chốt Nhanh
                xử lý các dữ liệu mà tôi đã điền ở trên theo{" "}
                <Link
                  href="/dieu-khoan"
                  target="_blank"
                  className="text-brand-600 underline hover:text-brand-700"
                >
                  thỏa thuận sử dụng dịch vụ
                </Link>{" "}
                {LEGAL_BRAND_NAME} và dữ liệu cho các chức năng trên các phần
                mềm Chốt Nhanh.
              </p>
              <p className="text-sm leading-6">
                - Đồng thời, tôi đồng ý để {LEGAL_BRAND_NAME} thu thập, xử lý
                dữ liệu nhằm cho các mục đích hỗ trợ và chăm sóc khách hàng
                liên quan tới các sản phẩm, dịch vụ của {LEGAL_BRAND_NAME}.
                Theo đây, tôi xác nhận và hiểu rõ các quyền hợp pháp của chủ
                thể dữ liệu theo quy định tại Nghị Định 13/2023/NĐ-CP về bảo vệ
                dữ liệu cá nhân.
              </p>
              <p className="mt-4 text-center text-sm italic text-gray-600 dark:text-gray-400">
                Powered by {LEGAL_BRAND_NAME} Form.
              </p>
            </div>

            {(fieldError || error) && (
              <p className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
                {fieldError || error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? "Đang đăng ký..." : "Đăng ký"}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}