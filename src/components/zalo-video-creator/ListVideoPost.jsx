import { useRouter } from 'next/navigation';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { OverlayPanel } from 'primereact/overlaypanel';
import { useEffect, useRef, useState } from 'react';
import {
  FaEllipsisH,
  FaEye,
  FaPlay,
  FaRegCommentDots,
  FaRegHeart,
  FaRegShareSquare,
} from 'react-icons/fa';
import { MdOutlineDeleteOutline, MdOutlineQrCode2 } from 'react-icons/md';
import { TfiReload } from 'react-icons/tfi';
import { TiPinOutline } from 'react-icons/ti';
import { toast } from 'react-toastify';
import { API_CHANNEL_VIDEO, API_URL } from '@/lib/zalo-video/legacy-api';
import { formatProxy } from "@/const/convertProxy";
import { formatTimestamp } from '@/const/getLinkFile';
import { useHeaders } from '@/const/headers';
import { truncateDescription } from '@/const/truncateDescription';
import PaginatorBasicDemo from '@/components/layout/premeLayout/TableApiPagination';
import { OptionVideo } from './overlay/OptionVideo';
import { Removideo } from './overlay/Removideo';
import { ViewVideoComments } from './overlay/ViewVideoComments';
import { updateStatusViewVideo } from './router_request';
import axiosConfig from "@/lib/axios"
export const ListVideoPost = ({ params, inforChannel }) => {
  const headers = useHeaders();
  const [showOverlayFull, setShowOverlayFull] = useState(false);
  const router = useRouter();
  const overlayRef = useRef(null);
  const containerRef = useRef(null);
  const [selectedStatus, setSelectedStatus] = useState({ name: 'Công khai', code: 'public' });
  const [showOptions, setShowOptions] = useState({ name: 'Công khai', code: 'public' });
  const [loadingRenew, setLoadingRenew] = useState(false);
  const deletePanelRef = useRef({});
  const optionsPanelRef = useRef({});
  const [forcusData, setForcusData] = useState(null);

  const apiRenewVideo = API_URL + API_CHANNEL_VIDEO.API_RENEW_LIST_VIDEO;
  const apiRenewVideoRs = API_URL + API_CHANNEL_VIDEO.API_RENEW_LIST_VIDEO_RS;
  const listStatus = [
    { name: 'Công khai', code: 'public' },
    { name: 'Riêng tư', code: 'private' },
  ];
  const [first, setFirst] = useState(1);
  const [rows, setRows] = useState(50);
  const [page, setPage] = useState(1);
  const [listVideo, setListVideo] = useState();
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

  const getListVideoChannel = async () => {
    try {
      const storedDataFb = JSON.parse(localStorage.getItem('dataFb'));
      const clientCookie = storedDataFb?.filter(item => item.id === Number(params.account))[0]?.webSession;
      const proxy = formatProxy(storedDataFb?.filter(item => item.id === Number(params.account))[0]?.proxy?.proxy)
      const response = await fetch('/next-api/get_list_video_public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientCookie,
          number_per_page: rows,
          page,
          status: showOptions?.code,
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
    getListVideoChannel();
  }, [rows, page, showOptions?.code]);
  const indexBodyTemplate = (_data, options) => {
    return options.rowIndex;
  };
  const temPost = (rowData) => {
    return (
      <div className="d-flex gap-2">
        <nav
          className="position-relative cursor-pointer"
          style={{ width: 'max-content' }}
        >
          <img
            style={{ height: '125px', width: '94px', objectFit: "cover", borderRadius: "8px" }}
            src={rowData.thumbnail}
            alt="Video Thumbnail"
            onClick={() => {
              setForcusData(rowData);
              setShowOverlayFull(true);
              router.push(
                `/zalo-campaigns/post-video/${params.account}/video-manager?${rowData.id}`,
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
              {truncateDescription(rowData?.description, 100)}
            </p>
          </nav>
          <nav className="d-flex gap-2">
            <nav className="d-flex gap-2 align-items-center">
              <FaEye />
              <p>{rowData?.views}</p>
            </nav>
            <p className='text-secondary'>|</p>
            <nav className="d-flex gap-2 align-items-center">
              <FaRegHeart />
              <p>{rowData?.likes}</p>
            </nav>
            <p className='text-secondary'>|</p>

            <nav className="d-flex gap-2 align-items-center">
              <FaRegCommentDots />
              <p>{rowData?.lock_comment ? '-' : rowData?.comments}</p>
            </nav>
            <p className='text-secondary'>|</p>

            <nav className="d-flex gap-2 align-items-center">
              <FaRegShareSquare />
              <p>{rowData?.shares}</p>
            </nav>
          </nav>
        </div>
      </div>
    );
  };
  const viewFunction = (row) => {
    const id = row.id;
    return (
      <div className="d-flex gap-2 align-items-center ">
        <MdOutlineQrCode2 size={20} cursor="pointer"
          onClick={() => {
            window.open(`https://qr.bitly.ac/s/${row.shortId}`, 'popupWindow', 'width=400,height=400,scrollbars=yes');
          }}
        />
        <span
          className="cursor-pointer"
          onClick={(e) => deletePanelRef.current[id]?.toggle(e)}
          data-pr-tooltip="Xóa video"
        >
          <MdOutlineDeleteOutline size={20} />
        </span>
        <OverlayPanel
          ref={(el) => (deletePanelRef.current[id] = el)}
          dismissable
        >
          <Removideo
            selectedStatus={selectedStatus}
            params={params}
            rowData={row}
            headers={headers}
            getListVideoChannel={getListVideoChannel}
          />
        </OverlayPanel>

        <span
          className="cursor-pointer"
          onClick={(e) => optionsPanelRef.current[id]?.toggle(e)}
          data-pr-tooltip="Tùy chọn"
        >
          <FaEllipsisH size={20} />
        </span>
        <OverlayPanel
          ref={(el) => (optionsPanelRef.current[id] = el)}
          dismissable
        >
          <OptionVideo
            rowData={row}
            params={params}
            getListVideoChannel={getListVideoChannel}
            headers={headers}
          />
        </OverlayPanel>


      </div>
    );
  };

  const statusView = (rowData) => {
    return (
      <Dropdown
        value={rowData?.privacy === 2 ? listStatus[0] : listStatus[1]}
        onChange={(e) => {
          setSelectedStatus(e.value)
          updateStatusViewVideo(rowData?.id, getListVideoChannel, params, e.value.code === "public" ? "2" : "1");
        }}
        options={listStatus}

        optionLabel="name"
        placeholder="Trạng thái"
        className="w-full"
      />
    );
  };
  const statusPost = (rowData) => {
    return (
      <p
        className="fw-bold"
        style={{ color: rowData?.status === 1 || rowData?.status === 2 ? '#389e0d' : rowData?.status === 4 ? "" : rowData?.status === 0 ? "yellow" : '' }}
      >
        {rowData?.status === 1 || rowData?.status === 2
          ? 'Thành công'
          : rowData?.status === 4 ? "Chờ xử lý..." : rowData?.status === 0 ? "Chờ công khai" : ''}
      </p>
    );
  };
  const createAt = (rowData) => {
    return <p>{formatTimestamp(rowData?.createdTime)}</p>;
  };
  const listColumnProxy = [
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
      body={viewFunction}
      header="Chức năng"
    />,
    <Column
      key="per"
      field="per"
      style={{ width: '250px' }}
      body={statusView}
      header="Trạng thái hiển thị"
    />,
    <Column
      key="per"
      field="per"
      style={{ width: '250px' }}
      body={statusPost}
      header="Trạng thái đăng"
    />,
    <Column
      key="created_at"
      field="created_at"
      style={{ width: '150px' }}
      header="Ngày giờ đăng"
      body={createAt}
    />,
  ];

  const fetchRenewChannel = async () => {
    setLoadingRenew(true);
    const body = {
      id_account: Number(params.account),
    };
    try {
      const res = await axiosConfig.post(apiRenewVideo, body);
      const idTask = res.data;
      fetchRsRenewChannel(idTask);
    } catch (err) {
      toast.error(
        err?.response?.data?.error ||
        err?.response?.data?.messenger ||
        err?.response?.error ||
        'Đã có lỗi xảy ra !',
      );
      setLoadingRenew(false);
    }
  };
  const fetchRsRenewChannel = (id_task) => {
    const intervalId = setInterval(async () => {
      try {
        const body = id_task;
        const res = await axiosConfig.post(apiRenewVideoRs, body);
        if (res?.data?.status === 'SUCCESS') {
          setLoadingRenew(false);
          toast.success('Thành công!');
          getListVideoChannel();
          clearInterval(intervalId);
        }
      } catch (err) {
        toast.error(
          err?.response?.data?.error ||
          err?.response?.data?.messenger ||
          err?.response?.error ||
          'Đã có lỗi xảy ra !',
        );
        setLoadingRenew(false);
      }
    }, 3000);
  };
  return (
    <div className="lvp-container shadow">
      <div className="lvp-header">
        <nav className="d-flex flex-column gap-2">
          <p className="mb-0">Trạng thái hiển thị</p>
          <Dropdown
            value={showOptions}
            onChange={(e) => setShowOptions(e.value)}
            options={[...listStatus, { name: 'Đã đặt lịch', code: 'schedule' }]}
            optionLabel="name"
            placeholder="Chọn trạng thái"
            className="p-inputtext-sm" // Sử dụng class của PrimeReact để giảm kích thước
            style={{ minWidth: '15rem' }} // Tăng độ rộng tối thiểu để đẹp hơn
          />
        </nav>
        <div className="lvp-actions">
          {loadingRenew ? (
            <p className="lvp-loading">Đang làm mới thông tin...</p>
          ) : (
            <TfiReload
              onClick={fetchRenewChannel}
              cursor="pointer"
              className="lvp-reload"
              title="Làm mới thông tin"
              size={28}
            />
          )}
          <button
            className="lvp-btn"
            onClick={() =>
              router.push(`/zalo-campaigns/post-video/${params.account}/video-post`)
            }
          >
            Đăng video
          </button>
        </div>
      </div>
      {/* <div>
        <p className="lvp-status-label">Trạng thái hiển thị Video</p>
      </div> */}
      <div className="lvp-table">
        <PaginatorBasicDemo
          setPage={setPage}
          listColumn={listColumnProxy}
          totalRecords={listVideo?.count ?? 0}
          allData={listVideo?.results ?? []}
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
          params={params}
          rowData={forcusData}
          setShowOverlayFull={setShowOverlayFull}
          headers={headers}
        />
      )}
    </div>
  );
};
