"use client";

import Input from "@/components/form/input/InputField";
import PasswordInput from "@/components/form/input/PasswordInput";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { API_AUTH } from "@/config/api";
import { APP_NAME } from "@/constants/brand";
import api from "@/lib/axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function SignUpForm() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullname: "",
    phone_number: "",
    mail: "",
    username: "",
    password: "",
    confirm_password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const username = form.username.trim();
    const phone = form.phone_number.trim();
    const fullname = form.fullname.trim();

    if (!username || !form.password) {
      setError("Vui lòng điền đầy đủ tên đăng nhập và mật khẩu.");
      return;
    }

    if (username.includes(" ")) {
      setError("Tên đăng nhập không được chứa khoảng trắng.");
      return;
    }

    if (form.password.length < 6) {
      setError("Mật khẩu phải có độ dài tối thiểu 6 ký tự.");
      return;
    }

    if (form.password !== form.confirm_password) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (!phone || phone.length < 9) {
      setError("Vui lòng nhập số điện thoại hợp lệ (tối thiểu 9 số).");
      return;
    }

    setIsLoading(true);
    try {
      console.log("[AUTH] Đang gửi yêu cầu đăng ký đại lý username=" + username);
      const res = await api.post(API_AUTH.AGENCY_REGISTER, {
        username,
        password: form.password,
        fullname,
        phone_number: phone,
        mail: form.mail.trim() || undefined,
      });

      const message = res?.data?.message || "Đăng ký đại lý thành công! Đang chuyển đến trang đăng nhập...";
      setSuccessMsg(message);
      console.log("[AUTH] Đăng ký đại lý thành công username=" + username);

      setTimeout(() => {
        router.push(`/login?username=${encodeURIComponent(username)}`);
      }, 1500);
    } catch (err: any) {
      console.error("[AUTH] Đăng ký đại lý thất bại", err);
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.username?.[0] ||
        err?.response?.data?.errors?.phone_number?.[0] ||
        "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-1 flex-col">
      <div className="mx-auto mb-5 w-full max-w-lg px-5 sm:px-0">
        <p className="text-sm text-gray-500 dark:text-gray-400">{APP_NAME}</p>
      </div>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-5 sm:px-0">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 text-title-sm font-semibold text-gray-800 sm:text-title-md dark:text-white/90">
            Đăng ký Đại lý Phân phối
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Trở thành đối tác phân phối bản quyền GGMaps và công cụ nghề
          </p>
        </div>

        {successMsg ? (
          <div className="space-y-4 rounded-2xl border border-success-200 bg-success-50 p-6 text-center dark:border-success-900/40 dark:bg-success-950/40">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-100 text-2xl text-success-600 dark:bg-success-900/60 dark:text-success-300">
              ✓
            </div>
            <h3 className="text-lg font-bold text-success-800 dark:text-success-200">
              Đăng ký thành công!
            </h3>
            <p className="text-sm text-success-700 dark:text-success-300">
              {successMsg}
            </p>
            <Link
              href={`/login?username=${encodeURIComponent(form.username.trim())}`}
              className="inline-block rounded-xl bg-success-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-success-600 transition shadow-sm"
            >
              Đăng nhập ngay
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label>
                  Tên Đại lý / Họ và tên <span className="text-error-500">*</span>
                </Label>
                <Input
                  placeholder="Ví dụ: Đại Lý Nam Định - Nguyễn Văn A"
                  type="text"
                  name="fullname"
                  value={form.fullname}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>
                    Số điện thoại <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    placeholder="0912345678"
                    type="tel"
                    name="phone_number"
                    value={form.phone_number}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div>
                  <Label>Email (Tùy chọn)</Label>
                  <Input
                    placeholder="agency@example.com"
                    type="email"
                    name="mail"
                    value={form.mail}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <Label>
                  Tên đăng nhập (Username) <span className="text-error-500">*</span>
                </Label>
                <Input
                  placeholder="Nhập tên đăng nhập (viết liền, không dấu)"
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  disabled={isLoading}
                  error={Boolean(error && error.includes("đăng nhập"))}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>
                    Mật khẩu <span className="text-error-500">*</span>
                  </Label>
                  <PasswordInput
                    placeholder="Tối thiểu 6 ký tự"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div>
                  <Label>
                    Xác nhận mật khẩu <span className="text-error-500">*</span>
                  </Label>
                  <PasswordInput
                    placeholder="Nhập lại mật khẩu"
                    name="confirm_password"
                    value={form.confirm_password}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                size="sm"
                disabled={isLoading || !form.username.trim() || !form.password}
              >
                {isLoading ? "Đang xử lý đăng ký..." : "Đăng ký làm Đại lý"}
              </Button>

              <div className="text-center pt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Đã có tài khoản Đại lý?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Đăng nhập ngay
                  </Link>
                </p>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
