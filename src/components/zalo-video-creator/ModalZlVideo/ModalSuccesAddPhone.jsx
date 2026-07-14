import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { IoMdInformationCircleOutline } from 'react-icons/io';
function ModalSuccesAddPhone({
  isSucess,
  setIsSucess,
  inforChannel,
  setIsCustom,
}) {
  return (
    <Dialog
      header=""
      className="dialog-shop"
      visible={isSucess}
      style={{ width: '40%' }}
      onHide={() => {
        if (!isSucess) return;
        setIsSucess(false);
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
            Kênh <strong>{inforChannel?.name}</strong> của bạn đã được kích hoạt
            tính năng liên hệ qua Zalo. Bấm từ chỉnh để thay đổi các cài đặt
            hiển thị theo ý muốn
          </p>
        </nav>
        <nav className="d-flex gap-2">
          <Button
            label="Đóng"
            className="bg-light rounded text-dark p-2 lh-base"
            style={{ width: '90px' }}
            onClick={() => {
              setIsSucess(false);
            }}
            autoFocus
          />
          <Button
            label="Tùy chỉnh"
            className="bg-primary rounded text-light p-2 lh-base"
            style={{ width: '90px' }}
            onClick={() => {
              setIsSucess(false);
              setIsCustom(true);
            }}
            autoFocus
          />
        </nav>
      </div>
    </Dialog>
  );
}

export default ModalSuccesAddPhone;
