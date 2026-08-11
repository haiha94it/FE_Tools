import axios from 'axios';
import { getProxyAgent } from '@/lib/proxy-helper';
export async function POST(req) {
    try {
        // Lấy clientCookie và các tham số phân trang từ body của request
        const { clientCookie, number_per_page = 50, page = 1, status, proxy } = await req.json();
        const agentOptions = getProxyAgent(proxy);
        // Gửi request đến API của Zalo với clientCookie
        const response = await axios.get(`https://video.zalo.me/v2/public-api/video/${status === "public" ? "list" : status === "private" ? "private-list" : "scheduled-list"}`, {
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
        const allVideo = response?.data?.data?.videos || response?.data?.data || [];
        const totalComments = allVideo.length;
        // Tính toán phân trang
        const startIndex = (page - 1) * number_per_page;
        const endIndex = startIndex + number_per_page;
        const paginatedResults = allVideo.slice(startIndex, endIndex);

        // Tạo cấu trúc dữ liệu phân trang
        const paginatedResponse = {
            count: totalComments,
            next: endIndex < totalComments ? `/next-api/get_list_video_public?page=${page + 1}&number_per_page=${number_per_page}` : null,
            previous: startIndex > 0 ? `/next-api/get_list_video_public?page=${page - 1}&number_per_page=${number_per_page}` : null,
            results: paginatedResults,
        };

        // Trả về dữ liệu phân trang
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