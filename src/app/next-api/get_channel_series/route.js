import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * Proxy Zalo channel/series?start=&end=&key=
 * key: follower | view | like | comment | share
 * Body: { clientCookie, start, end, key?, proxy?, referer? }
 *
 * Overview chart (tong-quat): key=view, range = prev+current window.
 * Followers tab: key=follower.
 */
export async function POST(req) {
    try {
        const body = await req.json();
        const {
            clientCookie,
            proxy,
            start,
            end,
            key = 'follower',
            referer,
        } = body ?? {};

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

        const defaultReferer =
            key === 'view' || key === 'like' || key === 'comment' || key === 'share'
                ? 'https://video.zalo.me/creator/phan-tich/tong-quat'
                : 'https://video.zalo.me/creator/phan-tich/nguoi-theo-doi';

        const response = await axios.get(
            'https://video.zalo.me/v2/public-api/channel/series',
            {
                params: { start, end, key },
                headers: {
                    accept: 'application/json, text/plain, */*',
                    'accept-language': 'vi,en;q=0.9',
                    referer:
                        typeof referer === 'string' && referer.trim()
                            ? referer.trim()
                            : defaultReferer,
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
                key,
                data: response.data?.data ?? response.data ?? null,
                error: response.data?.error,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('channel/series failed:', error?.response?.data || error.message);
        return new Response(
            JSON.stringify({
                error: 'Failed to fetch channel series',
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
