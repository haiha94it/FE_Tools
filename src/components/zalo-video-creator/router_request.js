'use client';

import { toast } from 'react-toastify';
import { formatProxy } from '@/const/convertProxy';

export const likeCommentVideo = async (id_comment, refetch, params, status) => {
    const csrfDataRaw = localStorage.getItem('csrfZaloData');
    const csrfData = JSON.parse(csrfDataRaw);
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const clientCookie = storedDataFb?.filter(
            (item) => item.id === Number(params.account),
        )[0]?.webSession;
        const proxy = formatProxy(
            storedDataFb?.filter((item) => item.id === Number(params.account))[0]
                ?.proxy?.proxy,
        );
        const response = await fetch('/next-api/like_comment_public', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientCookie,
                id_comment: id_comment,
                csrf: csrfData.token,
                status,
                proxy,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch video list');
        }
        if (refetch) {
            refetch();
        }
    } catch (error) {
        console.error('Error fetching video list:', error.message);
    }
};
export const getInforVideo = async (id_video, params, setData) => {
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const clientCookie = storedDataFb?.filter(
            (item) => item.id === Number(params.account),
        )[0]?.webSession;
        const proxy = formatProxy(
            storedDataFb?.filter((item) => item.id === Number(params.account))[0]
                ?.proxy?.proxy,
        );
        const response = await fetch('/next-api/get_infor_video', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientCookie,
                id_video: id_video,
                proxy,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch video list');
        }
        if (setData) {
            setData(await response.json());
        }
    } catch (error) {
        console.error('Error fetching video list:', error.message);
    }
};

export const getListCommentIsVideo = async (id_video, params, setData) => {
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const clientCookie = storedDataFb?.filter(
            (item) => item.id === Number(params.account),
        )[0]?.webSession;
        const proxy = formatProxy(
            storedDataFb?.filter((item) => item.id === Number(params.account))[0]
                ?.proxy?.proxy,
        );
        const response = await fetch('/next-api/get_list_comment_is_video', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientCookie,
                id_video: id_video,
                proxy,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch video list');
        }
        if (setData) {
            setData(await response.json());
        }
    } catch (error) {
        console.error('Error fetching video list:', error.message);
    }
};

export const getCsrfToken = async (params) => {
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const clientCookie = storedDataFb?.find(
            (item) => item.id === Number(params.account),
        )?.webSession;
        let proxy;
        try {
            const rawProxy = storedDataFb?.find(
                (item) => item.id === Number(params.account),
            )?.proxy?.proxy;
            proxy = rawProxy ? formatProxy(rawProxy) : undefined;
        } catch {
            proxy = undefined;
        }
        const response = await fetch('/next-api/get_csrf_token_zl', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ clientCookie, proxy }),
        });

        const text = await response.text();
        if (!response.ok || !text?.trim()) {
            throw new Error('Failed to fetch CSRF token');
        }
        const result = JSON.parse(text);
        localStorage.setItem('csrfZaloData', JSON.stringify(result));
    } catch (error) {
        console.error('Error fetching CSRF token:', error.message);
    }
};
export const deleteCommentVideo = async (id_comment, refetch, params) => {
    const csrfDataRaw = localStorage.getItem('csrfZaloData');
    const csrfData = JSON.parse(csrfDataRaw);
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const clientCookie = storedDataFb?.filter(
            (item) => item.id === Number(params.account),
        )[0]?.webSession;
        const proxy = formatProxy(
            storedDataFb?.filter((item) => item.id === Number(params.account))[0]
                ?.proxy?.proxy,
        );

        const response = await fetch('/next-api/delete_comments_video', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientCookie,
                id_comment: id_comment,
                csrf: csrfData.token,
                proxy,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch video list');
        }
        if (refetch) {
            refetch();
        }
    } catch (error) {
        console.error('Error fetching video list:', error.message);
    }
};

