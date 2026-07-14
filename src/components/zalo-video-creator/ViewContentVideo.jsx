import { useState } from 'react';
import { API_URL, API_CHANNEL_VIDEO } from '@/lib/zalo-video/legacy-api';
import { TfiReload } from 'react-icons/tfi';
import { useParams } from 'next/navigation';
import { getAxios } from '@/const/getAxios';
import { TabView, TabPanel } from 'primereact/tabview';
import { ViewDataInforAccount } from './ViewDataInforAccount';
import axiosConfig from "@/lib/axios"
export const ViewContentVideo = ({
  inforChannel,
  setInforChannel,
  apiGetInforChannel,
}) => {
  const params = useParams();
  const apiRenewInfor = API_URL + API_CHANNEL_VIDEO.API_RENEW_INFOR;
  const apiRenewInforRs = API_URL + API_CHANNEL_VIDEO.API_LOGIN_CHANNEL_RESULTS;
  const [loadingRenew, setLoadingRenew] = useState(false);
  const fetchRenewChannel = async () => {
    setLoadingRenew(true);
    const body = {
      id_account: Number(params.account),
    };
    try {
      const res = await axiosConfig.post(apiRenewInfor, body);
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
        const res = await axiosConfig.post(apiRenewInforRs, body);
        if (res?.data?.status === 'SUCCESS') {
          setLoadingRenew(false);

          toast.success('Thành công!');
          getAxios(
            `${apiGetInforChannel}?id_account=${params.account}`,
            setInforChannel,
          );
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
    <div className="d-flex flex-column h-100 p-2 bg-white shadow flex-1">
      <div className="d-flex justify-content-between align-items-center bg-white">
        <div className="d-flex align-items-center h-100 gap-2 ">
          <nav className="bg-dark rounded">
            <img
              src={inforChannel?.avatar}
              style={{ width: '50px', height: '50px', borderRadius: '50%' }}
            />
          </nav>
          <nav className="d-flex flex-column justify-content-around h-100">
            <p className="fw-bold fs-6">{inforChannel?.name}</p>
            <nav className="d-flex gap-2">
              <p className="fw-bold">{inforChannel?.videos} Video</p>
              <p className="fw-bold">
                {inforChannel?.followers} Người theo dõi
              </p>
              <p className="fw-bold">{inforChannel?.likes} Lượt thích</p>
            </nav>
          </nav>
        </div>
        <nav>
          {loadingRenew ? (
            <p className="fs-6 fw-bold mr-4">Đang làm mới thông tin...</p>
          ) : (
            <TfiReload
              onClick={fetchRenewChannel}
              cursor="pointer"
              className="mr-4 "
              title="Làm mới thông tin"
              size={35}
            />
          )}
        </nav>
      </div>
      <TabView className='h-100'>
        <TabPanel header="Tổng Quát">
          <ViewDataInforAccount
            inforChannel={inforChannel}
            setInforChannel={setInforChannel}
            apiGetInforChannel={apiGetInforChannel}
            params={params}
          />
        </TabPanel>
        <TabPanel header="Người theo dõi"></TabPanel>
        <TabPanel header="Nội dung"></TabPanel>
      </TabView>
    </div>
  );
};
