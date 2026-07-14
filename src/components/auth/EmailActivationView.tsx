"use client";

import Button from "@/components/ui/button/Button";
import { getApiErrorMessage } from "@/lib/errors";
import { useAuthStore } from "@/stores/use-auth-store";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const ALREADY_ACTIVATED_MESSAGE = "Tài khoản đã được kích hoạt";

type ActivationStatus = "pending" | "success" | "error";

export default function EmailActivationView() {
  const params = useParams();
  const router = useRouter();
  const activateEmail = useAuthStore((s) => s.activateEmail);
  const startedRef = useRef(false);

  const [status, setStatus] = useState<ActivationStatus>("pending");
  const [errorMessage, setErrorMessage] = useState("");

  const tokenParam = params?.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (!token?.trim()) {
      setStatus("error");
      setErrorMessage("Liên kết xác nhận không hợp lệ.");
      return;
    }

    void (async () => {
      try {
        await activateEmail(token.trim());
        setStatus("success");
        router.replace("/zalo-messages");
      } catch (error) {
        setStatus("error");
        setErrorMessage(getApiErrorMessage(error));
      }
    })();
  }, [activateEmail, router, token]);

  const isAlreadyActivated = errorMessage.includes(ALREADY_ACTIVATED_MESSAGE);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-10 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
        {status === "pending" ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            <h1 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Đang xác nhận email...
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Vui lòng đợi trong giây lát.
            </p>
          </div>
        ) : null}

        {status === "success" ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400">
              <svg
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Kích hoạt thành công
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Đang chuyển vào ứng dụng...
            </p>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full ${
                isAlreadyActivated
                  ? "bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400"
                  : "bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400"
              }`}
            >
              <svg
                className="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                {isAlreadyActivated ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                )}
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              {isAlreadyActivated
                ? "Tài khoản đã được kích hoạt"
                : "Xác nhận email thất bại"}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {errorMessage || "Đăng ký thất bại. Vui lòng thử lại."}
            </p>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
              {isAlreadyActivated ? (
                <Link href="/signin" className="w-full sm:w-auto">
                  <Button size="sm" className="w-full">
                    Đăng nhập
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/signup" className="w-full sm:w-auto">
                    <Button size="sm" variant="outline" className="w-full">
                      Đăng ký lại
                    </Button>
                  </Link>
                  <Link href="/signin" className="w-full sm:w-auto">
                    <Button size="sm" className="w-full">
                      Đăng nhập
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}