export const deleteVideo = async (id_video, refetch, params) => {
    const csrfDataRaw = localStorage.getItem('csrfZaloData');
    const csrfData = JSON.parse(csrfDataRaw);
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const proxy = formatProxy(
            storedDataFb?.filter((item) => item.id === Number(params.account))[0]
                ?.proxy?.proxy,
        );
        const clientCookie = storedDataFb?.filter(
            (item) => item.id === Number(params.account),
        )[0]?.webSession;
        const response = await fetch('/next-api/delete_video', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientCookie,
                id: id_video,
                csrf: csrfData.token,
                proxy,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch video list');
        }
        if (refetch) {
            refetch();
        }
    } catch (error) {
        console.error('Error fetching video list:', error.message);
    }
};
export const pinVideo = async (id_video, refetch, params, status) => {
    const csrfDataRaw = localStorage.getItem('csrfZaloData');
    const csrfData = JSON.parse(csrfDataRaw);
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const clientCookie = storedDataFb?.filter(
            (item) => item.id === Number(params.account),
        )[0]?.webSession;
        const proxy = formatProxy(
            storedDataFb?.filter((item) => item.id === Number(params.account))[0]
                ?.proxy?.proxy,
        );
        const response = await fetch('/next-api/pin_video', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientCookie,
                id: id_video,
                csrf: csrfData.token,
                status,
                proxy,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch video list');
        }
        if (refetch) {
            refetch();
        }
    } catch (error) {
        console.error('Error fetching video list:', error.message);
    }
};

export const lockComment = async (id_video, refetch, params, status) => {
    const csrfDataRaw = localStorage.getItem('csrfZaloData');
    const csrfData = JSON.parse(csrfDataRaw);
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const clientCookie = storedDataFb?.filter(
            (item) => item.id === Number(params.account),
        )[0]?.webSession;
        const proxy = formatProxy(
            storedDataFb?.filter((item) => item.id === Number(params.account))[0]
                ?.proxy?.proxy,
        );

        const response = await fetch('/next-api/lock_comment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientCookie,
                id: id_video,
                csrf: csrfData.token,
                status,
                proxy,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch video list');
        }
        if (refetch) {
            refetch();
        }
    } catch (error) {
        console.error('Error fetching video list:', error.message);
    }
};

export const updateStatusViewVideo = async (
    id_video,
    refetch,
    params,
    status,
) => {
    const csrfDataRaw = localStorage.getItem('csrfZaloData');
    const csrfData = JSON.parse(csrfDataRaw);
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const clientCookie = storedDataFb?.filter(
            (item) => item.id === Number(params.account),
        )[0]?.webSession;
        const proxy = formatProxy(
            storedDataFb?.filter((item) => item.id === Number(params.account))[0]
                ?.proxy?.proxy,
        );

        const response = await fetch('/next-api/update_private_video', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientCookie,
                id: id_video,
                csrf: csrfData.token,
                status,
                proxy,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch video list');
        }
        if (refetch) {
            refetch();
        }
    } catch (error) {
        console.error('Error fetching video list:', error.message);
    }
};
export const getInforDaily = async (params, setData) => {
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const clientCookie = storedDataFb?.find(
            (item) => item.id === Number(params.account),
        )?.webSession;

        const response = await fetch('/next-api/get_csrf_token_zl', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ clientCookie }),
        });

        const text = await response.text();
        if (!response.ok || !text?.trim()) {
            throw new Error('Failed to fetch CSRF token');
        }
        const result = JSON.parse(text);
        if (setData) {
            setData(result);
        }
    } catch (error) {
        console.error('Error fetching CSRF token:', error.message);
    }
};
export const updateStatusPlaylist = async (
    id_playlist,
    refetch,
    params,
    status,
) => {
    const csrfDataRaw = localStorage.getItem('csrfZaloData');
    const csrfData = JSON.parse(csrfDataRaw);
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const clientCookie = storedDataFb?.filter(
            (item) => item.id === Number(params.account),
        )[0]?.webSession;
        const proxy = formatProxy(
            storedDataFb?.filter((item) => item.id === Number(params.account))[0]
                ?.proxy?.proxy,
        );
        const response = await fetch('/next-api/update_status_play_list', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientCookie,
                id: id_playlist,
                csrf: csrfData.token,
                status,
                proxy,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch video list');
        }
        if (refetch) {
            refetch();
        }
    } catch (error) {
        console.error('Error fetching video list:', error.message);
    }
};
export const deletePlaylist = async (id_playlist, refetch, params) => {
    const csrfDataRaw = localStorage.getItem('csrfZaloData');
    const csrfData = JSON.parse(csrfDataRaw);
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const clientCookie = storedDataFb?.filter(
            (item) => item.id === Number(params.account),
        )[0]?.webSession;
        const proxy = formatProxy(
            storedDataFb?.filter((item) => item.id === Number(params.account))[0]
                ?.proxy?.proxy,
        );
        const response = await fetch('/next-api/delete_playlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientCookie,
                id: id_playlist,
                csrf: csrfData.token,
                proxy,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch video list');
        }
        if (refetch) {
            refetch();
        }
    } catch (error) {
        console.error('Error fetching video list:', error.message);
    }
};

