"use client";

import { useAuthStore } from "@/stores/use-auth-store";
import { useWebSocketStore } from "@/stores/use-websocket-store";
import { useEffect } from "react";

/**
 * Đồng bộ WebSocket global với phiên đăng nhập:
 * - connect sau bootstrap/login thành công
 * - disconnect khi logout / hết phiên
 */
export function WebSocketBridge() {
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const connect = useWebSocketStore((s) => s.connect);
  const disconnect = useWebSocketStore((s) => s.disconnect);

  useEffect(() => {
    if (!isBootstrapped) return;

    if (isAuthenticated) {
      connect();
      return;
    }

    disconnect();
  }, [isBootstrapped, isAuthenticated, connect, disconnect]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      const { status } = useWebSocketStore.getState();
      if (
        useAuthStore.getState().isAuthenticated &&
        status !== "connected" &&
        status !== "connecting"
      ) {
        connect();
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [connect]);

  return null;
}