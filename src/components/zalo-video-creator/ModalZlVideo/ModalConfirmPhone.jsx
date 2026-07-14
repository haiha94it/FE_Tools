import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { RadioButton } from 'primereact/radiobutton';
import { useState } from 'react';
import { API_CHANNEL_VIDEO, API_URL } from '@/lib/zalo-video/legacy-api';
import { InputText } from 'primereact/inputtext';
import { validatePhoneVN } from '@/const/getLinkFile';
import { useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import axiosConfig from "@/lib/axios"
function ModalConfirmPhone({
  isAddPhone,
  setIsAddPhone,
  setIsAccept,
  phone,
  setPhone,
}) {
  const params = useParams();
  const [optionPhone, setOptionPhone] = useState('phone');
  const [error, setError] = useState('');
  const [loadingPhone, setLoadingPhone] = useState(false);
  const apiAddPhoneChannel = API_URL + API_CHANNEL_VIDEO.API_ADD_PHONE_CHANNEL;
  const apiAddPhoneChannelRs =
    API_URL + API_CHANNEL_VIDEO.API_ADD_PHONE_CHANNEL_RS;
  const fetchPhoneChannel = async () => {
    setLoadingPhone(true);
    const body = {
      id_account: Number(params.account),
      phone: phone,
    };
    try {
      const res = await axiosConfig.post(apiAddPhoneChannel, body);
      const idTask = res.data;
      fetchPhoneChannelRs(idTask);
    } catch (err) {
      toast.error(
        err?.response?.data?.error ||
        err?.response?.data?.messenger ||
        err?.response?.error ||
        err?.response?.data?.data.error ||
        'Đã có lỗi xảy ra !',
      );
      setLoadingPhone(false);
    }
  };
  const fetchPhoneChannelRs = (id_task) => {
    const intervalId = setInterval(async () => {
      try {
        const body = id_task;
        const res = await axiosConfig.post(apiAddPhoneChannelRs, body);
        if (res?.data?.status === 'SUCCESS') {
          setLoadingPhone(false);
          clearInterval(intervalId);
          toast.success(
            res?.data?.data?.error || res?.data?.data?.messenger || '',
          );
          setIsAccept(true);
          setIsAddPhone(false);
        }
      } catch (err) {
        toast.error(
          err?.response?.data?.error ||
          err?.response?.data?.messenger ||
          err?.response?.error ||
          err?.response?.data?.data.error ||
          'Đã có lỗi xảy ra !',
        );
        clearInterval(intervalId);
        setLoadingPhone(false);
      }
    }, 3000);
  };
  const handleChange = (e) => {
    const value = e.target.value;
    setPhone(value);
    if (value && !validatePhoneVN(value)) {
      setError('Số điện thoại không hợp lệ');
    } else {
      setError('');
    }
  };

  const footerContent = loadingPhone ? (
    <p className="fs-6 p-4 fw-bold mr-4">Đang thực hiện...</p>
  ) : (
    <div className="flex gap-2 justify-content-end w-100">
      <Button
        label="Đóng"
        className="bg-light text-dark rounded p-2 lh-base "
        onClick={() => setIsAddPhone(false)}
        autoFocus
      />
      <Button
        disabled={error || !phone}
        label="Tiếp tục"
        className="bg-primary rounded p-2 lh-base"
        onClick={() => fetchPhoneChannel()}
        autoFocus
      />
    </div>
  );
  return (
    <Dialog
      header="Thiết lập tài khoản cho nút Liên hệ Zalo"
      className="dialog-shop"
      visible={isAddPhone}
      style={{ width: '50%' }}
      onHide={() => {
        if (!isAddPhone) return;
        setIsAddPhone(false);
      }}
      footer={footerContent}
    >
      <div className="flex flex-column gap-4 mt-4">
        <div className="flex flex-column w-100 gap-2">
          <div className="flex align-items-start">
            <RadioButton
              inputId="ingredient1"
              name="pizza"
              value="pin"
              onChange={(e) => setOptionPhone(e.value)}
              checked={optionPhone === 'pin'}
            />
            <label htmlFor="ingredient1" className="ml-2">
              <nav className="d-flex flex-column gap-2 align-items-start">
                <p className="fs-6 fw-bold">Nhập mã PIN</p>
                <p style={{ color: '#b5b5b5' }} className="fs-6 ">
                  Được cung cấp bởi chủ tài khoản của nút Liên hệ
                </p>
              </nav>
            </label>
          </div>
          {optionPhone === 'pin' && <InputNumber placeholder="Nhập mã PIN" />}
        </div>
        <div className="flex flex-column w-100 gap-2">
          <div className="flex align-items-start">
            <RadioButton
              inputId="ingredient2"
              name="pizza"
              value="phone"
              onChange={(e) => setOptionPhone(e.value)}
              checked={optionPhone === 'phone'}
            />
            <label htmlFor="ingredient2" className="ml-2">
              <nav className="d-flex flex-column gap-2 align-items-start">
                <p className="fs-6 fw-bold">
                  Thêm số điện thoại cho nút Liên hệ
                </p>
                <p
                  style={{ color: '#b5b5b5', lineHeight: '1.5' }}
                  className="fs-6 "
                >
                  * Bằng việc tiếp tục, bạn đã xác nhận đồng ý nhận tin nhắn OTP
                  từ OA Zalo Video Creators để xác thực số điện thoại
                </p>
              </nav>
            </label>
          </div>
          {optionPhone === 'phone' && (
            <InputText
              value={phone}
              onChange={(e) => handleChange(e)}
              placeholder="Nhập số điện thoại"
            />
          )}
        </div>
      </div>
    </Dialog>
  );
}

export default ModalConfirmPhone;
