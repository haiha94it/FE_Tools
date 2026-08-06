"use client";

import ComponentCard from "@/components/common/ComponentCard";
import AvatarText from "@/components/ui/avatar/AvatarText";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { isZaloAccountActive } from "@/lib/zalo-account-utils";
import {
  checkBulkPostEligibilityForAccounts,
  type BulkPostEligibility,
} from "@/lib/zalo-video/bulk-eligibility";
import { hasZaloVideoChannel } from "@/lib/zalo-video/channel-utils";
import {
  buildDownloadedVideoPreviewUrl,
  dataUrlToBlob,
  formatZaloVideoPublishTime,
  generateVideoThumbnails,
  isAllowedVideoFile,
  MAX_VIDEO_FILE_BYTES,
} from "@/lib/zalo-video-utils";
import {
  getVideoTaskErrorMessage,
  isVideoTaskBusinessSuccess,
} from "@/lib/zalo-video/task-utils";
import { zaloVideoService } from "@/services/zalo-video.service";
import { useZaloVideoStore } from "@/stores/use-zalo-video-store";
import type { ZaloAccount } from "@/types/zalo-account";
import type { VideoThumbnailItem } from "@/types/zalo-video";
import { HiOutlineArrowPath, HiOutlineXMark } from "react-icons/hi2";
import { useEffect, useMemo, useRef, useState } from "react";

interface BulkPostVideoPanelProps {
  /** Prefill nick đang mở workspace (nếu có) */
  defaultAccountId?: number | null;
  onClose: () => void;
}

interface AccountPostResult {
  accountId: number;
  label: string;
  success: boolean;
  error?: string;
}

