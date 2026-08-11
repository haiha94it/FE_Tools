"use client";

import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";
import { HiOutlineExclamationCircle, HiOutlinePlay } from "react-icons/hi2";
import { twMerge } from "tailwind-merge";

export function toProxiedHlsUrl(streamUrl: string): string {
  if (!streamUrl) return "";
  if (streamUrl.includes("/next-api/proxy_hls")) return streamUrl;
  return `/next-api/proxy_hls?url=${encodeURIComponent(streamUrl)}`;
}

interface ZaloHlsPlayerProps {
  streamUrl?: string | null;
  poster?: string | null;
  className?: string;
  useProxy?: boolean;
}

/**
 * Play HLS Zalo CDN (streamUrl m3u8 signed).
 * Proxy bắt buộc: CORS + rewrite //cdn segment + Range partial.
 * Fill parent container (object-contain) — parent quyết định khung.
 */
export default function ZaloHlsPlayer({
  streamUrl,
  poster,
  className,
  useProxy = true,
}: ZaloHlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) {
      setError(null);
      setLoading(false);
      return;
    }

    setError(null);
    setLoading(true);

    const src = useProxy ? toProxiedHlsUrl(streamUrl) : streamUrl;
    let destroyed = false;

    const onCanPlay = () => {
      if (!destroyed) setLoading(false);
    };
    const onPlaying = () => {
      if (!destroyed) setLoading(false);
    };
    const onError = () => {
      if (!destroyed && !hlsRef.current) {
        setLoading(false);
        setError("Không phát được video. Thử mở lại chi tiết (link stream mới).");
      }
    };

    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("error", onError);

    if (video.canPlayType("application/vnd.apple.mpegurl") && !Hls.isSupported()) {
      video.src = src;
      video.load();
    } else if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        maxBufferLength: 60,
        maxMaxBufferLength: 120,
        maxBufferHole: 0.5,
        nudgeMaxRetry: 5,
        fragLoadingTimeOut: 30000,
        manifestLoadingTimeOut: 20000,
        startFragPrefetch: true,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (!destroyed) setLoading(false);
      });

      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (destroyed) return;
        if (!data.fatal) {
          if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
            try {
              const t = video.currentTime;
              video.currentTime = t + 0.05;
            } catch {
              /* ignore */
            }
          }
          return;
        }

        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
          return;
        }
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          try {
            hls.recoverMediaError();
          } catch {
            setLoading(false);
            setError("Lỗi media HLS. Thử mở lại video.");
            hls.destroy();
            hlsRef.current = null;
          }
          return;
        }

        setLoading(false);
        setError("Không phát được stream. Thử mở lại chi tiết.");
        hls.destroy();
        hlsRef.current = null;
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.load();
    } else {
      setLoading(false);
      setError("Trình duyệt không hỗ trợ HLS.");
    }

    return () => {
      destroyed = true;
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("error", onError);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.removeAttribute("src");
      video.load();
    };
  }, [streamUrl, useProxy]);

  if (!streamUrl) {
    return (
      <div
        className={twMerge(
          "flex h-full min-h-[12rem] w-full flex-col items-center justify-center gap-2 bg-gray-900 text-gray-400",
          className,
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-white/5">
          <HiOutlinePlay size={24} className="ml-0.5 opacity-60" aria-hidden />
        </span>
        <p className="text-xs font-medium">Chưa có stream video</p>
      </div>
    );
  }

  return (
    <div
      className={twMerge(
        "relative flex h-full min-h-0 w-full items-center justify-center overflow-hidden bg-black",
        className,
      )}
    >
      <video
        ref={videoRef}
        className="h-full max-h-full w-full max-w-full bg-black object-contain"
        controls
        playsInline
        poster={poster || undefined}
        preload="auto"
      />
      {loading ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
          <span className="size-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
      ) : null}
      {error ? (
        <div className="absolute inset-x-0 bottom-0 flex items-start gap-2 bg-error-950/90 px-3 py-2.5 text-[11px] font-medium text-error-100">
          <HiOutlineExclamationCircle size={14} className="mt-0.5 shrink-0" aria-hidden />
          <span>{error}</span>
        </div>
      ) : null}
    </div>
  );
}
