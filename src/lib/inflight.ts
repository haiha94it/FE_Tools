/**
 * Gộp các Promise cùng key đang chạy — tránh double HTTP khi:
 * - React Strict Mode (dev) mount effect 2 lần
 * - Nhiều useEffect / store action gọi cùng lúc
 *
 * Không thay AbortController: request đã start vẫn chạy xong,
 * nhưng call thứ 2 trả về cùng Promise (1 network).
 */
const inflight = new Map<string, Promise<unknown>>();

export function dedupeInflight<T>(
  key: string,
  fn: () => Promise<T>,
): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fn().finally(() => {
    if (inflight.get(key) === promise) {
      inflight.delete(key);
    }
  });

  inflight.set(key, promise);
  return promise;
}