export const createPlaylistVideo = async (
    title,
    refetch,
    params,
    status,
    videoIds,
) => {
    const csrfDataRaw = localStorage.getItem('csrfZaloData');
    const csrfData = JSON.parse(csrfDataRaw);
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const clientCookie = storedDataFb?.filter(
            (item) => item.id === Number(params.account),
        )[0]?.webSession;
        const proxy = formatProxy(
            storedDataFb?.filter((item) => item.id === Number(params.account))[0]
                ?.proxy?.proxy,
        );
        const response = await fetch('/next-api/create_playlist_video', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientCookie,
                title: title,
                csrf: csrfData.token,
                status,
                videoIds,
                proxy,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch video list');
        }
        if (refetch) {
            refetch();
        }
    } catch (error) {
        console.error('Error fetching video list:', error.message);
    }
};

export const getVideoInPlayList = async (params, setData, id) => {
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const clientCookie = storedDataFb?.find(
            (item) => item.id === Number(params.account),
        )?.webSession;
        const proxy = formatProxy(
            storedDataFb?.filter((item) => item.id === Number(params.account))[0]
                ?.proxy?.proxy,
        );
        const response = await fetch('/next-api/get_video_in_play_list', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ clientCookie, id, proxy }),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch CSRF token');
        }

        const result = await response.json();
        if (setData) {
            setData(result);
        }
    } catch (error) {
        console.error('Error fetching CSRF token:', error.message);
    }
};

export const updatePlaylistVideo = async (
    title,
    refetch,
    params,
    status,
    id,
) => {
    const csrfDataRaw = localStorage.getItem('csrfZaloData');
    const csrfData = JSON.parse(csrfDataRaw);
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const clientCookie = storedDataFb?.filter(
            (item) => item.id === Number(params.account),
        )[0]?.webSession;
        const proxy = formatProxy(
            storedDataFb?.filter((item) => item.id === Number(params.account))[0]
                ?.proxy?.proxy,
        );
        const response = await fetch('/next-api/update_infor_play_list', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientCookie,
                title: title,
                csrf: csrfData.token,
                status,
                id,
                proxy,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch video list');
        }
        if (refetch) {
            refetch();
        }
    } catch (error) {
        console.error('Error fetching video list:', error.message);
    }
};
export const updatePlaylistVideos = async (refetch, params, videoIds, id) => {
    const csrfDataRaw = localStorage.getItem('csrfZaloData');
    const csrfData = JSON.parse(csrfDataRaw);
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const clientCookie = storedDataFb?.filter(
            (item) => item.id === Number(params.account),
        )[0]?.webSession;
        const proxy = formatProxy(
            storedDataFb?.filter((item) => item.id === Number(params.account))[0]
                ?.proxy?.proxy,
        );
        const response = await fetch('/next-api/update_infor_play_list_video', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientCookie,
                csrf: csrfData.token,
                id,
                videoIds,
                proxy,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch video list');
        }
        if (refetch) {
            refetch();
        }
    } catch (error) {
        console.error('Error fetching video list:', error.message);
    }
};
export const removeVideoPlaylist = async (refetch, params, videoIds, id) => {
    const csrfDataRaw = localStorage.getItem('csrfZaloData');
    const csrfData = JSON.parse(csrfDataRaw);
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const clientCookie = storedDataFb?.filter(
            (item) => item.id === Number(params.account),
        )[0]?.webSession;
        const proxy = formatProxy(
            storedDataFb?.filter((item) => item.id === Number(params.account))[0]
                ?.proxy?.proxy,
        );
        const response = await fetch('/next-api/remove_video_play_list', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientCookie,
                csrf: csrfData.token,
                id,
                videoIds,
                proxy,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch video list');
        }
        if (refetch) {
            refetch();
        }
    } catch (error) {
        console.error('Error fetching video list:', error.message);
    }
};

