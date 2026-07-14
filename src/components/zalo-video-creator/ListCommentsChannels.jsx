'use client';
import { useRouter } from 'next/navigation';
import { Column } from 'primereact/column';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Tooltip } from 'primereact/tooltip';
import { useEffect, useRef, useState } from 'react';
import {
  FaHeart,
  FaPlay,
  FaRegCommentDots,
  FaRegHeart
} from 'react-icons/fa';
import { MdOutlineDeleteOutline } from 'react-icons/md';
import { TfiReload } from 'react-icons/tfi';
import { TiPinOutline } from 'react-icons/ti';
import { toast } from 'react-toastify';
import { API_CHANNEL_VIDEO, API_URL } from '@/lib/zalo-video/legacy-api';
import { formatProxy } from '@/const/convertProxy';
import { useHeaders } from '@/const/headers';
import PaginatorBasicDemo from '@/components/layout/premeLayout/TableApiPagination';
import { Removideo } from './overlay/Removideo';
import { ViewVideoComments } from './overlay/ViewVideoComments';
import { likeCommentVideo } from "./router_request";
import axiosConfig from "@/lib/axios"
export const ListCommentsChannels = ({ params, inforChannel, dataFb }) => {
  const headers = useHeaders();
  const router = useRouter();
  const [listVideo, setListVideo] = useState();
  const [showOverlayFull, setShowOverlayFull] = useState(false);
  const [focusData, setFocusData] = useState(null);
  const [loadingRenew, setLoadingRenew] = useState(false);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(50);
  const [first, setFirst] = useState(0);
  const deletePanelRef = useRef({});
  const apiRenew = API_URL + API_CHANNEL_VIDEO.API_RENEW_COMMENT;
  const apiRenewResult = API_URL + API_CHANNEL_VIDEO.API_RENEW_COMMENT_RS;
  const getList = async () => {
    try {
      const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
      const clientCookie = storedDataFb?.filter(item => item.id === Number(params.account))[0]?.webSession;
      const proxy = formatProxy(storedDataFb?.filter(item => item.id === Number(params.account))[0]?.proxy?.proxy)
      const response = await fetch('/next-api/get_comment_public', {
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
    } catch (error) {
      console.error('Error fetching video list:', error.message);
    }
  };
  useEffect(() => {
    getList();
  }, [page, rows]);
  const handleRenew = async () => {
    setLoadingRenew(true);
    try {
      const res = await axiosConfig.post(
        apiRenew,
        { id_account: Number(params.account) }
      );
      const idTask = res.data;
      const intervalId = setInterval(async () => {
        try {
          const result = await axiosConfig.post(apiRenewResult, idTask);
          if (result.data.status === 'SUCCESS') {
            toast.success('Làm mới thành công!');
            getList();
            clearInterval(intervalId);
            setLoadingRenew(false);
          }
        } catch {
          toast.error('Lỗi khi làm mới');
          setLoadingRenew(false);
        }
      }, 3000);
    } catch {
      toast.error('Lỗi khi gửi yêu cầu làm mới');
      setLoadingRenew(false);
    }
  };
  const renderIndex = (_data, options) => options.rowIndex + 1;
  const renderPost = (row) => (
    <div className="d-flex gap-2">
      <div
        className="position-relative cursor-pointer"
        style={{ width: 'max-content' }}
      >
        <img
          style={{ height: '125px', width: '94px', objectFit: "cover" }}
          src={row.video?.thumbnail}
          alt="Thumbnail"
          onClick={() => {
            setFocusData(row);
            setShowOverlayFull(true);
            router.push(
              `/zalo-campaigns/post-video/${params.account}/comment-manager?${row.video.id}`,
            );
          }}
        />
        <FaPlay
          className="position-absolute"
          size={15}
          style={{ bottom: '3px', left: '3px', color: '#fff' }}
        />
        {row.is_pinned && (
          <TiPinOutline
            size={25}
            style={{
              position: 'absolute',
              top: '3px',
              left: '3px',
              background: '#1890ff',
              color: '#fff',
              padding: '2px',
              borderRadius: '4px',
            }}
          />
        )}
      </div>
      <div className="d-flex flex-column justify-content-between">
        <div>
          <div className="d-flex gap-2">
            <img
              src={row.parent?.owner?.info?.avatar || row?.owner?.info?.avatar}
              alt="avatar"
              className="rounded-circle"
              style={{ height: '25px', width: '25px' }}
            />
            <div className="d-flex flex-column">
              <strong>{row.parent?.owner?.info?.name || row?.owner?.info?.name}</strong>
              <span>{row.parent?.content || row?.content}</span>
              {!row?.parent?.isRepliedByAuthor && (
                <div className="d-flex gap-2 mt-1 align-items-center">
                  {row?.isLikedByAuthor ? <FaHeart
                    onClick={() => likeCommentVideo(row?.id, getList, params, "unlike")}
                    color='red'
                    data-pr-tooltip="Thích"
                    className="cursor-pointer"
                  /> :
                    <FaRegHeart
                      onClick={() => likeCommentVideo(row?.id, getList, params, "like")}
                      data-pr-tooltip="Thích"
                      className="cursor-pointer"
                    />
                  }
                  <nav className='d-flex gap-1 align-items-center'>
                    <FaRegCommentDots
                      data-pr-tooltip="Trả lời"
                      className="cursor-pointer"
                      onClick={() => setShowOverlayFull(true)}
                    />
                    <p className='text-primary'>{row?.isRepliedByAuthor ? "Đã trả lời" : "Trả lời"}</p>
                  </nav>
                </div>
              )}
            </div>
          </div>

          {row?.parent?.isRepliedByAuthor && (
            <div className="d-flex gap-2 mt-3 ml-4">
              <img
                src={row?.owner.info?.avatar}
                alt="avatar"
                className="rounded-circle"
                style={{ height: '25px', width: '25px' }}
              />
              <div className="d-flex flex-column">
                <strong>{row?.owner.info?.name}</strong>
                <span>{row?.content}</span>
                <div className="d-flex gap-2 mt-1 align-items-center">
                  <nav className='d-flex gap-1 align-items-center'>
                    {row?.isLikedByAuthor ? <FaHeart
                      onClick={() => likeCommentVideo(row?.id, getList, params, "unlike")}
                      color='red'
                      data-pr-tooltip="Thích"
                      className="cursor-pointer"
                    /> :
                      <FaRegHeart
                        onClick={() => likeCommentVideo(row?.id, getList, params, "like")}
                        data-pr-tooltip="Thích"
                        className="cursor-pointer"
                      />
                    }
                    <p className='text-danger'>{row?.isLikedByAuthor ? "Đã Thích" : "Thích"}</p>
                  </nav>
                  <nav className='d-flex gap-1 align-items-center'>
                    <FaRegCommentDots
                      data-pr-tooltip="Trả lời"
                      className="cursor-pointer"
                      onClick={() => setShowOverlayFull(true)}
                    />
                    <p className='text-primary'>{row?.isRepliedByAuthor ? "Đã trả lời" : "Trả lời"}</p>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

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
          <Removideo
            params={params}
            rowData={row}
            headers={headers}
            getListVideoChannel={getList}
          />
        </OverlayPanel>
      </div>
    );
  };

  const listColumns = [
    <Column
      key="stt"
      header="STT"
      body={renderIndex}
      style={{ width: '5%', textAlign: 'center' }}
    />,
    <Column
      key="post"
      header="Bình luận"
      body={renderPost}
      style={{ width: '65%' }}
    />,
    <Column
      key="actions"
      header="Chức năng"
      body={renderAction}
      style={{ width: '30%' }}
    />,
  ];

  return (
    <div className="w-100 h-100 d-flex flex-column p-2 gap-3 bg-white">
      <Tooltip target="[data-pr-tooltip]" />
      <div className="d-flex justify-content-between align-items-center">
        <h5 className="text-primary">Bình luận</h5>
        {loadingRenew ? (
          <span className="text-muted">Đang làm mới dữ liệu...</span>
        ) : (
          <TfiReload
            title='Làm mới'
            className="cursor-pointer"
            size={25}
            onClick={handleRenew}
          />
        )}
      </div>
      <div className="h-100 overflow-auto lvp-table">
        <PaginatorBasicDemo
          setPage={setPage}
          listColumn={listColumns}
          totalRecords={listVideo?.count || 0}
          allData={listVideo?.results || []}
          rows={rows}
          setRows={setRows}
          first={first}
          setFirst={setFirst}
        />
      </div>
      {showOverlayFull && (
        <ViewVideoComments
          inforChannel={inforChannel}
          showOverlayFull={showOverlayFull}
          setShowOverlayFull={setShowOverlayFull}
          params={params}
          rowData={focusData}
          headers={headers}
        />
      )}
    </div>
  );
};
