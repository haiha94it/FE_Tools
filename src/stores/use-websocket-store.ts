import { buildGlobalWsUrl } from "@/config/ws";
import {
  getAccessToken,
  getRefreshToken,
  logoutAndRedirect,
  refreshAccessToken,
} from "@/lib/axios";
import { handleApiError } from "@/lib/errors";
import type {
  WsConnectionStatus,
  WsMessageListener,
  WsMessagePayload,
} from "@/types/websocket";
import { create } from "zustand";

const MAX_RECONNECT_ATTEMPTS = 100;
const BASE_RECONNECT_MS = 2000;
const MAX_RECONNECT_MS = 30000;
const ACCESS_TOKEN_REFRESH_SKEW_MS = 30_000;
const RECOVERABLE_CLOSE_CODES = new Set([
  1000, 1001, 1006, 1012, 1013, 4000, 4001, 4002, 4500,
]);

const AUTH_CLOSE_CODES = new Set([4001, 4002]);
const AUTH_ERROR_CODES = new Set([4001, 4002]);

interface WebSocketState {
  status: WsConnectionStatus;
  reconnectAttempts: number;
  lastPayload: WsMessagePayload | null;
  connect: () => void;
  disconnect: () => void;
  send: (payload: Record<string, unknown> | string) => boolean;
  subscribe: (listener: WsMessageListener) => () => void;
}

let socket: WebSocket | null = null;
let socketGeneration = 0;
let intentionalClose = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<WsMessageListener>();
const seenEventIds = new Set<string>();
const seenEventOrder: string[] = [];
const MAX_SEEN_EVENT_IDS = 500;

function clearReconnectTimer() {
  if (!reconnectTimer) return;
  clearTimeout(reconnectTimer);
  reconnectTimer = null;
}

function notifyListeners(payload: WsMessagePayload) {
  listeners.forEach((listener) => {
    try {
      listener(payload);
    } catch (error) {
      console.error("[WS] listener error", error);
    }
  });
}

function parseWsPayload(raw: string): WsMessagePayload | null {
  try {
    return JSON.parse(raw) as WsMessagePayload;
  } catch {
    console.error("[WS] Invalid JSON", raw);
    return null;
  }
}

function isDuplicateEvent(payload: WsMessagePayload): boolean {
  const eventId = typeof payload.event_id === "string" ? payload.event_id : null;
  if (!eventId) return false;
  if (seenEventIds.has(eventId)) return true;

  seenEventIds.add(eventId);
  seenEventOrder.push(eventId);
  if (seenEventOrder.length > MAX_SEEN_EVENT_IDS) {
    const oldest = seenEventOrder.shift();
    if (oldest) seenEventIds.delete(oldest);
  }
  return false;
}

function getReconnectDelay(attempt: number): number {
  const capped = Math.min(BASE_RECONNECT_MS * 2 ** Math.min(attempt, 4), MAX_RECONNECT_MS);
  return Math.min(capped + Math.floor(Math.random() * 1000), MAX_RECONNECT_MS);
}

function shouldReconnect(closeCode: number): boolean {
  return RECOVERABLE_CLOSE_CODES.has(closeCode);
}

/** Kiểm tra JWT access đã hết hạn hoặc sắp hết hạn trước lần reconnect. */
function isAccessTokenExpired(accessToken: string): boolean {
  try {
    const payloadPart = accessToken.split(".")[1];
    if (!payloadPart) return true;

    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const payload = JSON.parse(atob(padded)) as { exp?: unknown };
    return (
      typeof payload.exp !== "number" ||
      payload.exp * 1000 <= Date.now() + ACCESS_TOKEN_REFRESH_SKEW_MS
    );
  } catch {
    return true;
  }
}

/** Đóng socket hiện tại trước khi đổi generation để callback cũ không mutate state. */
function closeActiveSocket() {
  if (!socket) return;

  const active = socket;
  socket = null;
  socketGeneration += 1;

  if (
    active.readyState === WebSocket.CONNECTING ||
    active.readyState === WebSocket.OPEN
  ) {
    active.close(1000, "Client disconnect");
  }
}

async function retryAuthAndReconnect(
  set: (patch: Partial<WebSocketState>) => void,
  get: () => WebSocketState,
): Promise<boolean> {
  if (!getRefreshToken()) return false;

  const newAccess = await refreshAccessToken();
  if (!newAccess) return false;

  intentionalClose = false;
  closeActiveSocket();
  set({ reconnectAttempts: 0, status: "reconnecting" });
  get().connect();
  return true;
}

