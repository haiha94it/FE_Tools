"use client";

import PaginatorBasicDemo from '@/components/layout/premeLayout/TableApiPagination';
import { confirm } from '@/lib/confirm';
import { useEffect, useRef, useState } from 'react';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { convertTimestampToDateTime } from '@/const/getLinkFile';
import {
    deletePlaylist,
    getVideoInPlayList,
    removeVideoPlaylist,
    updateStatusPlaylist,
} from './router_request';
import { MdDeleteOutline, MdOutlineDeleteOutline } from 'react-icons/md';
import { RiEdit2Line } from 'react-icons/ri';
import { OverlayPanel } from 'primereact/overlaypanel';
import { IoMdAdd } from 'react-icons/io';
import ModalAddPlaylist from './ModalZlVideo/ModalAddPlaylist';
import ModalSelectVideoInPlaylist from './ModalZlVideo/ModalSelectVideoInPlaylist';
import { useRouter } from 'next/navigation';
import {
    FaEye,
    FaPlay,
    FaRegCommentDots,
    FaRegHeart,
    FaRegShareSquare,
} from 'react-icons/fa';
import { TiPinOutline } from 'react-icons/ti';
import { ViewVideoComments } from './overlay/ViewVideoComments';
import { truncateDescription } from '@/const/truncateDescription';
import { useHeaders } from '@/const/headers';
import { toast } from 'react-toastify';
import { formatProxy } from '@/const/convertProxy';
export const PlaylistPlay = ({ params, inforChannel }) => {
    const listStatus = [
        { name: 'Công khai', code: 'public' },
        { name: 'Riêng tư', code: 'private' },
    ];
    const headers = useHeaders();
    const router = useRouter();
    const overlayRef = useRef(null);
    const containerRef = useRef(null);
    const deletePanelRef = useRef({});
    const idParams = window?.location?.search.includes('&')
        ? window?.location?.search?.split('?')[1].split('&')[0]
        : window?.location?.search?.split('?')[1];
    const [isAddPlaylist, setIsAddPlaylist] = useState(false);
    const [isSelectVideo, setIsSelectVideo] = useState(false);
    const [listVideoParams, setListVideoParams] = useState([]);
    const [showOverlayFull, setShowOverlayFull] = useState(false);
    const [selectPlaylist, setSelectPlaylist] = useState(null);
    const [selectedVideos, setSelectedVideos] = useState([]);
    const [showOptionsModal, setShowOptionsModal] = useState({
        name: 'Công khai',
        code: 'public',
    });
    const [optionHeader, setOptionHeader] = useState({
        name: 'Công khai',
        code: 'public',
    });
    const [name, setName] = useState('');
    const [first, setFirst] = useState(1);
    const [rows, setRows] = useState(50);
    const [page, setPage] = useState(1);
    const [listVideo, setListVideo] = useState([]);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                overlayRef.current &&
                !overlayRef.current.contains(event.target) &&
                !containerRef.current.contains(event.target)
            ) {
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const getPlayListVideo = async () => {
        try {
            const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
            const proxy = formatProxy(storedDataFb?.filter(item => item.id === Number(params.account))[0]?.proxy?.proxy)
            const clientCookie = storedDataFb?.filter(
                (item) => item.id === Number(params.account),
            )[0]?.webSession;
            const response = await fetch('/next-api/get_play_list_video', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clientCookie,
                    number_per_page: rows,
                    page,
                    proxy
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch video list');
            }
            const data = await response.json();
            setListVideo(data);
            setSelectPlaylist(
                data?.results?.filter((item) => item.id === idParams)[0],
            );
        } catch (error) {
            console.error('Error fetching video list:', error.message);
        }
    };
    useEffect(() => {
        if (idParams) {
            getVideoInPlayList(params, setListVideoParams, idParams);
        }
    }, [idParams]);
    useEffect(() => {
        if (listVideo && idParams)
            setSelectPlaylist(
                listVideo?.results?.filter((item) => item.id === idParams)[0],
            );
    }, [listVideo, idParams])
    useEffect(() => {
        getPlayListVideo();
    }, [rows, page]);
    const indexBodyTemplate = (_data, options) => {
        return options.rowIndex;
    };

    const statusView = (rowData) => {
        const status =
            rowData?.privacy === 1
                ? { name: 'Riêng tư', code: 'private' }
                : { name: 'Công khai', code: 'public' };
        return (
            <Dropdown
                value={status}
                onChange={(e) => {
                    updateStatusPlaylist(
                        rowData?.id,
                        getPlayListVideo,
                        params,
                        e.value.code === 'public' ? '2' : '1',
                    );
                }}
                style={{ height: '32px', width: '130px' }}
                options={listStatus}
                optionLabel="name"
                placeholder="Trạng thái"
            />
        );
    };
    const createAt = (rowData) => {
        return <p>{convertTimestampToDateTime(rowData?.createdTime)}</p>;
    };
    const optionRow = (rowData) => {
        return (
            <nav>
                <RiEdit2Line
                    onClick={() => {
                        router.push(
                            `/zalo-campaigns/post-video/${params.account}/playlist-manager?${rowData.id}`,
                        );
                    }}
                    size={20}
                    cursor="pointer"
                    title="Xóa danh sách phát"
                />
                <span
                    className="cursor-pointer"
                    onClick={(e) => deletePanelRef.current[rowData.id]?.toggle(e)}
                    data-pr-tooltip="Xóa video"
                >
                    <MdDeleteOutline size={20} />
                </span>
                <OverlayPanel
                    ref={(el) => (deletePanelRef.current[rowData.id] = el)}
                    dismissable
                >
                    <nav>
                        <p className="m-0">Bạn có chắc muốn xoá danh sách phát này?</p>
                        <button
                            onClick={() =>
                                deletePlaylist(rowData?.id, getPlayListVideo, params)
                            }
                            className="btn btn-danger btn-sm mt-2"
                        >
                            Xác nhận
                        </button>
                    </nav>
                </OverlayPanel>
            </nav>
        );
    };
    const listColumnNoParams = [
        <Column
            header="STT"
            key="stt"
            body={indexBodyTemplate}
            style={{ width: '5%', textAlign: 'center' }}
        ></Column>,
        <Column
            key="title"
            field="title"
            style={{ width: '250px' }}
            header="Tên danh sách phát"
        />,
        <Column
            key="videosTotal"
            field="videosTotal"
            style={{ width: '250px' }}
            header="Số videos"
        />,
        <Column
            key="per1"
            field="per1"
            style={{ width: '250px' }}
            body={statusView}
            header="Quyền riêng tư"
        />,
        <Column
            key="created_at"
            field="created_at"
            style={{ width: '150px' }}
            header="Ngày giờ đăng"
            body={createAt}
        />,
        <Column
            key="option"
            field="option"
            style={{ width: '150px' }}
            header="Chức năng"
            body={optionRow}
        />,
    ];
    const renderAction = (row) => {
        const id = row.id;
        return (
            <div className="d-flex gap-2 align-items-center ">
                <span
                    className="cursor-pointer"
                    onClick={(e) => deletePanelRef.current[id]?.toggle(e)}
                    title="Xóa bình luận"
                >
                    <MdOutlineDeleteOutline size={20} />
                </span>
                <OverlayPanel
                    ref={(el) => (deletePanelRef.current[id] = el)}
                    dismissable
                >
                    <p className="m-0">Bạn có chắc muốn xoá?</p>
                    <button
                        onClick={() =>
                            removeVideoPlaylist(
                                () => {
                                    getVideoInPlayList(params, setListVideoParams, idParams);
                                    deletePanelRef.current[id]?.hide();
                                },
                                params,
                                idParams,
                                row.id,
                            )
                        }
                        className="btn btn-danger btn-sm mt-2"
                    >
                        Xác nhận
                    </button>
                </OverlayPanel>
            </div>
        );
    };
    const temPost = (rowData) => {
        return (
            <div className="d-flex gap-2">
                <nav
                    className="position-relative cursor-pointer"
                    style={{ width: 'max-content' }}
                >
                    <img
                        style={{ height: '110px', width: '80px' }}
                        src={rowData.thumbnail}
                        alt="Video Thumbnail"
                        onClick={() => {
                            setShowOverlayFull(true);
                            router.push(
                                `/zalo-campaigns/post-video/${params.account}/playlist-manager?${idParams}&${rowData.id}`,
                            );
                        }}
                    />
                    <FaPlay
                        color="#fff"
                        size={15}
                        style={{ position: 'absolute', bottom: '3px', left: '3px' }}
                    />
                    {rowData?.isPinned && (
                        <TiPinOutline
                            color="#fff"
                            size={25}
                            style={{
                                position: 'absolute',
                                top: '3px',
                                left: '3px',
                                background: '#1890ff',
                                padding: '2px',
                                borderRadius: '4px',
                            }}
                        />
                    )}
                </nav>

                <div className="d-flex flex-column justify-content-between">
                    <nav>
                        <p className="fw-bold">
                            {truncateDescription(rowData?.description, 50)}
                        </p>
                    </nav>
                    <nav className="d-flex gap-2">
                        <nav className="d-flex gap-2 align-items-center">
                            <FaEye />
                            <p>{rowData?.views}</p>
                        </nav>
                        <p>|</p>
                        <nav className="d-flex gap-2 align-items-center">
                            <FaRegHeart />
                            <p>{rowData?.likes}</p>
                        </nav>
                        <p>|</p>

                        <nav className="d-flex gap-2 align-items-center">
                            <FaRegCommentDots />
                            <p>{rowData?.lock_comment ? '-' : rowData?.comments}</p>
                        </nav>
                        <p>|</p>

                        <nav className="d-flex gap-2 align-items-center">
                            <FaRegShareSquare />
                            <p>{rowData?.shares}</p>
                        </nav>
                    </nav>
                </div>
            </div>
        );
    };
    const statusViewParams = (rowData) => {
        return (
            <p className="fw-bold">
                {rowData?.privacy === 2 ? 'Công khai' : 'Riêng tư'}
            </p>
        );
    };
    const listColumnParams = [
        <Column
            header="STT"
            key="stt"
            body={indexBodyTemplate}
            style={{ width: '5%', textAlign: 'center' }}
        ></Column>,
        <Column
            key="post"
            field="post"
            style={{ width: '35%' }}
            header="Bài đăng"
            body={temPost}
        />,
        <Column
            key="per"
            field="per"
            style={{ width: '250px' }}
            body={statusViewParams}
            header="Trạng thái hiển thị"
        />,
        <Column
            key="created_at"
            field="created_at"
            style={{ width: '150px' }}
            header="Ngày giờ đăng"
            body={createAt}
        />,
        <Column
            key="funtion"
            field="funtion"
            style={{ width: '150px' }}
            header="Chức năng"
            body={renderAction}
        />,
    ];
    return (
        <div className="lvp-container shadow">
            <div className='d-flex justify-content-between align-items-center'>
                <nav className="d-flex gap-2">
                    <p className="fs-6 fw-bold text-muted hover-text-primary cursor-pointer">
                        Quản lý nội dung
                    </p>
                    <p className="fs-6 fw-bold">/</p>
                    <p
                        className="fs-6 fw-bold text-muted hover-text-primary cursor-pointer"
                        onClick={() =>
                            router.push(`/zalo-campaigns/post-video/${params.account}/playlist-manager`)
                        }
                    >
                        Danh sách phát
                    </p>
                    {idParams && Array.isArray(listVideo?.results) && (
                        <>
                            <p className="fs-6 fw-bold">/</p>
                            <p className="fs-6 fw-bold text-muted hover-text-primary cursor-pointer">
                                {selectPlaylist?.title}
                            </p>
                        </>
                    )}
                </nav>
                {!idParams && (<div className="lvp-actions">
                    <button
                        className="lvp-btn d-flex align-items-center gap-2"
                        onClick={() => setIsAddPlaylist(true)}
                    >
                        <IoMdAdd size={30} />
                        Tạo danh sách phát
                    </button>
                </div>)}
            </div>
            <div className="lvp-header justify-content-end">
                {idParams && (

                    <div className="d-flex justify-content-between align-items-center w-100 bg-light p-2 rounded">
                        <div className="d-flex flex-column gap-2">
                            <p className="fs-5 fw-bold text-muted hover-text-primary cursor-pointer">
                                {selectPlaylist?.title}
                            </p>
                            <nav className="d-flex gap-2 align-items-center ">
                                <p className="fw-bold text-secondary">
                                    Tạo{' '}
                                    {convertTimestampToDateTime(
                                        listVideo?.results?.filter(
                                            (item) => item.id === idParams,
                                        )[0]?.createdTime,
                                    )}{' '}
                                </p>
                                <p className="fw-bold text-secondary">-</p>
                                <p className="fw-bold text-secondary">
                                    {
                                        listVideo?.results?.filter(
                                            (item) => item.id === idParams,
                                        )[0]?.videosTotal
                                    }{' '}
                                    videos
                                </p>
                                <p className="fw-bold text-secondary">-</p>
                                <Dropdown
                                    value={optionHeader}
                                    onChange={(e) => setOptionHeader(e.value)}
                                    options={listStatus}
                                    optionLabel="name"
                                    placeholder="Trạng thái"
                                    style={{ height: '30px' }}
                                    className="p-0"
                                />
                            </nav>
                        </div>
                        <div className="d-flex gap-2">
                            <button
                                onClick={() => {
                                    setIsAddPlaylist(true);
                                    setName(selectPlaylist?.title || '');
                                    setShowOptionsModal(
                                        selectPlaylist?.privacy === 2
                                            ? { name: 'Công khai', code: 'public' }
                                            : { name: 'Riêng tư', code: 'private' },
                                    );
                                }}
                                className="border border-1 border-secondary rounded p-2 bg-light d-flex align-items-center gap-2"
                            >
                                <RiEdit2Line size={18} /> Thông tin
                            </button>
                            <button
                                onClick={() => {
                                    setIsSelectVideo(true);
                                    setSelectedVideos(listVideoParams?.map((item) => item.id));
                                }}
                                className="border border-1 border-secondary rounded p-2 bg-light d-flex align-items-center gap-2"
                            >
                                <RiEdit2Line size={18} /> Danh sách video
                            </button>
                            <button
                                onClick={async () => {
                                    if (
                                        !(await confirm({
                                            title: 'Xóa danh sách phát',
                                            message: 'Bạn có chắc muốn xóa danh sách phát này?',
                                            confirmText: 'Xóa',
                                            variant: 'danger',
                                        }))
                                    ) {
                                        return;
                                    }
                                    deletePlaylist(
                                        idParams,
                                        () => {
                                            getPlayListVideo();
                                            router.push(
                                                `/zalo-campaigns/post-video/${params.account}/playlist-manager`,
                                            );
                                            toast.success("Xóa danh sách phát thành công");
                                        },
                                        params,
                                    );
                                }}
                                className="border border-1 border-danger text-danger rounded p-2 bg-light d-flex align-items-center gap-2"
                            >
                                <RiEdit2Line size={18} /> Xóa
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <div className="lvp-table">
                <PaginatorBasicDemo
                    setPage={setPage}
                    listColumn={idParams ? listColumnParams : listColumnNoParams}
                    totalRecords={idParams ? 50 : (listVideo?.count ?? 0)}
                    allData={idParams ? listVideoParams : (listVideo?.results ?? [])}
                    rows={rows}
                    setRows={setRows}
                    first={first}
                    setFirst={setFirst}
                />
            </div>
            <ModalAddPlaylist
                idParams={idParams}
                showOptionsModal={showOptionsModal}
                getPlayListVideo={getPlayListVideo}
                setShowOptionsModal={setShowOptionsModal}
                name={name}
                setName={setName}
                setIsAddPlaylist={setIsAddPlaylist}
                isAddPlaylist={isAddPlaylist}
                setIsSelectVideo={setIsSelectVideo}
            />
            <ModalSelectVideoInPlaylist
                getVideoInPlayList={getVideoInPlayList}
                setListVideoParams={setListVideoParams}
                idParams={idParams}
                selectedVideos={selectedVideos}
                setSelectedVideos={setSelectedVideos}
                getPlayListVideo={getPlayListVideo}
                showOptionsModal={showOptionsModal}
                name={name}
                setName={setName}
                setIsSelectVideo={setIsSelectVideo}
                isSelectVideo={isSelectVideo}
            />
            {showOverlayFull && (
                <ViewVideoComments
                    inforChannel={inforChannel}
                    showOverlayFull={showOverlayFull}
                    setShowOverlayFull={setShowOverlayFull}
                    params={params}
                    rowData={null}
                    headers={headers}
                />
            )}
        </div>
    );
};
