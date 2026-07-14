"use client";

import { ChevronDownIcon } from "@/icons";
import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";

export interface CustomSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

type CustomSelectVariant = "default" | "inline-start" | "inline-end";

interface CustomSelectProps {
  options: CustomSelectOption[];
  value?: string;
  defaultValue?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  variant?: CustomSelectVariant;
  renderOption?: (option: CustomSelectOption, selected: boolean) => ReactNode;
  renderValue?: (option: CustomSelectOption | null) => ReactNode;
  id?: string;
  "aria-label"?: string;
}

const triggerStyles: Record<CustomSelectVariant, string> = {
  default:
    "flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs transition focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-800",
  "inline-start":
    "flex h-11 min-w-[72px] cursor-pointer items-center justify-between gap-1 rounded-l-lg border-0 border-r border-gray-200 bg-transparent py-3 pl-3.5 pr-2 text-sm leading-tight text-gray-700 dark:border-gray-800 dark:text-gray-400",
  "inline-end":
    "flex h-11 min-w-[72px] cursor-pointer items-center justify-between gap-1 rounded-r-lg border-0 border-l border-gray-200 bg-transparent py-3 pl-3.5 pr-2 text-sm leading-tight text-gray-700 dark:border-gray-800 dark:text-gray-400",
};

const listStyles: Record<CustomSelectVariant, string> = {
  default: "left-0 w-full",
  "inline-start": "left-0 min-w-[88px]",
  "inline-end": "right-0 min-w-[88px]",
};

export default function CustomSelect({
  options,
  value,
  defaultValue = "",
  onChange,
  placeholder = "Chọn một mục",
  disabled = false,
  className = "",
  variant = "default",
  renderOption,
  renderValue,
  id,
  "aria-label": ariaLabel,
}: CustomSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selectedValue = isControlled ? value : internalValue;

  const selectedOption =
    options.find((option) => option.value === selectedValue) ?? null;

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelect = (next: string) => {
    if (!isControlled) setInternalValue(next);
    onChange(next);
    setIsOpen(false);
  };

  const hasValue = Boolean(selectedValue);
  const triggerTextClass = hasValue
    ? "text-gray-800 dark:text-white/90"
    : "text-gray-400 dark:text-gray-400";

  return (
    <div
      ref={containerRef}
      className={`relative ${variant === "default" ? "w-full" : ""} ${className}`}
    >
      <button
        type="button"
        id={selectId}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`${triggerStyles[variant]} ${
          disabled
            ? "cursor-not-allowed opacity-60"
            : "hover:border-brand-200 dark:hover:border-gray-600"
        }`}
      >
        <span className={`min-w-0 flex-1 truncate text-left ${triggerTextClass}`}>
          {renderValue
            ? renderValue(selectedOption)
            : selectedOption?.label ?? placeholder}
        </span>
        <span
          className={`shrink-0 text-gray-500 transition-transform duration-200 dark:text-gray-400 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <ChevronDownIcon />
        </span>
      </button>

      {isOpen && options.length > 0 && (
        <ul
          role="listbox"
          aria-labelledby={selectId}
          className={`absolute top-full z-50 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 ${listStyles[variant]}`}
        >
          {options.map((option) => {
            const isSelected = option.value === selectedValue;

            return (
              <li key={option.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/5 ${
                    isSelected
                      ? "bg-brand-50 font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                      : "text-gray-800 dark:text-white/90"
                  }`}
                >
                  {renderOption ? (
                    renderOption(option, isSelected)
                  ) : (
                    <span className="truncate">{option.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}