/** Lên lịch reconnect và làm mới access token hết hạn trước khi mở socket mới. */
function scheduleReconnect(
  set: (patch: Partial<WebSocketState>) => void,
  get: () => WebSocketState,
) {
  if (intentionalClose) return;
  if (!getAccessToken()) return;

  const attempts = get().reconnectAttempts;
  if (attempts >= MAX_RECONNECT_ATTEMPTS) {
    set({ status: "disconnected" });
    handleApiError(new Error("Mất kết nối máy chủ. Vui lòng tải lại trang."));
    return;
  }

  clearReconnectTimer();
  const delay = getReconnectDelay(attempts);

  set({
    status: "reconnecting",
    reconnectAttempts: attempts + 1,
  });

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;

    if (intentionalClose) return;

    const accessToken = getAccessToken();
    if (!accessToken) {
      set({ status: "disconnected" });
      return;
    }

    if (isAccessTokenExpired(accessToken)) {
      if (!getRefreshToken()) {
        set({ status: "disconnected" });
        logoutAndRedirect();
        return;
      }

      const refreshedAccess = await refreshAccessToken();
      if (intentionalClose) return;
      if (!refreshedAccess) {
        if (getAccessToken()) {
          scheduleReconnect(set, get);
        } else {
          set({ status: "disconnected" });
        }
        return;
      }
    }

    get().connect();
  }, delay);
}

/** Gắn callback có generation guard; socket cũ không được ghi đè socket mới. */
function bindSocketHandlers(
  client: WebSocket,
  generation: number,
  set: (patch: Partial<WebSocketState>) => void,
  get: () => WebSocketState,
) {
  const isCurrent = () => socket === client && socketGeneration === generation;

  client.onopen = () => {
    if (!isCurrent()) return;
    set({ status: "connected", reconnectAttempts: 0 });
    clearReconnectTimer();
  };

  client.onmessage = async (event) => {
    if (!isCurrent()) return;
    const payload = parseWsPayload(String(event.data));
    if (!payload || isDuplicateEvent(payload)) return;

    set({ lastPayload: payload });
    notifyListeners(payload);

    if (
      AUTH_ERROR_CODES.has(payload.error_code ?? -1) ||
      payload.type === "authentication_error"
    ) {
      const refreshed = await retryAuthAndReconnect(set, get);
      if (!refreshed) {
        handleApiError(
          new Error(
            "Kết nối đang được làm mới. Nếu kéo dài, vui lòng tải lại trang.",
          ),
        );
      }
      return;
    }

    if (payload.type === "disconnect_notification") {
      intentionalClose = false;
      closeActiveSocket();
      get().connect();
    }
  };

  client.onerror = () => {
    if (isCurrent()) set({ status: "reconnecting" });
  };

  client.onclose = async (event) => {
    if (!isCurrent()) return;
    socket = null;

    if (intentionalClose) {
      set({ status: "disconnected", reconnectAttempts: 0 });
      return;
    }

    set({ status: "reconnecting" });

    if (AUTH_CLOSE_CODES.has(event.code) && getRefreshToken()) {
      const refreshed = await retryAuthAndReconnect(set, get);
      if (refreshed) return;
      if (getRefreshToken()) {
        scheduleReconnect(set, get);
        return;
      }
    }

    if (AUTH_CLOSE_CODES.has(event.code)) {
      handleApiError(new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại."));
      logoutAndRedirect();
      return;
    }

    if (!getAccessToken()) {
      set({ status: "disconnected" });
      return;
    }

    if (shouldReconnect(event.code)) {
      scheduleReconnect(set, get);
      return;
    }

    set({ status: "disconnected" });
    handleApiError(new Error("Mất kết nối máy chủ. Vui lòng tải lại trang."));
  };
}

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  status: "idle",
  reconnectAttempts: 0,
  lastPayload: null,

  connect: () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      get().disconnect();
      return;
    }

    if (
      socket &&
      (socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const wsUrl = buildGlobalWsUrl(accessToken);
    if (!wsUrl) {
      console.warn("[WS] Missing WS base URL — set NEXT_PUBLIC_WS in .env");
      return;
    }

    intentionalClose = false;
    closeActiveSocket();
    set({ status: "connecting" });

    const generation = ++socketGeneration;
    const client = new WebSocket(wsUrl);
    socket = client;
    bindSocketHandlers(client, generation, set, get);
  },

  disconnect: () => {
    intentionalClose = true;
    clearReconnectTimer();
    closeActiveSocket();
    seenEventIds.clear();
    seenEventOrder.length = 0;
    set({
      status: "disconnected",
      reconnectAttempts: 0,
      lastPayload: null,
    });
  },

  send: (payload) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn("[WS] not open, cannot send");
      return false;
    }

    const message =
      typeof payload === "string" ? payload : JSON.stringify(payload);
    socket.send(message);
    return true;
  },

  subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
}));