export const postCommentsVideo = async (
    refetch,
    params,
    id_attach,
    content,
    id_video,
) => {
    const csrfDataRaw = localStorage.getItem('csrfZaloData');
    const csrfData = JSON.parse(csrfDataRaw);
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const clientCookie = storedDataFb?.filter(
            (item) => item.id === Number(params.account),
        )[0]?.webSession;
        const proxy = formatProxy(
            storedDataFb?.filter((item) => item.id === Number(params.account))[0]
                ?.proxy?.proxy,
        );
        const response = await fetch('/next-api/post_comments_video', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientCookie,
                csrf: csrfData.token,
                id_attach,
                content,
                id_video,
                proxy,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch video list');
        }
        if (refetch) {
            refetch();
        }
    } catch (error) {
        console.error('Error fetching video list:', error.message);
    }
};
export const postReplyCommentsVideo = async (
    refetch,
    params,
    id_attach,
    content,
    id_cmt,
) => {
    const csrfDataRaw = localStorage.getItem('csrfZaloData');
    const csrfData = JSON.parse(csrfDataRaw);
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const clientCookie = storedDataFb?.filter(
            (item) => item.id === Number(params.account),
        )[0]?.webSession;
        const proxy = formatProxy(
            storedDataFb?.filter((item) => item.id === Number(params.account))[0]
                ?.proxy?.proxy,
        );
        const response = await fetch('/next-api/post_reply_comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientCookie,
                csrf: csrfData.token,
                id_attach,
                content,
                id_cmt,
                proxy,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch video list');
        }
        if (refetch) {
            refetch();
        }
    } catch (error) {
        console.error('Error fetching video list:', error.message);
    }
};

export const getLinkImageThumbnail = async (
    channelId,
    files,
    clientCookie,
    csrfData,
    proxy,
    refetch,
) => {
    try {
        const formData = new FormData();
        formData.append('image', files);
        formData.append('clientCookie', clientCookie);
        formData.append('csrf', csrfData.token);
        formData.append('proxy', proxy);
        formData.append('channelId', channelId);
        const res = await fetch('/next-api/get_link_image_thumbnail', {
            method: 'POST',
            body: formData,
        });
        const result = await res.json();
        if (refetch) {
            refetch(result);
        }
    } catch (error) {
        console.error('Error fetching video list:', error.message);
    }
};

