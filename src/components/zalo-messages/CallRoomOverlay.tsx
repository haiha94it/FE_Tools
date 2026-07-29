"use client";

/**
 * In-call UI: mic/camera browser + hangup.
 * Audio frames → WS voice-call-media (PCM base64).
 * Zalo ZRTC full media map: BE gateway control-plane; duplex phụ thuộc reverse.
 */

import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { useEffect, useRef, useState } from "react";
import {
  HiOutlineMicrophone,
  HiOutlinePhoneXMark,
  HiOutlineVideoCamera,
  HiOutlineVideoCameraSlash,
} from "react-icons/hi2";
import { HiOutlineMicrophone as MicOffIcon } from "react-icons/hi2";

export type CallRoomState = {
  active: boolean;
  callType: 0 | 1;
  peerName?: string;
  mediaReady?: boolean;
  callId?: number | string;
  startedAt?: number;
  note?: string;
};

type Props = {
  call: CallRoomState | null;
  onHangup: () => void;
  onMediaFrame?: (frame: {
    kind: "audio" | "video";
    payloadBase64: string;
    mime: string;
    seq: number;
  }) => void;
};

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

/** Float32 → Int16 PCM little-endian base64 */
function pcmBase64FromFloat32(input: Float32Array): string {
  const buf = new ArrayBuffer(input.length * 2);
  const view = new DataView(buf);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export default function CallRoomOverlay({
  call,
  onHangup,
  onMediaFrame,
}: Props) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const seqRef = useRef(0);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);

  const isVideo = call?.callType === 1;

  // timer
  useEffect(() => {
    if (!call?.active) return;
    const start = call.startedAt ?? Date.now();
    const t = window.setInterval(() => {
      setElapsed(Date.now() - start);
    }, 500);
    return () => clearInterval(t);
  }, [call?.active, call?.startedAt]);

  // getUserMedia + capture PCM
  useEffect(() => {
    if (!call?.active) return;
    let cancelled = false;

    (async () => {
      try {
        setMicError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: isVideo
            ? { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }
            : false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (localVideoRef.current && isVideo) {
          localVideoRef.current.srcObject = stream;
          void localVideoRef.current.play().catch(() => undefined);
        }

        const ctx = new AudioContext({ sampleRate: 16000 });
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        // ScriptProcessor deprecated but widely supported; AudioWorklet needs file URL
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;
        source.connect(processor);
        // Silent sink — không loopback ra loa (tránh echo)
        const silent = ctx.createGain();
        silent.gain.value = 0;
        processor.connect(silent);
        silent.connect(ctx.destination);

        processor.onaudioprocess = (ev) => {
          if (cancelled || muted) return;
          const input = ev.inputBuffer.getChannelData(0);
          // level meter
          let sum = 0;
          for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
          const rms = Math.sqrt(sum / input.length);
          setLevel(Math.min(1, rms * 4));

          if (!onMediaFrame) return;
          seqRef.current += 1;
          // downsample-ish: send every 2nd frame to cut bandwidth
          if (seqRef.current % 2 !== 0) return;
          try {
            const b64 = pcmBase64FromFloat32(input);
            onMediaFrame({
              kind: "audio",
              payloadBase64: b64,
              mime: "audio/pcm;rate=16000;channels=1;bits=16",
              seq: seqRef.current,
            });
          } catch {
            /* ignore encode errors */
          }
        };
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Không truy cập được micro/camera";
        setMicError(msg);
      }
    })();

    return () => {
      cancelled = true;
      processorRef.current?.disconnect();
      processorRef.current = null;
      void audioCtxRef.current?.close().catch(() => undefined);
      audioCtxRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only remount when call opens / type changes
  }, [call?.active, isVideo]);

  // mute tracks
  useEffect(() => {
    const stream = streamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => {
      t.enabled = !muted;
    });
  }, [muted]);

  useEffect(() => {
    const stream = streamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => {
      t.enabled = !camOff;
    });
  }, [camOff]);

  if (!call?.active) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-gray-900 to-gray-950 shadow-2xl">
        <div className="px-5 pt-5 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-400/90">
            {isVideo ? "Gọi video Zalo" : "Gọi thoại Zalo"}
          </p>
          <h2 className="mt-1 truncate text-xl font-semibold text-white">
            {call.peerName || "Cuộc gọi"}
          </h2>
          <p className="mt-1 font-mono text-sm text-gray-400">
            {formatElapsed(elapsed)}
            {call.mediaReady ? (
              <span className="ml-2 text-emerald-400">· media</span>
            ) : (
              <span className="ml-2 text-amber-400">· đang kết nối…</span>
            )}
          </p>
        </div>

        <div className="relative mx-auto mt-4 flex h-48 w-full max-w-sm items-center justify-center overflow-hidden rounded-2xl bg-black/40">
          {isVideo && !camOff ? (
            <video
              ref={localVideoRef}
              muted
              playsInline
              autoPlay
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-3xl text-emerald-300">
                📞
              </div>
              {/* mic level */}
              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-[width] duration-75"
                  style={{ width: `${Math.round(level * 100)}%` }}
                />
              </div>
            </div>
          )}
          {/* remote audio sink (khi BE forward được frame) */}
          <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
        </div>

        {micError ? (
          <p className="mt-3 px-5 text-center text-xs text-red-400">{micError}</p>
        ) : null}

        <p className="mt-3 px-5 text-center text-[11px] leading-relaxed text-amber-200/90">
          {call.note ||
            "API web Zalo không giữ reo để nhấc máy (chỉ tín hiệu/gọi nhỡ). Cuộc gọi thật cần native FriendCall + session mobile."}
        </p>

        <div className="mt-5 flex items-center justify-center gap-4 pb-6">
          <Tooltip content={muted ? "Bật micro" : "Tắt micro"} side="top">
            <button
              type="button"
              onClick={() => setMuted((v) => !v)}
              className={`flex h-12 w-12 items-center justify-center rounded-full border transition ${
                muted
                  ? "border-red-400/40 bg-red-500/20 text-red-300"
                  : "border-white/10 bg-white/10 text-white hover:bg-white/15"
              }`}
              aria-label={muted ? "Bật micro" : "Tắt micro"}
            >
              {muted ? (
                <span className="text-lg">🔇</span>
              ) : (
                <HiOutlineMicrophone size={22} />
              )}
            </button>
          </Tooltip>

          {isVideo ? (
            <Tooltip content={camOff ? "Bật camera" : "Tắt camera"} side="top">
              <button
                type="button"
                onClick={() => setCamOff((v) => !v)}
                className={`flex h-12 w-12 items-center justify-center rounded-full border transition ${
                  camOff
                    ? "border-amber-400/40 bg-amber-500/20 text-amber-200"
                    : "border-white/10 bg-white/10 text-white hover:bg-white/15"
                }`}
                aria-label={camOff ? "Bật camera" : "Tắt camera"}
              >
                {camOff ? (
                  <HiOutlineVideoCameraSlash size={22} />
                ) : (
                  <HiOutlineVideoCamera size={22} />
                )}
              </button>
            </Tooltip>
          ) : null}

          <Tooltip content="Kết thúc" side="top">
            <button
              type="button"
              onClick={onHangup}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 transition hover:bg-red-600"
              aria-label="Kết thúc cuộc gọi"
            >
              <HiOutlinePhoneXMark size={26} />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

// silence unused import lint for MicOffIcon if tree-shaken
void MicOffIcon;
