"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";

export interface ConsentSignatureValue {
  hasSignature: boolean;
  dataUrl: string | null;
  strokeCount: number;
  width: number;
  height: number;
}

interface ConsentSignaturePadProps {
  onChange: (value: ConsentSignatureValue) => void;
  disabled?: boolean;
  /** Chiều cao canvas CSS (px) */
  heightClassName?: string;
  className?: string;
  showToolbar?: boolean;
  onRequestExpand?: () => void;
}

interface Point {
  x: number;
  y: number;
}

const SIGNATURE_INK = "#101828";
const SIGNATURE_LINE_WIDTH = 3.5;

function applyStrokeStyle(ctx: CanvasRenderingContext2D) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = SIGNATURE_LINE_WIDTH;
  ctx.strokeStyle = SIGNATURE_INK;
  ctx.globalAlpha = 1;
}

function getCanvasPoint(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): Point {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}

function emptyValue(): ConsentSignatureValue {
  return {
    hasSignature: false,
    dataUrl: null,
    strokeCount: 0,
    width: 0,
    height: 0,
  };
}

function ConsentSignaturePad({
  onChange,
  disabled = false,
  heightClassName = "h-40",
  className = "",
  showToolbar = true,
  onRequestExpand,
}: ConsentSignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const hasInkRef = useRef(false);
  const strokeCountRef = useRef(0);
  const [hasInk, setHasInk] = useState(false);

  const emitChange = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasInkRef.current) {
      onChange(emptyValue());
      return;
    }
    const rect = canvas.getBoundingClientRect();
    onChange({
      hasSignature: true,
      dataUrl: canvas.toDataURL("image/png"),
      strokeCount: strokeCountRef.current,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    });
  }, [onChange]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const ctx = canvas.getContext("2d");
    const previous = hasInkRef.current ? canvas.toDataURL("image/png") : null;

    canvas.width = Math.floor(rect.width * window.devicePixelRatio);
    canvas.height = Math.floor(rect.height * window.devicePixelRatio);

    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    applyStrokeStyle(ctx);

    if (previous) {
      const image = new Image();
      image.onload = () => {
        ctx.drawImage(image, 0, 0, rect.width, rect.height);
      };
      image.src = previous;
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [resizeCanvas]);

  const startStroke = useCallback(
    (point: Point) => {
      if (disabled) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      drawingRef.current = true;
      strokeCountRef.current += 1;
      applyStrokeStyle(ctx);
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    },
    [disabled],
  );

  const drawStroke = useCallback(
    (point: Point) => {
      if (!drawingRef.current || disabled) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      if (!hasInkRef.current) {
        hasInkRef.current = true;
        setHasInk(true);
      }
    },
    [disabled],
  );

  const endStroke = useCallback(() => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    emitChange();
  }, [emitChange]);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    hasInkRef.current = false;
    strokeCountRef.current = 0;
    setHasInk(false);
    onChange(emptyValue());
  }, [onChange]);

  return (
    <div className={`min-w-0 ${className}`.trim()}>
      {showToolbar ? (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="min-w-0 text-xs font-medium text-gray-600 dark:text-gray-400">
            Bên B — Chữ ký của bạn *
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {onRequestExpand ? (
              <button
                type="button"
                onClick={onRequestExpand}
                disabled={disabled}
                className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-medium text-brand-600 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-brand-400 dark:hover:bg-brand-500/10"
              >
                Phóng to khung ký
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled || !hasInk}
              className="cursor-pointer rounded-lg px-2.5 py-1 text-xs text-brand-600 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-brand-400 dark:hover:bg-brand-500/10"
            >
              Xóa chữ ký
            </button>
          </div>
        </div>
      ) : null}

      <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-gray-300 bg-white shadow-inner dark:border-gray-600">
        <div
          className="pointer-events-none absolute inset-x-4 bottom-10 border-b border-gray-200"
          aria-hidden
        />
        <p className="pointer-events-none absolute bottom-3 left-4 text-[11px] text-gray-400">
          Ký tên tại đây
        </p>
        <canvas
          ref={canvasRef}
          className={`relative z-10 w-full touch-none cursor-crosshair bg-white ${heightClassName}`}
          style={{ touchAction: "none" }}
          aria-label="Vùng ký xác nhận đồng thuận"
          onPointerDown={(event) => {
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            startStroke(
              getCanvasPoint(
                canvasRef.current!,
                event.clientX,
                event.clientY,
              ),
            );
          }}
          onPointerMove={(event) => {
            event.preventDefault();
            drawStroke(
              getCanvasPoint(
                canvasRef.current!,
                event.clientX,
                event.clientY,
              ),
            );
          }}
          onPointerUp={endStroke}
          onPointerLeave={endStroke}
          onPointerCancel={endStroke}
        />
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
        Dùng chuột, ngón tay hoặc bút để ký. Cần ít nhất một nét vẽ trước khi xác nhận.
      </p>
    </div>
  );
}

export default memo(ConsentSignaturePad);
