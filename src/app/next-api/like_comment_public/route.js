import axios from 'axios';
import { getProxyAgent } from '@/lib/proxy-helper';

export async function POST(req) {
    try {
        // Lấy clientCookie và các tham số phân trang từ body của request
        const { clientCookie, id_comment, csrf, status, proxy } = await req.json();
        const apiUrl = `https://video.zalo.me/v2/public-api/comments/${status}?cmtId=${id_comment}`;
        const agentOptions = getProxyAgent(proxy);
        // Gửi request đến API của Zalo với clientCookie
        const response = await axios.post(apiUrl, {}, // no body content, like in cURL (Content-Length: 0)
            {
                headers: {
                    'accept': 'application/json, text/plain, */*',
                    'accept-language': 'en-GB-oxendict,en;q=0.9,fr;q=0.8,vi;q=0.7,fr-FR;q=0.6,en-US;q=0.5,en-GB;q=0.4',
                    'cache-control': 'no-cache',
                    'content-length': '0',
                    'content-type': 'application/x-www-form-urlencoded',
                    'dnt': '1',
                    'origin': 'https://video.zalo.me',
                    'pragma': 'no-cache',
                    'priority': 'u=1, i',
                    'referer': 'https://video.zalo.me/creator/comment',
                    'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    "x-csrf-token": `${csrf}`,
                    'Cookie': `webSession=${clientCookie}`,
                },
                ...agentOptions,
            }
        );
        return new Response(JSON.stringify(response.data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error fetching comments:', error.message);
        // Trả về lỗi nếu request thất bại
        return new Response(
            JSON.stringify({ error: 'Failed to fetch comments', details: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}