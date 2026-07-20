/** Thư viện media chat — /api/message/video · /api/message/album */

export interface SavedVideoListItem {
  id: number;
  video_url: string;
  name_video: string;
}

export interface SavedVideoDetail {
  id: number;
  user?: number;
  video_url: string;
  thumb_url: string;
  duration: number;
  width: number;
  height: number;
  file_size: number;
  name_video: string;
}

/** POST body camelCase — WriteSerializer */
export interface SaveVideoPayload {
  videoUrl: string;
  thumbUrl: string;
  duration: number;
  width: number;
  height: number;
  fileSize: number;
  nameVideo: string;
}

export interface SavedAlbumImage {
  id?: number;
  album?: number;
  url: string;
  width?: string;
  height?: string;
  file_size?: string;
  idInGroup?: string;
  previewThumb?: string | null;
}

export interface SavedAlbum {
  id: number;
  user?: number;
  name: string;
  groupLayoutId: string;
  totalItemInGroup: string;
  images: SavedAlbumImage[];
}

export interface SaveAlbumImageInput {
  url: string;
  width?: string;
  height?: string;
  file_size?: string;
  idInGroup?: string;
}

export interface SaveAlbumPayload {
  groupLayoutId: string;
  totalItemInGroup: string;
  nameAlbum?: string;
  images: SaveAlbumImageInput[];
}

export type CampaignAttachType = "" | "image" | "video" | "album";
