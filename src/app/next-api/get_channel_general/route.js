import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * Proxy Zalo channel/general?start=YYYYMMDD&end=YYYYMMDD
 * Body: { clientCookie, start?, end?, days?: 7|14|30, proxy? }
 * Default: 7 ngày (start = today-8, end = today-2) — khớp BE ZaloVideo.get_channel_general.
 */
function ymd(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
}

function defaultRange(days = 7) {
    const today = new Date();
    // BE: type1 → start today-8, end today-2 (~6–7 ngày cửa sổ)
    const offsetEnd = 2;
    const offsetStart = days === 14 ? 15 : days === 30 ? 32 : 8;
    const end = new Date(today);
    end.setDate(end.getDate() - offsetEnd);
    const start = new Date(today);
    start.setDate(start.getDate() - offsetStart);
    return { start: ymd(start), end: ymd(end) };
}

/** Kỳ trước cùng độ dài (để so sánh chart 2 đường). */
function previousRange(startYmd, endYmd) {
    const parse = (s) => {
        const y = Number(s.slice(0, 4));
        const m = Number(s.slice(4, 6)) - 1;
        const d = Number(s.slice(6, 8));
        return new Date(y, m, d);
    };
    const start = parse(startYmd);
    const end = parse(endYmd);
    const spanMs = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 24 * 3600 * 1000);
    const prevStart = new Date(prevEnd.getTime() - spanMs);
    return { start: ymd(prevStart), end: ymd(prevEnd) };
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { clientCookie, proxy, days = 7, includePrevious = true } = body ?? {};
        let { start, end } = body ?? {};

        if (!start || !end) {
            const r = defaultRange(Number(days) || 7);
            start = r.start;
            end = r.end;
        }

        const agent =
            proxy && typeof proxy === 'string' && proxy.trim()
                ? new HttpsProxyAgent(proxy.trim())
                : null;

        const headers = {
            accept: 'application/json, text/plain, */*',
            'accept-language': 'vi,en;q=0.9',
            referer: 'https://video.zalo.me/creator/phan-tich/tong-quat',
            'user-agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
            Cookie: `webSession=${clientCookie}`,
        };

        const fetchGeneral = async (s, e) => {
            const response = await axios.get(
                'https://video.zalo.me/v2/public-api/channel/general',
                {
                    params: { start: s, end: e },
                    headers,
                    ...(agent ? { httpsAgent: agent, httpAgent: agent } : {}),
                }
            );
            return response.data;
        };

        const current = await fetchGeneral(start, end);
        let previous = null;
        if (includePrevious) {
            const pr = previousRange(start, end);
            try {
                previous = await fetchGeneral(pr.start, pr.end);
            } catch {
                previous = null;
            }
        }

        // Trả full data (total + changes). FE đọc total = số chính, changes = delta.
        return new Response(
            JSON.stringify({
                start,
                end,
                current: current?.data ?? current ?? null,
                previous: previous?.data ?? previous ?? null,
                rawError: current?.error,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('get_channel_general failed:', error?.response?.data || error.message);
        return new Response(
            JSON.stringify({
                error: 'Failed to fetch channel general',
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
