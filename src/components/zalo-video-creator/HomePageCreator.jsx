'use client';

import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { useAuth } from '../../../AuthContext';

export const HomePageCreator = () => {
  const { userLoggedIn } = useAuth();
  const router = useRouter();

  return (
    <div
      className="w-100 min-vh-100 d-flex flex-column-reverse  flex-lg-row justify-content-center align-items-center gap-4 px-3 py-5"
      style={{
        backgroundImage: 'url("/img_creator/bg.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        overflowX: 'hidden',
        overflowY: 'auto',
      }}
    >
      <div
        className="position-fixed top-0 end-0 p-3 d-flex gap-2 flex-row align-items-center z-3"
        style={{ zIndex: 1030 }}
      >
        <Button
          label={userLoggedIn ? 'Video Creator' : 'Đăng nhập'}
          onClick={() => router.push('/zalo-campaigns/post-video')}
          className="px-3 py-2 fw-semibold text-white"
          style={{
            backgroundColor: '#005CED',
            border: 'none',
            borderRadius: '50px',
            fontSize: '0.9rem',
          }}
        />

        <Button
          label="Đăng ký"
          onClick={() => router.push('/zalo-campaigns/post-video?register')}
          outlined
          className="px-3 py-2 fw-semibold text-primary border-primary"
          style={{
            borderRadius: '50px',
            fontSize: '0.9rem',
          }}
        />
      </div>
      <div className="col-12 col-lg-6 d-flex justify-content-center flex-column align-items-start gap-4 text-center text-lg-start">
        <nav className="d-flex flex-column align-items-center  w-100">
          <div className="d-none d-md-block">
            <h2
              className="d-none d-md-block bg-white text-primary fw-bold fs-2 fs-md-6 p-3 rounded-pill text-break"
              style={{
                letterSpacing: '1.5px',
                border: '3px solid #005CED',
                fontSize: '1.1rem',
              }}
            >
              CÔNG CỤ QUẢN LÝ ZALO CHANNEL
            </h2>

            {/* Dành cho màn hình nhỏ */}
            <h2
              className="d-block d-md-none fs-6 bg-white text-primary fw-bold p-3 rounded-pill text-break"
              style={{
                letterSpacing: '1.5px',
                border: '3px solid #005CED',
                fontSize: '1.1rem',
              }}
            >
              CÔNG CỤ QUẢN LÝ ZALO CHANNEL
            </h2>
          </div>
          <>
            <h2
              className="d-none d-md-block fw-semibold fs-2 text-white fw-bold mt-3 text-break"
              style={{
                fontSize: '1.5rem',
                letterSpacing: '2px',
              }}
            >
              ZALO VIDEO CREATOR
            </h2>
          </>
        </nav>

        <nav
          className="d-flex flex-column gap-4 text-start w-100 "
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            border: ' 2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '10px',
            padding: '20px',
            boxShadow: '0 0 15px rgba(0, 255, 0, 0.5)',
          }}
        >
          {[
            '. HOÀN TOÀN MIỄN PHÍ ĐẾN NGƯỜI DÙNG',
            '. QUẢN LÝ KHÔNG GIỚI HẠN KÊNH ZALO VIDEO',
            '. ĐĂNG TẢI KHÔNG GIỚI HẠN VIDEO',
            '. TIỆN DỤNG TRÊN MỌI THIẾT BỊ',
            '. ĐẦY ĐỦ TẤT CẢ CÁC TÍNH NĂNG',
            '. TÍCH HỢP CÁC TIỆN ÍCH THÔNG MINH',
            '. TIÊN PHONG ĐẦU TIÊN TRONG NĂM 2025',
            '. REUP TIKTOK & FACEBOOK LÊN ZALO VIDEO',
          ].map((item, idx) => (
            <h5
              key={idx}
              className="text-white lh-sm fw-normal m-0 fs-4 text-break"
              style={{ letterSpacing: '0.5px' }}
            >
              {item}
            </h5>
          ))}
        </nav>
      </div>

      {/* Right Image */}
      <div className="col-12 col-lg-6 text-center mt-4 mt-lg-0">
        <nav className="d-flex flex-column align-items-center  w-100">
          <div className="d-block d-md-none">
            <h2
              className="d-none d-md-block bg-white text-primary fw-bold fs-2 fs-md-6 p-3 rounded-pill text-break"
              style={{
                letterSpacing: '1.5px',
                border: '3px solid #005CED',
                fontSize: '1.1rem',
              }}
            >
              CÔNG CỤ QUẢN LÝ ZALO CHANNEL
            </h2>

            {/* Dành cho màn hình nhỏ */}
            <h2
              className="d-block d-md-none fs-4 bg-white text-primary fw-bold p-2 rounded-pill text-break"
              style={{
                letterSpacing: '1.5px',
                border: '3px solid #005CED',
                fontSize: '1.1rem',
              }}
            >
              CÔNG CỤ QUẢN LÝ ZALO CHANNEL
            </h2>
          </div>
          <>
            <h2
              className="d-none d-md-block fw-semibold fs-2 text-white fw-bold mt-3 text-break "
              style={{
                fontSize: '1.5rem',
                letterSpacing: '2px',
              }}
            >
              ZALO VIDEO CREATOR
            </h2>
            <h2
              className="d-block d-md-none fw-semibold fs-6 text-white fw-bold mt-3 text-break"
              style={{
                fontSize: '1.5rem',
                letterSpacing: '2px',
              }}
            >
              ZALO VIDEO CREATOR
            </h2>
          </>
        </nav>
        <img
          src="/img_creator/contentedit.png"
          alt="Content"
          className="img-fluid mt-2"
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
        />
      </div>
    </div>
  );
};