export const getLinkVideoZl = async (
    channelId,
    videoInput, // Có thể là URL (string) hoặc File object
    clientCookie,
    csrfData,
    proxy,
    refetch,
) => {
    try {
        let file;
        if (typeof videoInput === 'string') {
            // Fetch video from URL
            const response = await fetch(videoInput, {
                method: 'GET',
                headers: {
                    // Có thể thêm headers nếu URL yêu cầu xác thực
                    // 'Authorization': 'Bearer your-token',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch video from URL: ${response.statusText}`);
            }

            // Convert response to Blob
            const blob = await response.blob();

            // Create File object from Blob
            const fileName = videoInput.split('/').pop() || 'video.mp4'; // Lấy tên file từ URL hoặc mặc định
            file = new File([blob], fileName, { type: blob.type || 'video/mp4' });
        } else if (videoInput instanceof File) {
            // Nếu đã là File object, sử dụng trực tiếp
            file = videoInput;
        } else {
            throw new Error('Invalid video input: Must be a URL string or File object');
        }

        // Validate file
        const ALLOWED_MIME_TYPES = ['video/mp4', 'video/mpeg', 'video/webm'];
        const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            throw new Error('Invalid video file type');
        }
        if (file.size > MAX_FILE_SIZE) {
            throw new Error('Video size exceeds 100MB');
        }

        // Prepare FormData
        const formData = new FormData();
        formData.append('video', file);
        formData.append('clientCookie', clientCookie);
        formData.append('channelId', channelId);
        formData.append('csrf', csrfData.token);
        formData.append('proxy', proxy);

        // Send to API
        const res = await fetch('/next-api/upload_video_post', {
            method: 'POST',
            body: formData,
        });

        const result = await res.json();
        if (!res.ok) {
            throw new Error(result.error || 'Failed to upload video');
        }

        if (refetch) {
            refetch(result);
        }

        return result; // Trả về result để sử dụng nếu cần
    } catch (error) {
        console.error('Error fetching video list:', error.message);
        throw error; // Ném lỗi để xử lý ở nơi gọi hàm
    }
};

export const postVideoCreators = async (
    zmcId,
    caption,
    thumbnail,
    publicTime,
    md5Checksum,
    params,
    refetch
) => {
    const csrfDataRaw = localStorage.getItem('csrfZaloData');
    const csrfData = JSON.parse(csrfDataRaw);
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const clientCookie = storedDataFb?.filter(
            (item) => item.id === Number(params.account),
        )[0]?.webSession;
        const proxy = formatProxy(
            storedDataFb?.filter((item) => item.id === Number(params.account))[0]
                ?.proxy?.proxy,
        );
        const response = await fetch('/next-api/post_video_creators', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientCookie,
                csrf: csrfData.token,
                zmcId,
                caption,
                thumbnail,
                md5Checksum,
                publicTime,
                proxy,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch video list');
        }
        if (refetch) {
            refetch();
        }
    } catch (error) {
        console.error('Error fetching video list:', error.message);
    }
};


export const getInforPage = async (params, setData) => {
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const clientCookie = storedDataFb?.filter(
            (item) => item.id === Number(params.account),
        )[0]?.webSession;
        const proxy = formatProxy(
            storedDataFb?.filter((item) => item.id === Number(params.account))[0]
                ?.proxy?.proxy,
        );
        const response = await fetch('/next-api/get_page_infor', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientCookie,
                proxy,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch video list');
        }
        if (setData) {
            setData(await response.json());
        }
    } catch (error) {
        console.error('Error fetching video list:', error.message);
    }
};


export const createPageInfor = async (
    name,
    params,
    description,
    showed,
) => {
    const csrfDataRaw = localStorage.getItem('csrfZaloData');
    const csrfData = JSON.parse(csrfDataRaw);
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const clientCookie = storedDataFb?.filter(
            (item) => item.id === Number(params.account),
        )[0]?.webSession;
        const proxy = formatProxy(
            storedDataFb?.filter((item) => item.id === Number(params.account))[0]
                ?.proxy?.proxy,
        );
        const response = await fetch('/next-api/create_page_infor', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientCookie,
                name: name,
                csrf: csrfData.token,
                description,
                showed,
                proxy,
            }),
        });
        const data = await response.json();
        if (data.error || data?.error === -2400) {
            toast.error(data?.msg)
        }
        return data
    } catch (error) {
        console.error('Error fetching video list:', error.message);
    }
};


export const getListProductsPage = async (params, setData, title) => {
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const clientCookie = storedDataFb?.filter(
            (item) => item.id === Number(params.account),
        )[0]?.webSession;
        const proxy = formatProxy(
            storedDataFb?.filter((item) => item.id === Number(params.account))[0]
                ?.proxy?.proxy,
        );
        const response = await fetch('/next-api/get_list_products_page', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientCookie,
                proxy,
                title
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch video list');
        }
        const res = await response.json()
        if (setData) {
            if (Array.isArray(res)) {
                setData(res);
            } else if (res?.data && Array.isArray(res.data)) {
                setData(res.data);
            } else {
                setData([]);
            }
        }
    } catch (error) {
        console.error('Error fetching video list:', error.message);
    }
};


