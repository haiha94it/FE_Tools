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
import { toast } from "@/lib/toast";
import { zaloFriendService } from "@/services/zalo-friend.service";
import { zaloGroupService } from "@/services/zalo-group.service";
import { zaloLabelService } from "@/services/zalo-label.service";
import { ContactNameCell } from "@/components/zalo-contacts/shared/ContactAvatar";
import { getZaloGroupAvatar } from "@/lib/zalo-contacts-utils";
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

function StepTrail({
  contactLabelCap,
  step1Done,
  step2Done,
}: {
  contactLabelCap: string;
  step1Done: boolean;
  step2Done: boolean;
}) {
  const steps = [
    { label: "Nhãn", done: step1Done, active: !step1Done },
    { label: contactLabelCap, done: step2Done, active: step1Done && !step2Done },
    { label: "Gán", done: false, active: step1Done && step2Done },
  ];

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1.5 text-theme-xs text-gray-400">
      {steps.map((step, index) => (
        <span key={step.label} className="inline-flex items-center gap-1.5">
          {index > 0 && <span className="text-gray-300 dark:text-gray-600">›</span>}
          <span
            className={
              step.active
                ? "font-medium text-brand-600 dark:text-brand-400"
                : step.done
                  ? "text-gray-600 dark:text-gray-300"
                  : ""
            }
          >
            {index + 1}.{step.label}
          </span>
        </span>
      ))}
    </div>
  );
}

