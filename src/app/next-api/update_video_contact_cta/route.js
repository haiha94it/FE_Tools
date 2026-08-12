import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * Proxy Zalo video/update-contact-cta
 * Body FE: { clientCookie, id, enabled: 0|1|boolean, csrf, proxy? }
 * Form: id=&enabled=0|1
 */
export async function POST(request) {
    try {
        const { clientCookie, id, enabled, csrf, proxy } = await request.json();
        const agent =
            proxy && typeof proxy === 'string' && proxy.trim()
                ? new HttpsProxyAgent(proxy.trim())
                : null;

        if (!id) {
            return new Response(JSON.stringify({ error: 'Missing video ID.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        if (!csrf) {
            return new Response(JSON.stringify({ error: 'Missing CSRF token.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const enabledVal =
            enabled === true || enabled === 1 || enabled === '1' ? '1' : '0';
        const bodyRaw = `id=${encodeURIComponent(String(id))}&enabled=${enabledVal}`;

        const zaloResponse = await axios.post(
            'https://video.zalo.me/v2/public-api/video/update-contact-cta',
            bodyRaw,
            {
                headers: {
                    accept: 'application/json, text/plain, */*',
                    'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
                    origin: 'https://video.zalo.me',
                    referer: 'https://video.zalo.me/creator/video',
                    'x-csrf-token': csrf,
                    'user-agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
                    cookie: `webSession=${clientCookie}`,
                },
                ...(agent ? { httpsAgent: agent, httpAgent: agent } : {}),
            }
        );

        const payload = zaloResponse.data;
        const errCode = payload?.error;
        if (errCode !== undefined && errCode !== null && errCode !== 0 && errCode !== '0') {
            return new Response(
                JSON.stringify(
                    typeof payload === 'object' && payload
                        ? payload
                        : { error: errCode, msg: 'Zalo reject update-contact-cta' }
                ),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        return new Response(JSON.stringify(payload), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error(
            'update-contact-cta failed:',
            error?.response?.data || error.message
        );
        return new Response(
            JSON.stringify({
                error: 'Failed to update contact CTA',
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