export const getLinkThumbnalsProducts = async (file, params, channelId, setLinkImage) => {
    const csrfDataRaw = localStorage.getItem('csrfZaloData');
    const csrfData = JSON.parse(csrfDataRaw);
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const account = storedDataFb?.find(item => item.id === Number(params.account));
        const clientCookie = account?.webSession;
        const proxy = formatProxy(account?.proxy?.proxy);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("clientCookie", clientCookie || "");
        formData.append("csrf", csrfData?.token || "");
        formData.append("proxy", proxy || "");
        formData.append("channelId", channelId || "");

        const response = await fetch('/next-api/get_link_thumbnails', {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (data?.error && data.error !== 0) {
            toast.error(data?.msg);
        }
        setLinkImage(data?.data)
        return data;
    } catch (error) {
        console.error('Error fetching video list:', error);
        toast.error('Không thể lấy link thumbnail');
    }
};


export const createNewProductsPage = async (
    name,
    params,
    privacy,
    ctaType,
    link,
    thumbnails,
    keyUpdate,
    itemId,
    setRfProducts
) => {
    const csrfDataRaw = localStorage.getItem('csrfZaloData');
    const csrfData = JSON.parse(csrfDataRaw);
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const clientCookie = storedDataFb?.filter(
            (item) => item.id === Number(params.account),
        )[0]?.webSession;
        const proxy = formatProxy(
            storedDataFb?.filter((item) => item.id === Number(params.account))[0]
                ?.proxy?.proxy,
        );
        const response = await fetch('/next-api/create_new_products_page', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientCookie,
                name: name,
                csrf: csrfData.token,
                privacy,
                ctaType,
                link,
                thumbnails,
                proxy,
                keyUpdate,
                itemId
            }),
        });
        const data = await response.json();
        setRfProducts((pre) => !pre)
        if (data.error || data?.error === -2400) {
            toast.error(data?.msg)
        }
        return data
    } catch (error) {
        console.error('Error fetching video list:', error.message);
    }
};

export const deleteProductsPage = async (
    params,
    videoId,
    setRfProducts,
    customText
) => {
    const csrfDataRaw = localStorage.getItem('csrfZaloData');
    const csrfData = JSON.parse(csrfDataRaw);
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const clientCookie = storedDataFb?.filter(
            (item) => item.id === Number(params.account),
        )[0]?.webSession;
        const proxy = formatProxy(
            storedDataFb?.filter((item) => item.id === Number(params.account))[0]
                ?.proxy?.proxy,
        );
        const response = await fetch('/next-api/delete_product_page', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientCookie,
                csrf: csrfData.token,
                videoId,
                proxy,
                customText
            }),
        });
        const data = await response.json();
        setRfProducts((pre) => !pre)
        if (data.error || data?.error === -2400) {
            toast.error(data?.msg)
        }
        return data
    } catch (error) {
        console.error('Error fetching video list:', error.message);
    }
};


export const getListCategoryProducts = async (params, setData) => {
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const clientCookie = storedDataFb?.filter(
            (item) => item.id === Number(params.account),
        )[0]?.webSession;
        const proxy = formatProxy(
            storedDataFb?.filter((item) => item.id === Number(params.account))[0]
                ?.proxy?.proxy,
        );
        const response = await fetch('/next-api/get_list_category_products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientCookie,
                proxy,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch video list');
        }
        const res = await response.json()
        if (setData) {
            if (Array.isArray(res)) {
                setData(res);
            } else if (res?.data && Array.isArray(res.data)) {
                setData(res.data);
            } else {
                setData([]);
            }
        }
    } catch (error) {
        console.error('Error fetching video list:', error.message);
    }
};


export const getListVideoProducts = async (params, setData) => {
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const clientCookie = storedDataFb?.filter(
            (item) => item.id === Number(params.account),
        )[0]?.webSession;
        const proxy = formatProxy(
            storedDataFb?.filter((item) => item.id === Number(params.account))[0]
                ?.proxy?.proxy,
        );
        const response = await fetch('/next-api/get_list_video_category_creator', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientCookie,
                proxy,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch video list');
        }
        const res = await response.json()
        if (setData) {
            if (Array.isArray(res)) {
                setData(res);
            } else if (res?.data && Array.isArray(res.data)) {
                setData(res.data);
            } else {
                setData([]);
            }
        }
    } catch (error) {
        console.error('Error fetching video list:', error.message);
    }
};

