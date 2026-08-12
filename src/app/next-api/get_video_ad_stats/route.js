import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * Proxy Zalo analytics-ad-stats (phân tích video / nguồn traffic).
 * GET https://video.zalo.me/v2/public-api/analytics-ad-stats?id=
 */
export async function POST(req) {
    try {
        const { clientCookie, id_video, id, proxy } = await req.json();
        const videoId = id_video ?? id;
        if (!videoId) {
            return new Response(JSON.stringify({ error: 'Missing video id' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const agent =
            proxy && typeof proxy === 'string' && proxy.trim()
                ? new HttpsProxyAgent(proxy.trim())
                : null;

        const response = await axios.get(
            'https://video.zalo.me/v2/public-api/analytics-ad-stats',
            {
                params: { id: videoId },
                headers: {
                    accept: 'application/json, text/plain, */*',
                    'accept-language':
                        'vi,fr-FR;q=0.9,fr;q=0.8,en-US;q=0.7,en;q=0.6',
                    referer: `https://video.zalo.me/creator/phan-tich/noi-dung/video-${videoId}.html`,
                    'sec-ch-ua':
                        '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'user-agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
                    Cookie: `webSession=${clientCookie}`,
                },
                ...(agent ? { httpsAgent: agent, httpAgent: agent } : {}),
            }
        );

        // Trả full payload — data có thể nằm ở .data
        const payload = response.data?.data ?? response.data ?? {};
        return new Response(JSON.stringify(payload), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('analytics-ad-stats failed:', error?.response?.data || error.message);
        return new Response(
            JSON.stringify({
                error: 'Failed to fetch video ad stats',
                details: error.message,
                zalo: error?.response?.data ?? null,
            }),
            { status: error?.response?.status || 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
