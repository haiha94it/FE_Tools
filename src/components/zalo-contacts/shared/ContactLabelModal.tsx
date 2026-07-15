"use client";

import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/form/input/Checkbox";
import ScrollableTableContainer, {
  adminDataPanelClass,
  stickyTableHeaderClass,
} from "@/components/ui/table/ScrollableTableContainer";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import CustomSelect from "@/components/form/CustomSelect";
import Input from "@/components/form/input/InputField";
import { canManageLabelDefinitions } from "@/lib/team-collaboration-utils";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/stores/use-auth-store";
import { zaloFriendService } from "@/services/zalo-friend.service";
import { zaloGroupService } from "@/services/zalo-group.service";
import { zaloLabelService } from "@/services/zalo-label.service";
import { ContactNameCell } from "@/components/zalo-contacts/shared/ContactAvatar";
import {
  getZaloFriendDisplayName,
  getZaloGroupAvatar,
  getZaloGroupDisplayName,
} from "@/lib/zalo-contacts-utils";
import type { ZaloLabelCategory } from "@/types/zalo-contacts";
import { useCallback, useEffect, useMemo, useState } from "react";

type LabelScope = "friend" | "group";
type LabelMode = "pick" | "create";

interface ContactLabelPanelProps {
  active: boolean;
  scope: LabelScope;
  accountId: number | null;
}

const headerClass =
  "px-3 py-2 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400";
const cellClass =
  "px-3 py-2 text-gray-600 text-start text-theme-sm dark:text-gray-400";

interface ContactRow {
  id: number;
  name: string;
  avatar?: string | null;
}

const DEFAULT_LABEL_COLOR = "#465fff";

function LabelColorDot({ color }: { color?: string | null }) {
  if (!color) return null;
  return (
    <span
      className="h-3 w-3 shrink-0 rounded-full border border-gray-200 dark:border-gray-700"
      style={{ backgroundColor: color }}
    />
  );
}

function InstructionHint({
  labelMode,
  contactLabel,
}: {
  labelMode: LabelMode;
  contactLabel: string;
}) {
  const pickHint = `Chọn nhãn → tick ${contactLabel} cần gắn → bấm «Gán nhãn». Muốn bỏ nhãn: chọn nhãn, tick ${contactLabel} → «Gỡ nhãn».`;
  const createHint = `Nhập tên nhãn mới → (tuỳ chọn) tick ${contactLabel} → bấm «Lưu». Có tick ${contactLabel} thì nhãn được gán luôn sau khi tạo.`;

  return (
    <p className="text-theme-xs leading-relaxed text-gray-500 dark:text-gray-400">
      {labelMode === "pick" ? pickHint : createHint}
    </p>
  );
}

const modeTabClass = (active: boolean) =>
  `rounded-lg px-3 py-1.5 text-theme-xs font-medium transition-colors ${
    active
      ? "bg-white text-brand-600 shadow-theme-xs dark:bg-gray-900 dark:text-brand-400"
      : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
  }`;

