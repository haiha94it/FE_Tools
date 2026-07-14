import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { cancelVideoSchedule, deleteCommentVideo, deleteVideo } from "../router_request"
export const Removideo = ({
  rowData,
  getListVideoChannel,
  params,
  selectedStatus
}) => {
  const pathname = usePathname();
  const [loadingPin, setLoadingPin] = useState(false);
  const fetchRemoveVideo = async () => {
    setLoadingPin(true);
    if (selectedStatus.code === "private") {
      return cancelVideoSchedule(rowData.id, getListVideoChannel, params)
    }
    if (pathname?.includes('comment-manager')) {
      await deleteCommentVideo(rowData.id, getListVideoChannel, params)
    } else {
      await deleteVideo(rowData.id, getListVideoChannel, params)
    }
    setLoadingPin(false);

  };
  return (
    <div>
      {loadingPin ? (
        <p>Đang thực hiện...</p>
      ) : (
        <>
          <p className="m-0">Bạn có chắc muốn xoá?</p>
          <button
            onClick={() => fetchRemoveVideo()}
            className="btn btn-danger btn-sm mt-2"
          >
            Xác nhận
          </button>
        </>
      )}
    </div>
  );
};
