"use client";

import { useWebSocketStore } from "@/stores/use-websocket-store";
import type { WsMessagePayload } from "@/types/websocket";
import { useEffect, useMemo, useRef, useState } from "react";

/** Tương thích `useWebSocketStore` ZaloCN (socketRef + imageQrSCan) */
export default function useZaloVideoWebSocket() {
  const send = useWebSocketStore((s) => s.send);
  const lastPayload = useWebSocketStore((s) => s.lastPayload);
  const subscribe = useWebSocketStore((s) => s.subscribe);

  const [imageQrSCan, setImageQrSCan] = useState<{
    qr?: string;
    result?: string;
  } | null>(null);

  const socketRef = useRef({
    send: (raw: string) => {
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        send(parsed);
      } catch {
        send(raw);
      }
    },
  });

  useEffect(() => {
    return subscribe((message: WsMessagePayload) => {
      if (message.type !== "login_qr") return;
      if (typeof message.qr === "string" && message.qr) {
        setImageQrSCan({ qr: message.qr });
        return;
      }
      if (message.result !== undefined) {
        setImageQrSCan({
          result:
            typeof message.result === "string"
              ? message.result
              : String(message.result),
        });
      }
      if (message.error) {
        setImageQrSCan({ result: String(message.error) });
      }
    });
  }, [subscribe]);

  useEffect(() => {
    if (!lastPayload || lastPayload.type !== "login_qr") return;
    if (typeof lastPayload.qr === "string" && lastPayload.qr) {
      setImageQrSCan({ qr: lastPayload.qr });
    } else if (lastPayload.result !== undefined) {
      setImageQrSCan({
        result:
          typeof lastPayload.result === "string"
            ? lastPayload.result
            : String(lastPayload.result),
      });
    }
  }, [lastPayload]);

  return useMemo(
    () => ({ socketRef, imageQrSCan, setImageQrSCan }),
    [imageQrSCan],
  );
}