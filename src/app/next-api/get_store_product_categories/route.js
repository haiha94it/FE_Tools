import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * Zalo Creator — danh mục sản phẩm chuẩn (tree id/name/children).
 * GET store/product-categories
 *
 * Hiện Creator load API này nhưng UI ChotCare chưa dùng — giữ proxy để dành
 * (gán category khi tạo store-item / filter sau này).
 */
export async function POST(req) {
  try {
    const { clientCookie, proxy } = await req.json();
    const agent =
      proxy && typeof proxy === 'string' && proxy.trim()
        ? new HttpsProxyAgent(proxy.trim())
        : null;

    const response = await axios.get(
      'https://video.zalo.me/v2/public-api/store/product-categories',
      {
        headers: {
          accept: 'application/json, text/plain, */*',
          'accept-language': 'vi,fr-FR;q=0.9,fr;q=0.8,en-US;q=0.7,en;q=0.6',
          'cache-control': 'no-cache',
          pragma: 'no-cache',
          referer: 'https://video.zalo.me/creator/trang-thong-tin',
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
          Cookie: `webSession=${clientCookie}`,
        },
        ...(agent ? { httpsAgent: agent, httpAgent: agent } : {}),
      }
    );

    return new Response(JSON.stringify(response.data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(
      'Zalo store/product-categories failed:',
      error?.response?.data || error.message
    );
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch product categories',
        details: error.message,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
