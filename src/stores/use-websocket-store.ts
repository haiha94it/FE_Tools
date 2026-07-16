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
let intentionalClose = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<WsMessageListener>();

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

function getReconnectDelay(attempt: number): number {
  return Math.min(BASE_RECONNECT_MS * 2 ** Math.min(attempt, 4), MAX_RECONNECT_MS);
}

function shouldReconnect(closeCode: number): boolean {
  return RECOVERABLE_CLOSE_CODES.has(closeCode);
}

function closeActiveSocket() {
  if (!socket) return;

  const active = socket;
  socket = null;

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
  set({ reconnectAttempts: 0, status: "reconnecting" });
  get().connect();
  return true;
}

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

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    if (!intentionalClose && getAccessToken()) {
      get().connect();
    }
  }, delay);
}

function bindSocketHandlers(
  client: WebSocket,
  set: (patch: Partial<WebSocketState>) => void,
  get: () => WebSocketState,
) {
  client.onopen = () => {
    set({ status: "connected", reconnectAttempts: 0 });
    clearReconnectTimer();
  };

  client.onmessage = async (event) => {
    const payload = parseWsPayload(String(event.data));
    if (!payload) return;

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
    set({ status: "reconnecting" });
  };

  client.onclose = async (event) => {
    if (socket === client) socket = null;

    if (intentionalClose) {
      set({ status: "disconnected", reconnectAttempts: 0 });
      return;
    }

    set({ status: "reconnecting" });

    if (AUTH_CLOSE_CODES.has(event.code) && getRefreshToken()) {
      const refreshed = await retryAuthAndReconnect(set, get);
      if (refreshed) return;
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

    const client = new WebSocket(wsUrl);
    socket = client;
    bindSocketHandlers(client, set, get);
  },

  disconnect: () => {
    intentionalClose = true;
    clearReconnectTimer();
    closeActiveSocket();
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