import { SiZalo } from 'react-icons/si';
import { InputSwitch } from 'primereact/inputswitch';
import { useEffect, useState } from 'react';
import { API_CHANNEL_VIDEO, API_URL } from '@/lib/zalo-video/legacy-api';
import { useHeaders } from '@/const/headers';
import ModalConfirmPhone from './ModalZlVideo/ModalConfirmPhone';
import ModalSendMessAcceptPhone from './ModalZlVideo/ModalSendMessAcceptPhone';
import ModalAcceptPhone from './ModalZlVideo/ModalAcceptPhone';
import ModalSuccesAddPhone from './ModalZlVideo/ModalSuccesAddPhone';
import { Checkbox } from 'primereact/checkbox';
import ModalDeletePhoneChannel from './ModalZlVideo/ModalDeletePhoneChannel';
import ModalOpenFormOption from './ModalZlVideo/ModalOpenFormOption';
import { toast } from 'react-toastify';
import { getAxios } from '@/const/getAxios';
import axiosConfig from "@/lib/axios"
export const InformationZaloVideo = ({
  inforChannel,
  params,
  apiGetInforChannel,
  setInforChannel,
}) => {
  const headers = useHeaders();
  const apiGetPhoneChannel = API_URL + API_CHANNEL_VIDEO.API_GET_PHONE_CHANNEL;
  const apiGetPhoneChannelRs =
    API_URL + API_CHANNEL_VIDEO.API_GET_PHONE_CHANNEL_RS;
  const [checkedPhone, setCheckedPhone] = useState(false);
  const [loadingPhone, setLoadingPhone] = useState(false);
  const [isAddPhone, setIsAddPhone] = useState(false);
  const [isAccept, setIsAccept] = useState(false);
  const [phone, setPhone] = useState(null);
  const [isAcceptPhone, setIsAcceptPhone] = useState(false);
  const [isSucess, setIsSucess] = useState(false);
  const [isDelete, setIsDelete] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const fetchPhoneChannel = async () => {
    setLoadingPhone(true);
    const body = {
      id_account: Number(params.account),
    };
    try {
      const res = await axiosConfig.post(apiGetPhoneChannel, body);
      const idTask = res.data;
      fetchPhoneChannelRs(idTask);
    } catch (err) {
      toast.error(
        err?.response?.data?.error ||
        err?.response?.data?.messenger ||
        err?.response?.error ||
        'Đã có lỗi xảy ra !',
      );
      setLoadingPhone(false);
    }
  };
  const fetchPhoneChannelRs = (id_task) => {
    const intervalId = setInterval(async () => {
      try {
        const body = id_task;
        const res = await axiosConfig.post(apiGetPhoneChannelRs, body);
        if (res?.data?.status === 'SUCCESS') {
          getAxios(
            `${apiGetInforChannel}?id_account=${params.account}`,
            setInforChannel,
          );
          setCheckedPhone(res.data.data.status);
          setLoadingPhone(false);
          clearInterval(intervalId);
        }
      } catch (err) {
        toast.error(
          err?.response?.data?.error ||
          err?.response?.data?.messenger ||
          err?.response?.error ||
          'Đã có lỗi xảy ra !',
        );
        clearInterval(intervalId);
        setLoadingPhone(false);
      }
    }, 1000);
  };

  useEffect(() => {
    fetchPhoneChannel();
  }, []);
  return loadingPhone ? (
    <p className="izv-loading">Đang lấy thông tin kênh...</p>
  ) : (
    <>
      <div className="izv-main">
        <div className="izv-info">
          <p className="izv-info-title">Thông tin kênh</p>
          <div className="izv-info-content">
            <div className="izv-info-fields">
              <div className="izv-field">
                <span className="izv-label">Tên kênh</span>
                <span className="izv-value">{inforChannel?.name}</span>
              </div>
              <div className="izv-field">
                <span className="izv-label">ID kênh</span>
                <span className="izv-value">
                  {inforChannel?.channel_id || 'Bạn chưa có ID kênh'}
                </span>
              </div>
              <div className="izv-field">
                <span className="izv-label">Giới thiệu kênh</span>
                <span className="izv-value">{inforChannel?.bio}</span>
              </div>
            </div>
            <div className="izv-avatar-wrap">
              <img
                src={inforChannel?.avatar}
                className="izv-avatar"
                alt="avatar"
              />
            </div>
          </div>
        </div>
        <div className="izv-setting">
          <p className="izv-info-title">Cài đặt kênh</p>
          <div className="izv-setting-content">
            <div className="izv-setting-row">
              <span className="izv-zalo-label">
                <SiZalo /> Nút liên hệ qua Zalo
              </span>
              <InputSwitch
                checked={checkedPhone}
                onChange={(e) => {
                  if (e.value) setIsAddPhone(true);
                }}
              />
            </div>
            <div className="izv-setting-desc">
              <p>
                - Nút Liên hệ sẽ được hiển thị trong trang Kênh của tôi trên ứng
                dụng.
              </p>
              <p>
                - Bạn có thể cài đặt để hiển thị nút Liên hệ trên từng video
                trong trang Quản lý nội dung video.
              </p>
              {inforChannel?.display_name && (
                <div className="izv-setting-custom">
                  <div className="izv-setting-checkbox">
                    <Checkbox checked={true} />
                    <span>Mặc định hiển thị trong bình luận của video</span>
                  </div>
                  <p className="izv-zalo-contact">
                    Tài khoản Zalo liên hệ: {inforChannel?.display_name}
                  </p>
                  <div className="izv-setting-actions">
                    <span
                      className="izv-action izv-action-custom"
                      onClick={() => setIsCustom(true)}
                    >
                      Tùy chỉnh
                    </span>
                    <span>|</span>
                    <span
                      className="izv-action izv-action-delete"
                      onClick={() => setIsDelete(true)}
                    >
                      Hủy liên kết
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <ModalConfirmPhone
        setIsAccept={setIsAccept}
        phone={phone}
        setPhone={setPhone}
        isAddPhone={isAddPhone}
        setIsAddPhone={setIsAddPhone}
      />
      <ModalSendMessAcceptPhone
        phone={phone}
        isAccept={isAccept}
        setIsAccept={setIsAccept}
        setIsAcceptPhone={setIsAcceptPhone}
      />
      <ModalAcceptPhone
        setIsAccept={setIsAccept}
        phone={phone}
        isAcceptPhone={isAcceptPhone}
        setIsAcceptPhone={setIsAcceptPhone}
        setIsSucess={setIsSucess}
      />
      <ModalSuccesAddPhone
        isSucess={isSucess}
        setIsSucess={setIsSucess}
        inforChannel={inforChannel}
        setIsCustom={setIsCustom}
      />
      <ModalDeletePhoneChannel
        fetchPhoneChannel={fetchPhoneChannel}
        setInforChannel={setInforChannel}
        isDelete={isDelete}
        setIsDelete={setIsDelete}
        name_zl={inforChannel?.display_name}
        params={params}
      />
      <ModalOpenFormOption
        inforChannel={inforChannel}
        fetchPhoneChannel={fetchPhoneChannel}
        params={params}
        isCustom={isCustom}
        setIsCustom={setIsCustom}
        headers={headers}
      />
    </>
  );
};
