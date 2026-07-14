import { IoMdCloseCircle } from 'react-icons/io';
import VideoPlayer from './RenderVideom3u8';
import { useEffect, useState } from 'react';
import { TiPinOutline } from 'react-icons/ti';
import axios from 'axios';
import {
    formatTimestamp,
    formatUnixTimestamp,
} from '@/const/getLinkFile';
import {
    FaEye,
    FaHeart,
    FaRegCommentDots,
    FaRegHeart,
    FaRegShareSquare,
} from 'react-icons/fa';
import { truncateDescription } from '@/const/truncateDescription';
import { API_CHANNEL_VIDEO, API_URL } from '@/lib/zalo-video/legacy-api';
import { toast } from 'react-toastify';
import {
    getInforVideo,
    getListCommentIsVideo,
    likeCommentVideo,
    postCommentsVideo,
    postReplyCommentsVideo,
} from '../router_request';
import { usePathname } from 'next/navigation';
import { RiVideoUploadLine } from 'react-icons/ri';
import ModalSelectVideoComments from '../ModalZlVideo/ModalSelectVideoComments';
export const ViewVideoComments = ({
    rowData,
    setShowOverlayFull,
    showOverlayFull,
    params,
    headers,
    inforChannel,
}) => {
    const pathname = usePathname();
    const [inforVideo, setInforVideo] = useState(null);
    const [ListCommentsChannels, setListCommentsChannels] = useState([]);
    const [meComment, setMeComment] = useState('');
    const [replies, setReplies] = useState({});
    const [loadingComment, setLoadingComment] = useState(false);
    const [isSelectVideo, setIsSelectVideo] = useState(false);
    const [typeVideo, setTypeVideo] = useState('');
    const [indexInput, setIndexInput] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);
    useEffect(() => {
        if (showOverlayFull) {
            getInforVideo(
                pathname?.includes('playlist-manager')
                    ? window?.location?.search?.split('&')[1]
                    : window?.location?.search?.split('?')[1],
                params,
                setInforVideo,
            );
            getListCommentIsVideo(
                pathname?.includes('playlist-manager')
                    ? window?.location?.search?.split('&')[1]
                    : window?.location?.search?.split('?')[1],
                params,
                setListCommentsChannels,
            );
        }
    }, [showOverlayFull, window?.location?.search]);
    const handleReplyChange = (index, value) => {
        setReplies((prev) => ({
            ...prev,
            [index]: value,
        }));
    };
    return (
        <div className="vvc-overlay">
            <div className="vvc-content">
                <div className="vvc-video-wrap">
                    <div className="vvc-video-inner">
                        <VideoPlayer streamUrl={inforVideo?.streamUrl || ''} />
                        <button
                            className="btn btn-dark position-absolute top-0 end-0 m-3 rounded-pill d-flex align-items-center"
                            style={{ zIndex: 99 }}
                            onClick={() => setShowOverlayFull(false)}
                        >
                            <IoMdCloseCircle size={22} className="me-1" />
                            <span>Đóng</span>
                        </button>
                    </div>
                </div>
                <div className="vvc-info-wrap">
                    <div className="vvc-info-header">
                        <p>{formatTimestamp(inforVideo?.createdTime)}</p>
                        <p className="vvc-desc">
                            {truncateDescription(inforVideo?.description, 50)}
                        </p>
                        <div className="vvc-stats-row">
                            <div className="vvc-stat">
                                <FaEye />
                                <span>{inforVideo?.views}</span>
                            </div>
                            <span className="vvc-stat-sep">|</span>
                            <div className="vvc-stat">
                                <FaRegHeart />
                                <span>{inforVideo?.likes}</span>
                            </div>
                            <span className="vvc-stat-sep">|</span>
                            <div className="vvc-stat">
                                <FaRegCommentDots />
                                <span>
                                    {inforVideo?.lock_comment ? '-' : inforVideo?.comments}
                                </span>
                            </div>
                            <span className="vvc-stat-sep">|</span>
                            <div className="vvc-stat">
                                <FaRegShareSquare />
                                <span>{inforVideo?.shares || 0}</span>
                            </div>
                        </div>
                    </div>
                    {inforVideo?.lockComment ? (
                        <div className="vvc-comment-locked">
                            <p>Bạn đã tắt bình luận trên video này</p>
                        </div>
                    ) : (
                        <div className="vvc-comment-list">
                            <div className="overflow-auto">
                                {ListCommentsChannels?.map((item, index) => (
                                    <div key={index} className="vvc-comment-item">
                                        <div className="vvc-comment-header justify-content-between">
                                            <div className="d-flex align-items-center gap-2">
                                                <img
                                                    src={item?.owner?.info?.avatar}
                                                    alt="Avatar"
                                                    className="vvc-avatar"
                                                />
                                                <div>
                                                    {item?.isPinned && (
                                                        <div className="vvc-pin">
                                                            <TiPinOutline size={20} />
                                                            <span>Được ghim</span>
                                                        </div>
                                                    )}
                                                    <strong>{item?.owner?.info?.name}</strong>
                                                    <p className="vvc-time">
                                                        {formatUnixTimestamp(item.createdTime)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="vvc-like">
                                                {item.isLikedByAuthor ? (
                                                    <FaHeart
                                                        cursor="pointer"
                                                        onClick={() =>
                                                            likeCommentVideo(
                                                                item?.id,
                                                                () => {
                                                                    getListCommentIsVideo(
                                                                        pathname?.includes('playlist-manager')
                                                                            ? window?.location?.search?.split('&')[1]
                                                                            : window?.location?.search?.split('?')[1],
                                                                        params,
                                                                        setListCommentsChannels,
                                                                    )
                                                                },
                                                                params,
                                                                'unlike',
                                                            )
                                                        }
                                                        color="red"
                                                        size={18}
                                                    />
                                                ) : (
                                                    <FaRegHeart
                                                        cursor="pointer"
                                                        onClick={() =>
                                                            likeCommentVideo(
                                                                item?.id,
                                                                () => {
                                                                    getListCommentIsVideo(
                                                                        pathname?.includes('playlist-manager')
                                                                            ? window?.location?.search?.split('&')[1]
                                                                            : window?.location?.search?.split('?')[1],
                                                                        params,
                                                                        setListCommentsChannels,
                                                                    )
                                                                },
                                                                params,
                                                                'like',
                                                            )
                                                        }
                                                        size={18}
                                                    />
                                                )}
                                                <span>{item.likes}</span>
                                            </div>
                                        </div>
                                        {item?.attachedVideo && (
                                            <div className="ml-4">
                                                <img
                                                    src={item?.attachedVideo.thumbnail}
                                                    style={{
                                                        width: '67px',
                                                        height: '89px',
                                                        objectFit: 'cover',
                                                    }}
                                                />
                                            </div>
                                        )}
                                        <p className="vvc-comment-content ml-4">{item?.content}</p>
                                        {item?.replyComments?.length > 0 && (
                                            <div className="vvc-reply-list">
                                                {item.replyComments.map((reply, i) => (
                                                    <div key={i} className="vvc-reply-item">
                                                        <img
                                                            src={reply.owner?.info?.avatar}
                                                            alt="Avatar"
                                                            className="vvc-avatar vvc-avatar-sm"
                                                        />
                                                        <div>
                                                            <strong>{reply.owner_name}</strong>
                                                            <p className="vvc-time">
                                                                {formatUnixTimestamp(reply.createdTime)}
                                                            </p>
                                                            {reply?.attachedVideo && (
                                                                <div className="ml-4">
                                                                    <img
                                                                        //   onClick={() =>
                                                                        //     window.open(
                                                                        //       `/zalo-campaigns/post-video/${params.account}/view-video?${reply?.attachedVideo.id}`,
                                                                        //     )
                                                                        //   }
                                                                        src={reply?.attachedVideo.thumbnail}
                                                                        style={{
                                                                            width: '67px',
                                                                            height: '89px',
                                                                            objectFit: 'cover',
                                                                            cursor: 'pointer',
                                                                        }}
                                                                    />
                                                                </div>
                                                            )}
                                                            <p className="vvc-comment-content">
                                                                {reply?.content}
                                                            </p>
                                                        </div>
                                                        <div className="vvc-like">
                                                            {reply.isLikedByAuthor ? (
                                                                <FaHeart
                                                                    onClick={() =>
                                                                        likeCommentVideo(
                                                                            reply?.id,
                                                                            () => {
                                                                                getListCommentIsVideo(
                                                                                    pathname?.includes('playlist-manager')
                                                                                        ? window?.location?.search?.split('&')[1]
                                                                                        : window?.location?.search?.split('?')[1],
                                                                                    params,
                                                                                    setListCommentsChannels,
                                                                                )
                                                                            },
                                                                            params,
                                                                            'unlike',
                                                                        )
                                                                    }
                                                                    color="red"
                                                                    size={18}
                                                                />
                                                            ) : (
                                                                <FaRegHeart
                                                                    cursor="pointer"
                                                                    onClick={() =>
                                                                        likeCommentVideo(
                                                                            reply?.id,
                                                                            () => {
                                                                                getListCommentIsVideo(
                                                                                    pathname?.includes('playlist-manager')
                                                                                        ? window?.location?.search?.split('&')[1]
                                                                                        : window?.location?.search?.split('?')[1],
                                                                                    params,
                                                                                    setListCommentsChannels,
                                                                                )
                                                                            },
                                                                            params,
                                                                            'like',
                                                                        )
                                                                    }
                                                                    size={18}
                                                                />
                                                            )}
                                                            <span>{reply.likes}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {selectedVideo &&
                                            typeVideo === 'reply' &&
                                            indexInput === index && (
                                                <div className="d-flex justify-content-center align-items-center ">
                                                    <nav className="relative">
                                                        <img
                                                            src={selectedVideo?.thumbnail}
                                                            alt="thum"
                                                            style={{
                                                                width: '80px',
                                                                height: '100px',
                                                                objectFit: 'cover',
                                                            }}
                                                        />
                                                        <IoMdCloseCircle
                                                            cursor="pointer"
                                                            onClick={() => {
                                                                setSelectedVideo(null);
                                                                setIndexInput(null);
                                                            }}
                                                            size={20}
                                                            color="red"
                                                            style={{
                                                                position: 'absolute',
                                                                top: '0',
                                                                right: '-20px',
                                                            }}
                                                        />
                                                    </nav>
                                                </div>
                                            )}
                                        <div className="vvc-input-row">
                                            <img
                                                src={item?.owner?.info?.avatar}
                                                alt="Avatar"
                                                className="vvc-avatar vvc-avatar-xs"
                                            />
                                            <div className="vvc-input-container">
                                                <input
                                                    value={replies[index] || ''}
                                                    onChange={(e) =>
                                                        handleReplyChange(index, e.target.value)
                                                    }
                                                    type="text"
                                                    className="vvc-input"
                                                    placeholder="Trả lời..."
                                                />
                                                <RiVideoUploadLine
                                                    onClick={() => {
                                                        setIsSelectVideo(true);
                                                        setIndexInput(index);
                                                        setTypeVideo('reply');
                                                    }}
                                                    className="vvc-input-icon"
                                                    size={20}
                                                />
                                            </div>

                                            <button
                                                onClick={() => {
                                                    postReplyCommentsVideo(
                                                        () => {
                                                            getListCommentIsVideo(
                                                                pathname?.includes('playlist-manager')
                                                                    ? window?.location?.search?.split('&')[1]
                                                                    : window?.location?.search?.split('?')[1],
                                                                params,
                                                                setListCommentsChannels,
                                                            );
                                                            setReplies('');
                                                            setSelectedVideo(null);
                                                        },
                                                        params,
                                                        typeVideo === 'reply' && selectedVideo?.id
                                                            ? selectedVideo?.id
                                                            : null,
                                                        replies[index],
                                                        item.id,
                                                    );
                                                }}
                                                className="vvc-btn-send"
                                            >
                                                Gửi
                                            </button>
                                            <button
                                                className="vvc-btn-cancel"
                                                onClick={() => {
                                                    handleReplyChange(index, '')
                                                    setSelectedVideo(null)
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div>
                                {selectedVideo && typeVideo === 'comments' && (
                                    <div className="d-flex justify-content-center align-items-center ">
                                        <nav className="relative">
                                            <img
                                                src={selectedVideo?.thumbnail}
                                                alt="thum"
                                                style={{
                                                    width: '80px',
                                                    height: '100px',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                            <IoMdCloseCircle
                                                cursor="pointer"
                                                onClick={() => setSelectedVideo(null)}
                                                size={20}
                                                color="red"
                                                style={{ position: 'absolute', top: '0', right: '-20px' }}
                                            />
                                        </nav>
                                    </div>
                                )}

                                <div className="vvc-input-row vvc-input-main">
                                    <img
                                        src={inforChannel.avatar}
                                        alt="Avatar"
                                        className="vvc-avatar"
                                    />
                                    <div className="vvc-input-container">
                                        <input
                                            type="text"
                                            value={meComment}
                                            onChange={(e) => setMeComment(e.target.value)}
                                            className="vvc-input"
                                            placeholder="Bình luận..."
                                        />
                                        <RiVideoUploadLine
                                            onClick={() => {
                                                setIsSelectVideo(true);
                                                setTypeVideo('comments');
                                            }}
                                            className="vvc-input-icon"
                                            size={20}
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (meComment)
                                                postCommentsVideo(
                                                    () => {
                                                        getListCommentIsVideo(
                                                            pathname?.includes('playlist-manager')
                                                                ? window?.location?.search?.split('&')[1]
                                                                : window?.location?.search?.split('?')[1],
                                                            params,
                                                            setListCommentsChannels,
                                                        );
                                                        setMeComment('');
                                                        setSelectedVideo(null);
                                                    },
                                                    params,
                                                    typeVideo === 'comments' && selectedVideo?.id
                                                        ? selectedVideo?.id
                                                        : null,
                                                    meComment,
                                                    pathname?.includes('playlist-manager')
                                                        ? window?.location?.search?.split('&')[1]
                                                        : window?.location?.search?.split('?')[1],
                                                );
                                        }}
                                        disabled={!meComment}
                                        className="vvc-btn-send"
                                    >
                                        {loadingComment ? 'Đang gửi' : 'Gửi'}
                                    </button>
                                    <button
                                        className="vvc-btn-cancel"
                                        onClick={() => {
                                            setMeComment('')
                                            setSelectedVideo(null)
                                        }

                                        }
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <ModalSelectVideoComments
                    selectedVideo={selectedVideo}
                    setSelectedVideo={setSelectedVideo}
                    isSelectVideo={isSelectVideo}
                    setIsSelectVideo={setIsSelectVideo}
                />
            </div>
        </div>
    );
};
