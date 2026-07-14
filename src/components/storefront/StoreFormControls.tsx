"use client";

import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

const inputClass =
  "h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 transition focus:border-[#ec4899] focus:outline-none focus:ring-2 focus:ring-[#ec4899]/20";

const selectClass =
  "h-12 w-full cursor-pointer appearance-none rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 shadow-sm transition focus:border-[#ec4899] focus:outline-none focus:ring-2 focus:ring-[#ec4899]/20 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400";

export function StoreField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </label>
      {children}
    </div>
  );
}

export function StoreInput({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${inputClass} ${className}`} {...props} />;
}

export function StoreSelect({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={`${selectClass} ${className}`} {...props}>
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}