export const addLabelContactCta = async (
    params,
    customText,
    videoId,
    type,
    getData
) => {
    const csrfDataRaw = localStorage.getItem('csrfZaloData');
    const csrfData = JSON.parse(csrfDataRaw);
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const clientCookie = storedDataFb?.filter(
            (item) => item.id === Number(params.account),
        )[0]?.webSession;
        const proxy = formatProxy(
            storedDataFb?.filter((item) => item.id === Number(params.account))[0]
                ?.proxy?.proxy,
        );
        const response = await fetch('/next-api/add_contact_label_cta', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientCookie,
                csrf: csrfData.token,
                videoId,
                proxy,
                customText,
                type
            }),
        });
        getData()
        const data = await response.json();
        if (data.error || data?.error === -2400) {
            toast.error(data?.msg)
        }
        return data
    } catch (error) {
        console.error('Error fetching video list:', error.message);
    }
};


export const deleteLabelContactCta = async (
    params,
    ctaType,
    videoId,
    type,
    getData
) => {
    const csrfDataRaw = localStorage.getItem('csrfZaloData');
    const csrfData = JSON.parse(csrfDataRaw);
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const clientCookie = storedDataFb?.filter(
            (item) => item.id === Number(params.account),
        )[0]?.webSession;
        const proxy = formatProxy(
            storedDataFb?.filter((item) => item.id === Number(params.account))[0]
                ?.proxy?.proxy,
        );
        const response = await fetch('/next-api/delete_label_category', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientCookie,
                csrf: csrfData.token,
                videoId,
                proxy,
                ctaType,
                type
            }),
        });
        getData()
        const data = await response.json();
        if (data.error || data?.error === -2400) {
            toast.error(data?.msg)
        }
        return data
    } catch (error) {
        console.error('Error fetching video list:', error.message);
    }
};


export const updateInforPageCreator = async (
    params,
    pageName,
    type,
    getData
) => {
    const csrfDataRaw = localStorage.getItem('csrfZaloData');
    const csrfData = JSON.parse(csrfDataRaw);
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const clientCookie = storedDataFb?.filter(
            (item) => item.id === Number(params.account),
        )[0]?.webSession;
        const proxy = formatProxy(
            storedDataFb?.filter((item) => item.id === Number(params.account))[0]
                ?.proxy?.proxy,
        );
        const response = await fetch('/next-api/update_infor_page_creator', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientCookie,
                csrf: csrfData.token,
                infor: pageName,
                proxy,
                type
            }),
        });
        getData()
        const data = await response.json();
        if (data.error || data?.error === -2400) {
            toast.error(data?.msg)
        }
        return data
    } catch (error) {
        console.error('Error fetching video list:', error.message);
    }
};



export const updateStatusPageCreator = async (
    params,
    type,
) => {
    const csrfDataRaw = localStorage.getItem('csrfZaloData');
    const csrfData = JSON.parse(csrfDataRaw);
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const clientCookie = storedDataFb?.filter(
            (item) => item.id === Number(params.account),
        )[0]?.webSession;
        const proxy = formatProxy(
            storedDataFb?.filter((item) => item.id === Number(params.account))[0]
                ?.proxy?.proxy,
        );
        const response = await fetch('/next-api/update_status_page_creator', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientCookie,
                csrf: csrfData.token,
                proxy,
                type
            }),
        });
        const data = await response.json();
        if (data.error || data?.error === -2400) {
            toast.error(data?.msg)
        }
        return data
    } catch (error) {
        console.error('Error fetching video list:', error.message);
    }
};


export const cancelVideoSchedule = async (id_video, refetch, params) => {
    const csrfDataRaw = localStorage.getItem('csrfZaloData');
    const csrfData = JSON.parse(csrfDataRaw);
    try {
        const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
        const proxy = formatProxy(
            storedDataFb?.filter((item) => item.id === Number(params.account))[0]
                ?.proxy?.proxy,
        );
        const clientCookie = storedDataFb?.filter(
            (item) => item.id === Number(params.account),
        )[0]?.webSession;
        const response = await fetch('/next-api/cancel_video_schedule', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                clientCookie,
                id: id_video,
                csrf: csrfData.token,
                proxy,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to fetch video list');
        }
        if (refetch) {
            refetch();
        }
    } catch (error) {
        console.error('Error fetching video list:', error.message);
    }
};

