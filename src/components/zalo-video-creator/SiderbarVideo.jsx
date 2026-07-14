import { TbBrandGoogleAnalytics } from 'react-icons/tb';
import { CiSettings } from 'react-icons/ci';
import { IoMdInformationCircleOutline } from 'react-icons/io';
import { Button } from 'primereact/button';
import { useParams, useRouter } from 'next/navigation';
import { MdNewLabel } from 'react-icons/md';
import { GrChannel } from 'react-icons/gr';

export const SiderbarVideo = ({ setIsInstruc, isHiddenElement }) => {
  const router = useRouter();
  const params = useParams();
  const base = `/zalo-campaigns/post-video/${params.account}`;

  return (
    <div className="d-flex justify-content-between flex-column gap-3 px-3  py-4 shadow bg-white rounded h-100 border-end">
      <div className=''>
        {isHiddenElement && (
          <>
            <div className="text-center mb-3">
              <Button
                className="btn btn-primary w-100 fw-bold"
                onClick={() =>
                  router.push(`${base}/video-post`)
                }
              >
                Đăng video
              </Button>
            </div>

            <div
              onClick={() => router.push(base)}
              className={`d-flex align-items-center gap-2 py-2 px-3 rounded cursor-pointer ${!params?.infor ? 'bg-primary text-white' : 'text-dark'
                } hover-shadow`}
              style={{ transition: '0.3s' }}
            >
              <TbBrandGoogleAnalytics size={20} />
              <span className="fw-medium">Phân tích dữ liệu</span>
            </div>

            <div className="d-flex flex-column">
              <div className="d-flex align-items-center gap-2 py-2 px-3 text-secondary fw-semibold">
                <CiSettings size={20} />
                <span>Quản lý nội dung</span>
              </div>
              <ul className="list-unstyled ps-3 mt-2 d-flex flex-column gap-2">
                <li
                  onClick={() =>
                    router.push(`${base}/video-manager`)
                  }
                  className={`py-2 px-3 rounded cursor-pointer ${params?.infor === 'video-manager'
                    ? 'bg-primary text-white'
                    : 'text-dark'
                    } hover-shadow`}
                >
                  Video
                </li>
                <li
                  onClick={() =>
                    router.push(`${base}/comment-manager`)
                  }
                  className={`py-2 px-3 rounded cursor-pointer ${params?.infor === 'comment-manager'
                    ? 'bg-primary text-white'
                    : 'text-dark'
                    } hover-shadow`}
                >
                  Bình luận
                </li>
                <li
                  onClick={() =>
                    router.push(`${base}/playlist-manager`)
                  }
                  className={`py-2 px-3 rounded cursor-pointer ${params?.infor === 'playlist-manager' ? 'bg-primary text-white' : 'text-dark'
                    } hover-shadow`}

                >
                  Danh sách phát
                </li>
              </ul>
            </div>
            <nav>
              <div
                onClick={() => router.push(`${base}/channel`)}
                className={`d-flex align-items-center gap-2 py-2 px-3 mt-auto rounded cursor-pointer ${params?.infor === 'channel' ? 'bg-primary text-dark' : 'text-dark'
                  } hover-shadow`}
                style={{ transition: '0.3s', height: 'max-content' }}
              >
                <IoMdInformationCircleOutline size={20} />
                <span className="fw-medium">Trang thông tin</span>
              </div>
            </nav>
            <nav>
              <div
                onClick={() => router.push(`${base}/category`)}
                className={`d-flex align-items-center gap-2 py-2 px-3 mt-auto rounded cursor-pointer ${params?.infor === 'category' ? 'bg-primary text-dark' : 'text-dark'
                  } hover-shadow`}
                style={{ transition: '0.3s', height: 'max-content' }}
              >
                <MdNewLabel size={20} />
                <span className="fw-medium">Gán nhãn video</span>
              </div>
            </nav>
            <nav>
              <div
                onClick={() => router.push(`${base}/infor`)}
                className={`d-flex align-items-center gap-2 py-2 px-3 mt-auto rounded cursor-pointer ${params?.infor === 'infor' ? 'bg-primary text-dark' : 'text-dark'
                  } hover-shadow`}
                style={{ transition: '0.3s', height: 'max-content' }}
              >
                <GrChannel size={20} />
                <span className="fw-medium">Thông tin kênh</span>
              </div>
            </nav>
          </>
        )}
      </div>
    </div>
  );
};