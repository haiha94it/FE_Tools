export interface ZaloCookieAccountPayload {
  imei: string;
  proxy: string;
  cookie: string;
  user_agent: string;
  lineNumber: number;
}

export function parseZaloCookieInput(input: string): ZaloCookieAccountPayload[] {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const result: ZaloCookieAccountPayload[] = [];

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) return;

    const [imei = "", proxy = "", cookie = "", user_agent = ""] = line
      .split("|")
      .map((segment) => segment.trim());

    result.push({
      imei,
      proxy,
      cookie,
      user_agent,
      lineNumber: index + 1,
    });
  });

  return result;
}

export function getZaloCookieValidationMessage(
  payloads: ZaloCookieAccountPayload[],
  options?: {
    fallbackProxy?: string;
    requireProxy?: boolean;
  },
): string | null {
  if (!payloads.length) {
    return "Vui lòng nhập dữ liệu cookie.";
  }

  const first = payloads[0];
  if (!first.cookie) {
    return `Dòng ${first.lineNumber} thiếu cookie.`;
  }

  if (!first.imei) {
    return `Dòng ${first.lineNumber} thiếu imei.`;
  }

  const resolvedProxy =
    first.proxy.trim() || options?.fallbackProxy?.trim() || "";
  if (options?.requireProxy !== false && !resolvedProxy) {
    return `Dòng ${first.lineNumber} thiếu proxy.`;
  }

  return null;
}

export function resolveZaloCookieProxy(
  payload: ZaloCookieAccountPayload,
  fallbackProxy = "",
) {
  return payload.proxy.trim() || fallbackProxy.trim();
}

export function buildZaloCookieCreateBody(payload: ZaloCookieAccountPayload) {
  return {
    imei: payload.imei,
    proxy: payload.proxy,
    cookie: payload.cookie,
    user_agent: payload.user_agent,
  };
}