"use client";

import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { APP_NAME } from "@/constants/brand";
import { useAuthStore } from "@/stores/use-auth-store";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function SignInForm() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!username.trim() || !password) {
      return;
    }

    try {
      await login({ username: username.trim(), password });
      router.replace("/zalo-messages");
    } catch {
      // error đã set trong store
    }
  };

  return (
    <div className="flex w-full flex-1 flex-col lg:w-1/2">
      <div className="mx-auto mb-5 w-full max-w-md sm:pt-10">
        <p className="text-sm text-gray-500 dark:text-gray-400">{APP_NAME}</p>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 text-title-sm font-semibold text-gray-800 sm:text-title-md dark:text-white/90">
            Đăng nhập
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nhập tên đăng nhập và mật khẩu để vào hệ thống
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <Label>
                Tên đăng nhập <span className="text-error-500">*</span>
              </Label>
              <Input
                placeholder="Nhập tên đăng nhập"
                type="text"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                error={Boolean(error)}
              />
            </div>

            <div>
              <Label>
                Mật khẩu <span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  error={Boolean(error)}
                />
                <Tooltip
                  content={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  side="left"
                >
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-4 z-30 -translate-y-1/2 cursor-pointer"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                    )}
                  </button>
                </Tooltip>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end">
              <Link
                href="/forgot-password"
                className="cursor-pointer text-sm text-brand-500 hover:text-brand-600"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="sm"
              disabled={isLoading || !username.trim() || !password}
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Chưa có tài khoản?{" "}
              <Link
                href="/signup"
                className="cursor-pointer text-brand-500 hover:text-brand-600"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}