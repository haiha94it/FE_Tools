import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { MdOutlineCancelPresentation } from 'react-icons/md';
import { API_CHANNEL_VIDEO, API_URL } from '@/lib/zalo-video/legacy-api';
import axiosConfig from "@/lib/axios"
function ModalDeletePhoneChannel({
  isDelete,
  setIsDelete,
  name_zl,
  params,
  fetchPhoneChannel,
}) {
  const apiDeletePhoneChannel =
    API_URL + API_CHANNEL_VIDEO.API_DELETE_PHONE_CHANNEL;
  const apiDeletePhoneChannelRs =
    API_URL + API_CHANNEL_VIDEO.API_DELETE_PHONE_CHANNEL_RS;
  const fetchDeletePhoneChannel = async () => {
    const body = {
      id_account: Number(params.account),
    };
    try {
      const res = await axiosConfig.post(apiDeletePhoneChannel, body);
      const idTask = res.data;
      fetchDeletePhoneChannelRs(idTask);
    } catch (err) {
      toast.error(
        err?.response?.data?.error ||
        err?.response?.data?.messenger ||
        err?.response?.error ||
        'Đã có lỗi xảy ra !',
      );
    }
  };
  const fetchDeletePhoneChannelRs = (id_task) => {
    const intervalId = setInterval(async () => {
      try {
        const body = id_task;
        const res = await axiosConfig.post(apiDeletePhoneChannelRs, body);
        if (res?.data?.status === 'SUCCESS') {
          fetchPhoneChannel();
          setIsDelete(false);
          clearInterval(intervalId);
        }
      } catch (err) {
        toast.error(
          err?.response?.data?.error ||
          err?.response?.data?.messenger ||
          err?.response?.error ||
          'Đã có lỗi xảy ra !',
        );
      }
    }, 2000);
  };
  return (
    <Dialog
      header=""
      className="dialog-shop"
      visible={isDelete}
      style={{ width: '40%' }}
      onHide={() => {
        if (!isDelete) return;
        setIsDelete(false);
      }}
      closable={false}
    >
      <div
        className="flex flex-column align-items-center justify-content-center gap-4 mt-4 p-2 rounded"
        style={{ background: '#e9e9e9' }}
      >
        <MdOutlineCancelPresentation size={50} color="red" />
        <nav>
          <p className="text-center fs-6 fw-4 mb-2 lh-base">
            Tài khoản Zalo <strong>{name_zl}</strong> sẽ không còn là tài khoản
            liên hệ qua Zalo nữa. Bạn có muốn tiếp tục?
          </p>
        </nav>
        <nav className="d-flex gap-2">
          <Button
            label="Hủy bỏ"
            className="bg-light rounded text-dark p-2 lh-base"
            style={{ width: '90px' }}
            onClick={() => setIsDelete(false)}
            autoFocus
          />
          <Button
            label="Xác nhận"
            className="bg-primary rounded text-light p-2 lh-base"
            style={{ width: '90px' }}
            onClick={() => fetchDeletePhoneChannel()}
            autoFocus
          />
        </nav>
      </div>
    </Dialog>
  );
}

export default ModalDeletePhoneChannel;
