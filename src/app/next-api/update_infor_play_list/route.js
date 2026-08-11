import axios from 'axios';
import { getProxyAgent } from '@/lib/proxy-helper';
export async function POST(request) {
    try {
        const { clientCookie, title, csrf, status, id, proxy } = await request.json();
        const agentOptions = getProxyAgent(proxy);
        if (!title) {
            return new Response(JSON.stringify({ error: 'Missing video ID.' }), {
                status: 400,
            });
        }
        const bodyRaw = `title=${encodeURIComponent(title)}&privacy=${encodeURIComponent(status)}&id=${encodeURIComponent(id)}`;
        const zaloResponse = await axios.post(
            `https://video.zalo.me/v2/public-api/playlist/update`,
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



// import axios from 'axios';
// import { getProxyAgent } from '@/lib/proxy-helper';

// export async function POST(request) {
//     try {
//         const { clientCookie, title, csrf, status, id } = await request.json();
//         if (!title) {
//             return new Response(JSON.stringify({ error: 'Missing video ID.' }), {
//                 status: 400,
//             });
//         }

//         // Cấu hình proxy
//         const proxy = 'http://2008qgshby:2008qgshby@157.10.194.218:15805';
//         const agentOptions = getProxyAgent(proxy);

//         const bodyRaw = `title=${encodeURIComponent(title)}&privacy=${encodeURIComponent(status)}&id=${encodeURIComponent(id)}`;
//         const zaloResponse = await axios.post(
//             `https://video.zalo.me/v2/public-api/playlist/update`,
//             bodyRaw,
//             {
//                 headers: {
//                     'accept': 'application/json, text/plain, */*',
//                     'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
//                     'origin': 'https://video.zalo.me',
//                     'referer': 'https://video.zalo.me/creator/video?type=public',
//                     'x-csrf-token': csrf,
//                     'user-agent':
//                         'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
//                     'cookie': `webSession=${clientCookie}`,
//                 },
//                 // Thêm proxy agent vào cấu hình axios
//                 ...agentOptions,
//                  // Nếu API dùng HTTP thay vì HTTPS
//             }
//         );

//         return new Response(JSON.stringify(zaloResponse.data), {
//             status: 200,
//         });
//     } catch (error) {
//         console.error('Zalo delete failed:', error?.response?.data || error.message);
//         return new Response(
//             JSON.stringify({ error: error?.response?.data || 'Internal Server Error' }),
//             {
//                 status: error?.response?.status || 500,
//             }
//         );
//     }
// }