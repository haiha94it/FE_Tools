"use client";

import ComponentCard from "@/components/common/ComponentCard";
import { Modal } from "@/components/ui/modal";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import Pagination from "@/components/tables/Pagination";
import { useModal } from "@/hooks/useModal";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlinePaperAirplane,
  HiOutlineSquares2X2,
  HiOutlineTrash,
  HiOutlineVideoCamera,
} from "react-icons/hi2";
import VideoCreatorInlineIcon from "./VideoCreatorInlineIcon";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import {
  deletePublicComment,
  fetchPublicCommentList,
  likePublicComment,
  replyPublicComment,
} from "@/lib/zalo-video/comments-public-api";
import { refreshCsrfToken } from "@/lib/zalo-video/session";
import { zaloVideoService } from "@/services/zalo-video.service";
import type { ZaloPublicCommentItem } from "@/types/zalo-video";
import { useCallback, useEffect, useState } from "react";

interface CommentManagerPanelProps {
  accountId: number;
}

const ROWS_PER_PAGE = 50;

function HeartIcon({ filled }: { filled?: boolean }) {
  return (
    <svg
      className="size-4 shrink-0"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function PinBadge() {
  return (
    <span className="absolute left-2 top-2 rounded-md bg-brand-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
      Ghim
    </span>
  );
}

function CommentAvatar({ src, name }: { src?: string; name?: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className="h-7 w-7 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-medium text-gray-500 dark:bg-gray-800">
      {(name?.trim()?.[0] ?? "?").toUpperCase()}
    </span>
  );
}

interface CommentBodyProps {
  comment: ZaloPublicCommentItem;
  onLike: (comment: ZaloPublicCommentItem, status: "like" | "unlike") => void;
  onReply: (comment: ZaloPublicCommentItem) => void;
  likingId: string | number | null;
}

function CommentBody({
  comment,
  onLike,
  onReply,
  likingId,
}: CommentBodyProps) {
  const owner = comment.parent?.owner ?? comment.owner;
  const name = owner?.info?.name ?? "Người dùng";
  const avatar = owner?.info?.avatar;
  const text = comment.parent?.content ?? comment.content ?? "";
  const showActions = !comment.parent?.isRepliedByAuthor;
  const isLiked = Boolean(comment.isLikedByAuthor);
  const isReplying = likingId === comment.id;

  return (
    <div className="min-w-0 flex-1">
      <div className="flex gap-2.5">
        <CommentAvatar src={avatar} name={name} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
            {name}
          </p>
          <p className="mt-0.5 break-words text-sm text-gray-600 dark:text-gray-300">
            {text || "—"}
          </p>
          {showActions && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Tooltip content={isLiked ? "Bỏ thích" : "Thích"}>
                <button
                  type="button"
                  disabled={isReplying}
                  aria-label={isLiked ? "Bỏ thích" : "Thích"}
                  onClick={() =>
                    onLike(comment, isLiked ? "unlike" : "like")
                  }
                  className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition disabled:opacity-50 ${
                    isLiked
                      ? "border-error-200 bg-error-50 text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                  }`}
                >
                  <HeartIcon filled={isLiked} />
                  {isLiked ? "Đã thích" : "Thích"}
                </button>
              </Tooltip>
              <Tooltip content="Trả lời">
                <button
                  type="button"
                  aria-label="Trả lời"
                  onClick={() => onReply(comment)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-xs font-medium text-brand-600 transition hover:bg-brand-50 dark:border-gray-700 dark:text-brand-400 dark:hover:bg-brand-500/10"
                >
                  <VideoCreatorInlineIcon icon={HiOutlineChatBubbleLeftRight} size="sm" />
                  {comment.isRepliedByAuthor ? "Đã trả lời" : "Trả lời"}
                </button>
              </Tooltip>
            </div>
          )}
        </div>
      </div>

      {comment.parent?.isRepliedByAuthor && (
        <div className="mt-3 ml-9 border-l-2 border-gray-100 pl-3 dark:border-gray-800">
          <div className="flex gap-2.5">
            <CommentAvatar
              src={comment.owner?.info?.avatar}
              name={comment.owner?.info?.name}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {comment.owner?.info?.name ?? "Bạn"}
              </p>
              <p className="mt-0.5 break-words text-sm text-gray-600 dark:text-gray-300">
                {comment.content ?? "—"}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Tooltip content={isLiked ? "Bỏ thích" : "Thích"}>
                  <button
                    type="button"
                    disabled={isReplying}
                    aria-label={isLiked ? "Bỏ thích" : "Thích"}
                    onClick={() =>
                      onLike(comment, isLiked ? "unlike" : "like")
                    }
                    className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition disabled:opacity-50 ${
                      isLiked
                        ? "border-error-200 bg-error-50 text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                    }`}
                  >
                    <HeartIcon filled={isLiked} />
                    {isLiked ? "Đã thích" : "Thích"}
                  </button>
                </Tooltip>
                <Tooltip content="Trả lời">
                  <button
                    type="button"
                    aria-label="Trả lời"
                    onClick={() => onReply(comment)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-xs font-medium text-brand-600 transition hover:bg-brand-50 dark:border-gray-700 dark:text-brand-400 dark:hover:bg-brand-500/10"
                  >
                    <VideoCreatorInlineIcon icon={HiOutlineChatBubbleLeftRight} size="sm" />
                    {comment.isRepliedByAuthor ? "Đã trả lời" : "Trả lời"}
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CommentManagerPanel({
  accountId,
}: CommentManagerPanelProps) {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [likingId, setLikingId] = useState<string | number | null>(null);
  const [comments, setComments] = useState<ZaloPublicCommentItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [replyTarget, setReplyTarget] = useState<ZaloPublicCommentItem | null>(
    null,
  );
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ZaloPublicCommentItem | null>(
    null,
  );
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const replyModal = useModal();
  const deleteModal = useModal();

  const totalPages = Math.max(1, Math.ceil(totalCount / ROWS_PER_PAGE));

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPublicCommentList({
        accountId,
        page,
        rows: ROWS_PER_PAGE,
      });
      setComments(data.results ?? []);
      setTotalCount(data.count ?? data.results?.length ?? 0);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setComments([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [accountId, page]);

  useEffect(() => {
    void refreshCsrfToken(accountId);
  }, [accountId]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  const handleRenew = async () => {
    setRenewing(true);
    try {
      await zaloVideoService.renewComments(accountId);
      toast.success("Làm mới bình luận thành công");
      await loadComments();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setRenewing(false);
    }
  };

  const handleLike = async (
    comment: ZaloPublicCommentItem,
    status: "like" | "unlike",
  ) => {
    setLikingId(comment.id);
    try {
      await likePublicComment({
        accountId,
        commentId: comment.id,
        status,
      });
      await loadComments();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLikingId(null);
    }
  };

  const openReply = (comment: ZaloPublicCommentItem) => {
    setReplyTarget(comment);
    setReplyText("");
    replyModal.openModal();
  };

  const submitReply = async () => {
    if (!replyTarget) return;
    setReplySubmitting(true);
    try {
      await replyPublicComment({
        accountId,
        commentId: replyTarget.id,
        content: replyText,
      });
      toast.success("Đã gửi trả lời");
      replyModal.closeModal();
      setReplyTarget(null);
      setReplyText("");
      await loadComments();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setReplySubmitting(false);
    }
  };

  const openDelete = (comment: ZaloPublicCommentItem) => {
    setDeleteTarget(comment);
    deleteModal.openModal();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    try {
      await deletePublicComment({
        accountId,
        commentId: deleteTarget.id,
      });
      toast.success("Đã xóa bình luận");
      deleteModal.closeModal();
      setDeleteTarget(null);
      await loadComments();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <ComponentCard
      title="Quản lý bình luận"
      desc="Xem, thích, trả lời và xóa bình luận trên video kênh"
      hideDescOnMobile
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          disabled={loading}
          onClick={() => void loadComments()}
          className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 sm:w-auto sm:py-2 dark:border-gray-700 dark:text-gray-300"
        >
          {loading ? "Đang tải…" : "↻ Tải lại"}
        </button>
        <button
          type="button"
          disabled={renewing}
          onClick={() => void handleRenew()}
          className="h-11 w-full rounded-xl bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-60 sm:w-auto sm:py-2"
        >
          {renewing ? "Đang làm mới…" : "Làm mới dữ liệu"}
        </button>
      </div>

      {loading && comments.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-gray-500">Đang tải bình luận…</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
            <VideoCreatorInlineIcon icon={HiOutlineChatBubbleLeftRight} size="lg" className="text-gray-400" />
          </span>
          <p className="text-sm text-gray-500">Chưa có bình luận nào</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {comments.map((comment, index) => (
              <article
                key={String(comment.id)}
                className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 sm:flex-row sm:items-start sm:gap-4 sm:p-4 dark:border-gray-800 dark:bg-white/[0.02]"
              >
                <div className="flex items-start gap-3 sm:shrink-0">
                  <span className="hidden w-6 pt-1 text-center text-xs text-gray-400 sm:inline">
                    {(page - 1) * ROWS_PER_PAGE + index + 1}
                  </span>
                  <div className="relative shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                    {comment.video?.thumbnail ? (
                      <img
                        src={comment.video.thumbnail}
                        alt=""
                        className="h-[100px] w-[75px] object-cover sm:h-[125px] sm:w-[94px]"
                      />
                    ) : (
                      <div className="flex h-[100px] w-[75px] items-center justify-center sm:h-[125px] sm:w-[94px]">
                        <HiOutlineVideoCamera size={20} className="shrink-0 text-gray-300" aria-hidden />
                      </div>
                    )}
                    {comment.is_pinned && <PinBadge />}
                    <span className="absolute bottom-1 left-1 rounded bg-black/55 px-1 py-0.5">
                      <VideoCreatorInlineIcon icon={HiOutlineSquares2X2} size="sm" className="text-white" />
                    </span>
                  </div>
                </div>

                <CommentBody
                  comment={comment}
                  onLike={handleLike}
                  onReply={openReply}
                  likingId={likingId}
                />

                <div className="flex shrink-0 sm:pt-1">
                  <Tooltip content="Xóa bình luận">
                    <button
                      type="button"
                      aria-label="Xóa bình luận"
                      onClick={() => openDelete(comment)}
                      className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-error-200 px-3 text-xs font-medium text-error-600 transition hover:bg-error-50 sm:w-9 sm:px-0 dark:border-error-500/30 dark:text-error-400 dark:hover:bg-error-500/10"
                    >
                      <VideoCreatorInlineIcon icon={HiOutlineTrash} />
                      <span className="sm:hidden">Xóa</span>
                    </button>
                  </Tooltip>
                </div>
              </article>
            ))}
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
        isOpen={replyModal.isOpen}
        onClose={replyModal.closeModal}
        className="max-w-lg m-4"
      >
        <div className="p-5 sm:p-6">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Trả lời bình luận
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {replyTarget?.parent?.content ?? replyTarget?.content ?? ""}
          </p>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={4}
            placeholder="Nhập nội dung trả lời…"
            className="mt-4 w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={replyModal.closeModal}
              className="h-10 w-full rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 sm:w-auto dark:border-gray-700 dark:text-gray-300"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={replySubmitting || !replyText.trim()}
              onClick={() => void submitReply()}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60 sm:w-auto"
            >
              <VideoCreatorInlineIcon icon={HiOutlinePaperAirplane} />
              {replySubmitting ? "Đang gửi…" : "Gửi"}
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
            Xóa bình luận
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Bạn có chắc muốn xóa bình luận này? Hành động không thể hoàn tác.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={deleteModal.closeModal}
              className="h-10 w-full rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-700 sm:w-auto dark:border-gray-700 dark:text-gray-300"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={deleteSubmitting}
              onClick={() => void confirmDelete()}
              className="h-10 w-full rounded-lg bg-error-500 px-4 text-sm font-medium text-white hover:bg-error-600 disabled:opacity-60 sm:w-auto"
            >
              {deleteSubmitting ? "Đang xóa…" : "Xác nhận xóa"}
            </button>
          </div>
        </div>
      </Modal>
    </ComponentCard>
  );
}