/**
 * Chrome tab-level messenger alerts:
 * - document.title badge + flash when tab is in background
 * - favicon unread badge
 * - optional Desktop Notification (OS / Chrome notification tray)
 */

import { APP_NAME } from "@/constants/brand";

const DEFAULT_BASE_TITLE = APP_NAME;

export interface MessengerTabAlertInput {
  channel: "zalo";
  senderName: string;
  preview: string;
  toastId?: string;
}

let baseTitle = DEFAULT_BASE_TITLE;
let unreadCount = 0;
let latestLine = "";
let flashTimer: ReturnType<typeof setInterval> | null = null;
let flashShowAlert = true;
let originalFaviconHref: string | null = null;
let visibilityBound = false;
let faviconLinkEl: HTMLLinkElement | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function captureBaseTitle() {
  if (!isBrowser()) return;
  const current = document.title || DEFAULT_BASE_TITLE;
  if (!/^\(\d+\)\s/.test(current) && current !== "● Tin nhắn mới") {
    baseTitle = current || DEFAULT_BASE_TITLE;
  }
}

function ensureVisibilityListener() {
  if (!isBrowser() || visibilityBound) return;
  visibilityBound = true;
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      stopFlash();
      applyTitle();
    } else if (unreadCount > 0) {
      startFlash();
    }
  });
}

function getOrCreateFaviconLink(): HTMLLinkElement | null {
  if (!isBrowser()) return null;
  if (faviconLinkEl && document.contains(faviconLinkEl)) return faviconLinkEl;

  const existing = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
  if (existing) {
    if (originalFaviconHref === null) {
      originalFaviconHref = existing.href;
    }
    faviconLinkEl = existing;
    return existing;
  }

  const link = document.createElement("link");
  link.rel = "icon";
  link.type = "image/png";
  document.head.appendChild(link);
  faviconLinkEl = link;
  return link;
}

function drawFaviconBadge(count: number): string {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "#0068ff";
  ctx.beginPath();
  ctx.arc(size * 0.42, size * 0.45, 16, 0, Math.PI * 2);
  ctx.fill();

  const label = count > 9 ? "9+" : String(count);
  const badgeR = 16;
  const bx = size - badgeR - 2;
  const by = badgeR + 2;
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.arc(bx, by, badgeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, bx, by + 1);

  return canvas.toDataURL("image/png");
}

function updateFaviconBadge(count: number) {
  if (!isBrowser()) return;
  const link = getOrCreateFaviconLink();
  if (!link) return;

  if (count <= 0) {
    if (originalFaviconHref) {
      link.href = originalFaviconHref;
    }
    return;
  }

  const dataUrl = drawFaviconBadge(count);
  if (dataUrl) {
    link.href = dataUrl;
  }
}

function restoreFavicon() {
  if (!isBrowser()) return;
  const link = getOrCreateFaviconLink();
  if (link && originalFaviconHref) {
    link.href = originalFaviconHref;
  }
}

function applyTitle() {
  if (!isBrowser()) return;
  if (unreadCount <= 0) {
    document.title = baseTitle;
    return;
  }
  const preview = latestLine || "Tin nhắn mới";
  document.title = `(${unreadCount}) ${preview} · ${baseTitle}`;
}

function stopFlash() {
  if (flashTimer) {
    clearInterval(flashTimer);
    flashTimer = null;
  }
  flashShowAlert = true;
}

function startFlash() {
  if (!isBrowser() || unreadCount <= 0) return;
  if (!document.hidden) {
    applyTitle();
    return;
  }

  stopFlash();
  flashShowAlert = true;
  flashTimer = setInterval(() => {
    if (!isBrowser() || unreadCount <= 0) {
      stopFlash();
      return;
    }
    if (!document.hidden) {
      stopFlash();
      applyTitle();
      return;
    }
    document.title = flashShowAlert
      ? `(${unreadCount}) ${latestLine || "Tin nhắn mới"}`
      : baseTitle;
    flashShowAlert = !flashShowAlert;
  }, 1100);
}

export function pushMessengerTabAlert(input: MessengerTabAlertInput) {
  if (!isBrowser()) return;

  ensureVisibilityListener();
  captureBaseTitle();

  unreadCount += 1;
  const preview = (input.preview || "Tin nhắn mới").trim();
  const sender = (input.senderName || "Tin nhắn").trim();
  latestLine = `Zalo · ${sender}: ${preview}`.slice(0, 72);

  applyTitle();
  startFlash();
  updateFaviconBadge(unreadCount);
}

export function clearMessengerTabAlert() {
  if (!isBrowser()) return;
  unreadCount = 0;
  latestLine = "";
  stopFlash();
  captureBaseTitle();
  document.title = baseTitle;
  restoreFavicon();
}

export function getMessengerTabUnreadCount() {
  return unreadCount;
}

export function showMessengerDesktopNotification(
  input: MessengerTabAlertInput & { toastId?: string },
) {
  if (!isBrowser() || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (!document.hidden && document.hasFocus()) return;

  try {
    const title = `Zalo · ${input.senderName}`;
    const notification = new Notification(title, {
      body: input.preview || "Bạn có tin nhắn mới",
      tag: input.toastId || "messenger-zalo",
      silent: false,
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    // Some browsers throw on permission edge cases.
  }
}

export function requestMessengerDesktopPermission(): void {
  if (!isBrowser() || !("Notification" in window)) return;
  if (Notification.permission !== "default") return;
  window.setTimeout(() => {
    if (Notification.permission === "default") {
      void Notification.requestPermission().catch(() => undefined);
    }
  }, 1500);
}