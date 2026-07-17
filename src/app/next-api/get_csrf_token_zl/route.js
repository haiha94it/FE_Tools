import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

function jsonResponse(body, status = 200) {
    // Luôn body JSON string — tránh Response(undefined) → body rỗng → FE .json() crash
    return new Response(JSON.stringify(body ?? null), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const clientCookie = body?.clientCookie;
        const proxy = body?.proxy;

        if (!clientCookie || typeof clientCookie !== 'string') {
            return jsonResponse({ error: 'Missing clientCookie (webSession)' }, 400);
        }

        const axiosConfig = {
            headers: {
                accept: 'application/json, text/plain, */*',
                'accept-language': 'en-GB-oxendict,en;q=0.9,fr;q=0.8,vi;q=0.7,fr-FR;q=0.6,en-US;q=0.5,en-GB;q=0.4',
                'cache-control': 'no-cache',
                dnt: '1',
                pragma: 'no-cache',
                priority: 'u=1, i',
                referer: 'https://video.zalo.me/creator/comment',
                'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
                Cookie: `webSession=${clientCookie}`,
            },
            timeout: 30000,
            validateStatus: () => true,
        };

        // Proxy optional — admin/bypass hoặc nick chưa gán proxy không được crash route
        if (proxy && typeof proxy === 'string' && proxy.trim()) {
            const agent = new HttpsProxyAgent(proxy.trim());
            axiosConfig.httpsAgent = agent;
            axiosConfig.httpAgent = agent;
        }

        const response = await axios.get(
            'https://video.zalo.me/v2/public-api/auth/csrf-token',
            axiosConfig,
        );

        // Zalo shape: { error, data: { token, expiredTime, ... } }
        const payload = response.data?.data ?? response.data ?? null;
        if (response.status >= 400 || payload == null) {
            return jsonResponse(
                {
                    error: 'CSRF fetch failed',
                    status: response.status,
                    details: response.data ?? null,
                },
                502,
            );
        }

        return jsonResponse(payload, 200);
    } catch (error) {
        console.error('[get_csrf_token_zl]', error?.message || error);
        return jsonResponse(
            { error: 'Failed to fetch CSRF token', details: error?.message || String(error) },
            500,
        );
    }
}