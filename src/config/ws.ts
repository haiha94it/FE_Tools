import { env } from "@/config/env";

function normalizeWsBase(value: string): string {
  let wsUrl = value.trim();
  if (!wsUrl) return "";

  if (wsUrl.startsWith("http://")) {
    return wsUrl.replace("http://", "ws://").replace(/\/$/, "");
  }
  if (wsUrl.startsWith("https://")) {
    return wsUrl.replace("https://", "wss://").replace(/\/$/, "");
  }
  if (!wsUrl.startsWith("ws://") && !wsUrl.startsWith("wss://")) {
    const protocol =
      wsUrl.startsWith("localhost") || wsUrl.startsWith("127.0.0.1")
        ? "ws"
        : "wss";
    wsUrl = `${protocol}://${wsUrl}`;
  }

  return wsUrl.replace(/\/$/, "");
}

/** Base URL WebSocket — ưu tiên NEXT_PUBLIC_WS, fallback từ API URL */
export function resolveWsBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_WS;
  if (fromEnv?.trim()) {
    return normalizeWsBase(fromEnv);
  }

  if (typeof window !== "undefined") {
    const { hostname, protocol, port } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "";
    }
    const wsProtocol = protocol === "https:" ? "wss" : "ws";
    const portPart = port ? `:${port}` : "";
    return `${wsProtocol}://${hostname}${portPart}`;
  }

  try {
    const api = new URL(env.NEXT_PUBLIC_API_URL);
    const wsProtocol = api.protocol === "https:" ? "wss" : "ws";
    return `${wsProtocol}://${api.host}`;
  } catch {
    return "";
  }
}

/** URL kết nối WS global — đồng bộ ZaloCN `/ws/?token=` */
export function buildGlobalWsUrl(accessToken: string): string | null {
  const base = resolveWsBaseUrl();
  if (!base || !accessToken) return null;

  const params = new URLSearchParams({ token: accessToken });
  return `${base}/ws/?${params.toString()}`;
}