import Hls from 'hls.js';
import { useEffect, useRef } from 'react';

const VideoPlayer = ({ streamUrl }) => {
  const videoRef = useRef(null);
  useEffect(() => {
    const video = videoRef.current;
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls?.loadSource(streamUrl);
      hls?.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Trình duyệt hỗ trợ HLS natively (như Safari)
      video.src = streamUrl;
    }
  }, [streamUrl]);

  return (
    <video
      ref={videoRef}
      controls
      style={{ width: '100%', height: 'auto', borderRadius: '8px', maxHeight: '90vh' }} 
      alt="Video Player"
    />
  );
};

export default VideoPlayer;
