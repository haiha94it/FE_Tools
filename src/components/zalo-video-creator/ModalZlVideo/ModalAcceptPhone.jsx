import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputOtp } from 'primereact/inputotp';
import { useState } from 'react';
import { API_CHANNEL_VIDEO, API_URL } from '@/lib/zalo-video/legacy-api';
import { useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import axiosConfig from "@/lib/axios"
function ModalAcceptPhone({
  isAcceptPhone,
  setIsAcceptPhone,
  phone,
  setIsAccept,
  setIsSucess,
}) {
  const [token, setToken] = useState('');
  const params = useParams();
  const [loadingPhone, setLoadingPhone] = useState(false);
  const apiConfirmPhoneChannel =
    API_URL + API_CHANNEL_VIDEO.API_CONFIRM_PHONE_CHANNEL;
  const apiConfirmPhoneChannelRs =
    API_URL + API_CHANNEL_VIDEO.API_CONFIRM_PHONE_CHANNEL_RS;
  const fetchConfirmChannel = async () => {
    setLoadingPhone(true);
    const body = {
      id_account: Number(params.account),
      code: token,
    };
    try {
      const res = await axiosConfig.post(apiConfirmPhoneChannel, body);
      const idTask = res.data;
      fetchConfirmChannelRs(idTask);
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
  const fetchConfirmChannelRs = (id_task) => {
    const intervalId = setInterval(async () => {
      try {
        const body = id_task;
        const res = await axiosConfig.post(apiConfirmPhoneChannelRs, body);
        if (res?.data?.status === 'SUCCESS') {
          setLoadingPhone(false);
          clearInterval(intervalId);
          setIsSucess(true);
          setIsAcceptPhone(false);
        }
      } catch (err) {
        toast.error(
          err?.response?.data?.error ||
            err?.response?.data?.messenger ||
            err?.response?.error ||
            'Đã có lỗi xảy ra !',
        );
        setLoadingPhone(false);
      }
    }, 3000);
  };

  const footerContent = loadingPhone ? (
    <p className="fs-6 p-4 fw-bold mr-4">Đang thực hiện...</p>
  ) : (
    <div className="flex gap-2 justify-content-end w-100">
      <Button
        label="Đóng"
        className="bg-light text-dark rounded p-2 lh-base "
        onClick={() => setIsAcceptPhone(false)}
        autoFocus
      />
      <Button
        // disabled={error || !phone}
        label="Tiếp tục"
        className="bg-primary rounded p-2 lh-base"
        onClick={() => fetchConfirmChannel()}
        autoFocus
      />
    </div>
  );
  return (
    <Dialog
      header="Xác thực số điện thoại"
      className="dialog-shop"
      visible={isAcceptPhone}
      style={{ width: '40%' }}
      onHide={() => {
        if (!isAcceptPhone) return;
        setIsAcceptPhone(false);
      }}
      footer={footerContent}
    >
      <div className="flex flex-column align-items-start justify-content-start gap-4 mt-4 rounded">
        <p>
          Vui lòng nhập mã OTP được gửi từ OA Zalo Video Creators tới số Zalo{' '}
          <strong>{phone}</strong> để xác nhận
        </p>
        <div className="flex justify-content-start">
          <InputOtp
            value={token}
            onChange={(e) => setToken(e.value)}
            length={6}
            autoFocus
            placeholder="•"
          />
        </div>
        <p
          onClick={() => {
            setIsAccept(true);
            isAcceptPhone(false);
          }}
          className="fw-bold text-primary cursor-pointer"
        >
          Nhập số điện thoại khác
        </p>
      </div>
    </Dialog>
  );
}

export default ModalAcceptPhone;
