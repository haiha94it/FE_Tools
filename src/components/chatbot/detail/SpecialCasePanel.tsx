"use client";

import PlaceholderHint from "@/components/chatbot/PlaceholderHint";
import Switch from "@/components/form/switch/Switch";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import {
  CopyIcon,
  DownloadIcon,
  TrashBinIcon,
  UploadIcon,
} from "@/icons";
import {
  formatCommaSeparatedKeywords,
  mergeKeywords,
  parseCommaSeparatedKeywords,
} from "@/lib/chatbot-utils";
import { toast } from "@/lib/toast";
import { useChatbotSpecialCaseStore } from "@/stores/use-chatbot-special-case-store";
import {
  CHATBOT_MAX_KEYWORD_LENGTH,
  CHATBOT_MAX_KEYWORDS,
} from "@/types/chatbot";
import { useEffect, useMemo, useRef, useState } from "react";

interface SpecialCasePanelProps {
  chatbotId: number;
}

const FALLBACK_TYPES = [
  {
    value: "spam_keywords",
    label: "Từ khóa spam",
    description: "Tin nhắn chứa từ khóa spam — bot trả lời mẫu.",
    supports_keywords: true,
  },
  {
    value: "short_greeting",
    label: "Tin nhắn chào ngắn",
    description: "Tin nhắn chào ngắn (hi, hello…) — bot trả lời mẫu.",
    supports_keywords: true,
  },
];

