'use client';
import { toast } from 'react-toastify';
import { HeaderZlVideo } from './HeaderZlVideo';
import { ViewContentVideo } from './ViewContentVideo';
import { SiderbarVideo } from './SiderbarVideo';
import { API_CHANNEL_VIDEO, API_ROUTES, API_URL } from '@/lib/zalo-video/legacy-api';
import { InformationZaloVideo } from './InformationZaloVideo';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getAxios } from '@/const/getAxios';
import VideoUploadThumbnail from './UploadVideoThumbails';
import { ListVideoPost } from './ListVideoPost';
import { ListCommentsChannels } from './ListCommentsChannels';
import { ViewInstructionsChannel } from './ViewInstructionsChannel';
import { GetQrAccount } from './GetQrAccount';
import { fetcher } from '@/lib/zalo-video/fetcher';
import useSWR, { mutate } from 'swr';
import { Sidebar } from 'primereact/sidebar';
import { PlaylistPlay } from './PlaylistPlay';
import { ViewVideoComments } from './overlay/ViewVideoComments';
import { Dialog } from 'primereact/dialog';
import useZaloVideoWebSocket from '@/lib/zalo-video/websocket-compat';
import { RenderNotica } from './stubs/RenderNotica';
import { ChannelInfoPage } from "./ChannelInfoPage"
import { CategoryProductsCreator } from "./CategoryProductsCreator"
import axiosConfig from "@/lib/axios"
export const ZaloVideoContainer = () => {
  const params = useParams();
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const apiGetInforChannel = API_URL + API_CHANNEL_VIDEO.API_INFOR_CHANNEL;
  const getInfor = API_URL + API_ROUTES.GET_INFO_UERS;
  const [statusLogin, setStatusLogin] = useState('');
  const [inforChannel, setInforChannel] = useState(null);
  const [userInfor, setUserInfor] = useState({ id: 1 });
  const [rfLogin, setRfLogin] = useState('');
  const { socketRef, imageQrSCan } = useZaloVideoWebSocket();
  const [isInstruc, setIsInstruc] = useState("")
  const [resultQr, setResultQr] = useState([]);
  const {
    data: dataFb,
    error: errorFb,
    isLoading: isLoadingFb,
  } = useSWR(API_ROUTES.GET_ACC_FB, fetcher);
  useEffect(() => {
    const element = document.getElementById('chat-widget-button');
    if (element) {
      element.style.display = 'none';
    }
    if (dataFb) {
      localStorage.setItem('dataFb', JSON.stringify(dataFb));
    }
  }, [dataFb]);
  useEffect(() => {
    getAxios(getInfor, setUserInfor);
    mutate(API_ROUTES.GET_ACC_FB);
    if (params.account) {
      getAxios(
        `${apiGetInforChannel}?id_account=${params.account}`,
        setInforChannel,
      );
    }
  }, [params]);
  const heightHeaderZl = document.getElementById(
    'get-height-header-zl',
  )?.offsetHeight;
  useEffect(() => {
    if (imageQrSCan?.qr) {
      setResultQr(imageQrSCan.qr)
    }
    if (imageQrSCan?.result) {
      mutate(API_ROUTES.GET_ACC_FB);
      setResultQr([]);
      // setOpenAutoLogin(false);
    }
    if (
      imageQrSCan?.result === 'Tài khoản Zalo đã tồn tại trên hệ thống'
    ) {
      toast.error(imageQrSCan?.result);
      setResultQr([]);
      // setOpenAutoLogin(false);
      return;
    }
  }, [imageQrSCan])
  const isHiddenElement = params?.account &&
    inforChannel?.id &&
    !dataFb?.filter(
      (item) => item.id === Number(params?.account),
    )[0]?.checkpoint
  return (
    <div className="d-flex flex-column p-2 h-full" style={{ background: "aliceblue" }}>
      <div className="notifica-container h-full">
        {userInfor?.id && (
          <div className="d-flex flex-column h-100 w-100 ">
            <div id="get-height-header-zl">
              <HeaderZlVideo
                setResultQr={setResultQr}
                setRfLogin={setRfLogin}
                rfLogin={rfLogin}
                dataFb={dataFb}
                socketRef={socketRef}
                setStatusLogin={setStatusLogin}
                apiGetInforChannel={apiGetInforChannel}
                setInforChannel={setInforChannel}
                setLoadingLogin={setLoadingLogin}
                loadingLogin={loadingLogin}
                setIsInstruc={setIsInstruc}
              />
              
            </div>
            {loadingLogin ? (
              <nav className="w-100 text-center">
                <p className="p-4 fs-4 fw-bold">Đang chuyển kênh...</p>
              </nav>
            ) : (
              <div
                className="d-flex w-100  gap-2 flex-1"
                style={{ height: `calc(-${heightHeaderZl}px + 100%)` }}
              >
                <div
                  className="zl-video-main-layout  d-flex flex-1  h-100">
                  <button
                    className="sidebar-toggle-btn"
                    onClick={() => setShowSidebar(true)}
                    aria-label="Mở menu"
                  >
                    <i className="pi pi-bars"></i>
                  </button>
                  <Sidebar
                    visible={showSidebar}
                    onHide={() => setShowSidebar(false)}
                    className="sidebar-mobile"
                    position="left"
                    dismissable
                    showCloseIcon
                  >
                    <SiderbarVideo isHiddenElement={isHiddenElement} setIsInstruc={setIsInstruc} />
                  </Sidebar>
                  <div
                    className="zl-video-sidebar"
                    style={{ width: '247px' }}
                  >
                    <SiderbarVideo isHiddenElement={isHiddenElement} setIsInstruc={setIsInstruc} />
                  </div>
                  {isHiddenElement ? (
                    <div
                      className="zl-video-content rounded flex-1 "
                    // style={{ width: 'calc(100% - 200px)' }}
                    >
                      {params.infor === 'category' ? (
                        <CategoryProductsCreator
                          // apiGetInforChannel={apiGetInforChannel}
                          // setInforChannel={setInforChannel}
                          inforChannel={inforChannel}
                        // params={params}
                        />
                      ) : params.infor === 'channel' ? (
                        <ChannelInfoPage
                          // apiGetInforChannel={apiGetInforChannel}
                          // setInforChannel={setInforChannel}
                          inforChannel={inforChannel}
                        // params={params}
                        />
                      ) : params.infor === 'infor' ? (
                        <InformationZaloVideo
                          apiGetInforChannel={apiGetInforChannel}
                          setInforChannel={setInforChannel}
                          inforChannel={inforChannel}
                          params={params}
                        />
                      ) : params.infor === 'video-post' ? (
                        <VideoUploadThumbnail params={params}
                          inforChannel={inforChannel}
                        />
                      ) : params.infor === 'video-manager' ? (
                        <ListVideoPost
                          inforChannel={inforChannel}
                          params={params}
                        />
                      ) : params.infor === 'comment-manager' ? (
                        <ListCommentsChannels
                          dataFb={dataFb}
                          inforChannel={inforChannel}
                          params={params}
                        />
                      ) : params.infor === 'playlist-manager' ? (
                        <PlaylistPlay
                          dataFb={dataFb}
                          inforChannel={inforChannel}
                          params={params}
                        />
                      ) : params.infor === 'view-video' ? (
                        <ViewVideoComments
                          dataFb={dataFb}
                          inforChannel={inforChannel}
                          params={params}
                        />
                      ) : (
                        <ViewContentVideo
                          apiGetInforChannel={apiGetInforChannel}
                          inforChannel={inforChannel}
                          setInforChannel={setInforChannel}
                        />
                      )}
                    </div>
                  ) :
                    (!params?.account
                    ) && (

                      <RenderNotica />
                    )}
                </div>
                {(resultQr?.length > 0 ||
                  dataFb?.filter((item) => item.id === Number(params?.account))[0]
                    ?.checkpoint) &&
                  !statusLogin?.data?.error?.includes(
                    'Bạn cần có kênh để thực hiện hành động này',
                  ) && (
                    <GetQrAccount
                      params={params}
                      socketRef={socketRef}
                      dataFb={dataFb}
                      resultQr={resultQr}
                    />
                  )}
                {!loadingLogin &&
                  dataFb?.filter((item) => item.id === Number(params?.account))[0]
                    ?.checkpoint === false &&
                  statusLogin?.data?.error?.includes(
                    'Bạn cần có kênh để thực hiện hành động này',
                  ) && (
                    <div className=" shadow-sm w-full d-flex justify-content-center align-items-center" role="alert">
                      <div className='alert alert-warning d-flex justify-content-center flex-column align-items-between' style={{ width: "300px", height: "300px" }}>
                        <h4 className="alert-heading text-center">⚠️ Hình như bạn chưa có kênh!</h4>
                        <p>
                          Bạn cần tạo kênh để có thể thực hiện chức năng này.
                          Tạo kênh sẽ giúp bạn cá nhân hóa trải nghiệm và lưu trữ dữ liệu.
                        </p>
                        <hr />

                        {/* Nút Xem Hướng Dẫn */}
                        <a
                          onClick={() => setIsInstruc(true)}
                          className="btn btn-primary mt-2"
                          // target="_blank"
                          rel="noopener noreferrer"
                        >
                          <i className="bi bi-book-fill me-2"></i> Xem Hướng Dẫn
                        </a>
                      </div>

                    </div>
                  )}
                {!params?.account && (
                  <></>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <Dialog
        header="Hướng dẫn tạo kênh"
        visible={isInstruc}
        style={{ maxWidth: '80vw' }}
        className='model-creator-video'
        onHide={() => setIsInstruc(false)}
        modal
        closable
      >
        <ViewInstructionsChannel
          userInfor={userInfor}
          setUserInfor={setUserInfor}
        />
      </Dialog>
    </div>
  );
};
