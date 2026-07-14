import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Checkbox } from 'primereact/checkbox';
import { formatTimestamp } from '@/const/getLinkFile';
import { FaPlay } from 'react-icons/fa';
import { createPlaylistVideo, updatePlaylistVideos } from '../router_request';
import { formatProxy } from '@/const/convertProxy';
function ModalSelectVideoInPlaylist({
    isSelectVideo,
    setIsSelectVideo,
    name,
    showOptionsModal,
    setName,
    getPlayListVideo,
    selectedVideos,
    setSelectedVideos,
    idParams,
    getVideoInPlayList,
    setListVideoParams
}) {
    const [listVideo, setListVideo] = useState();
    const params = useParams();

    const footerContent = (
        <div className="flex gap-2 justify-content-end w-100">
            <Button
                label="Đóng"
                className="bg-light text-dark rounded p-2 lh-base "
                onClick={() => setIsSelectVideo(false)}
                autoFocus
            />
            <Button
                disabled={selectedVideos.length === 0}
                label="Tiếp tục"
                className="bg-primary rounded p-2 lh-base"
                onClick={() => {
                    if (idParams) {
                        updatePlaylistVideos(
                            () => {
                                setIsSelectVideo(false);
                                getVideoInPlayList(params, setListVideoParams, idParams);
                            },
                            params,
                            idParams,
                            selectedVideos.join(','),
                        );
                    } else {
                        createPlaylistVideo(
                            name,
                            () => {
                                getPlayListVideo();
                                setIsSelectVideo(false);
                            },
                            params,
                            showOptionsModal?.code === 'public' ? '2' : '1',
                            selectedVideos.join(','),
                        );
                    }
                    setName('');
                }}
                autoFocus
            />
        </div>
    );

    const getListVideoChannel = async () => {
        try {
            const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
            const clientCookie = storedDataFb?.filter(
                (item) => item.id === Number(params.account),
            )[0]?.webSession;
            const proxy = formatProxy(storedDataFb?.filter(item => item.id === Number(params.account))[0]?.proxy?.proxy)

            const page = 1;
            const response = await fetch('/next-api/get_list_video_public', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clientCookie,
                    number_per_page: 50,
                    page,
                    status: 'public',
                    proxy
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch video list');
            }
            const data = await response.json();
            setListVideo(data);
        } catch (error) {
            console.error('Error fetching video list:', error.message);
        }
    };

    const handleCheckboxChange = (e, item) => {
        if (e.checked) {
            setSelectedVideos((prev) => [...prev, item.id]); // Thêm id vào danh sách
        } else {
            setSelectedVideos((prev) => prev.filter((id) => id !== item.id)); // Loại bỏ id khỏi danh sách
        }
    };

    useEffect(() => {
        if (isSelectVideo) {
            getListVideoChannel();
        }
    }, [isSelectVideo]);

    return (
        <Dialog
            header="Chọn video để thêm"
            className="dialog-shop"
            visible={isSelectVideo}
            style={{ width: '50%' }}
            onHide={() => {
                if (!isSelectVideo) return;
                setIsSelectVideo(false);
            }}
            footer={footerContent}
        >
            <div className="flex flex-column gap-4 mt-4 h-100">
                {listVideo?.results?.map((item, index) => (
                    <div key={index} className="flex align-items-center gap-2 h-100">
                        <Checkbox
                            onChange={(e) => handleCheckboxChange(e, item)}
                            checked={selectedVideos.includes(item.id)}
                        />
                        <nav
                            className="position-relative cursor-pointer"
                            style={{ width: 'max-content' }}
                        >
                            <img
                                src={item.thumbnail}
                                alt="anh"
                                style={{ width: '80px', height: '120px', objectFit: 'cover' }}
                            />
                            <FaPlay
                                color="#fff"
                                size={15}
                                style={{ position: 'absolute', bottom: '3px', left: '3px' }}
                            />
                        </nav>
                        <nav className="d-flex  flex-column justify-content-start h-100 align-items-start">
                            <p className="fw-bold">{item?.description}</p>
                            <p className="fw-bold">{formatTimestamp(item?.createdTime)}</p>
                        </nav>
                    </div>
                ))}
            </div>
        </Dialog>
    );
}

export default ModalSelectVideoInPlaylist;
