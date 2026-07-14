"use client";

import dynamic from "next/dynamic";

const VideoCreatorView = dynamic(
  () => import("@/components/zalo-campaigns/VideoCreatorView"),
  { ssr: false },
);

export default function VideoCreatorPageClient() {
  return <VideoCreatorView />;
}