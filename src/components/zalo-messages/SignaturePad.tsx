"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";

interface SignaturePadProps {
  onChange: (hasSignature: boolean, dataUrl: string | null) => void;
  disabled?: boolean;
  className?: string;
}

interface Point {
  x: number;
  y: number;
}

const SIGNATURE_INK = "#101828";
const SIGNATURE_LINE_WIDTH = 3.5;

function applySignatureStrokeStyle(ctx: CanvasRenderingContext2D) {
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

function SignaturePad({
  onChange,
  disabled = false,
  className = "",
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const hasInkRef = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const ctx = canvas.getContext("2d");
    const previous = hasInkRef.current
      ? canvas.toDataURL("image/png")
      : null;

    canvas.width = Math.floor(rect.width * window.devicePixelRatio);
    canvas.height = Math.floor(rect.height * window.devicePixelRatio);

    if (!ctx) return;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    applySignatureStrokeStyle(ctx);

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

  const notifyChange = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      onChange(false, null);
      return;
    }
    onChange(hasInkRef.current, hasInkRef.current ? canvas.toDataURL("image/png") : null);
  }, [onChange]);

  const startStroke = useCallback(
    (point: Point) => {
      if (disabled) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      drawingRef.current = true;
      applySignatureStrokeStyle(ctx);
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
    notifyChange();
  }, [notifyChange]);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    hasInkRef.current = false;
    setHasInk(false);
    onChange(false, null);
  }, [onChange]);

  return (
    <div className={`min-w-0 ${className}`.trim()}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="min-w-0 text-xs font-medium text-gray-600 dark:text-gray-400">
          Ký trực tiếp tại đây
        </p>
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled || !hasInk}
          className="cursor-pointer rounded-lg px-2.5 py-1 text-xs text-brand-600 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-brand-400 dark:hover:bg-brand-500/10"
        >
          Xóa chữ ký
        </button>
      </div>
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
          className="relative z-10 h-40 w-full touch-none cursor-crosshair bg-white"
          aria-label="Vùng ký điện tử"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            startStroke(getCanvasPoint(canvasRef.current!, event.clientX, event.clientY));
          }}
          onPointerMove={(event) => {
            drawStroke(getCanvasPoint(canvasRef.current!, event.clientX, event.clientY));
          }}
          onPointerUp={endStroke}
          onPointerLeave={endStroke}
          onPointerCancel={endStroke}
        />
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
        Dùng chuột hoặc ngón tay để ký. Chữ ký được lưu khi bạn bấm xác nhận.
      </p>
    </div>
  );
}

export default memo(SignaturePad);