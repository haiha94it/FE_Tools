/** Payload message từ WebSocket server CN */
export interface WsMessagePayload {
  type?: string;
  error_code?: number;
  error?: string;
  message?: unknown;
  message_details?: unknown;
  account?: unknown;
  result?: unknown;
  /** QR đăng nhập Zalo — response từ command login_qr */
  qr?: string;
  [key: string]: unknown;
}

export type WsMessageListener = (payload: WsMessagePayload) => void;

export type WsConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";