import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * Proxy Zalo comments/parent-list?videoId=&prevCmtId=
 * Body: { clientCookie, id_video, prevCmtId?, proxy? }
 * Load-more: prevCmtId = id comment cuối trang trước.
 */
export async function POST(req) {
    try {
        const body = await req.json();
        const { clientCookie, id_video, prevCmtId = '', proxy } = body ?? {};

        if (!id_video) {
            return new Response(JSON.stringify({ error: 'Missing id_video' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const agent =
            proxy && typeof proxy === 'string' && proxy.trim()
                ? new HttpsProxyAgent(proxy.trim())
                : null;

        const params = { videoId: String(id_video) };
        if (prevCmtId != null && String(prevCmtId).trim() !== '') {
            params.prevCmtId = String(prevCmtId).trim();
        }

        const response = await axios.get(
            'https://video.zalo.me/v2/public-api/comments/parent-list',
            {
                params,
                headers: {
                    accept: 'application/json, text/plain, */*',
                    'accept-language': 'vi,en;q=0.9',
                    referer: 'https://video.zalo.me/creator/video',
                    'user-agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
                    Cookie: `webSession=${clientCookie}`,
                },
                ...(agent ? { httpsAgent: agent, httpAgent: agent } : {}),
            }
        );

        const raw = response.data?.data;
        let comments = [];
        if (Array.isArray(raw)) {
            comments = raw;
        } else if (raw && typeof raw === 'object') {
            if (Array.isArray(raw.list)) comments = raw.list;
            else if (Array.isArray(raw.comments)) comments = raw.comments;
            else if (Array.isArray(raw.data)) comments = raw.data;
        }

        const last = comments.length > 0 ? comments[comments.length - 1] : null;
        const nextPrevCmtId = last?.id != null ? String(last.id) : null;
        const hasMore = comments.length > 0 && Boolean(nextPrevCmtId);

        return new Response(
            JSON.stringify({
                results: comments,
                count: comments.length,
                hasMore,
                nextPrevCmtId: hasMore ? nextPrevCmtId : null,
                error: response.data?.error,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('parent-list failed:', error?.response?.data || error.message);
        return new Response(
            JSON.stringify({
                error: 'Failed to fetch video comments',
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
