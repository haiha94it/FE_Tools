"use client";

import { useState } from "react";

interface FloatingContactButtonsProps {
  contactPhone?: string;
  contactZalo?: string;
  contactFacebook?: string;
  contactWebsite?: string;
}

/** Floating Contact Speed-Dial Widget (Góc trái màn hình) */
export default function FloatingContactButtons({
  contactPhone,
  contactZalo,
  contactFacebook,
  contactWebsite,
}: FloatingContactButtonsProps) {
  const [expanded, setExpanded] = useState(true);

  const phone = contactPhone?.trim();
  const zalo =
    contactZalo?.trim() ||
    (phone ? `https://zalo.me/${phone.replace(/\D/g, "")}` : "");
  const facebook = contactFacebook?.trim();
  const website = contactWebsite?.trim();

  const hasAny = Boolean(phone || zalo || facebook || website);
  if (!hasAny) return null;

  const phoneUrl = phone ? `tel:${phone.replace(/\s+/g, "")}` : "";

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2.5">
      {/* Expanded contact list */}
      {expanded ? (
        <div className="flex flex-col items-end gap-2 transition-all duration-300">
          {phone ? (
            <a
              href={phoneUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex cursor-pointer items-center gap-2 rounded-full bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-[0_4px_20px_rgba(5,150,105,0.4)] transition-all duration-300 hover:scale-105 hover:bg-emerald-500 active:scale-95"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
                📞
              </span>
              <span className="max-w-[0px] overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:max-w-[160px] group-hover:opacity-100 sm:max-w-[160px] sm:opacity-100">
                Gọi {phone}
              </span>
            </a>
          ) : null}

          {zalo ? (
            <a
              href={zalo}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex cursor-pointer items-center gap-2 rounded-full bg-[#0068FF] px-3 py-2 text-xs font-bold text-white shadow-[0_4px_20px_rgba(0,104,255,0.4)] transition-all duration-300 hover:scale-105 hover:bg-blue-600 active:scale-95"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
                💬
              </span>
              <span className="max-w-[0px] overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:max-w-[160px] group-hover:opacity-100 sm:max-w-[160px] sm:opacity-100">
                Chat Zalo
              </span>
            </a>
          ) : null}

          {facebook ? (
            <a
              href={facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex cursor-pointer items-center gap-2 rounded-full bg-[#1877F2] px-3 py-2 text-xs font-bold text-white shadow-[0_4px_20px_rgba(24,119,242,0.4)] transition-all duration-300 hover:scale-105 hover:bg-blue-700 active:scale-95"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
                🌐
              </span>
              <span className="max-w-[0px] overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:max-w-[160px] group-hover:opacity-100 sm:max-w-[160px] sm:opacity-100">
                Facebook
              </span>
            </a>
          ) : null}

          {website ? (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex cursor-pointer items-center gap-2 rounded-full bg-stone-900 px-3 py-2 text-xs font-bold text-white shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-300 hover:scale-105 hover:bg-black active:scale-95"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
                🔗
              </span>
              <span className="max-w-[0px] overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover:max-w-[160px] group-hover:opacity-100 sm:max-w-[160px] sm:opacity-100">
                Website
              </span>
            </a>
          ) : null}
        </div>
      ) : null}

      {/* Main Toggle Speedial Button */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-label="Liên hệ hỗ trợ"
        className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-stone-900 text-white shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-all duration-300 hover:scale-110 active:scale-95"
      >
        {expanded ? (
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <span className="relative flex h-5 w-5 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <svg
              className="relative h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </span>
        )}
      </button>
    </div>
  );
}
