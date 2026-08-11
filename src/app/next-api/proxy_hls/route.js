import axios from 'axios';

/**
 * Proxy HLS (m3u8 + .ts) — CORS + Range (quan trọng).
 *
 * Bug cũ: bỏ Range header → trả full body 200 khi browser xin bytes=N-
 * → MSE/hls.js vỡ buffer, video dừng giữa chừng (vd 8s/11s trên clip 13s).
 *
 * m3u8 Zalo dùng URI protocol-relative: //cdn.../seg.ts?authen=...
 */

function isAllowedStreamUrl(raw) {
    try {
        const u = new URL(raw.startsWith('//') ? `https:${raw}` : raw);
        if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
        const host = u.hostname.toLowerCase();
        if (host.endsWith('.zmdcdn.me') || host === 'zmdcdn.me') return true;
        if (host.includes('zchannel') && host.endsWith('.me')) return true;
        if (host.includes('zadn.vn')) return true;
        return false;
    } catch {
        return false;
    }
}

function toAbsoluteUrl(line, playlistUrl) {
    const t = line.trim();
    if (!t) return t;
    if (t.startsWith('//')) return `https:${t}`;
    try {
        return new URL(t, playlistUrl).href;
    } catch {
        return t;
    }
}

function proxyPath(absoluteUrl, reqUrl) {
    const base = new URL(reqUrl);
    // relative path — tránh hardcode host khi rewrite m3u8
    return `/next-api/proxy_hls?url=${encodeURIComponent(absoluteUrl)}`;
}

function rewriteM3u8(body, playlistUrl) {
    return body
        .split(/\r?\n/)
        .map((line) => {
            const trimmed = line.trim();
            if (!trimmed) return line;

            if (trimmed.startsWith('#')) {
                if (!/URI="/i.test(trimmed)) return line;
                return trimmed.replace(/URI="([^"]+)"/gi, (_, uri) => {
                    try {
                        const abs = toAbsoluteUrl(uri, playlistUrl);
                        if (!isAllowedStreamUrl(abs)) return `URI="${uri}"`;
                        return `URI="${proxyPath(abs)}"`;
                    } catch {
                        return `URI="${uri}"`;
                    }
                });
            }

            try {
                const abs = toAbsoluteUrl(trimmed, playlistUrl);
                if (!isAllowedStreamUrl(abs)) return line;
                return proxyPath(abs);
            } catch {
                return line;
            }
        })
        .join('\n');
}

function pickHeader(headers, name) {
    if (!headers) return undefined;
    const lower = name.toLowerCase();
    for (const [k, v] of Object.entries(headers)) {
        if (k.toLowerCase() === lower) {
            return Array.isArray(v) ? v[0] : v;
        }
    }
    return undefined;
}

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': 'Range, Content-Type, Accept',
            'Access-Control-Expose-Headers':
                'Content-Length, Content-Range, Accept-Ranges, Content-Type',
            'Access-Control-Max-Age': '86400',
        },
    });
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        let target = searchParams.get('url');
        if (!target) {
            return new Response(JSON.stringify({ error: 'Missing url' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        // protocol-relative passed as query
        if (target.startsWith('//')) target = `https:${target}`;

        if (!isAllowedStreamUrl(target)) {
            return new Response(JSON.stringify({ error: 'URL not allowed' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const isPlaylist = /\.m3u8(\?|$)/i.test(target);
        const range = req.headers.get('range') || req.headers.get('Range') || undefined;

        const upstreamHeaders = {
            accept: '*/*',
            referer: 'https://video.zalo.me/',
            origin: 'https://video.zalo.me',
            'user-agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
        };
        // Forward Range cho .ts — hls.js / MSE xin partial
        if (range && !isPlaylist) {
            upstreamHeaders.Range = range;
        }

        const upstream = await axios.get(target, {
            responseType: isPlaylist ? 'text' : 'arraybuffer',
            timeout: 90000,
            maxRedirects: 5,
            headers: upstreamHeaders,
            // 206 Partial Content
            validateStatus: (s) => (s >= 200 && s < 400) || s === 206,
        });

        // URL sau redirect (CDN edge) — base rewrite m3u8
        const finalUrl =
            upstream.request?.res?.responseUrl ||
            upstream.request?.responseURL ||
            target;

        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Expose-Headers':
                'Content-Length, Content-Range, Accept-Ranges, Content-Type',
            'Accept-Ranges': 'bytes',
        };

        if (isPlaylist) {
            const text =
                typeof upstream.data === 'string'
                    ? upstream.data
                    : Buffer.from(upstream.data).toString('utf8');
            if (!text || !text.includes('#EXTM3U')) {
                return new Response(
                    JSON.stringify({
                        error: 'Empty or invalid m3u8 from CDN',
                        status: upstream.status,
                    }),
                    { status: 502, headers: { 'Content-Type': 'application/json' } }
                );
            }
            const rewritten = rewriteM3u8(text, finalUrl);
            return new Response(rewritten, {
                status: 200,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/vnd.apple.mpegurl',
                    'Cache-Control': 'private, no-store',
                },
            });
        }

        const buf = Buffer.from(upstream.data);
        const ct =
            pickHeader(upstream.headers, 'content-type') ||
            (/\.ts(\?|$)/i.test(target) ? 'video/mp2t' : 'application/octet-stream');

        const status = upstream.status === 206 ? 206 : 200;
        const outHeaders = {
            ...corsHeaders,
            'Content-Type': ct,
            'Cache-Control': 'private, max-age=60',
            'Content-Length': String(buf.length),
        };

        const contentRange = pickHeader(upstream.headers, 'content-range');
        if (contentRange) {
            outHeaders['Content-Range'] = contentRange;
        } else if (range && status === 200) {
            // Upstream bỏ Range — client xin partial nhưng nhận full.
            // Trả full 200 + length; KHÔNG cắt sai offset (tránh corrupt).
            // hls.js chấp nhận 200 full khi xin Range.
        }

        return new Response(buf, {
            status,
            headers: outHeaders,
        });
    } catch (error) {
        console.error(
            'proxy_hls failed:',
            error?.response?.status || error.message,
            error?.config?.url?.slice?.(0, 80)
        );
        return new Response(
            JSON.stringify({
                error: 'Failed to proxy HLS',
                details: error.message,
                status: error?.response?.status,
            }),
            {
                status: error?.response?.status || 502,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            }
        );
    }
}
