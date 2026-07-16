"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import { Modal } from "@/components/ui/modal";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import Pagination from "@/components/tables/Pagination";
import { VIDEO_CREATOR_BASE } from "@/config/api";
import { useModal } from "@/hooks/useModal";
import {
  HiOutlineChevronLeft,
  HiOutlineFolder,
  HiOutlinePencil,
  HiOutlinePlus,
  HiOutlineSquares2X2,
  HiOutlineTrash,
  HiOutlineVideoCamera,
} from "react-icons/hi2";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import {
  createPlaylist,
  deletePlaylist,
  fetchPlaylistList,
  fetchPlaylistVideos,
  fetchPublicVideosForPicker,
  formatZaloTimestamp,
  getLegacyQueryId,
  removeVideoFromPlaylist,
  updatePlaylistPrivacy,
} from "@/lib/zalo-video/creator-public-api";
import { refreshCsrfToken } from "@/lib/zalo-video/session";
import type {
  ZaloPlaylistItem,
  ZaloPlaylistVideoItem,
  ZaloPublicVideoItem,
} from "@/types/zalo-video";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

interface PlaylistManagerPanelProps {
  accountId: number;
}

const PRIVACY_OPTIONS = [
  { value: "public", label: "Công khai" },
  { value: "private", label: "Riêng tư" },
];

const ROWS_PER_PAGE = 50;

function privacyToStatus(code: string): "1" | "2" {
  return code === "public" ? "2" : "1";
}

function privacyLabel(privacy?: number) {
  return privacy === 1 ? "Riêng tư" : "Công khai";
}