export default function ContactLabelPanel({
  active,
  scope,
  accountId,
}: ContactLabelPanelProps) {
  const [labels, setLabels] = useState<ZaloLabelCategory[]>([]);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [labelMode, setLabelMode] = useState<LabelMode>("pick");
  const [selectedLabelId, setSelectedLabelId] = useState<number | null>(null);
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState(DEFAULT_LABEL_COLOR);

  const user = useAuthStore((s) => s.user);
  const canCreateLabels = canManageLabelDefinitions(user);

  const contactLabel = scope === "friend" ? "bạn bè" : "nhóm";
  const contactLabelCap = scope === "friend" ? "Bạn bè" : "Nhóm";

  const selectedLabel = useMemo(
    () => labels.find((item) => item.id === selectedLabelId) ?? null,
    [labels, selectedLabelId],
  );

  const loadLabels = useCallback(async () => {
    if (!accountId) return [];
    return zaloLabelService.listCategories(accountId);
  }, [accountId]);

  const loadData = useCallback(async () => {
    if (!accountId) return;
    setIsLoading(true);
    try {
      const labelList = await loadLabels();
      setLabels(labelList);

      const page =
        scope === "friend"
          ? await zaloFriendService.list({ accountId, page: 1, pageSize: 200 })
          : await zaloGroupService.list({ accountId, page: 1, pageSize: 200 });

      let results = page.results ?? [];
      if (results.length) {
        results =
          scope === "friend"
            ? await zaloFriendService.fetchDetails(results)
            : await zaloGroupService.fetchDetails(results);
      }

      setContacts(
        results.map((item) => ({
          id: item.id,
          name:
            scope === "friend"
              ? getZaloFriendDisplayName(item)
              : getZaloGroupDisplayName(item),
          avatar:
            scope === "friend"
              ? ("avatar" in item ? (item.avatar ?? null) : null)
              : getZaloGroupAvatar(item),
        })),
      );
    } catch {
      setLabels([]);
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  }, [accountId, scope, loadLabels]);

  useEffect(() => {
    if (!canCreateLabels && labelMode === "create") {
      setLabelMode("pick");
    }
  }, [canCreateLabels, labelMode]);

  useEffect(() => {
    if (!active) {
      setLabelMode("pick");
      setSelectedLabelId(null);
      setSelectedContactIds([]);
      setNewLabelName("");
      setNewLabelColor(DEFAULT_LABEL_COLOR);
      return;
    }
    void loadData();
  }, [active, loadData]);

  const labelOptions = labels.map((label) => ({
    value: String(label.id),
    label: label.name || `Nhãn #${label.id}`,
  }));

  const renderLabelOption = (option: { value: string; label: string }) => {
    const label = labels.find((item) => String(item.id) === option.value);
    return (
      <span className="flex min-w-0 items-center gap-2">
        <LabelColorDot color={label?.color} />
        <span className="truncate">{option.label}</span>
      </span>
    );
  };

  const toggleContact = (id: number) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedContactIds.length === contacts.length) {
      setSelectedContactIds([]);
      return;
    }
    setSelectedContactIds(contacts.map((item) => item.id));
  };

  const assignLabelToContacts = async (
    categoryId: number,
    contactIds: number[],
  ) => {
    if (!accountId) return;
    if (scope === "friend") {
      await zaloFriendService.assignLabel({
        accountId,
        categoryId,
        friendIds: contactIds,
      });
      return;
    }
    await zaloGroupService.assignLabel({
      accountId,
      categoryId,
      groupIds: contactIds,
    });
  };

  const handleCreateLabel = async (assignAfterCreate: boolean) => {
    const name = newLabelName.trim();
    if (!name) {
      toast.error("Nhập tên nhãn.");
      return;
    }
    if (assignAfterCreate && selectedContactIds.length === 0) {
      toast.error(`Chọn ít nhất một ${contactLabel} để gán nhãn.`);
      return;
    }

    setIsCreatingLabel(true);
    try {
      let categoryId = await zaloLabelService.createCategory({
        name,
        color: newLabelColor,
      });

      const labelList = await loadLabels();
      setLabels(labelList);

      if (!categoryId) {
        const matched = labelList.find((item) => item.name === name);
        categoryId = matched?.id ?? null;
      }

      if (!categoryId) {
        toast.error("Không xác định được nhãn vừa tạo.");
        return;
      }

      setSelectedLabelId(categoryId);
      setLabelMode("pick");
      setNewLabelName("");
      setNewLabelColor(DEFAULT_LABEL_COLOR);

      if (assignAfterCreate) {
        const assignCount = selectedContactIds.length;
        await assignLabelToContacts(categoryId, selectedContactIds);
        setSelectedContactIds([]);
        toast.success(
          `Đã tạo nhãn "${name}" và gán cho ${assignCount} ${contactLabel}.`,
        );
      } else {
        toast.success(`Đã tạo nhãn "${name}". Chọn ${contactLabel} để gán.`);
      }
    } catch {
      /* toast from axios */
    } finally {
      setIsCreatingLabel(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedLabelId) {
      toast.error("Hãy chọn nhãn ở bước 1.");
      return;
    }
    if (selectedContactIds.length === 0) {
      toast.error(`Hãy tick ít nhất một ${contactLabel} ở bước 2.`);
      return;
    }

    setIsSaving(true);
    try {
      await assignLabelToContacts(selectedLabelId, selectedContactIds);
      toast.success(
        `Đã gán nhãn "${selectedLabel?.name ?? ""}" cho ${selectedContactIds.length} ${contactLabel}.`,
      );
      setSelectedContactIds([]);
    } catch {
      /* toast from axios */
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!selectedLabelId) {
      toast.error("Hãy chọn nhãn ở bước 1.");
      return;
    }
    if (selectedContactIds.length === 0) {
      toast.error(`Hãy tick ít nhất một ${contactLabel} ở bước 2.`);
      return;
    }

    setIsSaving(true);
    try {
      if (!accountId) return;
      if (scope === "friend") {
        await zaloFriendService.removeLabel({
          accountId,
          categoryId: selectedLabelId,
          friendIds: selectedContactIds,
        });
      } else {
        await zaloGroupService.removeLabel({
          accountId,
          categoryId: selectedLabelId,
          groupIds: selectedContactIds,
        });
      }
      toast.success(
        `Đã gỡ nhãn "${selectedLabel?.name ?? ""}" khỏi ${selectedContactIds.length} ${contactLabel}.`,
      );
      setSelectedContactIds([]);
    } catch {
      /* toast from axios */
    } finally {
      setIsSaving(false);
    }
  };

  const canAssign =
    labelMode === "pick" && Boolean(selectedLabelId) && selectedContactIds.length > 0;
  const canCreate =
    labelMode === "create" && newLabelName.trim().length > 0;
  const selectedCount = selectedContactIds.length;

  if (!active) return null;

  return (
    <div className={adminDataPanelClass}>
      <div className="mb-3 shrink-0 space-y-2 border-b border-gray-100 pb-3 dark:border-gray-800">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Gán nhãn cho {contactLabel}
          </h3>
          <div className="inline-flex shrink-0 rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800/50">
            <button
              type="button"
              onClick={() => setLabelMode("pick")}
              className={modeTabClass(labelMode === "pick")}
            >
              Dùng nhãn có sẵn
            </button>
            {canCreateLabels ? (
              <button
                type="button"
                onClick={() => setLabelMode("create")}
                className={modeTabClass(labelMode === "create")}
              >
                Tạo nhãn mới
              </button>
            ) : null}
          </div>
        </div>
        <InstructionHint labelMode={labelMode} contactLabel={contactLabel} />
      </div>

      <div className="mb-3 shrink-0 space-y-1.5">
        <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-300">
          {labelMode === "pick" ? "Bước 1 — Chọn nhãn" : "Bước 1 — Đặt tên nhãn mới"}
        </p>
        {labelMode === "pick" ? (
          <div className="min-w-0">
            <CustomSelect
              value={selectedLabelId != null ? String(selectedLabelId) : ""}
              onChange={(value) =>
                setSelectedLabelId(value ? Number(value) : null)
              }
              placeholder={
                labels.length === 0
                  ? "Chưa có nhãn — hãy chọn «Tạo nhãn mới»"
                  : "Chọn nhãn trong danh sách"
              }
              disabled={isLoading}
              options={labelOptions}
              renderOption={renderLabelOption}
              renderValue={(option) =>
                option ? (
                  <span className="flex items-center gap-2">
                    <LabelColorDot
                      color={
                        labels.find((l) => String(l.id) === option.value)?.color
                      }
                    />
                    <span className="truncate">{option.label}</span>
                  </span>
                ) : null
              }
            />
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              <Input
                type="text"
                value={newLabelName}
                disabled={isCreatingLabel}
                placeholder="Ví dụ: Khách VIP, Nhóm sale..."
                onChange={(e) => setNewLabelName(e.target.value)}
              />
            </div>
            <label
              title="Màu hiển thị nhãn"
              className="flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2 dark:border-gray-700 dark:bg-gray-900"
            >
              <input
                type="color"
                value={newLabelColor}
                disabled={isCreatingLabel}
                onChange={(e) => setNewLabelColor(e.target.value)}
                className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                aria-label="Chọn màu nhãn"
              />
            </label>
          </div>
        )}
      </div>

      <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden">
        <div className="mb-1.5 flex shrink-0 items-center justify-between gap-2">
          <span className="text-theme-xs font-medium text-gray-600 dark:text-gray-400">
            Bước 2 — Chọn {contactLabel}
            {selectedCount > 0 ? (
              <span className="ml-1 font-normal text-brand-600 dark:text-brand-400">
                ({selectedCount} đã chọn)
              </span>
            ) : (
              <span className="ml-1 font-normal text-gray-400">
                (chưa chọn)
              </span>
            )}
          </span>
          {contacts.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="!px-2.5 !py-1 !text-theme-xs"
              onClick={toggleSelectAll}
            >
              {selectedContactIds.length === contacts.length
                ? "Bỏ chọn"
                : "Chọn tất cả"}
            </Button>
          )}
        </div>

        <ScrollableTableContainer fill className="h-0 min-h-0 flex-1">
        <Table>
          <TableHeader className={stickyTableHeaderClass}>
            <TableRow>
              <TableCell isHeader className={headerClass}>
                <Checkbox
                  checked={
                    contacts.length > 0 &&
                    selectedContactIds.length === contacts.length
                  }
                  onChange={toggleSelectAll}
                />
              </TableCell>
              <TableCell isHeader className={headerClass}>
                {contactLabelCap}
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {isLoading ? (
              <TableRow>
                <TableCell className={cellClass}>{" "}</TableCell>
                <TableCell className={cellClass}>Đang tải...</TableCell>
              </TableRow>
            ) : contacts.length === 0 ? (
              <TableRow>
                <TableCell className={cellClass}>{" "}</TableCell>
                <TableCell className={cellClass}>
                  Chưa có dữ liệu. Vào &quot;Quét danh sách&quot; trước.
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className={cellClass}>
                    <Checkbox
                      checked={selectedContactIds.includes(contact.id)}
                      onChange={() => toggleContact(contact.id)}
                    />
                  </TableCell>
                  <TableCell className={cellClass}>
                    <ContactNameCell
                      name={contact.name}
                      avatar={contact.avatar}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </ScrollableTableContainer>
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
        {labelMode === "pick" ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => void handleRemove()}
              disabled={isSaving || !canAssign}
            >
              {isSaving
                ? "Đang xử lý..."
                : selectedCount > 0
                  ? `Gỡ nhãn khỏi ${selectedCount} ${contactLabel}`
                  : "Gỡ nhãn"}
            </Button>
            <Button
              size="sm"
              onClick={() => void handleAssign()}
              disabled={isSaving || !canAssign}
            >
              {isSaving
                ? "Đang gán..."
                : selectedCount > 0
                  ? `Gán nhãn cho ${selectedCount} ${contactLabel}`
                  : "Gán nhãn"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <Button
              size="sm"
              className="sm:min-w-[220px]"
              onClick={() =>
                void handleCreateLabel(selectedCount > 0)
              }
              disabled={isCreatingLabel || !canCreate}
            >
              {isCreatingLabel
                ? "Đang lưu..."
                : selectedCount > 0
                  ? `Lưu nhãn và gán cho ${selectedCount} ${contactLabel}`
                  : "Lưu nhãn (gán sau)"}
            </Button>
            {selectedCount === 0 ? (
              <p className="text-right text-theme-xs text-gray-400">
                Tick {contactLabel} ở bảng trên nếu muốn gán ngay khi tạo nhãn.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}