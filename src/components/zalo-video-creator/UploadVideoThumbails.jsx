'use client';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { useRef, useState } from 'react';
import { AiFillTikTok } from 'react-icons/ai';
import { toast } from 'react-toastify';
import { API_CHANNEL_VIDEO, API_URL } from '@/lib/zalo-video/legacy-api';
import {
  dataURLtoBlob,
  downloadVideo,
  formatDateString,
  getLinkOneFile,
} from '@/const/getLinkFile';
import axiosConfig from "@/lib/axios"
export default function VideoUploadThumbnail({ params }) {
  const [videoUrl, setVideoUrl] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [selectedThumb, setSelectedThumb] = useState(null);
  const [datetime24h, setDateTime24h] = useState(new Date());
  const [caption, setCaption] = useState('');
  const [urlVideo, setUrlVideo] = useState('');
  const videoRef = useRef();
  const [checked, setChecked] = useState(false);
  const router = useRouter();
  const apiPostVideoChannel =
    API_URL + API_CHANNEL_VIDEO.API_POST_VIDEO_CHANNEL;
  const apiPostVideoChannelRs =
    API_URL + API_CHANNEL_VIDEO.API_POST_VIDEO_CHANNEL_RS;
  const apiGetLink = API_URL + API_CHANNEL_VIDEO.API_UPLOAD_FILE_VIDEO;
  const apiDowloadVideo = API_URL + API_CHANNEL_VIDEO.API_DOWLOAD_VIDEO_CHANNEL;
  const apiDowloadVideoRs =
    API_URL + API_CHANNEL_VIDEO.API_DOWLOAD_VIDEO_CHANNEL_RS;
  const [isLoadingPost, setIsLoadingPost] = useState(false);
  const [isInput, setIsInput] = useState(false);
  const [linkTiktok, setLinkTiktok] = useState('');
  const [loadingDow, setLoadingDow] = useState(false);
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = ['video/mp4', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Chỉ chấp nhận định dạng .mp4 hoặc .mov');
      return;
    }
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Dung lượng vượt quá 500MB');
      return;
    }
    getLinkOneFile(e.target.files[0], setUrlVideo, apiGetLink);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setThumbnails([]);
    setSelectedThumb(null);
  };
  const getThumbnailAt = (video, time) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      video.currentTime = time;
      video.onseeked = () => {
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        const targetAspect = 9 / 16;

        let cropWidth = videoWidth;
        let cropHeight = videoWidth / targetAspect;

        if (cropHeight > videoHeight) {
          cropHeight = videoHeight;
          cropWidth = videoHeight * targetAspect;
        }

        const sx = (videoWidth - cropWidth) / 2;
        const sy = (videoHeight - cropHeight) / 2;

        canvas.width = cropWidth;
        canvas.height = cropHeight;

        ctx.drawImage(
          video,
          sx,
          sy,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight,
        );
        resolve(canvas.toDataURL('image/jpeg'));
      };
    });
  };

  const generateThumbnails = async () => {
    const video = videoRef.current;
    const interval = 5;
    const duration = video.duration;

    setThumbnails([]); // clear trước

    for (let time = 0; time < duration; time += interval) {
      const thumb = await getThumbnailAt(video, time);
      setThumbnails((prev) => [...prev, { time, thumb }]);
      if (time === 0) {
        setSelectedThumb(thumb);
      }
    }
  };
  const fetchPostVideoChannel = async (thumbnail) => {
    const body = {
      id_account: Number(params.account),
      thumbnail: thumbnail,
      video: urlVideo,
      caption: caption,
      publish_time: checked ? formatDateString(datetime24h) : '',
    };
    try {
      const res = await axiosConfig.post(apiPostVideoChannel, body);
      const idTask = res.data;
      fetchPostVideoChannelRs(idTask);
    } catch (err) {
      toast.error(
        err?.response?.data?.error ||
        err?.response?.data?.messenger ||
        err?.response?.error ||
        'Đã có lỗi xảy ra !',
      );
      setIsLoadingPost(false);
    }
  };
  const fetchPostVideoChannelRs = (id_task) => {
    const intervalId = setInterval(async () => {
      try {
        const body = id_task;
        const res = await axiosConfig.post(apiPostVideoChannelRs, body);
        if (res?.data?.status === 'SUCCESS') {
          if (res?.data?.data?.status) {
            toast.success('Thành công');
            router.push(`/zalo-campaigns/post-video/${params.account}/video-manager`);
          } else {
            toast.error(
              res?.data?.data?.error ||
              res?.data?.data?.messenger ||
              'Đã có lỗi xảy ra',
            );
          }
          setIsLoadingPost(false);
          clearInterval(intervalId);
        }
      } catch (err) {
        toast.error(
          err?.response?.data?.error ||
          err?.response?.data?.messenger ||
          err?.response?.error ||
          'Đã có lỗi xảy ra !',
        );
        setIsLoadingPost(false);
      }
    }, 3000);
  };
  const getLinkImgPost = async (files) => {
    setIsLoadingPost(true);
    const formData = new FormData();
    formData.append('file', files, 'thumbnail.jpg');
    try {
      const res = await axiosConfig.post(apiGetLink, formData);
      fetchPostVideoChannel(res.data.file);
    } catch (err) {
      setIsLoadingPost(true);
    }
  };

  const fetchDowloadVideoChannel = async () => {
    setLoadingDow(true);
    const body = {
      link: linkTiktok,
    };
    try {
      const res = await axiosConfig.post(apiDowloadVideo, body);
      const idTask = res.data;
      fetchDowloadVideoChannelRs(idTask);
    } catch (err) {
      toast.error(
        err?.response?.data?.error ||
        err?.response?.data?.messenger ||
        err?.response?.error ||
        'Đã có lỗi xảy ra !',
      );
      setLoadingDow(false);
    }
  };
  const fetchDowloadVideoChannelRs = (id_task) => {
    const intervalId = setInterval(async () => {
      try {
        const body = id_task;
        const res = await axiosConfig.post(apiDowloadVideoRs, body);
        if (res?.data?.status === 'SUCCESS') {
          if (res?.data?.data.status) {
            setVideoUrl(`${API_URL}/api/channel${res?.data?.data?.path}`);
            setUrlVideo(res?.data?.data?.path);
          } else {
            toast.error(
              res?.data?.data?.error ||
              res?.data?.data?.messenger ||
              'Đã có lỗi xảy ra',
            );
          }
          setLoadingDow(false);
          clearInterval(intervalId);
        }
      } catch (err) {
        toast.error(
          err?.response?.data?.error ||
          err?.response?.data?.messenger ||
          err?.response?.error ||
          'Đã có lỗi xảy ra !',
        );
        setLoadingDow(false);
      }
    }, 3000);
  };
  return (
    <div className="container py-4">
      <div className="card shadow-sm rounded-3 p-4">
        <div className="row g-4">
          <div className="col-md-7">
            <div className="mb-4">
              <label htmlFor="videoUpload" className="form-label fw-bold">🎬 Chọn video</label>
              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => document.getElementById('videoInput').click()}
                >
                  📁 Tải từ máy
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary d-flex align-items-center gap-1"
                  onClick={() => setIsInput(pre => !pre)}
                >
                  <AiFillTikTok size={18} /> Quét từ link
                </button>
              </div>

              {isInput && (
                <div className="d-flex gap-2 flex-wrap mt-3">
                  <InputText
                    value={linkTiktok}
                    onChange={(e) => setLinkTiktok(e.target.value)}
                    placeholder="Nhập link video (TikTok, Facebook)"
                    className="flex-grow-1"
                  />
                  <button
                    disabled={loadingDow}
                    onClick={() => fetchDowloadVideoChannel()}
                    className="btn btn-primary"
                  >
                    {loadingDow ? '⏳ Đang quét...' : '🔍 Quét'}
                  </button>
                  {videoUrl?.includes(API_URL) && (
                    <button onClick={() => downloadVideo(videoUrl)} className="btn btn-success">
                      💾 Lưu
                    </button>
                  )}
                </div>
              )}

              <input
                type="file"
                id="videoInput"
                accept="video/*"
                onChange={handleVideoChange}
                className="d-none"
              />
            </div>
            {videoUrl && (
              <div className="mb-4 text-center">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  className="rounded shadow-sm"
                  style={{ maxWidth: '400px', maxHeight: '300px', objectFit: 'cover' }}
                  onLoadedMetadata={generateThumbnails}
                  crossOrigin="anonymous"
                />
              </div>
            )}

            {/* Caption */}
            <div className="mb-4">
              <label className="fw-bold">📝 Nội dung video</label>
              <InputTextarea
                autoResize
                value={caption}
                onChange={(e) => {
                  if (e.target.value.length <= 300) setCaption(e.target.value);
                }}
                rows={4}
                className="w-100"
                style={{maxHeight:"1000px"}}
              />
              <small className="text-muted">{caption.length}/300</small>
            </div>

            {/* Schedule */}
            <div className="mb-4">
              <div className="form-check">
                <Checkbox
                  onChange={(e) => setChecked(e.checked)}
                  checked={checked}
                  inputId="scheduleCheck"
                />
                <label htmlFor="scheduleCheck" className="ms-2">⏰ Hẹn giờ đăng video</label>
              </div>
              {checked && (
                <div className="mt-2">
                  <Calendar
                    id="calendar-24h"
                    value={datetime24h}
                    onChange={(e) => setDateTime24h(e.value)}
                    showTime
                    minDate={new Date()}
                    hourFormat="24"
                    className="w-100"
                  />
                </div>
              )}
            </div>
          </div>
          {/* RIGHT: THUMBNAIL + BUTTON */}
          <div className="col-md-5 border-start ps-4">
            {thumbnails.length > 0 && (
              <div className="mb-4">
                <p className="fw-bold mb-2">📸 Chọn ảnh bìa</p>
                <div className="d-flex gap-2 overflow-auto pb-2">
                  {thumbnails.map((item, idx) => (
                    <img
                      key={idx}
                      src={item.thumb}
                      onClick={() => setSelectedThumb(item.thumb)}
                      className={`rounded shadow-sm cursor-pointer ${item.thumb === selectedThumb ? 'border border-3 border-primary' : ''
                        }`}
                      style={{ width: '70px', height: '100px', objectFit: 'cover' }}
                    />
                  ))}
                </div>
              </div>
            )}

            {selectedThumb && (
              <div className="mb-4 text-center">
                <p className="fw-bold">Ảnh bìa đã chọn</p>
                <img
                  src={selectedThumb}
                  alt="selected thumbnail"
                  className="rounded shadow-sm border"
                  style={{ width: '140px', height: '200px', objectFit: 'cover' }}
                />
              </div>
            )}

            {/* Action button */}
            {videoUrl && (
              <div className="text-center mt-4">
                {isLoadingPost ? (
                  <p className="fw-bold text-muted">⏳ Đang đăng video...</p>
                ) : (
                  <Button
                    label="🚀 Đăng video"
                    onClick={() => {
                      if (selectedThumb) {
                        getLinkImgPost(dataURLtoBlob(selectedThumb));
                      } else {
                        toast.error('Bạn chưa chọn ảnh Thumbnail');
                      }
                    }}
                    className="p-button-lg p-button-rounded p-button-primary shadow"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

  );
}
