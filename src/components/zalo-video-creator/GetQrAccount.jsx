import { Button } from 'primereact/button';
import { Image } from 'primereact/image';
import { useEffect, useState } from 'react';

export const GetQrAccount = ({ resultQr, dataFb, socketRef, params }) => {
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (resultQr.length > 0) {
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev > 1) return prev - 1;
          clearInterval(timer);
          return 0;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resultQr]);
  return (
    <div
      className="card flex flex-column h-100 flex-wrap gap-3 mt-2 w-100 align-items-center justify-content-center"
      style={{ border: '0' }}
    >
      <div className="flex justify-content-center align-items-center flex-column w-100">
        <p>
          Quét mã QR lại để lấy thông tin kênh của tài khoản{' '}
          <strong>
            {
              dataFb?.filter((item) => item.id === Number(params?.account))[0]
                ?.name
            }
          </strong>
        </p>
        {resultQr?.length > 0 ? (
          <>
            {resultQr && resultQr !== 'timeout' && (
              <Image
                loading="lazy"
                src={resultQr}
                alt="Image"
                width="250"
                preview
              />
            )}
            <nav className="d-flex gap-2 justify-content-center">
              <p style={{ color: countdown === 0 ? 'red' : 'blue' }}>
                {countdown === 0 ? 'Mã Qr đã hết hạn' : 'Mã Qr sẻ hết hạn sau:'}
              </p>
              {countdown > 0 && (
                <p style={{ color: countdown > 10 ? 'blue' : 'red' }}>
                  {countdown}
                </p>
              )}
            </nav>
          </>
        ) : (
          <></>
        )}
      </div>
      <nav className="d-flex w-100 align-items-center justify-content-center">
        {!resultQr.length > 0 && (
          <Button
            className="button-blue radius"
            onClick={() => {
              socketRef.current.send(
                JSON.stringify({
                  command: 'login_qr',
                  proxy: dataFb?.filter(
                    (item) => item.id === Number(params?.account),
                  )[0]?.proxy?.proxy,
                }),
              );
            }}
          >
            Lấy mã QR
          </Button>
        )}
        {countdown === 0 && resultQr.length && (
          <Button
            className="button-blue radius"
            onClick={() => {
              socketRef.current.send(
                JSON.stringify({
                  command: 'login_qr',
                  proxy: dataFb?.filter(
                    (item) => item.id === Number(params?.account),
                  )[0]?.proxy?.proxy,
                }),
              );
            }}
          >
            Làm mới
          </Button>
        )}
      </nav>
    </div>
  );
};
