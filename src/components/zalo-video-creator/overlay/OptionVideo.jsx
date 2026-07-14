import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { pinVideo, lockComment } from '../router_request';
export const OptionVideo = ({
  params,
  getListVideoChannel,
  rowData,
}) => {
  const pathname = usePathname();

  const [loadingPin, setLoadingPin] = useState(false);
  const fetchPinVideo = async (key) => {
    setLoadingPin(true);
    if (pathname?.includes('comment-manager')) {
    } else {
      pinVideo(rowData.id, getListVideoChannel, params, rowData.isPinned ? 'unpin' : 'pin');
    }
    setLoadingPin(false);

  };
  return (
    <div>
      {loadingPin ? (
        <p>Đang thực hiện..</p>
      ) : (
        <>
          <p
            className="m-0 border-0 hover:bg-secondary"
            style={{ cursor: 'pointer' }}
            onClick={() => fetchPinVideo('pin')}
          >
              {rowData?.isPinned ? 'Bỏ ghim' : 'Ghim'}
          </p>
          {!pathname?.includes('comment-manager') && (
            <p
              className="m-0 border-0 hover:bg-secondary mt-2"
              style={{ cursor: 'pointer' }}
                onClick={() => lockComment(rowData.id, getListVideoChannel, params, rowData.lockComment ? '0' : '1')}
            >
                {rowData?.lockComment ? 'Mở khóa bình luận' : 'Khóa bình luận'}
            </p>
          )}
        </>
      )}
    </div>
  );
};