const modeTabClass = (active: boolean) =>
  `rounded px-2.5 py-1 text-theme-xs font-medium transition-colors ${
    active
      ? "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
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

      const list =
        scope === "friend"
          ? await zaloFriendService.list({ accountId, page: 1, pageSize: 200 })
          : await zaloGroupService.list({ accountId, page: 1, pageSize: 200 });

      setContacts(
        (list.results ?? []).map((item) => ({
          id: item.id,
          name:
            "name" in item && item.name
              ? String(item.name)
              : `ID ${item.id}`,
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
    if (scope === "friend") {
      await zaloFriendService.assignLabel({
        categoryId,
        friendIds: contactIds,
      });
      return;
    }
    await zaloGroupService.assignLabel({
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
      toast.error("Chọn nhãn ở bước 1.");
      return;
    }
    if (selectedContactIds.length === 0) {
      toast.error(`Chọn ít nhất một ${contactLabel} ở bước 2.`);
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
      toast.error("Chọn nhãn ở bước 1.");
      return;
    }
    if (selectedContactIds.length === 0) {
      toast.error(`Chọn ít nhất một ${contactLabel} ở bước 2.`);
      return;
    }

    setIsSaving(true);
    try {
      if (scope === "friend") {
        await zaloFriendService.removeLabel({
          categoryId: selectedLabelId,
          friendIds: selectedContactIds,
        });
      } else {
        await zaloGroupService.removeLabel({
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

  const step1Done = labelMode === "pick" ? Boolean(selectedLabelId) : false;
  const step2Done = selectedContactIds.length > 0;
  const canAssign =
    labelMode === "pick" && Boolean(selectedLabelId) && step2Done;
  const canCreateAndAssign =
    labelMode === "create" &&
    newLabelName.trim().length > 0 &&
    step2Done;
  const canCreateOnly =
    labelMode === "create" && newLabelName.trim().length > 0;

  if (!active) return null;

  return (
    <div className={adminDataPanelClass}>
      <div className="mb-1.5 flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 pb-1.5 sm:mb-2 sm:pb-2 dark:border-gray-800">
        <div className="hidden min-w-0 sm:block">
          <StepTrail
            contactLabelCap={contactLabelCap}
            step1Done={step1Done}
            step2Done={step2Done}
          />
        </div>
        <span className="truncate text-theme-xs font-medium text-brand-600 sm:hidden dark:text-brand-400">
          {step1Done
            ? step2Done
              ? `3. Gán · ${selectedContactIds.length} ${contactLabel}`
              : `2. Chọn ${contactLabel}`
            : "1. Chọn nhãn"}
        </span>
        <div className="inline-flex shrink-0 rounded-md border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800/50">
          <button
            type="button"
            onClick={() => setLabelMode("pick")}
            className={modeTabClass(labelMode === "pick")}
          >
            Có sẵn
          </button>
          <button
            type="button"
            onClick={() => setLabelMode("create")}
            className={modeTabClass(labelMode === "create")}
          >
            Tạo mới
          </button>
        </div>
      </div>

      <div className="mb-1.5 flex shrink-0 flex-col gap-1.5 sm:mb-2 sm:flex-row sm:items-center sm:gap-2">
        {labelMode === "pick" ? (
          <div className="min-w-0 flex-1">
            <CustomSelect
              value={selectedLabelId != null ? String(selectedLabelId) : ""}
              onChange={(value) =>
                setSelectedLabelId(value ? Number(value) : null)
              }
              placeholder={
                labels.length === 0
                  ? "Chưa có nhãn — chuyển Tạo mới"
                  : "Chọn nhãn"
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
          <>
            <div className="min-w-0 flex-1">
              <Input
                type="text"
                value={newLabelName}
                disabled={isCreatingLabel}
                placeholder="Tên nhãn mới..."
                onChange={(e) => setNewLabelName(e.target.value)}
              />
            </div>
            <label className="flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2 dark:border-gray-700 dark:bg-gray-900">
              <input
                type="color"
                value={newLabelColor}
                disabled={isCreatingLabel}
                onChange={(e) => setNewLabelColor(e.target.value)}
                className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                aria-label="Chọn màu nhãn"
              />
            </label>
          </>
        )}
      </div>

      <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden">
        <div className="mb-1.5 flex shrink-0 items-center justify-between gap-2">
          <span className="text-theme-xs font-medium text-gray-600 dark:text-gray-400">
            Chọn {contactLabel}
            {selectedContactIds.length > 0 && (
              <span className="ml-1 font-normal text-brand-600 dark:text-brand-400">
                · {selectedContactIds.length} đã chọn
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

      <div className="flex shrink-0 flex-nowrap items-center justify-end gap-1.5 overflow-x-auto border-t border-gray-100 pt-1.5 sm:flex-wrap sm:gap-2 sm:pt-2 dark:border-gray-800">
        {labelMode === "pick" && (
          <Button
            size="sm"
            variant="outline"
            className="max-sm:!px-3 max-sm:!py-2 max-sm:!text-xs"
            onClick={() => void handleRemove()}
            disabled={isSaving || !canAssign}
          >
            Gỡ nhãn
          </Button>
        )}
        {labelMode === "pick" ? (
          <Button
            size="sm"
            className="max-sm:!px-3 max-sm:!py-2 max-sm:!text-xs"
            onClick={() => void handleAssign()}
            disabled={isSaving || !canAssign}
          >
            {isSaving
              ? "Đang gán..."
              : `Gán nhãn${selectedContactIds.length > 0 ? ` (${selectedContactIds.length})` : ""}`}
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              className="max-sm:!px-3 max-sm:!py-2 max-sm:!text-xs"
              onClick={() => void handleCreateLabel(false)}
              disabled={isCreatingLabel || !canCreateOnly}
            >
              {isCreatingLabel ? "Đang tạo..." : "Chỉ tạo"}
            </Button>
            <Button
              size="sm"
              className="max-sm:!px-3 max-sm:!py-2 max-sm:!text-xs"
              onClick={() => void handleCreateLabel(true)}
              disabled={isCreatingLabel || !canCreateAndAssign}
            >
              {isCreatingLabel
                ? "Đang xử lý..."
                : `Tạo & gán${selectedContactIds.length > 0 ? ` (${selectedContactIds.length})` : ""}`}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}