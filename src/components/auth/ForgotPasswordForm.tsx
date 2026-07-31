"use client";

import AuthFeedbackModal from "@/components/auth/AuthFeedbackModal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { APP_NAME } from "@/constants/brand";
import { validateGmail, validateUsername } from "@/lib/auth-validation";
import { useAuthStore } from "@/stores/use-auth-store";
import Link from "next/link";
import React, { useState } from "react";

export default function ForgotPasswordForm() {
  const resetPassword = useAuthStore((s) => s.resetPassword);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [username, setUsername] = useState("");
  const [mail, setMail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setFieldError(null);

    const usernameError = validateUsername(username);
    const mailError = validateGmail(mail);

    if (usernameError || mailError) {
      setFieldError(usernameError || mailError);
      return;
    }

    try {
      const message = await resetPassword({
        username: username.trim(),
        mail: mail.trim(),
      });
      setModalMessage(message);
      setModalOpen(true);
    } catch {
      setModalMessage(
        useAuthStore.getState().error ||
        "Đã có lỗi xảy ra, vui lòng thử lại.",
      );
      setModalOpen(true);
    }
  };

  return (
    <>
      <AuthFeedbackModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        message={modalMessage}
      />

      <div className="flex w-full flex-1 flex-col">
        <div className="mx-auto mb-5 w-full max-w-lg px-5 sm:px-0">
          <p className="text-sm text-gray-500 dark:text-gray-400">{APP_NAME}</p>
        </div>

        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-5 sm:px-0">
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 text-title-sm font-semibold text-gray-800 sm:text-title-md dark:text-white/90">
              Quên mật khẩu
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nhập đầy đủ thông tin để tìm kiếm tài khoản của bạn
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>
                Tên tài khoản đăng nhập <span className="text-error-500">*</span>
              </Label>
              <Input
                placeholder="Tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <Label>
                Email đăng ký <span className="text-error-500">*</span>
              </Label>
              <Input
                placeholder="Email của bạn"
                value={mail}
                onChange={(e) => setMail(e.target.value)}
                disabled={isLoading}
              />
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
              {isLoading ? "Đang gửi..." : "Gửi thông tin"}
            </Button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              <Link
                href="/signin"
                className="cursor-pointer text-brand-500 hover:text-brand-600"
              >
                Quay lại đăng nhập
              </Link>
            </p>
          </form>
        </div>
      </div>
    </>
  );
}