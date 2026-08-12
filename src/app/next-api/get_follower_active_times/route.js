import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * Proxy Zalo channel/follower-active-times?start=&end=
 * Body: { clientCookie, start, end, proxy? }
 */
export async function POST(req) {
    try {
        const body = await req.json();
        const { clientCookie, proxy, start, end } = body ?? {};

        if (!start || !end) {
            return new Response(JSON.stringify({ error: 'Missing start/end (YYYYMMDD)' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const agent =
            proxy && typeof proxy === 'string' && proxy.trim()
                ? new HttpsProxyAgent(proxy.trim())
                : null;

        const response = await axios.get(
            'https://video.zalo.me/v2/public-api/channel/follower-active-times',
            {
                params: { start, end },
                headers: {
                    accept: 'application/json, text/plain, */*',
                    'accept-language': 'vi,en;q=0.9',
                    referer: 'https://video.zalo.me/creator/phan-tich/nguoi-theo-doi',
                    'user-agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
                    Cookie: `webSession=${clientCookie}`,
                },
                ...(agent ? { httpsAgent: agent, httpAgent: agent } : {}),
            }
        );

        return new Response(
            JSON.stringify({
                start,
                end,
                data: response.data?.data ?? response.data ?? null,
                error: response.data?.error,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('follower-active-times failed:', error?.response?.data || error.message);
        return new Response(
            JSON.stringify({
                error: 'Failed to fetch follower active times',
                details: error.message,
                zalo: error?.response?.data ?? null,
            }),
            {
                status: error?.response?.status || 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
}
