import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { IoMdInformationCircleOutline } from 'react-icons/io';
function ModalSendMessAcceptPhone({
  isAccept,
  setIsAccept,
  phone,
  setIsAcceptPhone,
}) {
  return (
    <Dialog
      header=""
      className="dialog-shop"
      visible={isAccept}
      style={{ width: '40%' }}
      onHide={() => {
        if (!isAccept) return;
        setIsAccept(false);
      }}
      closable={false}
    >
      <div
        className="flex flex-column align-items-center justify-content-center gap-4 mt-4 p-2 rounded"
        style={{ background: '#e9e9e9' }}
      >
        <IoMdInformationCircleOutline size={50} />
        <nav>
          <p className="text-center fs-6 fw-4 mb-2 lh-base">
            Một tin nhắn đã được gửi từ OA Zalo Creators tới tài khoản Zalo của
            Số {phone} để xác nhận đồng ý trở thành tài khoản liên hệ của kênh.
          </p>
          <p className="text-center fs-6 fw-4 lh-base">
            Sau khi bấm "Đồng ý" hệ thống sẻ gửi mã OTP để xác thực số điện
            thoại ở bước tiếp theo
          </p>
        </nav>
        <Button
          label="Tiếp tục"
          className="bg-light rounded text-dark p-2 lh-base"
          style={{ width: '90px' }}
          onClick={() => {
            setIsAccept(false);
            setIsAcceptPhone(true);
          }}
          autoFocus
        />
      </div>
    </Dialog>
  );
}

export default ModalSendMessAcceptPhone;
