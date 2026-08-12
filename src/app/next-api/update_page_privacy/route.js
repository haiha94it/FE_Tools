import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * Zalo Creator — bật/tắt hiển thị trang thông tin trên hồ sơ kênh.
 * POST store/update-privacy — form privacy=1|2
 *   1 = riêng tư (không hiển thị)
 *   2 = công khai (hiển thị)
 */
export async function POST(request) {
  try {
    const { clientCookie, privacy, csrf, proxy } = await request.json();
    const agent =
      proxy && typeof proxy === 'string' && proxy.trim()
        ? new HttpsProxyAgent(proxy.trim())
        : null;

    const bodyRaw = `privacy=${encodeURIComponent(privacy)}`;
    const zaloResponse = await axios.post(
      'https://video.zalo.me/v2/public-api/store/update-privacy',
      bodyRaw,
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
          origin: 'https://video.zalo.me',
          referer: 'https://video.zalo.me/creator/trang-thong-tin',
          'x-csrf-token': csrf,
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
          cookie: `webSession=${clientCookie}`,
        },
        ...(agent ? { httpsAgent: agent, httpAgent: agent } : {}),
      }
    );

    return new Response(JSON.stringify(zaloResponse.data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(
      'Zalo store/update-privacy failed:',
      error?.response?.data || error.message
    );
    return new Response(
      JSON.stringify({ error: error?.response?.data || 'Internal Server Error' }),
      { status: error?.response?.status || 500 }
    );
  }
}