export default function BulkPostVideoPanel({
  defaultAccountId = null,
  onClose,
}: BulkPostVideoPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const checkRunIdRef = useRef(0);

  const accounts = useZaloVideoStore((s) => s.accounts);
  const accountsLoading = useZaloVideoStore((s) => s.accountsLoading);
  const sessionAccountId = useZaloVideoStore((s) => s.sessionAccountId);
  const channelInfo = useZaloVideoStore((s) => s.channelInfo);
  const needsQr = useZaloVideoStore((s) => s.needsQr);
  const noChannel = useZaloVideoStore((s) => s.noChannel);

  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [serverVideoPath, setServerVideoPath] = useState("");
  const [thumbnails, setThumbnails] = useState<VideoThumbnailItem[]>([]);
  const [selectedThumb, setSelectedThumb] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleAt, setScheduleAt] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return now.toISOString().slice(0, 16);
  });

  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [downloadingLink, setDownloadingLink] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postProgress, setPostProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [lastResults, setLastResults] = useState<AccountPostResult[] | null>(
    null,
  );

  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);

  /** Trạng thái kiểm tra điều kiện kênh */
  const [eligibilityChecking, setEligibilityChecking] = useState(true);
  const [eligibilityProgress, setEligibilityProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [eligibilityList, setEligibilityList] = useState<BulkPostEligibility[]>(
    [],
  );
  const [eligibilityError, setEligibilityError] = useState<string | null>(null);
  const [showIneligible, setShowIneligible] = useState(false);

  const activeAccounts = useMemo(
    () => accounts.filter((account) => isZaloAccountActive(account)),
    [accounts],
  );

  const knownEligibleIds = useMemo(() => {
    if (
      sessionAccountId &&
      hasZaloVideoChannel(channelInfo) &&
      !needsQr &&
      !noChannel
    ) {
      return [sessionAccountId];
    }
    return [];
  }, [sessionAccountId, channelInfo, needsQr, noChannel]);

  const eligibleAccountIds = useMemo(
    () =>
      new Set(
        eligibilityList
          .filter((item) => item.eligible)
          .map((item) => item.accountId),
      ),
    [eligibilityList],
  );

  const eligibleAccounts = useMemo(
    () => activeAccounts.filter((account) => eligibleAccountIds.has(account.id)),
    [activeAccounts, eligibleAccountIds],
  );

  const ineligibleList = useMemo(
    () => eligibilityList.filter((item) => !item.eligible),
    [eligibilityList],
  );

  const effectiveSelectedIds = useMemo(() => {
    if (!eligibleAccounts.length) return [];
    const validIds = new Set(eligibleAccounts.map((item) => item.id));
    return selectedAccountIds.filter((id) => validIds.has(id));
  }, [eligibleAccounts, selectedAccountIds]);

  const accountLabelById = useMemo(() => {
    const map = new Map<number, string>();
    for (const account of accounts) {
      map.set(
        account.id,
        account.name?.trim() || account.phone_number || `#${account.id}`,
      );
    }
    for (const item of eligibilityList) {
      if (item.channelName && !map.get(item.accountId)) {
        map.set(item.accountId, item.channelName);
      }
    }
    return map;
  }, [accounts, eligibilityList]);

  const allEligibleSelected =
    eligibleAccounts.length > 0 &&
    eligibleAccounts.every((account) =>
      effectiveSelectedIds.includes(account.id),
    );

  const activeAccountIdsKey = useMemo(
    () => activeAccounts.map((account) => account.id).join(","),
    [activeAccounts],
  );
  const knownEligibleIdsKey = knownEligibleIds.join(",");

  const runEligibilityCheck = async () => {
    const runId = checkRunIdRef.current + 1;
    checkRunIdRef.current = runId;

    setEligibilityChecking(true);
    setEligibilityError(null);
    setEligibilityProgress(null);
    setEligibilityList([]);
    setSelectedAccountIds([]);
    setShowIneligible(false);

    const ids = activeAccounts.map((account) => account.id);

    if (!ids.length) {
      if (checkRunIdRef.current === runId) {
        setEligibilityChecking(false);
        setEligibilityList([]);
      }
      return;
    }

    setEligibilityProgress({ done: 0, total: ids.length });

    try {
      const results = await checkBulkPostEligibilityForAccounts(ids, {
        concurrency: 3,
        knownEligibleIds,
        onProgress: (done, total) => {
          if (checkRunIdRef.current !== runId) return;
          setEligibilityProgress({ done, total });
        },
      });

      if (checkRunIdRef.current !== runId) return;

      setEligibilityList(results);

      const eligibleIds = results
        .filter((item) => item.eligible)
        .map((item) => item.accountId);

      // Prefill nick workspace nếu đủ điều kiện; không thì để trống
      if (
        defaultAccountId &&
        defaultAccountId > 0 &&
        eligibleIds.includes(defaultAccountId)
      ) {
        setSelectedAccountIds([defaultAccountId]);
      } else {
        setSelectedAccountIds([]);
      }
    } catch (error) {
      if (checkRunIdRef.current !== runId) return;
      setEligibilityError(getApiErrorMessage(error));
      setEligibilityList([]);
    } finally {
      if (checkRunIdRef.current === runId) {
        setEligibilityChecking(false);
      }
    }
  };

  useEffect(() => {
    if (accountsLoading) return;

    // setTimeout: tránh setState đồng bộ trong effect (react-hooks/set-state-in-effect)
    const timer = window.setTimeout(() => {
      void runEligibilityCheck();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      // Hủy kết quả check cũ khi deps đổi / unmount
      checkRunIdRef.current += 1;
    };
    // Re-check khi danh sách nick active / nick known-eligible đổi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountsLoading, activeAccountIdsKey, knownEligibleIdsKey]);

  const toggleAccount = (id: number) => {
    if (!eligibleAccountIds.has(id)) return;
    setSelectedAccountIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (allEligibleSelected) {
      setSelectedAccountIds([]);
      return;
    }
    setSelectedAccountIds(eligibleAccounts.map((account) => account.id));
  };

  const resetVideoState = () => {
    setThumbnails([]);
    setSelectedThumb(null);
    setServerVideoPath("");
  };

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;

    if (!isAllowedVideoFile(file)) {
      toast.error("Chỉ chấp nhận định dạng .mp4 hoặc .mov");
      return;
    }
    if (file.size > MAX_VIDEO_FILE_BYTES) {
      toast.error("Dung lượng vượt quá 500MB");
      return;
    }

    resetVideoState();
    setLastResults(null);
    setVideoPreviewUrl(URL.createObjectURL(file));
    setUploadingFile(true);

    try {
      const path = await zaloVideoService.uploadVideoFile(file);
      setServerVideoPath(path);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setVideoPreviewUrl(null);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleVideoMetadata = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      const items = await generateVideoThumbnails(video);
      setThumbnails(items);
      if (items[0]) setSelectedThumb(items[0].thumb);
    } catch {
      toast.error("Không tạo được ảnh bìa từ video");
    }
  };

  const handleScanLink = async () => {
    if (!linkUrl.trim()) {
      toast.warning("Nhập link video TikTok hoặc Facebook");
      return;
    }

    setDownloadingLink(true);
    resetVideoState();
    setLastResults(null);

    try {
      const result = await zaloVideoService.downloadVideoFromLink(linkUrl.trim());
      const path = result.data?.path;
      if (!path || !isVideoTaskBusinessSuccess(result)) {
        toast.error(getVideoTaskErrorMessage(result));
        return;
      }

      setServerVideoPath(path);
      setVideoPreviewUrl(buildDownloadedVideoPreviewUrl(path));
      toast.success("Đã quét video từ link");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setDownloadingLink(false);
    }
  };

  const handlePost = async () => {
    if (eligibilityChecking) {
      toast.warning("Đang kiểm tra điều kiện kênh, vui lòng chờ");
      return;
    }
    if (!serverVideoPath) {
      toast.warning("Chưa có video để đăng");
      return;
    }
    if (!selectedThumb) {
      toast.warning("Chọn ảnh bìa trước khi đăng");
      return;
    }
    if (!effectiveSelectedIds.length) {
      toast.warning("Chọn ít nhất một kênh đủ điều kiện để đăng");
      return;
    }

    const thumbBlob = dataUrlToBlob(selectedThumb);
    if (!thumbBlob) {
      toast.error("Ảnh bìa không hợp lệ");
      return;
    }

    setPosting(true);
    setPostProgress(null);
    setLastResults(null);

    try {
      const thumbnailPath = await zaloVideoService.uploadThumbnailBlob(thumbBlob);
      const publishTime = scheduleEnabled
        ? formatZaloVideoPublishTime(new Date(scheduleAt))
        : "";

      const targetIds = [...effectiveSelectedIds];
      const results: AccountPostResult[] = [];

      for (let index = 0; index < targetIds.length; index += 1) {
        const targetId = targetIds[index];
        setPostProgress({ current: index + 1, total: targetIds.length });

        try {
          const result = await zaloVideoService.postVideo({
            id_account: targetId,
            thumbnail: thumbnailPath,
            video: serverVideoPath,
            caption,
            publish_time: publishTime,
          });

          if (isVideoTaskBusinessSuccess(result)) {
            results.push({
              accountId: targetId,
              label: accountLabelById.get(targetId) ?? `#${targetId}`,
              success: true,
            });
          } else {
            results.push({
              accountId: targetId,
              label: accountLabelById.get(targetId) ?? `#${targetId}`,
              success: false,
              error: getVideoTaskErrorMessage(result),
            });
          }
        } catch (error) {
          results.push({
            accountId: targetId,
            label: accountLabelById.get(targetId) ?? `#${targetId}`,
            success: false,
            error: getApiErrorMessage(error),
          });
        }
      }

      setLastResults(results);

      const successCount = results.filter((item) => item.success).length;
      const failed = results.filter((item) => !item.success);

      if (successCount === results.length) {
        toast.success(
          results.length === 1
            ? "Đăng video thành công"
            : `Đăng video thành công trên ${successCount} kênh`,
        );
        return;
      }

      if (successCount > 0) {
        toast.warning(
          `Đã đăng ${successCount}/${results.length} kênh. ${failed.length} kênh lỗi — xem chi tiết bên dưới.`,
        );
        return;
      }

      const firstError = failed[0]?.error;
      toast.error(
        firstError
          ? `Không đăng được video: ${firstError}`
          : "Không đăng được video trên bất kỳ kênh nào",
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setPosting(false);
      setPostProgress(null);
    }
  };

  const isBusy =
    eligibilityChecking || uploadingFile || downloadingLink || posting;
  const formReady = !eligibilityChecking && !eligibilityError;

  const postButtonLabel = (() => {
    if (eligibilityChecking) return "Đang kiểm tra kênh…";
    if (!posting) {
      return effectiveSelectedIds.length > 1
        ? `Đăng hàng loạt (${effectiveSelectedIds.length} kênh)`
        : "Đăng video";
    }
    if (postProgress) {
      return `Đang đăng ${postProgress.current}/${postProgress.total}…`;
    }
    return "Đang đăng video…";
  })();

  const resolveAccountLabel = (account: ZaloAccount) =>
    account.name?.trim() || account.phone_number || `#${account.id}`;

  return (
    <ComponentCard
      title="Đăng hàng loạt"
      desc="Một video — đăng lần lượt lên nhiều kênh Zalo Video đủ điều kiện"
      hideDescOnMobile
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Hệ thống kiểm tra nick hoạt động, đăng nhập kênh và có Zalo Video trước
          khi cho chọn đăng.
        </p>
        <button
          type="button"
          disabled={posting}
          onClick={onClose}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <HiOutlineXMark size={16} aria-hidden />
          Đóng
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_280px] lg:gap-6">
        <div className="space-y-4 sm:space-y-5">
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Kênh đủ điều kiện
              </label>
              <div className="flex items-center gap-3">
                {!eligibilityChecking && formReady && (
                  <span className="text-theme-xs text-gray-500 dark:text-gray-400">
                    {effectiveSelectedIds.length}/{eligibleAccounts.length} đã
                    chọn
                  </span>
                )}
                <button
                  type="button"
                  disabled={isBusy || !eligibleAccounts.length}
                  onClick={toggleSelectAll}
                  className="text-theme-xs font-medium text-brand-600 hover:underline disabled:opacity-50 dark:text-brand-400"
                >
                  {allEligibleSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => void runEligibilityCheck()}
                  className="inline-flex items-center gap-1 text-theme-xs font-medium text-gray-600 hover:text-brand-600 disabled:opacity-50 dark:text-gray-400 dark:hover:text-brand-400"
                >
                  <HiOutlineArrowPath
                    size={14}
                    aria-hidden
                    className={eligibilityChecking ? "animate-spin" : undefined}
                  />
                  Kiểm tra lại
                </button>
              </div>
            </div>

            {accountsLoading || eligibilityChecking ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 px-4 py-10 dark:border-gray-700">
                <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    Đang kiểm tra điều kiện các kênh…
                  </p>
                  <p className="mt-1 text-theme-xs text-gray-500">
                    {eligibilityProgress
                      ? `${eligibilityProgress.done}/${eligibilityProgress.total} tài khoản`
                      : accountsLoading
                        ? "Đang tải danh sách tài khoản…"
                        : "Chuẩn bị kiểm tra…"}
                  </p>
                </div>
              </div>
            ) : eligibilityError ? (
              <div className="rounded-xl border border-error-200 bg-error-50 px-4 py-4 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
                <p>{eligibilityError}</p>
                <button
                  type="button"
                  onClick={() => void runEligibilityCheck()}
                  className="mt-2 font-medium text-brand-600 underline-offset-2 hover:underline dark:text-brand-400"
                >
                  Thử lại
                </button>
              </div>
            ) : !activeAccounts.length ? (
              <p className="rounded-xl border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-500 dark:border-gray-700">
                Không có tài khoản đang hoạt động
              </p>
            ) : eligibleAccounts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/60 px-4 py-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Không có kênh đủ điều kiện để đăng hàng loạt
                </p>
                <p className="mt-1 text-theme-xs text-amber-700/90 dark:text-amber-400/90">
                  Cần nick hoạt động, đã đăng nhập kênh (không checkpoint QR) và
                  đã có kênh Zalo Video.
                </p>
              </div>
            ) : (
              <div className="custom-scrollbar max-h-[200px] space-y-1 overflow-y-auto rounded-xl border border-gray-200 p-2 dark:border-gray-700 sm:max-h-[240px]">
                {eligibleAccounts.map((account) => {
                  const selected = effectiveSelectedIds.includes(account.id);
                  const label = resolveAccountLabel(account);
                  const channelName = eligibilityList.find(
                    (item) => item.accountId === account.id,
                  )?.channelName;

                  return (
                    <button
                      key={account.id}
                      type="button"
                      disabled={isBusy}
                      onClick={() => toggleAccount(account.id)}
                      className={`flex w-full min-w-0 items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        selected
                          ? "border-brand-300 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10"
                          : "border-transparent hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          selected
                            ? "border-brand-500 bg-brand-500 text-white"
                            : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-900"
                        }`}
                      >
                        {selected ? (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path
                              d="M2 5.2L4 7.2L8 2.8"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : null}
                      </span>
                      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        {account.avatar ? (
                          <img
                            src={account.avatar}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <AvatarText name={label} size="sm" className="!h-9 !w-9" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-gray-800 dark:text-white/90">
                          {label}
                        </span>
                        <span className="block truncate text-theme-xs text-gray-500">
                          {channelName
                            ? `Kênh: ${channelName}`
                            : account.phone_number || "—"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {!eligibilityChecking && !eligibilityError && ineligibleList.length > 0 && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setShowIneligible((v) => !v)}
                  className="text-theme-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  {showIneligible ? "Ẩn" : "Xem"} {ineligibleList.length} tài
                  khoản không đủ điều kiện
                </button>
                {showIneligible && (
                  <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50/80 p-2 text-theme-xs dark:border-gray-800 dark:bg-gray-900/40">
                    {ineligibleList.map((item) => (
                      <li
                        key={item.accountId}
                        className="flex items-start justify-between gap-2 text-gray-600 dark:text-gray-400"
                      >
                        <span className="min-w-0 truncate font-medium text-gray-700 dark:text-gray-300">
                          {accountLabelById.get(item.accountId) ??
                            `#${item.accountId}`}
                        </span>
                        <span
                          className="max-w-[55%] shrink-0 truncate text-right text-amber-700 dark:text-amber-400"
                          title={item.reason}
                        >
                          {item.reason || "Không đủ điều kiện"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              disabled={!formReady || isBusy}
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700 transition hover:bg-brand-100 disabled:opacity-60 sm:w-auto sm:py-2.5 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
            >
              Tải từ máy
            </button>
            <button
              type="button"
              disabled={!formReady || isBusy}
              onClick={() => setShowLinkInput((v) => !v)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 sm:w-auto sm:py-2.5 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300"
            >
              Quét từ link
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/*"
              className="hidden"
              onChange={(e) => void handleFileChange(e.target.files?.[0])}
            />
          </div>

          {showLinkInput && formReady && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="Nhập link TikTok, Facebook…"
                className="h-11 flex-1 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
              <button
                type="button"
                disabled={downloadingLink}
                onClick={() => void handleScanLink()}
                className="h-11 w-full rounded-xl bg-brand-500 px-5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60 sm:w-auto sm:py-2.5"
              >
                {downloadingLink ? "Đang quét…" : "Quét video"}
              </button>
            </div>
          )}

          {uploadingFile && (
            <p className="text-sm text-brand-600">Đang upload video lên server…</p>
          )}

          {videoPreviewUrl && (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-black/5 dark:border-gray-700">
              <video
                ref={videoRef}
                src={videoPreviewUrl}
                controls
                crossOrigin="anonymous"
                className="mx-auto max-h-[min(50vh,320px)] w-full object-contain"
                onLoadedMetadata={() => void handleVideoMetadata()}
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nội dung video
            </label>
            <textarea
              value={caption}
              rows={4}
              maxLength={300}
              disabled={!formReady}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Mô tả video (tối đa 300 ký tự)"
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
            <p className="mt-1 text-xs text-gray-400">{caption.length}/300</p>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={scheduleEnabled}
              disabled={!formReady}
              onChange={(e) => setScheduleEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20 disabled:opacity-60"
            />
            Hẹn giờ đăng video
          </label>

          {scheduleEnabled && (
            <input
              type="datetime-local"
              value={scheduleAt}
              min={new Date().toISOString().slice(0, 16)}
              disabled={!formReady}
              onChange={(e) => setScheduleAt(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 sm:max-w-xs"
            />
          )}

          {lastResults && lastResults.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3 dark:border-gray-700 dark:bg-gray-900/40">
              <p className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">
                Kết quả đăng
              </p>
              <ul className="max-h-40 space-y-1.5 overflow-y-auto text-sm">
                {lastResults.map((item) => (
                  <li
                    key={item.accountId}
                    className="flex items-start justify-between gap-2"
                  >
                    <span className="min-w-0 truncate text-gray-700 dark:text-gray-300">
                      {item.label}
                    </span>
                    {item.success ? (
                      <span className="shrink-0 font-medium text-success-600 dark:text-success-400">
                        Thành công
                      </span>
                    ) : (
                      <span
                        className="max-w-[55%] shrink-0 truncate text-right text-error-600 dark:text-error-400"
                        title={item.error}
                      >
                        {item.error || "Lỗi"}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50/80 p-3 sm:p-4 dark:border-gray-800 dark:bg-gray-900/30 lg:sticky lg:top-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Ảnh bìa
          </p>

          {thumbnails.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {thumbnails.map((item) => (
                <button
                  key={item.time}
                  type="button"
                  disabled={!formReady}
                  onClick={() => setSelectedThumb(item.thumb)}
                  className={`shrink-0 overflow-hidden rounded-lg transition disabled:opacity-60 ${
                    selectedThumb === item.thumb
                      ? "ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-gray-900"
                      : "opacity-80 hover:opacity-100"
                  }`}
                >
                  <img
                    src={item.thumb}
                    alt=""
                    className="h-[88px] w-[50px] object-cover"
                  />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">
              {eligibilityChecking
                ? "Chờ kiểm tra kênh xong để đăng video"
                : "Chọn video để tự động tạo ảnh bìa"}
            </p>
          )}

          {selectedThumb && (
            <div className="text-center">
              <img
                src={selectedThumb}
                alt="Ảnh bìa đã chọn"
                className="mx-auto h-[180px] w-[101px] rounded-xl object-cover shadow-theme-sm"
              />
            </div>
          )}

          <button
            type="button"
            disabled={
              !formReady ||
              !serverVideoPath ||
              !selectedThumb ||
              !effectiveSelectedIds.length ||
              isBusy
            }
            onClick={() => void handlePost()}
            className="sticky bottom-0 z-10 mt-auto w-full rounded-xl bg-brand-500 py-3.5 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 lg:static lg:py-3"
          >
            {postButtonLabel}
          </button>
        </div>
      </div>
    </ComponentCard>
  );
}
