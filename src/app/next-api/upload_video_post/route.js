// File: app/api/upload_video_post/route.js

import { NextResponse } from 'next/server';
import { HttpsProxyAgent } from 'https-proxy-agent';
import axios from 'axios';

// Define allowed MIME types for videos
const ALLOWED_MIME_TYPES = ['video/mp4', 'video/mpeg', 'video/webm'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export async function POST(req) {
    try {
        // Parse form data using Web API
        const formData = await req.formData();
        const videoFile = formData.get('video');
        const proxy = formData.get('proxy');
        const csrf = formData.get('csrf');
        const clientCookie = formData.get('clientCookie');
        const channelId = formData.get('channelId');

        // Validate inputs
        if (!videoFile || !(videoFile instanceof File)) {
            return NextResponse.json({ success: false, error: 'No video file provided' }, { status: 400 });
        }
        if (!ALLOWED_MIME_TYPES.includes(videoFile.type)) {
            return NextResponse.json({ success: false, error: 'Invalid video file type' }, { status: 400 });
        }
        if (videoFile.size > MAX_FILE_SIZE) {
            return NextResponse.json({ success: false, error: 'File size exceeds 100MB' }, { status: 400 });
        }
        if (!csrf || !clientCookie) {
            return NextResponse.json({ success: false, error: 'Missing CSRF token or cookie' }, { status: 400 });
        }

        // Create FormData for Zalo API
        const apiFormData = new FormData();
        apiFormData.append('video', videoFile);

        // Make request to Zalo API
        const agent = new HttpsProxyAgent(proxy);
        const zaloResponse = await axios.post('https://video.zalo.me/upload-api/video', apiFormData, {
            headers: {
                accept: 'application/json, text/plain, */*',
                host: "video.zalo.me",
                origin: 'https://video.zalo.me',
                'Accept-encoding': 'gzip',
                'Connection': 'Keep-Alive',
                'Referer': 'https://video.zalo.me/creator/video?type=public',
                'Channel-id': channelId,
                'x-csrf-token': csrf,
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
                cookie: `webSession=${clientCookie}`,
            },
            httpsAgent: agent,
            maxBodyLength: Infinity,
        });
        return NextResponse.json({ success: true, data: zaloResponse.data.data }, { status: 200 });
    } catch (error) {
        console.error('Upload error:', error);
        const status = error.isAxiosError && error.response ? error.response.status : 500;
        const message = error.isAxiosError && error.response?.data ? error.response.data : 'Upload failed';
        return NextResponse.json({ success: false, error: message }, { status });
    }
}