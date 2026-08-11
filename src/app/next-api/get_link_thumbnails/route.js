import axios from 'axios';
import { getProxyAgent } from '@/lib/proxy-helper';
export async function POST(request) {
    try {
        const dataClient = await request.formData();
        const image = dataClient.get('file');
        const csrf = dataClient.get('csrf');
        const clientCookie = dataClient.get('clientCookie');
        const channelId = dataClient.get('channelId');
        const proxy = dataClient.get('proxy');
        const agentOptions = getProxyAgent(proxy);

        const formData = new FormData()
        formData.append("image", image)
        const zaloResponse = await axios.post(
            `https://video.zalo.me/upload-api/image`,
            formData,
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
                    "channel-id": channelId
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
