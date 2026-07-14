import { API_CHANNEL_VIDEO, API_URL } from '@/lib/zalo-video/legacy-api';
import { VirtualScroller } from 'primereact/virtualscroller';
import { classNames } from 'primereact/utils';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useEffect } from 'react';
import { getCsrfToken } from './router_request';
import axiosConfig from "@/lib/axios"

export const HeaderZlVideo = ({
  setLoadingLogin,
  loadingLogin,
  apiGetInforChannel,
  setInforChannel,
  setStatusLogin,
  socketRef,
  dataFb,
  rfLogin,
  setRfLogin,
  setResultQr,
  setIsInstruc
}) => {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname()
  const apiLoginChannel = API_URL + API_CHANNEL_VIDEO.API_LOGIN_CHANNEL;
  const apiLoginChannelResults =
    API_URL + API_CHANNEL_VIDEO.API_LOGIN_CHANNEL_RESULTS;
  useEffect(() => {
    getCsrfToken(params || '');
    const interval = setInterval(() => {
      getCsrfToken(params || '');
    }, 3600000);
    return () => clearInterval(interval);
  }, [params]);
  const fetchLoginChannel = async (id) => {
    setLoadingLogin(true);
    const body = {
      id_account: Number(id),
    };
    try {
      const res = await axiosConfig.post(apiLoginChannel, body);
      const idTask = res.data;
      startPollingLoginChannelResults(idTask, id);
    } catch (err) {
      toast.error(
        err?.response?.data?.error ||
        err?.response?.data?.messenger ||
        err?.response?.error ||
        'Đã có lỗi xảy ra !',
      );
      setLoadingLogin(false);
    }
  };
  const startPollingLoginChannelResults = (id_task, id) => {
    const intervalId = setInterval(async () => {
      try {
        const body = id_task;
        const res = await axiosConfig.post(apiLoginChannelResults, body);
        if (res?.data?.status === 'SUCCESS') {
          setStatusLogin(res?.data);
          if (res?.data?.data?.error?.includes('Quét mã QR lại')) {
            socketRef.current.send(
              JSON.stringify({
                command: 'login_qr',
                proxy: dataFb?.filter(
                  (item) => item.id === Number(params?.account),
                )[0]?.proxy?.proxy,
              }),
            );
          }
          if (!res?.data?.data?.status) {
            toast.error(res?.data?.data?.error || 'Đã có lỗi xảy ra !');
          }
          const infoRes = await axiosConfig.get(`${apiGetInforChannel}?id_account=${id}`);
          setInforChannel(infoRes.data);
          clearInterval(intervalId);
          setLoadingLogin(false);
        }
      } catch (err) {
        toast.error(
          err?.response?.data?.error ||
          err?.response?.data?.messenger ||
          err?.response?.error ||
          'Đã có lỗi xảy ra !',
        );
        setLoadingLogin(false);
      }
    }, 1000);
  };
  useEffect(() => {
    if (rfLogin === 'login') {
      fetchLoginChannel(params?.account);
      setRfLogin('');
    }
  }, [rfLogin]);
  const itemTemplate = (item, options) => {
    const className = classNames(
      'd-flex flex-column align-items-center justify-content-center p-2 w-auto border-0 cursor-pointer',
      {
        'fw-bold text-white bg-primary rounded': Number(params?.account) === item.id,
      },
      {
        'pointer-events-none': loadingLogin,
      },
    );
    return (
      <div
        className={className}
        onClick={() => {
          setResultQr([]);
          fetchLoginChannel(item.id);
          getCsrfToken(params);
          router.push(`/zalo-campaigns/post-video/${item.id}`);
          setInforChannel(null);
        }}
        style={{ width: options.props.itemSize + 'px' }}
      >
        <img
          src={item.avatar}
          alt={item.name}
          style={{
            width: '25px',
            height: '25px',
            borderRadius: '50%',
            marginBottom: '5px',
          }}
        />
        <span
          className="w-auto small zlvideo-account-name"
          style={{
            width: 'max-content',
            maxWidth: '120px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'block',
          }}
        >
          {item.name}
        </span>
      </div>
    );
  };

  return (
    <div className="header-zlvideo-container ">
      {!pathname.includes("post-article") && (
        <nav
          onClick={() => setIsInstruc(true)}
          className="cursor-pointer d-flex align-items-center justify-content-center p-2">
          <p
            className="fs-5 fw-bold bg-primary p-2 rounded"
            style={{ width: 'max-content' }}
          >
            Hướng Dẫn Tạo Kênh
          </p>
        </nav>
      )}
      <VirtualScroller
        items={dataFb || []}
        itemSize={50}
        itemTemplate={itemTemplate}
        orientation="horizontal"
        className=" rounded  w-100 shadow bg-white"
        style={{ width: '100%', height: '80px' }}
      />
    </div>
  );
};