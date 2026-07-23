"use client";

import MediaPickerModal from "@/components/chatbot/detail/MediaPickerModal";
import CustomSelect from "@/components/form/CustomSelect";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Switch from "@/components/form/switch/Switch";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { confirm } from "@/lib/confirm";
import {
  formatDelayLabel,
  formatTimeForApi,
  formatTimeForInput,
  getTrainingImageUrl,
} from "@/lib/chatbot-utils";
import { useChatbotReminderStore } from "@/stores/use-chatbot-reminder-store";
import { useChatbotSpecialCaseStore } from "@/stores/use-chatbot-special-case-store";
import { useChatbotTrainingStore } from "@/stores/use-chatbot-training-store";
import type {
  ReminderGlobalConfig,
  ReminderImageSendMode,
  ReminderTimeConfig,
  ReminderTimeConfigPayload,
  TrainingImage,
} from "@/types/chatbot";
import { useEffect, useMemo, useState } from "react";

interface ReminderPanelProps {
  chatbotId: number;
}

interface TimeFormState {
  delay_minutes: number;
  is_active: boolean;
  image_send_mode: ReminderImageSendMode;
  is_exclude_enabled: boolean;
  messages: string[];
  images: number[];
  messageInput: string;
}

const emptyTimeForm = (): TimeFormState => ({
  delay_minutes: 30,
  is_active: true,
  image_send_mode: "RANDOM",
  is_exclude_enabled: false,
  messages: [],
  images: [],
  messageInput: "",
});

function timeFormFromConfig(config: ReminderTimeConfig): TimeFormState {
  return {
    delay_minutes: config.delay_minutes,
    is_active: config.is_active,
    image_send_mode: config.image_send_mode || "RANDOM",
    is_exclude_enabled: config.is_exclude_enabled,
    messages:
      config.messages_data?.map((m) => m.message_text) ?? config.messages ?? [],
    images: config.images_data?.map((img) => img.media) ?? config.images ?? [],
    messageInput: "",
  };
}

interface GlobalConfigFormProps {
  globalConfig: ReminderGlobalConfig;
  categories: Array<{ id: number; name: string }>;
  specialConfigs: Array<{ id: number; case_type: string; case_type_display?: string }>;
  isSaving: boolean;
  isLoading: boolean;
  onSave: (payload: Partial<ReminderGlobalConfig>) => Promise<boolean>;
}

