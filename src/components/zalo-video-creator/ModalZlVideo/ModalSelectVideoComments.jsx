import { Dialog } from 'primereact/dialog';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { formatTimestamp } from '@/const/getLinkFile';
import { FaPlay } from 'react-icons/fa';
import { formatProxy } from '@/const/convertProxy';

function ModalSelectVideoComments({
    isSelectVideo,
    setIsSelectVideo,
    selectedVideo,
    setSelectedVideo,
}) {
    const [listVideo, setListVideo] = useState([]);
    const params = useParams();

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
            setListVideo(data.results || []); // Đảm bảo listVideo là một mảng
        } catch (error) {
            console.error('Error fetching video list:', error.message);
        }
    };

    const handleItemClick = (item) => {
        setSelectedVideo(item); // Lưu video được chọn
        setIsSelectVideo(false); // Đóng Dialog
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
        >
            <style jsx>{`
                .video-item:hover {
                    background-color: #e9ecef !important; /* Màu xám nhạt khi hover */
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1) !important; /* Hiệu ứng shadow */
                    transform: translateY(-2px); /* Nâng nhẹ item */
                    transition: all 0.2s ease-in-out; /* Hiệu ứng mượt */
                }
            `}</style>
            <div className="d-flex flex-column gap-4 mt-4 h-100 overflow-auto">
                {listVideo.map((item, index) => (
                    <div
                        key={index}
                        className="d-flex align-items-center gap-2 h-100 cursor-pointer bg-light shadow-sm rounded p-2 video-item"
                        onClick={() => handleItemClick(item)} // Xử lý click vào item
                        style={{
                            backgroundColor: selectedVideo?.id === item.id ? '#e0f7fa' : 'transparent', // Highlight video được chọn
                        }}
                    >
                        <nav
                            className="position-relative"
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
                        <nav className="d-flex flex-column justify-content-start h-100 align-items-start">
                            <p className="fw-bold">{item?.description}</p>
                            <p className="fw-bold">{formatTimestamp(item?.createdTime)}</p>
                        </nav>
                    </div>
                ))}
            </div>
        </Dialog>
    );
}

export default ModalSelectVideoComments;