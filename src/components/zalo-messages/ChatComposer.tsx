"use client";

import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import {
  adjustComposerTextareaHeight,
  COMPOSER_TEXTAREA_MAX_HEIGHT,
  insertTextAtCaret,
  replaceComposerTriggerQuery,
} from "@/lib/zalo-messenger-composer-utils";
import {
  calculateMentionInfo,
  filterMentionSuggestions,
  getGroupMemberName,
} from "@/lib/zalo-messenger-mention-utils";
import {
  getQuotePreviewText,
  isImageAttachmentDraft,
  isVideoAttachmentDraft,
  resolveAttachmentPreviewUrl,
} from "@/lib/zalo-messenger-send-utils";
import type { ZaloGroupMember } from "@/types/zalo-contacts";
import type {
  DisplayMessage,
  MessengerAttachmentDraft,
  MessengerFastReply,
  MessengerStickerItem,
} from "@/types/zalo-messenger";
import { PlugInIcon } from "@/icons";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  HiOutlineBolt,
  HiOutlineDocument,
  HiOutlineFaceSmile,
  HiOutlinePhoto,
  HiOutlinePlus,
  HiOutlinePuzzlePiece,
  HiOutlineVideoCamera,
  HiOutlineXMark,
} from "react-icons/hi2";
import MentionSuggestions from "./MentionSuggestions";

const StickerPicker = dynamic(() => import("./StickerPicker"), { ssr: false });
const FastReplyManageDialog = dynamic(() => import("./FastReplyManageDialog"), {
  ssr: false,
});

const QUICK_EMOJIS = ["😀", "😂", "❤️", "👍", "🙏", "😍", "🔥", "🎉"];

interface ComposerActionButtonProps {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}

function ComposerActionButton({
  label,
  disabled = false,
  onClick,
  children,
}: ComposerActionButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className="flex h-11 min-w-[72px] flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-gray-200 bg-gray-50 px-2 py-2 text-[10px] font-medium text-gray-600 transition active:scale-[0.98] hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-300"
    >
      {children}
      <span>{label}</span>
    </button>
  );
}

