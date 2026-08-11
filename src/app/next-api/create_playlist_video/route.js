import axios from 'axios';
import { getProxyAgent } from '@/lib/proxy-helper';
export async function POST(request) {
    try {
        const { clientCookie, title, csrf, status, videoIds, proxy } = await request.json();
        const agentOptions = getProxyAgent(proxy);
      
        const bodyRaw = `title=${encodeURIComponent(title)}&privacy=${encodeURIComponent(status)}&videoIds=${encodeURIComponent(videoIds)}`;
        const zaloResponse = await axios.post(
            `https://video.zalo.me/v2/public-api/playlist`,
            bodyRaw,
            {
                headers: {
                    'accept': 'application/json, text/plain, */*',
                    'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
                    'origin': 'https://video.zalo.me',
                    'referer': 'https://video.zalo.me/creator/video?type=public',
                    'x-csrf-token': csrf,
                    'user-agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
                    'cookie': `webSession=${clientCookie}`,
                },
                ...agentOptions, 
            }
        );
        return new Response(JSON.stringify(zaloResponse.data), {
            status: 200,
        });
    } catch (error) {
        console.error('Zalo delete failed:', error?.response?.data || error.message);
        return new Response(
            JSON.stringify({ error: error?.response?.data || 'Internal Server Error' }),
            {
                status: error?.response?.status || 500,
            }
        );
    }
}
