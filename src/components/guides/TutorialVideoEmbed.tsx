"use client";

import { toEmbedVideoUrl } from "@/lib/zalo-guide-utils";

interface TutorialVideoEmbedProps {
  url: string;
  title?: string;
}

export default function TutorialVideoEmbed({ url, title }: TutorialVideoEmbedProps) {
  const embedUrl = toEmbedVideoUrl(url);

  if (!embedUrl) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-700">
        Chưa có link video hợp lệ.
      </p>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-gray-200 bg-black shadow-theme-md dark:border-gray-800">
      <div className="relative aspect-video w-full">
        <iframe
          src={embedUrl}
          title={title || "Video hướng dẫn"}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
}