export default function PlaylistManagerPanel({
  accountId,
}: PlaylistManagerPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playlistId = getLegacyQueryId(searchParams);

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [playlists, setPlaylists] = useState<ZaloPlaylistItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [playlistVideos, setPlaylistVideos] = useState<ZaloPlaylistVideoItem[]>(
    [],
  );
  const [selectedPlaylist, setSelectedPlaylist] = useState<ZaloPlaylistItem | null>(
    null,
  );

  const createModal = useModal();
  const deleteModal = useModal();
  const [deleteTarget, setDeleteTarget] = useState<ZaloPlaylistItem | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const [createName, setCreateName] = useState("");
  const [createPrivacy, setCreatePrivacy] = useState("public");
  const [pickerVideos, setPickerVideos] = useState<ZaloPublicVideoItem[]>([]);
  const [selectedVideoIds, setSelectedVideoIds] = useState<Array<string | number>>(
    [],
  );
  const [createStep, setCreateStep] = useState<"info" | "videos">("info");
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(totalCount / ROWS_PER_PAGE));

  const loadPlaylists = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPlaylistList(accountId, page, ROWS_PER_PAGE);
      setPlaylists(data.results ?? []);
      setTotalCount(data.count ?? data.results?.length ?? 0);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setPlaylists([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [accountId, page]);

  const loadPlaylistVideos = useCallback(async () => {
    if (!playlistId) return;
    setLoading(true);
    try {
      const videos = await fetchPlaylistVideos(accountId, playlistId);
      setPlaylistVideos(videos);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setPlaylistVideos([]);
    } finally {
      setLoading(false);
    }
  }, [accountId, playlistId]);

  useEffect(() => {
    void refreshCsrfToken(accountId);
  }, [accountId]);

  useEffect(() => {
    if (playlistId) {
      void loadPlaylistVideos();
    } else {
      void loadPlaylists();
    }
  }, [playlistId, loadPlaylists, loadPlaylistVideos]);

  useEffect(() => {
    if (!playlistId || playlists.length === 0) return;
    const found = playlists.find((item) => String(item.id) === playlistId);
    if (found) setSelectedPlaylist(found);
  }, [playlistId, playlists]);

  useEffect(() => {
    if (!playlistId) return;
    void fetchPlaylistList(accountId, 1, 200).then((data) => {
      const found = data.results?.find((item) => String(item.id) === playlistId);
      if (found) setSelectedPlaylist(found);
    });
  }, [accountId, playlistId]);

  const openCreate = async () => {
    setCreateName("");
    setCreatePrivacy("public");
    setCreateStep("info");
    setSelectedVideoIds([]);
    try {
      const data = await fetchPublicVideosForPicker(accountId);
      setPickerVideos(data.results ?? []);
    } catch {
      setPickerVideos([]);
    }
    createModal.openModal();
  };

  const submitCreate = async () => {
    if (createStep === "info") {
      if (createName.trim().length < 3) {
        toast.error("Tên danh sách phát cần ít nhất 3 ký tự");
        return;
      }
      setCreateStep("videos");
      return;
    }

    if (selectedVideoIds.length === 0) {
      toast.error("Chọn ít nhất một video");
      return;
    }

    setCreateSubmitting(true);
    try {
      await createPlaylist({
        accountId,
        title: createName.trim(),
        status: privacyToStatus(createPrivacy),
        videoIds: selectedVideoIds,
      });
      toast.success("Đã tạo danh sách phát");
      createModal.closeModal();
      await loadPlaylists();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handlePrivacyChange = async (
    playlist: ZaloPlaylistItem,
    code: string,
  ) => {
    try {
      await updatePlaylistPrivacy({
        accountId,
        playlistId: playlist.id,
        status: privacyToStatus(code),
      });
      toast.success("Đã cập nhật quyền riêng tư");
      await loadPlaylists();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const confirmDeletePlaylist = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    try {
      await deletePlaylist(accountId, deleteTarget.id);
      toast.success("Đã xóa danh sách phát");
      deleteModal.closeModal();
      setDeleteTarget(null);
      await loadPlaylists();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleRemoveVideo = async (videoId: string | number) => {
    if (!playlistId) return;
    try {
      await removeVideoFromPlaylist({
        accountId,
        playlistId,
        videoId,
      });
      toast.success("Đã gỡ video khỏi playlist");
      await loadPlaylistVideos();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const detailTitle = useMemo(
    () => selectedPlaylist?.title ?? "Chi tiết playlist",
    [selectedPlaylist],
  );

  if (playlistId) {
    return (
      <ComponentCard
        title={detailTitle}
        desc={`${playlistVideos.length} video trong danh sách`}
        hideDescOnMobile
      >
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() =>
              router.push(`${VIDEO_CREATOR_BASE}/${accountId}/playlist-manager`)
            }
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
          >
            <HiOutlineChevronLeft size={16} className="shrink-0" aria-hidden />
            Quay lại
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void loadPlaylistVideos()}
            className="h-10 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300"
          >
            {loading ? "Đang tải…" : "↻ Tải lại"}
          </button>
        </div>

        {loading && playlistVideos.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-500">Đang tải…</p>
        ) : playlistVideos.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <HiOutlineVideoCamera size={32} className="shrink-0 text-gray-300" aria-hidden />
            <p className="text-sm text-gray-500">Playlist chưa có video</p>
          </div>
        ) : (
          <div className="space-y-3">
            {playlistVideos.map((video) => (
              <article
                key={String(video.id)}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:flex-row sm:items-center sm:gap-4 dark:border-gray-800 dark:bg-white/[0.02]"
              >
                <div className="relative h-[100px] w-[75px] shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <HiOutlineSquares2X2 size={20} className="shrink-0 text-gray-300" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-gray-800 dark:text-white/90">
                    {video.description?.trim() || "Không có mô tả"}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {privacyLabel(video.privacy)} · {formatZaloTimestamp(video.created_time)}
                  </p>
                </div>
                <Tooltip content="Gỡ khỏi playlist">
                  <button
                    type="button"
                    aria-label="Gỡ khỏi playlist"
                    onClick={() => void handleRemoveVideo(video.id)}
                    className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-error-200 px-3 text-xs font-medium text-error-600 sm:w-auto dark:border-error-500/30 dark:text-error-400"
                  >
                    <HiOutlineTrash size={16} className="shrink-0" aria-hidden />
                    Gỡ
                  </button>
                </Tooltip>
              </article>
            ))}
          </div>
        )}
      </ComponentCard>
    );
  }

  return (
    <ComponentCard
      title="Danh sách phát"
      desc="Tạo và quản lý playlist video trên kênh"
      hideDescOnMobile
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          disabled={loading}
          onClick={() => void loadPlaylists()}
          className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 sm:w-auto dark:border-gray-700 dark:text-gray-300"
        >
          {loading ? "Đang tải…" : "↻ Tải lại"}
        </button>
        <button
          type="button"
          onClick={() => void openCreate()}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 sm:w-auto"
        >
          <HiOutlinePlus size={16} className="shrink-0" aria-hidden />
          Tạo danh sách phát
        </button>
      </div>

      {loading && playlists.length === 0 ? (
        <p className="py-20 text-center text-sm text-gray-500">Đang tải…</p>
      ) : playlists.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <HiOutlineFolder size={32} className="shrink-0 text-gray-300" aria-hidden />
          <p className="text-sm text-gray-500">Chưa có danh sách phát</p>
        </div>
      ) : (
        <>
          <div className="custom-scrollbar overflow-x-auto overscroll-x-contain rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500 dark:bg-white/[0.03]">
                <tr>
                  <th className="px-4 py-3 font-medium">Tên</th>
                  <th className="px-4 py-3 font-medium">Số video</th>
                  <th className="px-4 py-3 font-medium">Quyền riêng tư</th>
                  <th className="px-4 py-3 font-medium">Ngày tạo</th>
                  <th className="px-4 py-3 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {playlists.map((playlist) => (
                  <tr key={String(playlist.id)} className="bg-white dark:bg-transparent">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white/90">
                      {playlist.title ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {playlist.videosTotal ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-36">
                        <Select
                          options={PRIVACY_OPTIONS}
                          value={playlist.privacy === 1 ? "private" : "public"}
                          onChange={(value) =>
                            void handlePrivacyChange(playlist, value)
                          }
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatZaloTimestamp(playlist.createdTime)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Tooltip content="Xem chi tiết">
                          <button
                            type="button"
                            aria-label="Xem chi tiết"
                            onClick={() =>
                              router.push(
                                `${VIDEO_CREATOR_BASE}/${accountId}/playlist-manager?${playlist.id}`,
                              )
                            }
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                          >
                            <HiOutlinePencil size={16} className="shrink-0" aria-hidden />
                          </button>
                        </Tooltip>
                        <Tooltip content="Xóa playlist">
                          <button
                            type="button"
                            aria-label="Xóa playlist"
                            onClick={() => {
                              setDeleteTarget(playlist);
                              deleteModal.openModal();
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-error-200 text-error-600 hover:bg-error-50 dark:border-error-500/30"
                          >
                            <HiOutlineTrash size={16} className="shrink-0" aria-hidden />
                          </button>
                        </Tooltip>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={createModal.isOpen}
        onClose={createModal.closeModal}
        className="max-w-2xl m-4"
      >
        <div className="p-5 sm:p-6">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
            {createStep === "info" ? "Tạo danh sách phát" : "Chọn video"}
          </h3>
          {createStep === "info" ? (
            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tên danh sách phát
                </label>
                <Input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Nhập tên (3–40 ký tự)"
                />
              </div>
              <div className="max-w-xs">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quyền riêng tư
                </label>
                <Select
                  options={PRIVACY_OPTIONS}
                  value={createPrivacy}
                  onChange={setCreatePrivacy}
                />
              </div>
            </div>
          ) : (
            <div className="custom-scrollbar mt-4 max-h-[50vh] space-y-2 overflow-y-auto">
              {pickerVideos.map((video) => {
                const checked = selectedVideoIds.includes(video.id);
                return (
                  <label
                    key={String(video.id)}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.03]"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedVideoIds((prev) =>
                          checked
                            ? prev.filter((id) => id !== video.id)
                            : [...prev, video.id],
                        );
                      }}
                      className="size-4 rounded border-gray-300"
                    />
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt=""
                        className="h-14 w-10 rounded object-cover"
                      />
                    ) : null}
                    <span className="line-clamp-2 text-sm text-gray-700 dark:text-gray-300">
                      {video.description?.trim() || "Video"}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            {createStep === "videos" && (
              <button
                type="button"
                onClick={() => setCreateStep("info")}
                className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 dark:border-gray-700 dark:text-gray-300"
              >
                Quay lại
              </button>
            )}
            <button
              type="button"
              disabled={createSubmitting}
              onClick={() => void submitCreate()}
              className="h-10 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            >
              {createSubmitting
                ? "Đang xử lý…"
                : createStep === "info"
                  ? "Tiếp tục"
                  : "Tạo playlist"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeModal}
        className="max-w-md m-4"
      >
        <div className="p-5 sm:p-6">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Xóa danh sách phát
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Xóa &quot;{deleteTarget?.title}&quot;? Hành động không thể hoàn tác.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={deleteModal.closeModal}
              className="h-10 rounded-lg border border-gray-200 px-4 text-sm dark:border-gray-700"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={deleteSubmitting}
              onClick={() => void confirmDeletePlaylist()}
              className="h-10 rounded-lg bg-error-500 px-4 text-sm font-medium text-white disabled:opacity-60"
            >
              {deleteSubmitting ? "Đang xóa…" : "Xác nhận"}
            </button>
          </div>
        </div>
      </Modal>
    </ComponentCard>
  );
}