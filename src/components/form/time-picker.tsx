"use client";

import { ChevronDownIcon, TimeIcon } from "@/icons";
import { useEffect, useId, useRef, useState } from "react";

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = [0, 15, 30, 45];

type TimePickerProps = {
  value: Date;
  onChange: (date: Date) => void;
  disabled?: boolean;
  className?: string;
};

function snapMinute(minute: number) {
  return MINUTES.reduce((closest, current) =>
    Math.abs(current - minute) < Math.abs(closest - minute) ? current : closest,
  );
}

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function columnItemClass(selected: boolean) {
  return `flex h-9 w-full cursor-pointer items-center justify-center rounded-lg text-sm font-medium tabular-nums transition ${
    selected
      ? "bg-brand-500 text-white shadow-sm"
      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
  }`;
}

export default function TimePicker({
  value,
  onChange,
  disabled = false,
  className = "",
}: TimePickerProps) {
  const id = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const hour = value.getHours();
  const minute = snapMinute(value.getMinutes());

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

  useEffect(() => {
    if (!isOpen) return;

    requestAnimationFrame(() => {
      hourListRef.current
        ?.querySelector('[data-selected="true"]')
        ?.scrollIntoView({ block: "center" });
      minuteListRef.current
        ?.querySelector('[data-selected="true"]')
        ?.scrollIntoView({ block: "center" });
    });
  }, [isOpen]);

  const updateTime = (nextHour: number, nextMinute: number) => {
    const next = new Date(value);
    next.setHours(nextHour, nextMinute, 0, 0);
    onChange(next);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-label={`Chọn giờ, hiện tại ${formatTime(hour, minute)}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`inline-flex h-10 min-w-[7.5rem] cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm shadow-theme-xs transition focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-800 ${
          disabled
            ? "cursor-not-allowed opacity-60"
            : "hover:border-brand-200 dark:hover:border-gray-600"
        }`}
      >
        <span className="shrink-0 text-brand-500 dark:text-brand-400">
          <TimeIcon className="size-4" />
        </span>
        <span className="flex-1 text-left font-medium tabular-nums text-gray-800 dark:text-white/90">
          {formatTime(hour, minute)}
        </span>
        <span
          className={`shrink-0 text-gray-500 transition-transform duration-200 dark:text-gray-400 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <ChevronDownIcon />
        </span>
      </button>

      {isOpen ? (
        <div
          role="dialog"
          aria-labelledby={id}
          className="absolute left-0 top-full z-50 mt-1.5 w-[13.5rem] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-800">
            <div className="flex min-w-0 flex-col">
              <div className="border-b border-gray-100 px-3 py-2 text-center text-theme-xs font-medium uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
                Giờ
              </div>
              <div
                ref={hourListRef}
                className="custom-scrollbar max-h-48 overflow-y-auto p-1.5"
              >
                {HOURS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    data-selected={item === hour}
                    onClick={() => updateTime(item, minute)}
                    className={columnItemClass(item === hour)}
                  >
                    {String(item).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex min-w-0 flex-col">
              <div className="border-b border-gray-100 px-3 py-2 text-center text-theme-xs font-medium uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:text-gray-400">
                Phút
              </div>
              <div
                ref={minuteListRef}
                className="custom-scrollbar max-h-48 overflow-y-auto p-1.5"
              >
                {MINUTES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    data-selected={item === minute}
                    onClick={() => {
                      updateTime(hour, item);
                      setIsOpen(false);
                    }}
                    className={columnItemClass(item === minute)}
                  >
                    {String(item).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}