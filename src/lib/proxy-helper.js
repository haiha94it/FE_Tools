import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * Returns httpsAgent and httpAgent object if valid proxy string is provided.
 * Returns empty object {} if proxy is missing, null, undefined, or empty.
 */
export function getProxyAgent(proxy) {
  if (proxy && typeof proxy === 'string' && proxy.trim()) {
    try {
      const agent = new HttpsProxyAgent(proxy.trim());
      return { httpsAgent: agent, httpAgent: agent };
    } catch (err) {
      console.warn('Failed to parse proxy agent:', err?.message || err);
      return {};
    }
  }
  return {};
}
