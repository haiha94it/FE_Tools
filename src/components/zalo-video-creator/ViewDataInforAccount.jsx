import { useState } from 'react';
import { IoMdInformationCircleOutline } from 'react-icons/io';
import { Dropdown } from 'primereact/dropdown';
import { API_CHANNEL_VIDEO, API_URL } from '@/lib/zalo-video/legacy-api';
import { toast } from 'react-toastify';
import { getAxios } from '@/const/getAxios';
import axiosConfig from "@/lib/axios"
import { useHeaders } from '@/const/headers';
import { getDayMonth, getPreviousDate } from '@/const/getLinkFile';
export const ViewDataInforAccount = ({
  inforChannel,
  setInforChannel,
  apiGetInforChannel,
  params,
}) => {
  const apiRenewGeneral = API_URL + API_CHANNEL_VIDEO.API_RENEW_GENERAL;
  const apiRenewGeneralRs = API_URL + API_CHANNEL_VIDEO.API_RENEW_GENERAL_RS;
  const [showTooltip, setShowTooltip] = useState(false);
  const [showTooltipDaily, setShowTooltipDaily] = useState(false);
  const [loadingGeneral, setLoadingGeneral] = useState(false);
  const headers = useHeaders();
  const [selectedWeek, setSelectWeek] = useState({
    name: '7 Ngày',
    code: 'seven_day',
  });
  const dataWeeks = [
    { name: '7 Ngày', code: 'seven_day' },
    { name: '14 Ngày', code: 'fourteen_day' },
    { name: '30 Ngày', code: 'thirty_day' },
  ];

  const fetchRenewChannel = async (type) => {
    setLoadingGeneral(true);
    const body = {
      id_account: Number(params.account),
      type: type,
    };
    try {
      const res = await axiosConfig.post(apiRenewGeneral, body);
      const idTask = res.data;
      fetchRsRenewChannel(idTask);
    } catch (err) {
      toast.error(
        err?.response?.data?.error ||
        err?.response?.data?.messenger ||
        err?.response?.error ||
        'Đã có lỗi xảy ra !',
      );
      setLoadingGeneral(false);
    }
  };
  const fetchRsRenewChannel = (id_task) => {
    const intervalId = setInterval(async () => {
      try {
        const body = id_task;
        const res = await axiosConfig.post(apiRenewGeneralRs, body);
        if (res?.data?.status === 'SUCCESS') {
          setLoadingGeneral(false);

          toast.success('Thành công!');
          getAxios(
            `${apiGetInforChannel}?id_account=${params.account}`,
            setInforChannel,
          );
          clearInterval(intervalId);
        }
      } catch (err) {
        toast.error(
          err?.response?.data?.error ||
          err?.response?.data?.messenger ||
          err?.response?.error ||
          'Đã có lỗi xảy ra !',
        );
        setLoadingGeneral(false);
      }
    }, 3000);
  };
  return (
    <div className="vda-container">
      <h5 className="vda-title">
        Thống kê hôm nay
        <div className="vda-tooltip-wrap">
          <span
            className="vda-tooltip-icon"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <IoMdInformationCircleOutline size={20} />
          </span>
          {showTooltip && (
            <div className="vda-tooltip">
              Thống kê số liệu từ 00:00 → đến thời điểm hiện tại.
              <ul>
                <li>- Lượt xem: tổng lượt xem từ các video của bạn</li>
                <li>- Thích: số lượt thích các video của bạn</li>
                <li>- Chia sẻ: số lượt chia sẻ các video của bạn</li>
                <li>- Bình luận: số lượng bình luận trên video của bạn</li>
              </ul>
            </div>
          )}
        </div>
      </h5>
      <div className="vda-grid">
        <div className="vda-card">
          <div className="vda-card-body">
            <i className="bi bi-eye"></i>
            <h6>Lượt xem</h6>
            <p className="vda-muted">{inforChannel?.channel_daily?.views}</p>
          </div>
        </div>
        <div className="vda-card">
          <div className="vda-card-body">
            <i className="bi bi-heart"></i>
            <h6>Lượt thích</h6>
            <p className="vda-muted">{inforChannel?.channel_daily?.likes}</p>
          </div>
        </div>
        <div className="vda-card">
          <div className="vda-card-body">
            <i className="bi bi-share"></i>
            <h6>Chia sẻ</h6>
            <p className="vda-muted">{inforChannel?.channel_daily?.shares}</p>
          </div>
        </div>
        <div className="vda-card">
          <div className="vda-card-body">
            <i className="bi bi-chat"></i>
            <h6>Bình luận</h6>
            <p className="vda-muted">{inforChannel?.channel_daily?.comments}</p>
          </div>
        </div>
      </div>

      <div className="vda-section">
        <h5 className="vda-title">
          Thống kê theo ngày
          <div className="vda-tooltip-wrap">
            <span
              className="vda-tooltip-icon"
              onMouseEnter={() => setShowTooltipDaily(true)}
              onMouseLeave={() => setShowTooltipDaily(false)}
            >
              <IoMdInformationCircleOutline size={20} />
            </span>
            {showTooltipDaily && (
              <div className="vda-tooltip">
                Thống kê số liệu từ {getDayMonth(inforChannel?.channel_general?.start)} →
                {getDayMonth(inforChannel?.channel_general?.end)}. (so với{' '}
                {getPreviousDate(inforChannel?.channel_general?.start, selectedWeek.code)} →
                {getPreviousDate(inforChannel?.channel_general?.end, selectedWeek.code)})
                <ul>
                  <li>- Lượt xem: tổng lượt xem từ các video của bạn</li>
                  <li>- Thích: số lượt thích các video của bạn</li>
                  <li>- Chia sẻ: số lượt chia sẻ các video của bạn</li>
                  <li>- Bình luận: số lượng bình luận trên video của bạn</li>
                </ul>
              </div>
            )}
          </div>
        </h5>
        {loadingGeneral ? (
          <p className="vda-loading">Đang làm mới thông tin...</p>
        ) : (
          <div className="vda-date-range">
            <span>{getDayMonth(inforChannel?.channel_general?.start)}</span>
            <span>-</span>
            <span>{getDayMonth(inforChannel?.channel_general?.end)}</span>
            <div className="vda-dropdown">
              <Dropdown
                value={selectedWeek}
                onChange={(e) => {
                  setSelectWeek(e.value);
                  const typeBody =
                    e.value.code === 'seven_day'
                      ? 1
                      : e.value.code === 'fourteen_day'
                        ? 2
                        : 3;
                  fetchRenewChannel(typeBody);
                }}
                options={dataWeeks}
                optionLabel="name"
                placeholder=""
                itemTemplate={(option) => (
                  <p className="vda-dropdown-item">{option.name}</p>
                )}
                valueTemplate={(option) =>
                  option ? (
                    <p className="vda-dropdown-value">{option.name}</p>
                  ) : null
                }
                className="vda-dropdown-select"
              />
            </div>
          </div>
        )}
      </div>

      <div className="vda-grid">
        <div className="vda-card">
          <div className="vda-card-body">
            <h6>Lượt xem</h6>
            <p className="vda-muted">{inforChannel?.channel_general?.views}</p>
          </div>
        </div>
        <div className="vda-card">
          <div className="vda-card-body">
            <h6>Lượt thích</h6>
            <p className="vda-muted">{inforChannel?.channel_general?.likes}</p>
          </div>
        </div>
        <div className="vda-card">
          <div className="vda-card-body">
            <h6>Chia sẻ</h6>
            <p className="vda-muted">{inforChannel?.channel_general?.shares}</p>
          </div>
        </div>
        <div className="vda-card">
          <div className="vda-card-body">
            <h6>Trung bình lượt xem</h6>
            <p className="vda-muted">{inforChannel?.channel_general?.viewers}</p>
          </div>
        </div>
        <div className="vda-card">
          <div className="vda-card-body">
            <h6>Bình luận</h6>
            <p className="vda-muted">{inforChannel?.channel_general?.comments}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