function EmojiPickerPanel({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {QUICK_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onPick(emoji)}
          className="flex h-11 w-full cursor-pointer items-center justify-center rounded-xl text-xl transition active:scale-95 hover:bg-gray-100 dark:hover:bg-white/[0.05]"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

interface ChatComposerProps {
  accountId?: number | null;
  conversationId?: number | null;
  groupId?: number | null;
  value: string;
  disabled?: boolean;
  sending?: boolean;
  uploading?: boolean;
  isGroup?: boolean;
  groupMembers?: ZaloGroupMember[];
  quoteMessage?: DisplayMessage | null;
  attachments?: MessengerAttachmentDraft[];
  fastReplies?: MessengerFastReply[];
  onChange: (value: string) => void;
  onSend: (mentionInfo: ReturnType<typeof calculateMentionInfo>) => void;
  onClearQuote?: () => void;
  onUploadFiles?: (files: File[]) => void;
  onRemoveAttachment?: (index: number) => void;
  onApplyFastReply?: (
    item: MessengerFastReply,
    options?: { text?: string },
  ) => void;
  onSendSticker?: (sticker: MessengerStickerItem) => void;
}

export default function ChatComposer({
  accountId = null,
  conversationId = null,
  groupId = null,
  value,
  disabled = false,
  sending = false,
  uploading = false,
  isGroup = false,
  groupMembers = [],
  quoteMessage = null,
  attachments = [],
  fastReplies = [],
  onChange,
  onSend,
  onClearQuote,
  onUploadFiles,
  onRemoveAttachment,
  onApplyFastReply,
  onSendSticker,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const composerShellRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const stickerRef = useRef<HTMLDivElement>(null);
  const mobileOptionsRef = useRef<HTMLDivElement>(null);
  const [taggedMembers, setTaggedMembers] = useState<ZaloGroupMember[]>([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [stickerOpen, setStickerOpen] = useState(false);
  const [mobileOptionsOpen, setMobileOptionsOpen] = useState(false);
  const [mobileEmojiOpen, setMobileEmojiOpen] = useState(false);
  const [mobileStickerOpen, setMobileStickerOpen] = useState(false);
  const [fastReplyOpen, setFastReplyOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  useEffect(() => {
    setTaggedMembers([]);
    setActiveSuggestionIndex(0);
  }, [conversationId, groupId, isGroup]);

  useEffect(() => {
    adjustComposerTextareaHeight(textareaRef.current);
  }, [value, quoteMessage, attachments.length]);

  useEffect(() => {
    if (!emojiOpen && !stickerOpen && !mobileOptionsOpen) return undefined;
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiRef.current?.contains(event.target as Node)) return;
      if (stickerRef.current?.contains(event.target as Node)) return;
      if (mobileOptionsRef.current?.contains(event.target as Node)) return;
      setEmojiOpen(false);
      setStickerOpen(false);
      setMobileOptionsOpen(false);
      setMobileEmojiOpen(false);
      setMobileStickerOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [emojiOpen, stickerOpen, mobileOptionsOpen]);

  const slashQuery = useMemo(() => {
    const match = value.match(/(?:^|\s)\/(\S*)$/);
    return match ? match[1].toLowerCase() : null;
  }, [value]);

  const filteredFastReplies = useMemo(() => {
    if (slashQuery === null) return [];
    if (!slashQuery) return fastReplies.slice(0, 8);
    return fastReplies
      .filter((item) =>
        [item.title, item.content, item.command]
          .filter(Boolean)
          .some((entry) =>
            String(entry).toLowerCase().includes(slashQuery),
          ),
      )
      .slice(0, 8);
  }, [fastReplies, slashQuery]);

  useEffect(() => {
    setFastReplyOpen(slashQuery !== null && filteredFastReplies.length > 0);
  }, [filteredFastReplies.length, slashQuery]);

  const availableMembers = useMemo(() => {
    const taggedIds = new Set(taggedMembers.map((item) => item.id));
    return groupMembers.filter((item) => !taggedIds.has(item.id));
  }, [groupMembers, taggedMembers]);

  const mentionQuery = useMemo(() => {
    if (!isGroup) return null;
    const match = value.match(/(?:^|\s)@(\S*)$/);
    return match ? match[1] : null;
  }, [isGroup, value]);

  const filteredMentionMembers = useMemo(() => {
    if (mentionQuery === null) return [];
    return filterMentionSuggestions(
      availableMembers,
      mentionQuery,
      taggedMembers.map((item) => item.id),
    ).slice(0, 8);
  }, [availableMembers, mentionQuery, taggedMembers]);

  const mentionOpen =
    mentionQuery !== null &&
    (filteredMentionMembers.length > 0 || mentionQuery === "");

  useEffect(() => {
    if (fastReplyOpen || mentionOpen) {
      setEmojiOpen(false);
      setStickerOpen(false);
      setMobileOptionsOpen(false);
      setMobileEmojiOpen(false);
      setMobileStickerOpen(false);
    }
  }, [fastReplyOpen, mentionOpen]);

  useEffect(() => {
    setActiveSuggestionIndex(0);
  }, [slashQuery, mentionQuery]);

  const mentionInfo = useMemo(
    () => calculateMentionInfo(value, taggedMembers),
    [value, taggedMembers],
  );

  const canSend =
    !disabled &&
    !uploading &&
    (value.trim().length > 0 || attachments.length > 0);

  const insertAtCaret = (text: string) => {
    const node = textareaRef.current;
    if (!node) {
      onChange(`${value}${text}`);
      return;
    }
    const { nextText, nextCaret } = insertTextAtCaret(
      value,
      text,
      node.selectionStart ?? value.length,
      node.selectionEnd ?? value.length,
    );
    onChange(nextText);
    requestAnimationFrame(() => {
      node.focus();
      node.setSelectionRange(nextCaret, nextCaret);
      adjustComposerTextareaHeight(node);
    });
  };

  const applyFastReply = (item: MessengerFastReply) => {
    const nextText = replaceComposerTriggerQuery(
      value,
      "/",
      item.content || "",
    );
    if (onApplyFastReply) {
      onApplyFastReply(item, { text: nextText });
    } else {
      onChange(nextText);
    }
    setFastReplyOpen(false);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      adjustComposerTextareaHeight(textareaRef.current);
    });
  };

  const handleSelectMention = (member: ZaloGroupMember) => {
    const name = getGroupMemberName(member);
    onChange(
      replaceComposerTriggerQuery(value, "@", `@${name} `),
    );
    setTaggedMembers((prev) =>
      prev.some((item) => item.id === member.id)
        ? prev
        : [...prev, member],
    );
    textareaRef.current?.focus();
  };

  const handleSelectMentionAll = () => {
    onChange(replaceComposerTriggerQuery(value, "@", "@All "));
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (fastReplyOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestionIndex(
          (prev) => (prev + 1) % filteredFastReplies.length,
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestionIndex(
          (prev) =>
            (prev - 1 + filteredFastReplies.length) %
            filteredFastReplies.length,
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const selected = filteredFastReplies[activeSuggestionIndex];
        if (selected) applyFastReply(selected);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setFastReplyOpen(false);
        return;
      }
    }

    if (emojiOpen && e.key === "Escape") {
      e.preventDefault();
      setEmojiOpen(false);
      return;
    }

    if (mentionOpen) {
      const totalItems = filteredMentionMembers.length + 1;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestionIndex((prev) => (prev + 1) % totalItems);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestionIndex(
          (prev) => (prev - 1 + totalItems) % totalItems,
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (activeSuggestionIndex === 0) {
          handleSelectMentionAll();
        } else {
          const member = filteredMentionMembers[activeSuggestionIndex - 1];
          if (member) handleSelectMention(member);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        textareaRef.current?.blur();
        setTimeout(() => textareaRef.current?.focus(), 50);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) {
        setMobileOptionsOpen(false);
        onSend(mentionInfo);
      }
    }
  };

  const closeMobilePanels = () => {
    setMobileOptionsOpen(false);
    setMobileEmojiOpen(false);
    setMobileStickerOpen(false);
  };

  const handleMobileEmojiPick = (emoji: string) => {
    insertAtCaret(emoji);
    setMobileEmojiOpen(false);
  };

  const handleSendClick = () => {
    closeMobilePanels();
    onSend(mentionInfo);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length && onUploadFiles) onUploadFiles(files);
    event.target.value = "";
  };

  const attachDisabled = disabled || uploading;

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(event.clipboardData.files ?? []);
    if (!files.length || !onUploadFiles) return;
    event.preventDefault();
    void onUploadFiles(files);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const files = Array.from(event.dataTransfer.files ?? []);
    if (files.length && onUploadFiles) void onUploadFiles(files);
  };

  return (
    <div
      className={`shrink-0 border-t border-gray-100 bg-white/90 p-2.5 backdrop-blur dark:border-gray-800 dark:bg-gray-900/90 xl:p-3 ${
        isDragging ? "ring-2 ring-inset ring-brand-400" : ""
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="mb-2 hidden flex-wrap items-center gap-1.5 xl:flex">
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-gray-800">
          Enter gửi
        </span>
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-gray-800">
          Shift+Enter xuống dòng
        </span>
        {isGroup ? (
          <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            @ tag thành viên
          </span>
        ) : null}
        <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
          / mẫu trả lời
        </span>
      </div>

      {quoteMessage ? (
        <div className="mb-2 flex items-start gap-2 rounded-xl border border-brand-200/60 bg-brand-50/60 px-3 py-2 dark:border-brand-500/20 dark:bg-brand-500/10">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-brand-600 dark:text-brand-400">
              Trả lời tin nhắn
            </p>
            <p className="truncate text-xs text-gray-600 dark:text-gray-300">
              {getQuotePreviewText(quoteMessage)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClearQuote}
            className="shrink-0 text-gray-400 hover:text-gray-600"
            aria-label="Bỏ trích dẫn"
          >
            ✕
          </button>
        </div>
      ) : null}

      {attachments.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((item, index) => (
            <div
              key={`${item.link}-${index}`}
              className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700"
            >
              {isImageAttachmentDraft(item) ? (
                <Image
                  src={resolveAttachmentPreviewUrl(item.link)}
                  alt={item.name}
                  width={72}
                  height={72}
                  unoptimized
                  className="h-[72px] w-[72px] object-cover"
                />
              ) : isVideoAttachmentDraft(item) ? (
                <div className="relative h-[72px] w-[120px] bg-black/80">
                  <video
                    src={resolveAttachmentPreviewUrl(item.link)}
                    className="h-full w-full object-cover opacity-90"
                    muted
                    playsInline
                    preload="metadata"
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white drop-shadow">
                    ▶ Video
                  </span>
                </div>
              ) : (
                <div className="flex h-[72px] w-[120px] items-center px-2 text-xs text-gray-600 dark:text-gray-300">
                  📄 {item.name}
                </div>
              )}
              <button
                type="button"
                onClick={() => onRemoveAttachment?.(index)}
                className="absolute top-1 right-1 rounded-full bg-black/50 px-1.5 text-[10px] text-white"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {fastReplyOpen ? (
        <div className="custom-scrollbar mb-2 max-h-60 overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 dark:border-gray-800 dark:bg-gray-800/50">
            <span>Gửi nhanh (/)</span>
            {accountId ? (
              <button
                type="button"
                onClick={() => setManageOpen(true)}
                className="text-brand-600 hover:underline dark:text-brand-400"
              >
                Cấu hình tin nhắn nhanh
              </button>
            ) : null}
          </div>
          {filteredFastReplies.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => applyFastReply(item)}
              className={`flex w-full items-start gap-3 border-b border-gray-100 px-3 py-2.5 text-left last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03] ${
                index === activeSuggestionIndex
                  ? "border-l-2 border-brand-500 bg-brand-50/50 dark:bg-brand-500/10"
                  : ""
              }`}
            >
              <span className="shrink-0 rounded-md bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                /{item.title || "Mẫu"}
              </span>
              <span className="line-clamp-2 text-sm text-gray-700 dark:text-gray-300">
                {item.content ||
                  (item.image ? "📷 Mẫu ảnh đính kèm" : "Mẫu trống")}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {isGroup ? (
        <MentionSuggestions
          key={`mention-${conversationId ?? "none"}-${groupId ?? "none"}`}
          anchorRef={composerShellRef}
          text={value}
          members={availableMembers}
          taggedMemberIds={taggedMembers.map((item) => item.id)}
          onSelectMember={handleSelectMention}
          onSelectAll={handleSelectMentionAll}
          activeIndex={activeSuggestionIndex}
        />
      ) : null}

      <input
        ref={imageInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={videoInputRef}
        type="file"
        multiple
        accept="video/mp4,video/*,.mp4"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <div ref={mobileOptionsRef} className="relative z-20">
        <div className="mb-2 flex items-center justify-between gap-2 xl:hidden">
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setMobileOptionsOpen((prev) => !prev);
              setMobileEmojiOpen(false);
              setMobileStickerOpen(false);
            }}
            aria-expanded={mobileOptionsOpen}
            aria-label="Tùy chọn đính kèm"
            className={`inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition active:scale-[0.98] ${
              mobileOptionsOpen
                ? "border-brand-300 bg-brand-50 text-brand-600 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-400"
                : "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            {mobileOptionsOpen ? (
              <HiOutlineXMark size={16} aria-hidden />
            ) : (
              <HiOutlinePlus size={16} aria-hidden />
            )}
            {mobileOptionsOpen ? "Đóng" : "Tùy chọn"}
          </button>
          {isGroup ? (
            <span className="text-[10px] text-gray-400">@ tag · / mẫu</span>
          ) : (
            <span className="text-[10px] text-gray-400">/ mẫu trả lời</span>
          )}
        </div>

        {mobileOptionsOpen ? (
          <div className="mb-2 rounded-2xl border border-gray-200 bg-gray-50/90 p-2.5 shadow-sm xl:hidden dark:border-gray-700 dark:bg-gray-800/80">
            {mobileEmojiOpen ? (
              <div className="space-y-2">
                <p className="px-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                  Chọn emoji
                </p>
                <EmojiPickerPanel onPick={handleMobileEmojiPick} />
              </div>
            ) : mobileStickerOpen && accountId && onSendSticker ? (
              <StickerPicker
                accountId={accountId}
                open
                placement="inline"
                onClose={() => setMobileStickerOpen(false)}
                onSelect={(sticker) => {
                  onSendSticker(sticker);
                  closeMobilePanels();
                }}
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                <ComposerActionButton
                  label="Ảnh"
                  disabled={attachDisabled}
                  onClick={() => imageInputRef.current?.click()}
                >
                  <HiOutlinePhoto size={20} aria-hidden />
                </ComposerActionButton>
                <ComposerActionButton
                  label="Video"
                  disabled={attachDisabled}
                  onClick={() => videoInputRef.current?.click()}
                >
                  <HiOutlineVideoCamera size={20} aria-hidden />
                </ComposerActionButton>
                <ComposerActionButton
                  label="File"
                  disabled={attachDisabled}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <HiOutlineDocument size={20} aria-hidden />
                </ComposerActionButton>
                {accountId && onSendSticker ? (
                  <ComposerActionButton
                    label="Sticker"
                    disabled={disabled}
                    onClick={() => {
                      setMobileStickerOpen(true);
                      setMobileEmojiOpen(false);
                    }}
                  >
                    <HiOutlinePuzzlePiece size={20} aria-hidden />
                  </ComposerActionButton>
                ) : null}
                <ComposerActionButton
                  label="Emoji"
                  disabled={disabled}
                  onClick={() => {
                    setMobileEmojiOpen(true);
                    setMobileStickerOpen(false);
                  }}
                >
                  <HiOutlineFaceSmile size={20} aria-hidden />
                </ComposerActionButton>
                {accountId ? (
                  <ComposerActionButton
                    label="Mẫu nhanh"
                    disabled={disabled}
                    onClick={() => {
                      closeMobilePanels();
                      setManageOpen(true);
                    }}
                  >
                    <HiOutlineBolt size={20} aria-hidden />
                  </ComposerActionButton>
                ) : null}
              </div>
            )}
          </div>
        ) : null}

        <div ref={composerShellRef} className="flex items-end gap-2">
          <div className="hidden shrink-0 items-center gap-1 xl:flex">
          <Tooltip content="Gửi ảnh" side="top">
            <button
              type="button"
              disabled={attachDisabled}
              onClick={() => imageInputRef.current?.click()}
              aria-label="Gửi ảnh"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:border-brand-300 hover:text-brand-600 disabled:opacity-50 dark:border-gray-700"
            >
              <HiOutlinePhoto size={18} aria-hidden />
            </button>
          </Tooltip>
          <Tooltip content="Gửi video" side="top">
            <button
              type="button"
              disabled={attachDisabled}
              onClick={() => videoInputRef.current?.click()}
              aria-label="Gửi video"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:border-brand-300 hover:text-brand-600 disabled:opacity-50 dark:border-gray-700"
            >
              <HiOutlineVideoCamera size={18} aria-hidden />
            </button>
          </Tooltip>
          <Tooltip content="Gửi file" side="top">
            <button
              type="button"
              disabled={attachDisabled}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Gửi file"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:border-brand-300 hover:text-brand-600 disabled:opacity-50 dark:border-gray-700"
            >
              <HiOutlineDocument size={18} aria-hidden />
            </button>
          </Tooltip>
          {accountId && onSendSticker ? (
            <div ref={stickerRef} className="relative">
              <Tooltip content="Sticker" side="top">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setStickerOpen((prev) => !prev);
                    setEmojiOpen(false);
                  }}
                  aria-label="Sticker"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:border-brand-300 hover:text-brand-600 disabled:opacity-50 dark:border-gray-700"
                >
                  🧩
                </button>
              </Tooltip>
              <StickerPicker
                accountId={accountId}
                open={stickerOpen}
                onClose={() => setStickerOpen(false)}
                onSelect={(sticker) => {
                  onSendSticker(sticker);
                  setStickerOpen(false);
                }}
              />
            </div>
          ) : null}
          {accountId ? (
            <Tooltip content="Quản lý tin nhắn nhanh" side="top">
              <button
                type="button"
                disabled={disabled}
                onClick={() => setManageOpen(true)}
                aria-label="Quản lý tin nhắn nhanh"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:border-brand-300 hover:text-brand-600 disabled:opacity-50 dark:border-gray-700"
              >
                <PlugInIcon className="h-4 w-4" />
              </button>
            </Tooltip>
          ) : null}
          <div ref={emojiRef} className="relative">
            <Tooltip content="Emoji" side="top">
              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  setEmojiOpen((prev) => !prev);
                  setStickerOpen(false);
                }}
                aria-label="Emoji"
                aria-expanded={emojiOpen}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:border-brand-300 hover:text-brand-600 disabled:opacity-50 dark:border-gray-700"
              >
                😊
              </button>
            </Tooltip>
            {emojiOpen ? (
              <div className="absolute bottom-full left-0 z-30 mb-2 w-[220px] overflow-hidden rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                <div className="grid grid-cols-4 gap-1">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        insertAtCaret(emoji);
                        setEmojiOpen(false);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-lg hover:bg-gray-100 dark:hover:bg-white/[0.05]"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

          <textarea
            ref={textareaRef}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={
              disabled
                ? "Chọn hội thoại để nhắn tin..."
                : isGroup
                  ? "Nhập tin nhắn..."
                  : "Nhập tin nhắn..."
            }
            style={{
              maxHeight: COMPOSER_TEXTAREA_MAX_HEIGHT,
              minHeight: 44,
            }}
            className="custom-scrollbar min-h-[44px] flex-1 resize-none overflow-y-hidden rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm leading-6 text-gray-800 outline-none transition [overflow-wrap:anywhere] focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-500/15 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 xl:min-h-[42px]"
          />

          <button
            type="button"
            disabled={disabled || sending || uploading || !canSend}
            onClick={handleSendClick}
            className="flex h-11 min-w-[72px] shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-brand-500 px-4 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 xl:h-[42px] xl:min-w-0 xl:font-medium"
          >
          {sending || uploading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            "Gửi"
          )}
          </button>
        </div>
      </div>

      {accountId ? (
        <FastReplyManageDialog
          accountId={accountId}
          open={manageOpen}
          onClose={() => setManageOpen(false)}
        />
      ) : null}
    </div>
  );
}