function GlobalConfigForm({
  globalConfig,
  categories,
  specialConfigs,
  isSaving,
  isLoading,
  onSave,
}: GlobalConfigFormProps) {
  const [isActive, setIsActive] = useState(Boolean(globalConfig.is_active));
  const [isLoop, setIsLoop] = useState(Boolean(globalConfig.is_loop_enabled));
  const [startTime, setStartTime] = useState(
    formatTimeForInput(globalConfig.start_time),
  );
  const [endTime, setEndTime] = useState(
    formatTimeForInput(globalConfig.end_time),
  );
  const [excludedCategories, setExcludedCategories] = useState<number[]>(
    globalConfig.excluded_category_ids ??
      globalConfig.excluded_categories ??
      [],
  );
  const [excludedSpecials, setExcludedSpecials] = useState<number[]>(
    globalConfig.excluded_special_case_ids ??
      globalConfig.excluded_special_cases ??
      [],
  );

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.02]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Cài đặt chung
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Khung giờ theo múi giờ Việt Nam (Asia/Ho_Chi_Minh)
          </p>
        </div>
        {isLoading ? (
          <span className="text-xs text-gray-400">Đang tải…</span>
        ) : null}
      </div>

      <div className="space-y-4">
        <Switch
          label="Bật nhắc nhở tự động"
          checked={isActive}
          onChange={setIsActive}
        />
        <Switch
          label="Lặp vòng sau khi hoàn thành"
          checked={isLoop}
          onChange={setIsLoop}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="reminder-start">Bắt đầu</Label>
            <Input
              id="reminder-start"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="reminder-end">Kết thúc</Label>
            <Input
              id="reminder-end"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label>Danh mục tắt nhắc nhở</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {categories.length === 0 ? (
              <p className="text-xs text-gray-500">Chưa có danh mục.</p>
            ) : (
              categories.map((cat) => {
                const checked = excludedCategories.includes(cat.id);
                return (
                  <label
                    key={cat.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition ${
                      checked
                        ? "bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300"
                        : "bg-white text-gray-600 ring-gray-200 dark:bg-transparent dark:text-gray-400 dark:ring-gray-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() =>
                        setExcludedCategories((prev) =>
                          checked
                            ? prev.filter((x) => x !== cat.id)
                            : [...prev, cat.id],
                        )
                      }
                    />
                    {cat.name}
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div>
          <Label>Tình huống đặc biệt tắt nhắc nhở</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {specialConfigs.length === 0 ? (
              <p className="text-xs text-gray-500">
                Chưa có cấu hình tình huống.
              </p>
            ) : (
              specialConfigs.map((cfg) => {
                const checked = excludedSpecials.includes(cfg.id);
                return (
                  <label
                    key={cfg.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition ${
                      checked
                        ? "bg-brand-50 text-brand-700 ring-brand-200 dark:bg-brand-500/10 dark:text-brand-300"
                        : "bg-white text-gray-600 ring-gray-200 dark:bg-transparent dark:text-gray-400 dark:ring-gray-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() =>
                        setExcludedSpecials((prev) =>
                          checked
                            ? prev.filter((x) => x !== cfg.id)
                            : [...prev, cfg.id],
                        )
                      }
                    />
                    {cfg.case_type_display || cfg.case_type}
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() =>
              void onSave({
                is_active: isActive,
                is_loop_enabled: isLoop,
                start_time: formatTimeForApi(startTime),
                end_time: formatTimeForApi(endTime),
                excluded_categories: excludedCategories,
                excluded_special_cases: excludedSpecials,
              })
            }
            disabled={isSaving}
          >
            {isSaving ? "Đang lưu…" : "Lưu cài đặt chung"}
          </Button>
        </div>
      </div>
    </section>
  );
}

interface TimeConfigFormBodyProps {
  initial: TimeFormState;
  maxMessages: number;
  maxImages: number;
  libraryImages: TrainingImage[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (payload: ReminderTimeConfigPayload) => void;
}

function TimeConfigFormBody({
  initial,
  maxMessages,
  maxImages,
  libraryImages,
  isSaving,
  onClose,
  onSubmit,
}: TimeConfigFormBodyProps) {
  const [timeForm, setTimeForm] = useState<TimeFormState>(initial);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerIds, setPickerIds] = useState<number[]>([]);

  const selectedImagePreview = useMemo(() => {
    return timeForm.images.map((id) => {
      const found = libraryImages.find(
        (img) => img.id === id || img.media === id,
      );
      return found ?? { id, media: id };
    });
  }, [timeForm.images, libraryImages]);

  return (
    <>
      <div className="max-h-[85dvh] overflow-y-auto p-6 sm:p-8">
        <h2 className="pr-10 text-lg font-semibold text-gray-900 dark:text-white">
          {initial.delay_minutes === 30 && initial.messages.length === 0
            ? "Thêm mốc nhắc nhở"
            : "Sửa mốc nhắc nhở"}
        </h2>

        <div className="mt-5 space-y-4">
          <div>
            <Label htmlFor="delay-minutes">Sau bao nhiêu phút</Label>
            <Input
              id="delay-minutes"
              type="number"
              min="1"
              value={timeForm.delay_minutes}
              onChange={(e) =>
                setTimeForm((prev) => ({
                  ...prev,
                  delay_minutes: Number(e.target.value) || 0,
                }))
              }
            />
          </div>

          <Switch
            label="Bật mốc này"
            checked={timeForm.is_active}
            onChange={(checked) =>
              setTimeForm((prev) => ({ ...prev, is_active: checked }))
            }
          />

          <div>
            <Label>Chế độ gửi ảnh</Label>
            <CustomSelect
              value={timeForm.image_send_mode}
              onChange={(v) =>
                setTimeForm((prev) => ({
                  ...prev,
                  image_send_mode: v as ReminderImageSendMode,
                }))
              }
              options={[
                { value: "ALL", label: "Gửi tất cả ảnh" },
                { value: "RANDOM", label: "Ngẫu nhiên 1 ảnh" },
              ]}
            />
          </div>

          <Switch
            label="Loại trừ tin nhắn đã gửi"
            checked={timeForm.is_exclude_enabled}
            disabled={timeForm.messages.length <= 1}
            onChange={(checked) =>
              setTimeForm((prev) => ({
                ...prev,
                is_exclude_enabled: checked,
              }))
            }
          />

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label>
                Tin nhắn mẫu ({timeForm.messages.length}/{maxMessages})
              </Label>
            </div>
            <div className="mb-2 space-y-1">
              {timeForm.messages.map((msg, idx) => (
                <div
                  key={`msg-${idx}`}
                  className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-white/[0.04]"
                >
                  <span className="min-w-0 flex-1">{msg}</span>
                  <button
                    type="button"
                    className="cursor-pointer text-error-500"
                    onClick={() =>
                      setTimeForm((prev) => ({
                        ...prev,
                        messages: prev.messages.filter((_, i) => i !== idx),
                      }))
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={timeForm.messageInput}
                onChange={(e) =>
                  setTimeForm((prev) => ({
                    ...prev,
                    messageInput: e.target.value,
                  }))
                }
                placeholder="Nhập tin nhắn mẫu"
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={
                  !timeForm.messageInput.trim() ||
                  timeForm.messages.length >= maxMessages
                }
                onClick={() => {
                  const text = timeForm.messageInput.trim();
                  if (!text) return;
                  setTimeForm((prev) => ({
                    ...prev,
                    messages: [...prev.messages, text],
                    messageInput: "",
                  }));
                }}
              >
                Thêm
              </Button>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>
                Ảnh đính kèm ({timeForm.images.length}/{maxImages})
              </Label>
              <Button
                size="sm"
                variant="outline"
                className="!px-3 !py-1.5"
                onClick={() => {
                  setPickerIds(timeForm.images);
                  setPickerOpen(true);
                }}
              >
                Chọn ảnh
              </Button>
            </div>
            {selectedImagePreview.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedImagePreview.map((img) => {
                  const src = getTrainingImageUrl(img);
                  return (
                    <div
                      key={img.id}
                      className="h-14 w-14 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={src}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-gray-400">
                          #{img.id}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-500">Chưa chọn ảnh.</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            Hủy
          </Button>
          <Button
            size="sm"
            onClick={() =>
              onSubmit({
                delay_minutes: Number(timeForm.delay_minutes) || 0,
                is_active: timeForm.is_active,
                image_send_mode: timeForm.image_send_mode,
                is_exclude_enabled:
                  timeForm.messages.length > 1
                    ? timeForm.is_exclude_enabled
                    : false,
                messages: timeForm.messages.filter((m) => m.trim()),
                images: timeForm.images,
              })
            }
            disabled={isSaving || timeForm.delay_minutes <= 0}
          >
            {isSaving ? "Đang lưu…" : "Lưu mốc"}
          </Button>
        </div>
      </div>

      <MediaPickerModal
        isOpen={pickerOpen}
        images={libraryImages}
        selectedIds={pickerIds}
        maxSelect={maxImages}
        onClose={() => setPickerOpen(false)}
        onToggle={(id) =>
          setPickerIds((prev) =>
            prev.includes(id)
              ? prev.filter((x) => x !== id)
              : prev.length >= maxImages
                ? prev
                : [...prev, id],
          )
        }
        onClear={() => setPickerIds([])}
        onConfirm={() => {
          setTimeForm((prev) => ({ ...prev, images: pickerIds }));
          setPickerOpen(false);
        }}
      />
    </>
  );
}

export default function ReminderPanel({ chatbotId }: ReminderPanelProps) {
  const setReminderChatbotId = useChatbotReminderStore((s) => s.setChatbotId);
  const globalConfig = useChatbotReminderStore((s) => s.globalConfig);
  const timeConfigs = useChatbotReminderStore((s) => s.timeConfigs);
  const maxTimeConfigs = useChatbotReminderStore((s) => s.maxTimeConfigs);
  const maxMessages = useChatbotReminderStore((s) => s.maxMessages);
  const maxImages = useChatbotReminderStore((s) => s.maxImages);
  const isLoadingGlobal = useChatbotReminderStore((s) => s.isLoadingGlobal);
  const isLoadingTimeConfigs = useChatbotReminderStore(
    (s) => s.isLoadingTimeConfigs,
  );
  const isSavingGlobal = useChatbotReminderStore((s) => s.isSavingGlobal);
  const isSavingTimeConfig = useChatbotReminderStore((s) => s.isSavingTimeConfig);
  const fetchAll = useChatbotReminderStore((s) => s.fetchAll);
  const updateGlobalConfig = useChatbotReminderStore((s) => s.updateGlobalConfig);
  const createTimeConfig = useChatbotReminderStore((s) => s.createTimeConfig);
  const updateTimeConfig = useChatbotReminderStore((s) => s.updateTimeConfig);
  const deleteTimeConfig = useChatbotReminderStore((s) => s.deleteTimeConfig);

  const setTrainingChatbotId = useChatbotTrainingStore((s) => s.setChatbotId);
  const categories = useChatbotTrainingStore((s) => s.categories);
  const images = useChatbotTrainingStore((s) => s.images);
  const fetchCategories = useChatbotTrainingStore((s) => s.fetchCategories);
  const fetchImages = useChatbotTrainingStore((s) => s.fetchImages);

  const setSpecialChatbotId = useChatbotSpecialCaseStore((s) => s.setChatbotId);
  const specialConfigs = useChatbotSpecialCaseStore((s) => s.configs);
  const fetchSpecial = useChatbotSpecialCaseStore((s) => s.fetchAll);

  const [timeFormOpen, setTimeFormOpen] = useState(false);
  const [editingTime, setEditingTime] = useState<ReminderTimeConfig | null>(
    null,
  );

  useEffect(() => {
    setReminderChatbotId(chatbotId);
    setTrainingChatbotId(chatbotId);
    setSpecialChatbotId(chatbotId);
    void fetchAll();
    void fetchCategories({ silent: true });
    void fetchImages({ silent: true });
    void fetchSpecial({ silent: true });
  }, [
    chatbotId,
    setReminderChatbotId,
    setTrainingChatbotId,
    setSpecialChatbotId,
    fetchAll,
    fetchCategories,
    fetchImages,
    fetchSpecial,
  ]);

  const openCreateTime = () => {
    setEditingTime(null);
    setTimeFormOpen(true);
  };

  const openEditTime = (config: ReminderTimeConfig) => {
    setEditingTime(config);
    setTimeFormOpen(true);
  };

  const handleSaveTime = async (payload: ReminderTimeConfigPayload) => {
    if (payload.delay_minutes <= 0) return;
    if (editingTime) {
      const ok = await updateTimeConfig(editingTime.id, payload);
      if (ok) setTimeFormOpen(false);
      return;
    }
    const ok = await createTimeConfig(payload);
    if (ok) setTimeFormOpen(false);
  };

  const timeFormKey = editingTime ? `edit-${editingTime.id}` : "create";
  const timeFormInitial = editingTime
    ? timeFormFromConfig(editingTime)
    : emptyTimeForm();

  return (
    <div className="space-y-6">
      {globalConfig ? (
        <GlobalConfigForm
          key={`global-${globalConfig.id ?? "default"}-${globalConfig.updated_at ?? ""}`}
          globalConfig={globalConfig}
          categories={categories}
          specialConfigs={specialConfigs}
          isSaving={isSavingGlobal}
          isLoading={isLoadingGlobal}
          onSave={updateGlobalConfig}
        />
      ) : (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.02]">
          <p className="text-sm text-gray-500">
            {isLoadingGlobal
              ? "Đang tải cài đặt nhắc nhở…"
              : "Chưa có cấu hình nhắc nhở."}
          </p>
        </section>
      )}

      {/* Time configs */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Mốc thời gian
            </h3>
            <Badge size="sm" color="primary" variant="light">
              {timeConfigs.length} / {maxTimeConfigs}
            </Badge>
          </div>
          <Button
            size="sm"
            onClick={openCreateTime}
            disabled={timeConfigs.length >= maxTimeConfigs}
          >
            + Thêm mốc
          </Button>
        </div>

        {isLoadingTimeConfigs && timeConfigs.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            Đang tải mốc nhắc nhở…
          </p>
        ) : timeConfigs.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500 dark:border-gray-800">
            Chưa có mốc thời gian. Thêm mốc (vd. sau 30 phút) để bot nhắc khách.
          </p>
        ) : (
          <div className="space-y-3">
            {[...timeConfigs]
              .sort((a, b) => a.delay_minutes - b.delay_minutes)
              .map((config) => {
                const messages =
                  config.messages_data?.map((m) => m.message_text) ??
                  config.messages ??
                  [];
                const imageCount =
                  config.images_data?.length ?? config.images?.length ?? 0;
                return (
                  <article
                    key={config.id}
                    className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.02]"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {formatDelayLabel(config.delay_minutes)}
                          </h4>
                          <Badge
                            size="sm"
                            color={config.is_active ? "success" : "light"}
                            variant="light"
                          >
                            {config.is_active ? "Bật" : "Tắt"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Ảnh:{" "}
                          {config.image_send_mode === "ALL"
                            ? "Gửi tất cả"
                            : "Ngẫu nhiên"}{" "}
                          · Tin nhắn: {messages.length}/{maxMessages} · Ảnh đính
                          kèm: {imageCount}/{maxImages}
                          {config.is_exclude_enabled
                            ? " · Loại trừ tin đã gửi"
                            : ""}
                        </p>
                        {messages.length > 0 ? (
                          <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                            {messages.slice(0, 3).map((msg, idx) => (
                              <li key={`${config.id}-msg-${idx}`}>• {msg}</li>
                            ))}
                            {messages.length > 3 ? (
                              <li className="text-xs text-gray-400">
                                +{messages.length - 3} tin khác
                              </li>
                            ) : null}
                          </ul>
                        ) : null}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditTime(config)}
                          className="!px-3 !py-1.5"
                        >
                          Sửa
                        </Button>
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await confirm({
                              title: "Xóa mốc nhắc nhở",
                              message: formatDelayLabel(config.delay_minutes),
                              confirmText: "Xóa",
                              variant: "danger",
                            });
                            if (ok) await deleteTimeConfig(config.id);
                          }}
                          className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-error-600 ring-1 ring-inset ring-gray-200 dark:ring-gray-700"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
          </div>
        )}
      </section>

      <Modal
        isOpen={timeFormOpen}
        onClose={() => setTimeFormOpen(false)}
        className="max-w-xl"
      >
        <TimeConfigFormBody
          key={timeFormKey}
          initial={timeFormInitial}
          maxMessages={maxMessages}
          maxImages={maxImages}
          libraryImages={images}
          isSaving={isSavingTimeConfig}
          onClose={() => setTimeFormOpen(false)}
          onSubmit={(payload) => {
            void handleSaveTime(payload);
          }}
        />
      </Modal>
    </div>
  );
}
