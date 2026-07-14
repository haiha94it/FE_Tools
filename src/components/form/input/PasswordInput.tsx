"use client";

import { EyeCloseIcon, EyeIcon } from "@/icons";
import React, { FC, useState } from "react";

interface PasswordInputProps {
  id?: string;
  name?: string;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  disabled?: boolean;
  success?: boolean;
  error?: boolean;
  hint?: string;
  autoComplete?: string;
}

const PasswordInput: FC<PasswordInputProps> = ({
  id,
  name,
  placeholder,
  defaultValue,
  value,
  onChange,
  className = "",
  disabled = false,
  success = false,
  error = false,
  hint,
  autoComplete,
}) => {
  const [visible, setVisible] = useState(false);

  let inputClasses = `h-11 w-full rounded-lg border appearance-none px-4 py-2.5 pr-11 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 ${className}`;

  if (disabled) {
    inputClasses += ` cursor-not-allowed border-gray-300 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400`;
  } else if (error) {
    inputClasses += ` border-error-500 text-error-800 focus:ring-3 focus:ring-error-500/10 dark:border-error-500 dark:text-error-400`;
  } else if (success) {
    inputClasses += ` border-success-400 text-success-500 focus:border-success-300 focus:ring-success-500/10 dark:border-success-500 dark:text-success-400`;
  } else {
    inputClasses += ` border-gray-300 bg-transparent text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800`;
  }

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        id={id}
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        disabled={disabled}
        autoComplete={
          autoComplete ??
          (name === "password" ? "current-password" : "new-password")
        }
        className={inputClasses}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => setVisible((prev) => !prev)}
        className="absolute top-1/2 right-1 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        aria-pressed={visible}
      >
        {visible ? (
          <EyeIcon className="h-5 w-5 fill-current" />
        ) : (
          <EyeCloseIcon className="h-5 w-5 fill-current" />
        )}
      </button>

      {hint ? (
        <p
          className={`mt-1.5 text-xs ${
            error
              ? "text-error-500"
              : success
                ? "text-success-500"
                : "text-gray-500"
          }`}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
};

export default PasswordInput;