export default function SpecialCasePanel({ chatbotId }: SpecialCasePanelProps) {
  const setChatbotId = useChatbotSpecialCaseStore((s) => s.setChatbotId);
  const types = useChatbotSpecialCaseStore((s) => s.types);
  const configs = useChatbotSpecialCaseStore((s) => s.configs);
  const isLoading = useChatbotSpecialCaseStore((s) => s.isLoading);
  const isSaving = useChatbotSpecialCaseStore((s) => s.isSaving);
  const fetchAll = useChatbotSpecialCaseStore((s) => s.fetchAll);
  const saveConfig = useChatbotSpecialCaseStore((s) => s.saveConfig);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [drafts, setDrafts] = useState<
    Record<
      string,
      {
        is_active: boolean;
        auto_reply: string;
        keywords: string[];
        keywordInput: string;
      }
    >
  >({});

  useEffect(() => {
    setChatbotId(chatbotId);
    void fetchAll();
  }, [chatbotId, setChatbotId, fetchAll]);

  const caseTypes = types.length > 0 ? types : FALLBACK_TYPES;

  useEffect(() => {
    const next: typeof drafts = {};
    for (const type of caseTypes) {
      const existing = configs.find((c) => c.case_type === type.value);
      next[type.value] = {
        is_active: existing?.is_active ?? false,
        auto_reply: existing?.auto_reply ?? "",
        keywords: existing?.keywords ?? [],
        keywordInput: "",
      };
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDrafts(next);
    // Chỉ hydrate khi load xong configs/types
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configs, caseTypes.map((t) => t.value).join(",")]);

  const configByType = useMemo(() => {
    const map = new Map(configs.map((c) => [c.case_type, c]));
    return map;
  }, [configs]);

  const getAllKeywordsForExport = (draft: {
    keywords: string[];
    keywordInput: string;
  }) => {
    const pendingKeyword = draft.keywordInput.trim();
    if (!pendingKeyword) return draft.keywords;
    return mergeKeywords(draft.keywords, [pendingKeyword]).keywords;
  };

  const handleCopyKeywords = async (typeValue: string) => {
    const draft = drafts[typeValue];
    if (!draft) return;
    const keywords = getAllKeywordsForExport(draft);
    if (keywords.length === 0) {
      toast.info("Chưa có từ khóa để sao chép.");
      return;
    }

    try {
      await navigator.clipboard.writeText(
        formatCommaSeparatedKeywords(keywords),
      );
      toast.success("Đã sao chép danh sách từ khóa.");
    } catch {
      toast.error("Không sao chép được từ khóa.");
    }
  };

  const handleExportKeywords = (typeValue: string) => {
    const draft = drafts[typeValue];
    if (!draft) return;
    const keywords = getAllKeywordsForExport(draft);
    if (keywords.length === 0) {
      toast.info("Chưa có từ khóa để xuất file.");
      return;
    }

    const content = formatCommaSeparatedKeywords(keywords);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const slug = typeValue || "tu-khoa";
    link.href = url;
    link.download = `tu-khoa-${slug}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Đã xuất file từ khóa.");
  };

  const handleImportKeywordsFile = async (typeValue: string, file: File) => {
    try {
      const text = await file.text();
      const parsed = parseCommaSeparatedKeywords(text);
      if (parsed.length === 0) {
        toast.warning("File không có từ khóa hợp lệ.");
        return;
      }

      const merged = mergeKeywords([], parsed);
      setDrafts((prev) => ({
        ...prev,
        [typeValue]: {
          ...(prev[typeValue] || {
            is_active: false,
            auto_reply: "",
            keywords: [],
            keywordInput: "",
          }),
          keywords: merged.keywords,
          keywordInput: "",
        },
      }));

      toast.success(`Đã nhập ${merged.keywords.length} từ khóa từ file.`);
      if (merged.skippedTooLongCount > 0) {
        toast.warning(
          `Bỏ qua ${merged.skippedTooLongCount} từ khóa vượt quá ${CHATBOT_MAX_KEYWORD_LENGTH} ký tự.`,
        );
      }
      if (merged.limitReached) {
        toast.warning(`Đã đạt giới hạn tối đa ${CHATBOT_MAX_KEYWORDS} từ khóa.`);
      }
    } catch {
      toast.error("Không đọc được file từ khóa.");
    }
  };

  const handleClearAllKeywords = (typeValue: string) => {
    const draft = drafts[typeValue];
    if (!draft || (draft.keywords.length === 0 && !draft.keywordInput.trim())) {
      toast.info("Chưa có từ khóa để xóa.");
      return;
    }

    setDrafts((prev) => ({
      ...prev,
      [typeValue]: {
        ...prev[typeValue],
        keywords: [],
        keywordInput: "",
      },
    }));
    toast.success("Đã xóa tất cả từ khóa.");
  };

  const handleKeywordPaste = (
    typeValue: string,
    event: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    const text = event.clipboardData.getData("text");
    if (!text.includes(",")) return;

    event.preventDefault();
    const draft = drafts[typeValue];
    if (!draft) return;

    const incoming = parseCommaSeparatedKeywords(text);
    const merged = mergeKeywords(draft.keywords, incoming);

    setDrafts((prev) => ({
      ...prev,
      [typeValue]: {
        ...prev[typeValue],
        keywords: merged.keywords,
        keywordInput: "",
      },
    }));

    if (merged.addedCount > 0) {
      toast.success(`Đã thêm ${merged.addedCount} từ khóa.`);
    }
    if (merged.skippedTooLongCount > 0) {
      toast.warning(
        `Bỏ qua ${merged.skippedTooLongCount} từ khóa vượt quá ${CHATBOT_MAX_KEYWORD_LENGTH} ký tự.`,
      );
    }
    if (merged.limitReached) {
      toast.warning(`Đã đạt giới hạn tối đa ${CHATBOT_MAX_KEYWORDS} từ khóa.`);
    }
  };

  if (isLoading && configs.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-gray-500">
        Đang tải tình huống đặc biệt…
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Mỗi loại tình huống có tối đa 1 cấu hình / kịch bản. Tối đa{" "}
        {CHATBOT_MAX_KEYWORDS} từ khóa, mỗi từ ≤ {CHATBOT_MAX_KEYWORD_LENGTH}{" "}
        ký tự.
      </p>

      {caseTypes.map((type) => {
        const draft = drafts[type.value] ?? {
          is_active: false,
          auto_reply: "",
          keywords: [],
          keywordInput: "",
        };
        const existing = configByType.get(type.value);

        return (
          <div
            key={type.value}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.02]"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {type.label}
                  </h3>
                  {existing ? (
                    <Badge size="sm" color="success" variant="light">
                      Đã cấu hình
                    </Badge>
                  ) : (
                    <Badge size="sm" color="light" variant="light">
                      Chưa cấu hình
                    </Badge>
                  )}
                </div>
                {type.description ? (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {type.description}
                  </p>
                ) : null}
              </div>
              <Switch
                label={draft.is_active ? "Đang bật" : "Đang tắt"}
                checked={draft.is_active}
                onChange={(checked) =>
                  setDrafts((prev) => ({
                    ...prev,
                    [type.value]: { ...draft, is_active: checked },
                  }))
                }
              />
            </div>

            {draft.is_active || existing ? (
              <div className="mt-4 space-y-4 border-t border-gray-100 pt-4 dark:border-gray-800">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Câu trả lời tự động
                  </label>
                  <textarea
                    value={draft.auto_reply}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [type.value]: {
                          ...draft,
                          auto_reply: e.target.value,
                        },
                      }))
                    }
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    placeholder="Chào {{title}} {{name}}, ..."
                  />
                  <PlaceholderHint className="mt-1.5" />
                </div>

                {type.supports_keywords !== false ? (
                  <div>
                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-400">
                          Từ khóa
                        </label>
                        <Badge size="sm" color="primary" variant="light">
                          {draft.keywords.length} / {CHATBOT_MAX_KEYWORDS}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => void handleCopyKeywords(type.value)}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                          <CopyIcon className="size-3.5" />
                          Sao chép
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExportKeywords(type.value)}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                          <DownloadIcon className="size-3.5" />
                          Xuất file
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            fileInputRefs.current[type.value]?.click()
                          }
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                        >
                          <UploadIcon className="size-3.5" />
                          Nhập file
                        </button>
                        <button
                          type="button"
                          onClick={() => handleClearAllKeywords(type.value)}
                          disabled={
                            draft.keywords.length === 0 &&
                            !draft.keywordInput.trim()
                          }
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-error-200 bg-white px-2.5 py-1 text-xs font-medium text-error-600 shadow-xs hover:bg-error-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-error-800 dark:bg-gray-800 dark:text-error-400 dark:hover:bg-error-950/30"
                        >
                          <TrashBinIcon className="size-3.5" />
                          Xóa tất cả
                        </button>
                      </div>
                    </div>

                    <input
                      ref={(el) => {
                        fileInputRefs.current[type.value] = el;
                      }}
                      type="file"
                      accept=".txt,.csv,text/plain"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (file) void handleImportKeywordsFile(type.value, file);
                      }}
                    />

                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {draft.keywords.map((kw) => (
                        <button
                          key={kw}
                          type="button"
                          onClick={() =>
                            setDrafts((prev) => ({
                              ...prev,
                              [type.value]: {
                                ...draft,
                                keywords: draft.keywords.filter(
                                  (k) => k !== kw,
                                ),
                              },
                            }))
                          }
                          className="cursor-pointer rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 transition hover:bg-error-50 hover:text-error-600 dark:bg-white/10 dark:text-gray-200"
                        >
                          {kw} ×
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={draft.keywordInput}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [type.value]: {
                              ...draft,
                              keywordInput: e.target.value,
                            },
                          }))
                        }
                        onPaste={(e) => handleKeywordPaste(type.value, e)}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter") return;
                          e.preventDefault();
                          const incoming = parseCommaSeparatedKeywords(
                            draft.keywordInput,
                          );
                          const merged = mergeKeywords(
                            draft.keywords,
                            incoming,
                          );
                          if (merged.skippedTooLongCount > 0) {
                            toast.warning(
                              `Bỏ qua ${merged.skippedTooLongCount} từ khóa quá dài.`,
                            );
                          }
                          if (merged.limitReached && merged.addedCount === 0) {
                            toast.error(
                              `Đã đạt giới hạn ${CHATBOT_MAX_KEYWORDS} từ khóa.`,
                            );
                          }
                          setDrafts((prev) => ({
                            ...prev,
                            [type.value]: {
                              ...draft,
                              keywords: merged.keywords,
                              keywordInput: "",
                            },
                          }));
                        }}
                        placeholder="Nhập từ khóa, Enter hoặc dấu phẩy"
                        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const incoming = parseCommaSeparatedKeywords(
                            draft.keywordInput,
                          );
                          const merged = mergeKeywords(
                            draft.keywords,
                            incoming,
                          );
                          setDrafts((prev) => ({
                            ...prev,
                            [type.value]: {
                              ...draft,
                              keywords: merged.keywords,
                              keywordInput: "",
                            },
                          }));
                        }}
                      >
                        Thêm
                      </Button>
                    </div>
                  </div>
                ) : null}

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    disabled={isSaving}
                    onClick={() =>
                      void saveConfig(
                        type.value,
                        {
                          is_active: draft.is_active,
                          auto_reply: draft.auto_reply,
                          keywords: draft.keywords,
                          metadata: existing?.metadata ?? {},
                        },
                        existing?.id ?? null,
                      )
                    }
                  >
                    {isSaving ? "Đang lưu…" : "Lưu cấu hình"}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
