import type { IconType } from "react-icons";
import {
  HiOutlinePresentationChartLine,
  HiOutlineChatBubbleLeftRight,
  HiOutlineDocumentText,
  HiOutlineInformationCircle,
  HiOutlineQueueList,
  HiOutlineSquares2X2,
  HiOutlineTag,
  HiOutlineVideoCamera,
} from "react-icons/hi2";

export type VideoCreatorIcon = IconType;

export interface VideoCreatorNavItem {
  slug: string;
  label: string;
  shortLabel: string;
  icon: VideoCreatorIcon;
  highlight?: boolean;
  group: "main" | "content" | "settings";
}

export const VIDEO_CREATOR_NAV_ITEMS: VideoCreatorNavItem[] = [
  {
    slug: "",
    label: "Phân tích dữ liệu",
    shortLabel: "Phân tích",
    icon: HiOutlinePresentationChartLine,
    group: "main",
  },
  {
    slug: "video-post",
    label: "Đăng video",
    shortLabel: "Đăng",
    icon: HiOutlineVideoCamera,
    highlight: true,
    group: "main",
  },
  {
    slug: "video-manager",
    label: "Quản lý video",
    shortLabel: "Video",
    icon: HiOutlineSquares2X2,
    group: "content",
  },
  {
    slug: "comment-manager",
    label: "Bình luận",
    shortLabel: "BL",
    icon: HiOutlineChatBubbleLeftRight,
    group: "content",
  },
  {
    slug: "playlist-manager",
    label: "Danh sách phát",
    shortLabel: "Playlist",
    icon: HiOutlineQueueList,
    group: "content",
  },
  {
    slug: "channel",
    label: "Trang thông tin",
    shortLabel: "Trang",
    icon: HiOutlineDocumentText,
    group: "settings",
  },
  {
    slug: "category",
    label: "Gán nhãn video",
    shortLabel: "Nhãn",
    icon: HiOutlineTag,
    group: "settings",
  },
  {
    slug: "infor",
    label: "Thông tin kênh",
    shortLabel: "Kênh",
    icon: HiOutlineInformationCircle,
    group: "settings",
  },
];

export const VIDEO_CREATOR_NAV_GROUPS = {
  content: "Quản lý nội dung",
  settings: "Cài đặt kênh",
} as const;