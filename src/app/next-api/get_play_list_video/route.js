import axios from 'axios';
import https from 'https';
import { getProxyAgent } from '@/lib/proxy-helper';
const agent = new https.Agent({
    rejectUnauthorized: false, // Tắt SSL check (chỉ nên dùng cho debug/dev)
});

export async function POST(req) {
    try {
        const { clientCookie, number_per_page = 50, page = 1, proxy } = await req.json();
        let allData = [];
        let lastIndex = 0;
        const limitPerCall = 20; // tùy theo Zalo trả mỗi lần bao nhiêu phần tử, điều chỉnh nếu biết rõ
        const agentOptions = getProxyAgent(proxy);
        while (true) {
            const url = `https://video.zalo.me/v2/public-api/playlist/list?type=0&title=&lastIndex=${lastIndex}`;
            const response = await axios.get(url, {
                headers: {
                    'accept': 'application/json, text/plain, */*',
                    'accept-language': 'en-GB-oxendict,en;q=0.9,fr;q=0.8,vi;q=0.7,fr-FR;q=0.6,en-US;q=0.5,en-GB;q=0.4',
                    'cache-control': 'no-cache',
                    'dnt': '1',
                    'pragma': 'no-cache',
                    'priority': 'u=1, i',
                    'referer': 'https://video.zalo.me/creator/video',
                    'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
                    'Cookie': `webSession=${clientCookie}`,
                },
                ...agentOptions,
            });

            const data = response.data;
            if (data?.error === -2209) {
                // Không còn dữ liệu, dừng lại
                break;
            }

            const items = data?.data || [];
            allData = [...allData, ...items];

            // Nếu ít hơn limitPerCall thì có thể đã là cuối cùng
            if (items.length < limitPerCall) {
                break;
            }

            // Cập nhật lastIndex cho lần gọi tiếp theo
            lastIndex += items.length;
        }

        const totalItems = allData.length;
        const startIndex = (page - 1) * number_per_page;
        const endIndex = startIndex + number_per_page;
        const paginatedResults = allData.slice(startIndex, endIndex);

        const paginatedResponse = {
            count: totalItems,
            next: endIndex < totalItems ? `/next-api/get_comment_public?page=${page + 1}&number_per_page=${number_per_page}` : null,
            previous: startIndex > 0 ? `/next-api/get_comment_public?page=${page - 1}&number_per_page=${number_per_page}` : null,
            results: paginatedResults,
        };

        return new Response(JSON.stringify(paginatedResponse), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error fetching comments:', error.message);

        return new Response(
            JSON.stringify({ error: 'Failed to fetch comments', details: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
