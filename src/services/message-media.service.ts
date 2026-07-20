import { API_MESSAGE_MEDIA } from "@/config/api";
import api from "@/lib/axios";
import type {
  SaveAlbumPayload,
  SavedAlbum,
  SavedVideoDetail,
  SavedVideoListItem,
  SaveVideoPayload,
} from "@/types/message-media";

function asArray<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : [];
}

export const messageMediaService = {
  async listVideos(): Promise<SavedVideoListItem[]> {
    const response = await api.get(API_MESSAGE_MEDIA.VIDEO);
    return asArray<SavedVideoListItem>(response.data);
  },

  async getVideo(id: number): Promise<SavedVideoDetail> {
    const response = await api.get<SavedVideoDetail>(
      API_MESSAGE_MEDIA.videoDetail(id),
    );
    return response.data;
  },

  async saveVideo(payload: SaveVideoPayload): Promise<SavedVideoDetail> {
    const response = await api.post(API_MESSAGE_MEDIA.VIDEO, payload);
    const data = response.data as SavedVideoDetail & { video_id?: number };
    return {
      ...data,
      id: data.id ?? data.video_id ?? 0,
    };
  },

  async renameVideo(id: number, name_video: string): Promise<SavedVideoDetail> {
    const response = await api.patch<SavedVideoDetail>(
      API_MESSAGE_MEDIA.videoDetail(id),
      { name_video },
    );
    return response.data;
  },

  async deleteVideo(id: number): Promise<void> {
    await api.delete(API_MESSAGE_MEDIA.videoDetail(id));
  },

  async deleteVideos(ids: number[]): Promise<void> {
    await api.delete(API_MESSAGE_MEDIA.VIDEO, { data: { ids } });
  },

  async listAlbums(): Promise<SavedAlbum[]> {
    const response = await api.get(API_MESSAGE_MEDIA.ALBUM);
    return asArray<SavedAlbum>(response.data);
  },

  async getAlbum(id: number): Promise<SavedAlbum> {
    const response = await api.get<SavedAlbum>(
      API_MESSAGE_MEDIA.albumDetail(id),
    );
    return response.data;
  },

  async saveAlbum(payload: SaveAlbumPayload): Promise<void> {
    await api.post(API_MESSAGE_MEDIA.ALBUM, payload);
  },

  async renameAlbum(id: number, name: string): Promise<SavedAlbum> {
    const response = await api.patch<SavedAlbum>(
      API_MESSAGE_MEDIA.albumDetail(id),
      { name },
    );
    return response.data;
  },

  async deleteAlbum(id: number): Promise<void> {
    await api.delete(API_MESSAGE_MEDIA.albumDetail(id));
  },

  async deleteAlbums(ids: number[]): Promise<void> {
    await api.delete(API_MESSAGE_MEDIA.ALBUM, { data: { ids } });
  },

  /** Poll album detail until images filled or timeout */
  async pollAlbumImages(
    albumId: number,
    expectedCount: number,
    options?: { attempts?: number; intervalMs?: number },
  ): Promise<SavedAlbum> {
    const attempts = options?.attempts ?? 12;
    const intervalMs = options?.intervalMs ?? 800;
    let last = await this.getAlbum(albumId);
    for (let i = 0; i < attempts; i += 1) {
      const count = last.images?.length ?? 0;
      if (count >= expectedCount && expectedCount > 0) return last;
      if (expectedCount <= 0 && count > 0) return last;
      await new Promise((r) => setTimeout(r, intervalMs));
      last = await this.getAlbum(albumId);
    }
    return last;
  },
};
