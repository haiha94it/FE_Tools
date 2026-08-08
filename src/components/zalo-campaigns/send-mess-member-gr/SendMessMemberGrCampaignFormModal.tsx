"use client";

import AvatarText from "@/components/ui/avatar/AvatarText";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import TimePicker from "@/components/form/time-picker";
import Checkbox from "@/components/form/input/Checkbox";
import { Modal } from "@/components/ui/modal";
import {
  campaignFormBodyClass,
  campaignFormMainClass,
  campaignFormModalPanelClass,
  campaignFormModalPanelClassWizard,
  campaignFormScrollPaneClass,
  campaignFormSidePaneClass,
  campaignFormWizardListScrollClass,
  campaignFormWizardSelectionPanelClass,
  CAMPAIGN_WIZARD_LIST_MAX_HEIGHT,
} from "@/components/zalo-campaigns/CampaignFormModalLayout";
import {
  CampaignFormWizardFooter,
  CampaignFormWizardHeader,
  type CampaignWizardStep,
} from "@/components/zalo-campaigns/CampaignFormWizard";
import ContactAvatar from "@/components/zalo-contacts/shared/ContactAvatar";
import CampaignAttachmentFields from "@/components/zalo-campaigns/shared/CampaignAttachmentFields";
import SendMesFrContentEditor from "@/components/zalo-campaigns/send-mes-fr/SendMesFrContentEditor";
import SendMessMemberGrFirstMessageEditor from "./SendMessMemberGrFirstMessageEditor";
import { GroupIcon, UserIcon } from "@/icons";
import { useCampaignFormWizard } from "@/hooks/use-campaign-form-wizard";
import { useScanTaskPoll } from "@/hooks/use-scan-task-poll";
import {
  canEditSendMessMemberGrTargets,
  formatTimeForApi,
  getSendMessMemberGrMediaUrl,
  parseTimeToDate,
} from "@/lib/zalo-send-mess-member-gr-campaign-utils";
import {
  getScanTaskStatus,
  isScanTaskDone,
} from "@/lib/zalo-contacts-utils";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import {
  fetchCampaignCommonGroups,
  fetchCampaignCommonGroupsPage,
} from "@/services/zalo-campaign-all-group.service";
import { zaloGroupService } from "@/services/zalo-group.service";
import { zaloSendMessMemberGrCampaignService } from "@/services/zalo-send-mess-member-gr-campaign.service";
import { useZaloSendMessMemberGrCampaignStore } from "@/stores/use-zalo-send-mess-member-gr-campaign-store";
import type { CampaignCommonGroupItem } from "@/types/zalo-campaign-common-group";
import type {
  SendMessMemberGrAssignMode,
  SendMessMemberGrCampaignDetail,
  SendMessMemberGrContentType,
  SendMessMemberGrGroupMember,
} from "@/types/zalo-send-mess-member-gr-campaign";
import type { ScanTaskResponse } from "@/types/zalo-contacts";
import type { ZaloAccount } from "@/types/zalo-account";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface SendMessMemberGrCampaignFormModalProps {
  open: boolean;
  editingCampaign: SendMessMemberGrCampaignDetail | null;
  accounts: ZaloAccount[];
  accountsLoading: boolean;
  onClose: () => void;
  readOnly?: boolean;
}

const defaultStart = () => {
  const date = new Date();
  date.setHours(7, 0, 0, 0);
  return date;
};

const defaultEnd = () => {
  const date = new Date();
  date.setHours(21, 0, 0, 0);
  return date;
};

function accountIdsKey(ids: number[]): string {
  return [...ids].sort((a, b) => a - b).join(",");
}

function groupAvatar(group: CampaignCommonGroupItem): string | undefined {
  return group.avt || group.avatar;
}

export default function SendMessMemberGrCampaignFormModal({
  open,
  editingCampaign,
  accounts,
  accountsLoading,
  onClose,
  readOnly = false,
}: SendMessMemberGrCampaignFormModalProps) {
  const createOrEditCampaign = useZaloSendMessMemberGrCampaignStore(
    (s) => s.createOrEditCampaign,
  );
  const saving = useZaloSendMessMemberGrCampaignStore((s) => s.saving);
  const { isWizard, wizardStep, setWizardStep, goBack, goNext } =
    useCampaignFormWizard(open);

  const [name, setName] = useState("");
  const [delayTime, setDelayTime] = useState("350");
  const [numberCount, setNumberCount] = useState("50");
  const [sendMessage, setSendMessage] = useState(true);
  const [addFriend, setAddFriend] = useState(false);
  const [splitAttachment, setSplitAttachment] = useState(false);
  const [contents, setContents] = useState<string[]>([]);
  const [firstMessages, setFirstMessages] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [contentType, setContentType] = useState<SendMessMemberGrContentType>("");
  const [selectedMediaId, setSelectedMediaId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(defaultEnd);
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);
  const [groups, setGroups] = useState<CampaignCommonGroupItem[]>([]);
  const [selectedGroupGlobalId, setSelectedGroupGlobalId] = useState<string | null>(
    null,
  );
  const [selectedMemberGlobalIds, setSelectedMemberGlobalIds] = useState<string[]>(
    [],
  );
  const [assignMode, setAssignMode] =
    useState<SendMessMemberGrAssignMode>("distribute");
  const [members, setMembers] = useState<SendMessMemberGrGroupMember[]>([]);
  const [groupSearch, setGroupSearch] = useState("");
  const [debouncedGroupSearch, setDebouncedGroupSearch] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [groupPage, setGroupPage] = useState(1);
  const [groupTotal, setGroupTotal] = useState(0);
  const [memberPage, setMemberPage] = useState(1);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [scanningGroups, setScanningGroups] = useState(false);
  const [scanningMembers, setScanningMembers] = useState(false);
  const [scanGroupTaskId, setScanGroupTaskId] = useState<string | number | null>(
    null,
  );
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadGroupsSeqRef = useRef(0);
  const loadMembersSeqRef = useRef(0);
  const pendingGroupGlobalIdRef = useRef<string | null>(null);

  const GROUP_PAGE_SIZE = 50;
  const MEMBER_PAGE_SIZE = 50;
  const SEARCH_DEBOUNCE_MS = 350;

  const targetsEditable = editingCampaign
    ? canEditSendMessMemberGrTargets(editingCampaign.status)
    : true;

  const activeAccounts = useMemo(
    () => accounts.filter((item) => item.checkpoint === false),
    [accounts],
  );

  const selectedKey = accountIdsKey(selectedAccountIds);
  const multiNick = selectedAccountIds.length >= 2;

  const groupTotalPages = Math.max(
    1,
    Math.ceil(groupTotal / GROUP_PAGE_SIZE) || 1,
  );

  /** TV: filter client + sort role, rồi phân trang UI. */
  const filteredMembers = useMemo(() => {
    const key = memberSearch.trim().toLowerCase();
    const matched = key
      ? members.filter((item) => {
          const id = item.member_global_id.toLowerCase();
          return item.name.toLowerCase().includes(key) || id.includes(key);
        })
      : [...members];
    return matched.sort((left, right) => {
      const leftRole = left.is_creator ? 0 : left.is_admin ? 1 : 2;
      const rightRole = right.is_creator ? 0 : right.is_admin ? 1 : 2;
      return leftRole - rightRole;
    });
  }, [members, memberSearch]);

  const memberTotalPages = Math.max(
    1,
    Math.ceil(filteredMembers.length / MEMBER_PAGE_SIZE) || 1,
  );

  const pageMembers = useMemo(() => {
    const start = (memberPage - 1) * MEMBER_PAGE_SIZE;
    return filteredMembers.slice(start, start + MEMBER_PAGE_SIZE);
  }, [filteredMembers, memberPage]);

  const allPageMembersSelected =
    pageMembers.length > 0 &&
    pageMembers.every((m) =>
      selectedMemberGlobalIds.includes(m.member_global_id),
    );

  const allFilteredMembersSelected =
    filteredMembers.length > 0 &&
    filteredMembers.every((m) =>
      selectedMemberGlobalIds.includes(m.member_global_id),
    );

  const resetGroupPaging = useCallback(() => {
    setGroupPage(1);
    setGroupTotal(0);
    setGroups([]);
    setGroupSearch("");
    setDebouncedGroupSearch("");
  }, []);

  const resetForm = useCallback(() => {
    setName("");
    setDelayTime("350");
    setNumberCount("50");
    setSendMessage(true);
    setAddFriend(false);
    setSplitAttachment(false);
    setContents([]);
    setFirstMessages([]);
    setImages([]);
    setContentType("");
    setSelectedMediaId(null);
    setStartTime(defaultStart());
    setEndTime(defaultEnd());
    setSelectedAccountIds([]);
    setSelectedGroupGlobalId(null);
    setSelectedMemberGlobalIds([]);
    setAssignMode("distribute");
    setMembers([]);
    setMemberSearch("");
    setMemberPage(1);
    resetGroupPaging();
    pendingGroupGlobalIdRef.current = null;
  }, [resetGroupPaging]);

  useEffect(() => {
    if (!open) return;
    if (!editingCampaign) {
      resetForm();
      return;
    }
    setName(editingCampaign.name ?? "");
    setDelayTime(String(editingCampaign.delay_time ?? 350));
    setNumberCount(String(editingCampaign.number_count ?? 50));
    setSendMessage(editingCampaign.send_message ?? true);
    setAddFriend(editingCampaign.add_friend ?? false);
    setSplitAttachment(editingCampaign.split_attachment ?? false);
    setContents(editingCampaign.contents ?? []);
    setFirstMessages(editingCampaign.first_messages ?? []);
    setImages(editingCampaign.images ?? []);
    const type = editingCampaign.type ?? "";
    setContentType(type);
    setSelectedMediaId(
      type === "video"
        ? (editingCampaign.video ?? null)
        : type === "album"
          ? (editingCampaign.album ?? null)
          : null,
    );
    setStartTime(parseTimeToDate(editingCampaign.from_time) ?? defaultStart());
    setEndTime(parseTimeToDate(editingCampaign.to_time) ?? defaultEnd());

    // accounts M2M: number[] (serializer) — fallback object {id} nếu BE đổi shape
    const rawAccounts = editingCampaign.accounts as unknown;
    let accountIds: number[] = [];
    if (Array.isArray(rawAccounts)) {
      accountIds = rawAccounts
        .map((item) => {
          if (typeof item === "number" && Number.isFinite(item)) return item;
          if (item && typeof item === "object" && "id" in item) {
            const n = Number((item as { id: unknown }).id);
            return Number.isFinite(n) ? n : NaN;
          }
          return NaN;
        })
        .filter((id) => Number.isFinite(id) && id > 0);
    } else if (editingCampaign.account) {
      accountIds = [editingCampaign.account];
    }
    setSelectedAccountIds(accountIds);
    setAssignMode(editingCampaign.assign_mode === "all" ? "all" : "distribute");

    const groupGlobalId = editingCampaign.group_global_id?.trim() || null;
    setSelectedGroupGlobalId(groupGlobalId);
    pendingGroupGlobalIdRef.current = groupGlobalId;

    setSelectedMemberGlobalIds(
      (editingCampaign.list_member_global ?? []).map(String).filter(Boolean),
    );
    setMembers([]);
    setMemberSearch("");
    setMemberPage(1);
    resetGroupPaging();
  }, [open, editingCampaign, resetForm, resetGroupPaging]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      setDebouncedGroupSearch(groupSearch.trim());
      setGroupPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [groupSearch, open]);

  useEffect(() => {
    setMemberPage(1);
  }, [memberSearch, selectedGroupGlobalId]);

  // Drop nick không còn active
  useEffect(() => {
    if (!open || !activeAccounts.length) return;
    setSelectedAccountIds((prev) => {
      const next = prev.filter((id) =>
        activeAccounts.some((account) => account.id === id),
      );
      return next.length === prev.length ? prev : next;
    });
  }, [open, activeAccounts]);

  const loadGroups = useCallback(
    async (
      accountIds: number[],
      keyword: string,
      page: number,
      options?: { silentEmpty?: boolean },
    ) => {
      if (!accountIds.length) {
        setGroups([]);
        setGroupTotal(0);
        setSelectedGroupGlobalId(null);
        return;
      }

      const seq = ++loadGroupsSeqRef.current;
      try {
        setGroupsLoading(true);
        const data = await fetchCampaignCommonGroupsPage({
          accountIds,
          keyword: keyword || undefined,
          page,
          pageSize: GROUP_PAGE_SIZE,
        });
        if (seq !== loadGroupsSeqRef.current) return;

        const loaded = data.results;
        setGroups(loaded);
        // count = tổng mọi trang (BE list_common_joined_groups)
        setGroupTotal(
          typeof data.count === "number" ? data.count : loaded.length,
        );

        const pending = pendingGroupGlobalIdRef.current;
        if (pending) {
          const matched = loaded.find((item) => item.globalId === pending);
          if (matched?.globalId) {
            setSelectedGroupGlobalId(matched.globalId);
            pendingGroupGlobalIdRef.current = null;
          } else if (page === 1 && !keyword) {
            try {
              const all = await fetchCampaignCommonGroups({ accountIds });
              if (seq !== loadGroupsSeqRef.current) return;
              const found = all.find((item) => item.globalId === pending);
              if (found?.globalId) {
                setSelectedGroupGlobalId(found.globalId);
                pendingGroupGlobalIdRef.current = null;
              }
            } catch {
              /* ignore */
            }
          }
        } else {
          setSelectedGroupGlobalId((prev) => {
            if (!prev) return null;
            // Giữ selection khi lật trang (không có trên page hiện tại)
            return prev;
          });
        }

        if (!loaded.length && data.count === 0 && !options?.silentEmpty) {
          toast.error(
            accountIds.length >= 2
              ? "Không có nhóm chung / chưa sync global giữa các nick đã chọn."
              : "Không tìm thấy nhóm (hoặc nhóm chưa gắn global — hãy quét nhóm).",
          );
        }
      } catch (error) {
        if (seq !== loadGroupsSeqRef.current) return;
        setGroups([]);
        setGroupTotal(0);
        toast.error(getApiErrorMessage(error));
      } finally {
        if (seq === loadGroupsSeqRef.current) {
          setGroupsLoading(false);
        }
      }
    },
    [],
  );

  const loadMembers = useCallback(
    async (accountIds: number[], groupGlobalId: string) => {
      if (!accountIds.length || !groupGlobalId.trim()) {
        setMembers([]);
        return;
      }
      const seq = ++loadMembersSeqRef.current;
      try {
        setMembersLoading(true);
        const loaded = await zaloSendMessMemberGrCampaignService.fetchGroupMembers({
          accountIds,
          groupGlobalId,
        });
        if (seq !== loadMembersSeqRef.current) return;
        setMembers(loaded);
        setSelectedMemberGlobalIds((prev) =>
          prev.filter((id) =>
            loaded.some((member) => member.member_global_id === id),
          ),
        );
      } catch (error) {
        if (seq !== loadMembersSeqRef.current) return;
        setMembers([]);
        toast.error(getApiErrorMessage(error));
      } finally {
        if (seq === loadMembersSeqRef.current) {
          setMembersLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (!open) return;
    if (!selectedAccountIds.length) {
      setGroups([]);
      setGroupTotal(0);
      if (!editingCampaign) {
        setSelectedGroupGlobalId(null);
        setMembers([]);
        setSelectedMemberGlobalIds([]);
      }
      return;
    }
    void loadGroups(selectedAccountIds, debouncedGroupSearch, groupPage, {
      silentEmpty: true,
    });
  }, [
    open,
    selectedKey,
    editingCampaign?.id,
    loadGroups,
    selectedAccountIds,
    debouncedGroupSearch,
    groupPage,
    editingCampaign,
  ]);

  useEffect(() => {
    if (!open || !selectedGroupGlobalId || !selectedAccountIds.length) {
      if (!selectedGroupGlobalId) setMembers([]);
      return;
    }
    void loadMembers(selectedAccountIds, selectedGroupGlobalId);
  }, [open, selectedKey, selectedGroupGlobalId, loadMembers, selectedAccountIds]);

  const handleScanGroupResult = useCallback(
    (result: ScanTaskResponse) => {
      const status = getScanTaskStatus(result);
      if (!isScanTaskDone(status)) return;
      setScanningGroups(false);
      setScanGroupTaskId(null);
      if (status === "SUCCESS") {
        toast.success("Quét danh sách nhóm thành công.");
        if (selectedAccountIds.length) {
          setGroupPage(1);
          void loadGroups(selectedAccountIds, debouncedGroupSearch, 1);
        }
      } else {
        toast.error(result.message || result.error || "Quét danh sách nhóm thất bại.");
      }
    },
    [selectedAccountIds, debouncedGroupSearch, loadGroups],
  );

  useScanTaskPoll({
    taskId: scanGroupTaskId,
    poll: zaloGroupService.pollScanResult,
    onResult: handleScanGroupResult,
  });

  const toggleAccount = (accountId: number) => {
    if (!targetsEditable) return;
    if (!activeAccounts.some((item) => item.id === accountId)) {
      toast.error("Chỉ chọn nick đang hoạt động.");
      return;
    }
    setSelectedAccountIds((prev) => {
      const next = prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId];
      if (next.length !== prev.length) {
        setSelectedGroupGlobalId(null);
        setSelectedMemberGlobalIds([]);
        setMembers([]);
        setMemberPage(1);
        resetGroupPaging();
        pendingGroupGlobalIdRef.current = null;
      }
      return next;
    });
  };

  const toggleSelectAllAccounts = () => {
    if (!targetsEditable) return;
    const allIds = activeAccounts.map((item) => item.id);
    const allSelected =
      allIds.length > 0 &&
      allIds.every((id) => selectedAccountIds.includes(id));
    setSelectedAccountIds(allSelected ? [] : allIds);
    setSelectedGroupGlobalId(null);
    setSelectedMemberGlobalIds([]);
    setMembers([]);
    setMemberPage(1);
    resetGroupPaging();
    pendingGroupGlobalIdRef.current = null;
  };

  const handleSelectGroup = (group: CampaignCommonGroupItem) => {
    if (!targetsEditable) return;
    const globalId = group.globalId?.trim();
    if (!globalId) {
      toast.error("Nhóm chưa có globalId — hãy quét/sync nhóm rồi thử lại.");
      return;
    }
    if (selectedGroupGlobalId === globalId) return;
    setSelectedGroupGlobalId(globalId);
    setSelectedMemberGlobalIds([]);
    setMemberSearch("");
    setMemberPage(1);
  };

  const toggleMember = (memberGlobalId: string) => {
    if (!targetsEditable || !memberGlobalId) return;
    setSelectedMemberGlobalIds((prev) =>
      prev.includes(memberGlobalId)
        ? prev.filter((id) => id !== memberGlobalId)
        : [...prev, memberGlobalId],
    );
  };

  /** Chọn / bỏ chọn TV trên trang UI hiện tại. */
  const toggleAllPageMembers = () => {
    if (!targetsEditable || !pageMembers.length) return;
    const pageIds = new Set(pageMembers.map((m) => m.member_global_id));
    setSelectedMemberGlobalIds((current) =>
      allPageMembersSelected
        ? current.filter((id) => !pageIds.has(id))
        : Array.from(new Set([...current, ...pageIds])),
    );
  };

  /** Chọn tất cả TV khớp filter tìm (mọi trang client). */
  const selectAllFilteredMembers = () => {
    if (!targetsEditable) return;
    const allIds = filteredMembers.map((m) => m.member_global_id);
    if (!allIds.length) return;
    setSelectedMemberGlobalIds((prev) =>
      Array.from(new Set([...prev, ...allIds])),
    );
  };

  const clearAllSelectedMembers = () => {
    if (!targetsEditable) return;
    setSelectedMemberGlobalIds([]);
  };

  const handleScanGroups = async () => {
    if (!selectedAccountIds.length) {
      toast.error("Chọn ít nhất một tài khoản.");
      return;
    }
    try {
      setScanningGroups(true);
      const taskId = await zaloGroupService.startScan(selectedAccountIds);
      if (!taskId) {
        setScanningGroups(false);
        toast.error("Không gửi được yêu cầu quét nhóm.");
        return;
      }
      setScanGroupTaskId(taskId);
      toast.info("Đang quét danh sách nhóm...");
    } catch (error) {
      setScanningGroups(false);
      toast.error(getApiErrorMessage(error));
    }
  };

  /**
   * Quét TV từ Zalo (get-member) cho từng nick đã chọn trên nhóm global,
   * rồi load lại list từ API members (accounts_ready cập nhật).
   */
  const handleScanMembers = async () => {
    if (!selectedAccountIds.length) {
      toast.error("Chọn ít nhất một tài khoản.");
      return;
    }
    if (!selectedGroupGlobalId) {
      toast.error("Chọn nhóm trước khi quét thành viên.");
      return;
    }

    setScanningMembers(true);
    try {
      const selectedGroup = groups.find(
        (item) => item.globalId === selectedGroupGlobalId,
      );

      // Resolve id_group (GroupModel) theo từng nick — all-group multi-nick chỉ trả id nick đầu
      const firstAccountId = selectedAccountIds[0];
      const knownFirstGroupId =
        firstAccountId &&
        selectedGroup?.id != null &&
        Number.isFinite(selectedGroup.id) &&
        selectedGroup.id > 0
          ? selectedGroup.id
          : null;

      const resolved = await Promise.all(
        selectedAccountIds.map(async (accountId) => {
          if (accountId === firstAccountId && knownFirstGroupId != null) {
            return { accountId, groupId: knownFirstGroupId };
          }
          try {
            const list = await fetchCampaignCommonGroups({
              accountIds: [accountId],
            });
            const match = list.find(
              (item) => item.globalId === selectedGroupGlobalId,
            );
            if (match?.id != null && match.id > 0) {
              return { accountId, groupId: match.id };
            }
          } catch {
            // bỏ nick không resolve được
          }
          return null;
        }),
      );
      const pairs = resolved.filter(
        (item): item is { accountId: number; groupId: number } => item != null,
      );

      if (!pairs.length) {
        toast.error(
          "Không tìm thấy nhóm trên nick để quét thành viên. Hãy quét nhóm trước.",
        );
        return;
      }

      toast.info(
        pairs.length > 1
          ? `Đang quét thành viên trên ${pairs.length} nick...`
          : "Đang quét thành viên nhóm từ Zalo...",
      );

      let successCount = 0;
      let failCount = 0;

      // Chạy tuần tự để tránh spam Zalo / Celery quá nhiều song song
      for (const pair of pairs) {
        try {
          const taskId = await zaloGroupService.startGetMembers(
            pair.accountId,
            pair.groupId,
          );
          if (!taskId) {
            failCount += 1;
            continue;
          }

          let done = false;
          for (let attempt = 0; attempt < 90; attempt++) {
            const result = await zaloGroupService.pollGetMembersResult(taskId);
            const status = getScanTaskStatus(result);
            if (!isScanTaskDone(status)) {
              await new Promise((resolve) => setTimeout(resolve, 1500));
              continue;
            }
            if (status === "SUCCESS") {
              successCount += 1;
            } else {
              failCount += 1;
            }
            done = true;
            break;
          }
          if (!done) failCount += 1;
        } catch {
          failCount += 1;
        }
      }

      await loadMembers(selectedAccountIds, selectedGroupGlobalId);

      if (successCount > 0 && failCount === 0) {
        toast.success(
          successCount > 1
            ? `Đã quét thành viên trên ${successCount} nick.`
            : "Đã quét thành viên nhóm thành công.",
        );
      } else if (successCount > 0) {
        toast.success(
          `Đã quét ${successCount} nick; ${failCount} nick lỗi hoặc timeout.`,
        );
      } else {
        toast.error("Quét thành viên nhóm thất bại. Thử lại sau.");
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setScanningMembers(false);
    }
  };

  const handleUploadImage = async (file: File) => {
    setUploadingImage(true);
    try {
      return await zaloSendMessMemberGrCampaignService.uploadImage(file);
    } finally {
      setUploadingImage(false);
    }
  };

  /** Lưu kịch bản cùng lựa chọn tách nội dung và file đính kèm. */
  const handleSave = async () => {
    const isRunningContentOnly = editingCampaign?.status === 1;

    // Validate nội dung (chung tạo/sửa + khi đang chạy chỉ sửa tin/media)
    if (sendMessage && !contents.length && !contentType) {
      toast.error("Nhập nội dung hoặc chọn đính kèm.");
      return;
    }
    if (sendMessage && contentType === "image" && !images.length) {
      toast.error("Vui lòng thêm ảnh.");
      return;
    }
    if (sendMessage && contentType === "image" && images.length > 1) {
      toast.error("Chỉ chấp nhận 1 ảnh. Từ 2 ảnh trở lên vui lòng gửi dạng album.");
      return;
    }
    if (
      sendMessage &&
      (contentType === "video" || contentType === "album") &&
      !selectedMediaId
    ) {
      toast.error(
        contentType === "video" ? "Vui lòng chọn video." : "Vui lòng chọn album ảnh.",
      );
      return;
    }
    if (addFriend && !firstMessages.length) {
      toast.error("Thêm ít nhất một lời chào kết bạn.");
      return;
    }

    // status===1: BE chỉ nhận tin/media — không gửi nick/nhóm/TV/mode
    if (isRunningContentOnly && editingCampaign?.id) {
      try {
        await createOrEditCampaign({
          id_category: editingCampaign.id,
          type: contentType || null,
          contents,
          images: contentType === "image" ? images : [],
          id_video: contentType === "video" ? selectedMediaId : null,
          id_album: contentType === "album" ? selectedMediaId : null,
          first_messages: firstMessages,
        });
        toast.success("Đã cập nhật nội dung kịch bản đang chạy.");
        onClose();
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      }
      return;
    }

    if (!sendMessage && !addFriend) {
      toast.error("Chọn ít nhất một chức năng: Nhắn tin hoặc Kết bạn.");
      return;
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Vui lòng nhập tên kịch bản.");
      return;
    }
    if (!selectedAccountIds.length) {
      toast.error("Chọn ít nhất một tài khoản Zalo.");
      return;
    }
    if (!selectedGroupGlobalId) {
      toast.error("Chọn nhóm (cần globalId từ danh sách nhóm chung).");
      return;
    }
    if (!selectedMemberGlobalIds.length) {
      toast.error("Chọn ít nhất một thành viên.");
      return;
    }
    const delay = Number(delayTime);
    const count = Number(numberCount);
    if (!Number.isFinite(delay) || delay <= 0) {
      toast.error("Thời gian chờ không hợp lệ.");
      return;
    }
    if (!Number.isFinite(count) || count <= 0) {
      toast.error("Số lượt gửi không hợp lệ.");
      return;
    }

    if (assignMode === "all") {
      const volume = selectedAccountIds.length * selectedMemberGlobalIds.length;
      if (volume > 2000) {
        toast.info(
          `Mode "mọi nick × mọi TV" ≈ ${volume} lượt — số lượt lớn, hãy cân nhắc.`,
        );
      }
    }

    const payload = {
      id_category: editingCampaign?.id ?? null,
      name: trimmedName,
      type: contentType || null,
      contents,
      images: contentType === "image" ? images : [],
      id_video: contentType === "video" ? selectedMediaId : null,
      id_album: contentType === "album" ? selectedMediaId : null,
      delay_time: delay,
      number_count: count,
      id_accounts: selectedAccountIds,
      group_global_id: selectedGroupGlobalId,
      member_global_ids: selectedMemberGlobalIds,
      assign_mode: assignMode,
      add_friend: addFriend,
      send_message: sendMessage,
      split_attachment: splitAttachment,
      first_messages: firstMessages,
      from_time: formatTimeForApi(startTime),
      to_time: formatTimeForApi(endTime),
    };

    try {
      await createOrEditCampaign(payload);
      toast.success(editingCampaign ? "Đã cập nhật kịch bản." : "Đã tạo kịch bản.");
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const wizardSteps: CampaignWizardStep[] = useMemo(
    () => [
      {
        id: "config",
        title: "Cấu hình + tin",
        hint: "Tên, tốc độ, khung giờ, chế độ gán, nhắn tin / kết bạn và nội dung",
      },
      {
        id: "accounts",
        title: "Nick Zalo",
        hint: "Chọn một hoặc nhiều nick gửi tin / kết bạn",
      },
      {
        id: "groups",
        title: "Nhóm",
        hint: "Chọn nhóm chung (globalId) — quét nhóm nếu danh sách trống",
      },
      {
        id: "members",
        title: "Thành viên",
        hint: "Chọn thành viên mục tiêu — quét TV nếu danh sách trống",
      },
    ],
    [],
  );

  /** Validate từng bước wizard; content-only (đang chạy) bỏ qua ràng buộc nick/nhóm/TV. */
  const validateWizardStep = useCallback(
    (step: number): boolean => {
      if (step === 0) {
        if (!sendMessage && !addFriend) {
          toast.error("Chọn ít nhất một chức năng: Nhắn tin hoặc Kết bạn.");
          return false;
        }
        if (!targetsEditable) {
          // status===1: chỉ sửa tin/media — vẫn kiểm tra nội dung
        } else {
          const trimmedName = name.trim();
          if (!trimmedName) {
            toast.error("Vui lòng nhập tên kịch bản.");
            return false;
          }
          const delay = Number(delayTime);
          const count = Number(numberCount);
          if (!Number.isFinite(delay) || delay <= 0) {
            toast.error("Thời gian chờ không hợp lệ.");
            return false;
          }
          if (!Number.isFinite(count) || count <= 0) {
            toast.error("Số lượt gửi không hợp lệ.");
            return false;
          }
        }
        if (sendMessage && !contents.length && !contentType) {
          toast.error("Nhập nội dung hoặc chọn đính kèm.");
          return false;
        }
        if (sendMessage && contentType === "image" && !images.length) {
          toast.error("Vui lòng thêm ảnh.");
          return false;
        }
        if (sendMessage && contentType === "image" && images.length > 1) {
          toast.error(
            "Chỉ chấp nhận 1 ảnh. Từ 2 ảnh trở lên vui lòng gửi dạng album.",
          );
          return false;
        }
        if (
          sendMessage &&
          (contentType === "video" || contentType === "album") &&
          !selectedMediaId
        ) {
          toast.error(
            contentType === "video"
              ? "Vui lòng chọn video."
              : "Vui lòng chọn album ảnh.",
          );
          return false;
        }
        if (addFriend && !firstMessages.length) {
          toast.error("Thêm ít nhất một lời chào kết bạn.");
          return false;
        }
        return true;
      }
      if (!targetsEditable) return true;
      if (step === 1) {
        if (!selectedAccountIds.length) {
          toast.error("Chọn ít nhất một tài khoản Zalo.");
          return false;
        }
        return true;
      }
      if (step === 2) {
        if (!selectedGroupGlobalId) {
          toast.error("Chọn nhóm (cần globalId từ danh sách nhóm chung).");
          return false;
        }
        return true;
      }
      return true;
    },
    [
      sendMessage,
      addFriend,
      targetsEditable,
      name,
      delayTime,
      numberCount,
      contents.length,
      contentType,
      images.length,
      selectedMediaId,
      firstMessages.length,
      selectedAccountIds.length,
      selectedGroupGlobalId,
    ],
  );

  const modalTitle = editingCampaign
    ? readOnly
      ? "Xem kịch bản tương tác nhóm"
      : "Sửa kịch bản tương tác nhóm"
    : "Thêm kịch bản tương tác nhóm";

  const wizardListStyle = {
    maxHeight: CAMPAIGN_WIZARD_LIST_MAX_HEIGHT,
    height: CAMPAIGN_WIZARD_LIST_MAX_HEIGHT,
    WebkitOverflowScrolling: "touch" as const,
    overscrollBehavior: "contain" as const,
    touchAction: "pan-y" as const,
  };

  const runningBanner = !targetsEditable ? (
    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
      Kịch bản đang chạy — chỉ sửa nội dung / media. Nick, nhóm, TV và chế độ chia
      bị khóa.
    </p>
  ) : null;

  const configFields = (
    <div className="space-y-4">
      {runningBanner}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
          Tên kịch bản
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nhập tên kịch bản"
          disabled={saving}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Thời gian chờ (giây)
          </label>
          <Input
            type="number"
            value={delayTime}
            onChange={(e) => setDelayTime(e.target.value)}
            disabled={saving}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Số lượt / ngày
          </label>
          <Input
            type="number"
            value={numberCount}
            onChange={(e) => setNumberCount(e.target.value)}
            disabled={saving}
          />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-white/[0.02]">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Khung giờ chạy
        </span>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-theme-xs text-gray-500">Từ</span>
            <TimePicker value={startTime} onChange={setStartTime} disabled={saving} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-theme-xs text-gray-500">Đến</span>
            <TimePicker value={endTime} onChange={setEndTime} disabled={saving} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
        <p className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">
          Chế độ gán thành viên
        </p>
        <div className="space-y-2">
          <label
            className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 text-sm ${
              assignMode === "distribute"
                ? "border-brand-300 bg-brand-50/60 dark:border-brand-500/40 dark:bg-brand-500/10"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            <input
              type="radio"
              name="assign_mode"
              className="mt-1"
              checked={assignMode === "distribute"}
              disabled={!targetsEditable || saving}
              onChange={() => setAssignMode("distribute")}
            />
            <span>
              <span className="font-medium text-gray-800 dark:text-white/90">
                Chia thành viên cho các nick
              </span>
              <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
                Mỗi TV chỉ 1 nick xử lý; hệ thống chia cho nick còn hoạt động mỗi
                phiên.
              </span>
            </span>
          </label>
          <label
            className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 text-sm ${
              assignMode === "all"
                ? "border-brand-300 bg-brand-50/60 dark:border-brand-500/40 dark:bg-brand-500/10"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            <input
              type="radio"
              name="assign_mode"
              className="mt-1"
              checked={assignMode === "all"}
              disabled={!targetsEditable || saving}
              onChange={() => setAssignMode("all")}
            />
            <span>
              <span className="font-medium text-gray-800 dark:text-white/90">
                Mọi nick gửi tất cả thành viên
              </span>
              <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
                Mỗi nick lần lượt nhắn/kết bạn toàn bộ TV (số lượt ≈ nick × TV).
              </span>
            </span>
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <Checkbox checked={sendMessage} onChange={setSendMessage} disabled={saving} />
          Nhắn tin
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <Checkbox checked={addFriend} onChange={setAddFriend} disabled={saving} />
          Kết bạn
        </label>
      </div>

      {sendMessage ? (
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <p className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
            Nội dung tin nhắn
          </p>
          <SendMesFrContentEditor
            contents={contents}
            images={images}
            contentType={contentType}
            uploadingImage={uploadingImage}
            disabled={saving}
            showImages={false}
            onContentsChange={setContents}
            onImagesChange={setImages}
            onUploadImage={handleUploadImage}
          />
          <div className="mt-4">
            <CampaignAttachmentFields
              contentType={contentType}
              images={images}
              selectedMediaId={selectedMediaId}
              uploadingImage={uploadingImage}
              disabled={saving}
              resolveImageUrl={getSendMessMemberGrMediaUrl}
              onContentTypeChange={setContentType}
              onImagesChange={setImages}
              onSelectedMediaIdChange={setSelectedMediaId}
              onUploadImage={async (file) => {
                try {
                  return await handleUploadImage(file);
                } catch (error) {
                  toast.error(getApiErrorMessage(error));
                  return null;
                }
              }}
            />
          </div>
          {contentType ? (
            <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
              <Checkbox
                checked={splitAttachment}
                onChange={setSplitAttachment}
                disabled={saving}
              />
              <span>Tách tin nhắn và đính kèm</span>
            </label>
          ) : null}
        </div>
      ) : null}

      {addFriend ? (
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <SendMessMemberGrFirstMessageEditor
            contents={firstMessages}
            disabled={saving}
            onContentsChange={setFirstMessages}
          />
        </div>
      ) : null}
    </div>
  );

  const allAccountsSelected =
    activeAccounts.length > 0 &&
    activeAccounts.every((a) => selectedAccountIds.includes(a.id));

  const accountsPanel = (
    <div
      className={
        isWizard
          ? "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
          : "shrink-0"
      }
    >
      <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
          {isWizard ? "Chọn tài khoản Zalo" : "Tài khoản gửi tin"}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!targetsEditable || saving || !activeAccounts.length}
            onClick={toggleSelectAllAccounts}
            className="text-theme-xs font-medium text-brand-600 hover:underline disabled:opacity-50 dark:text-brand-400"
          >
            {allAccountsSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
          </button>
          {isWizard ? (
            <span className="text-theme-xs text-gray-500">
              {selectedAccountIds.length} đã chọn
            </span>
          ) : null}
        </div>
      </div>
      <div
        className={
          isWizard
            ? `${campaignFormWizardListScrollClass} space-y-1`
            : "custom-scrollbar flex gap-2 overflow-x-auto pb-0.5"
        }
        style={isWizard ? wizardListStyle : undefined}
      >
        {accountsLoading ? (
          <p className="px-2 py-3 text-sm text-gray-500">Đang tải...</p>
        ) : activeAccounts.length === 0 ? (
          <p className="px-2 py-3 text-sm text-gray-500">Không có tài khoản</p>
        ) : isWizard ? (
          activeAccounts.map((account) => {
            const active = selectedAccountIds.includes(account.id);
            return (
              <button
                key={account.id}
                type="button"
                disabled={!targetsEditable || saving}
                onClick={() => toggleAccount(account.id)}
                className={`flex w-full min-w-0 items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition active:bg-brand-50/80 ${
                  active
                    ? "border-brand-300 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10"
                    : "border-transparent hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <Checkbox
                  checked={active}
                  onChange={() => toggleAccount(account.id)}
                  disabled={!targetsEditable || saving}
                />
                <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  {account.avatar ? (
                    <Image
                      src={account.avatar}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <AvatarText
                      name={account.name || `#${account.id}`}
                      size="sm"
                      className="!h-9 !w-9"
                    />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-gray-800 dark:text-white/90">
                    {account.name || `#${account.id}`}
                  </span>
                  <span className="block truncate text-theme-xs text-gray-500">
                    {account.phone_number || "—"}
                  </span>
                </span>
              </button>
            );
          })
        ) : (
          activeAccounts.map((account) => {
            const active = selectedAccountIds.includes(account.id);
            return (
              <button
                key={account.id}
                type="button"
                disabled={!targetsEditable || saving}
                onClick={() => toggleAccount(account.id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-2.5 py-2 transition ${
                  active
                    ? "border-brand-300 bg-white shadow-theme-xs ring-2 ring-brand-500/15 dark:border-brand-500/40 dark:bg-gray-900"
                    : "border-gray-200 bg-white/80 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900/60"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  {account.avatar ? (
                    <Image
                      src={account.avatar}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <AvatarText
                      name={account.name || `#${account.id}`}
                      size="sm"
                      className="!h-9 !w-9"
                    />
                  )}
                </span>
                <span className="max-w-[120px] truncate text-left text-sm font-medium text-gray-800 dark:text-white/90">
                  {account.name || `#${account.id}`}
                </span>
                {active ? (
                  <span className="text-brand-600 dark:text-brand-400">✓</span>
                ) : null}
              </button>
            );
          })
        )}
      </div>
      {multiNick ? (
        <p className="mt-1.5 shrink-0 text-theme-xs text-gray-500 dark:text-gray-400">
          ≥2 nick: chỉ hiện nhóm mọi nick đều join (cùng globalId).
        </p>
      ) : null}
    </div>
  );

  const groupsListBody = !selectedAccountIds.length ? (
    <p className="px-3 py-6 text-center text-xs text-gray-500">
      Chọn tài khoản đang hoạt động để xem nhóm chung
    </p>
  ) : groupsLoading ? (
    <p className="px-3 py-6 text-center text-xs text-gray-500">Đang tải...</p>
  ) : groups.length === 0 ? (
    <p className="px-3 py-6 text-center text-xs text-gray-500">
      Không có nhóm chung / chưa sync global
    </p>
  ) : (
    <ul className="space-y-0.5">
      {groups.map((group) => {
        const globalId = group.globalId ?? "";
        const active = Boolean(globalId && selectedGroupGlobalId === globalId);
        return (
          <li key={globalId || `${group.id}-${group.name}`}>
            <button
              type="button"
              disabled={!targetsEditable || saving || !globalId}
              onClick={() => handleSelectGroup(group)}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition ${
                active
                  ? "bg-brand-50 dark:bg-brand-500/10"
                  : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"
              } disabled:opacity-50`}
            >
              <ContactAvatar
                name={group.name}
                avatar={groupAvatar(group)}
                size="sm"
              />
              <span className="min-w-0 flex-1 truncate text-gray-800 dark:text-white/90">
                {group.name}
              </span>
              {active ? (
                <span className="shrink-0 text-theme-xs font-semibold text-brand-600 dark:text-brand-400">
                  ✓
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );

  const groupsPanel = (
    <div
      className={
        isWizard
          ? campaignFormWizardSelectionPanelClass
          : "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]"
      }
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 px-3 py-2 dark:border-gray-800">
        <span className="flex size-6 items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
          <GroupIcon className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Nhóm chung
          </span>
          <p className="text-[11px] leading-tight text-gray-500">
            1 nhóm · all-group phân trang
          </p>
        </div>
        {selectedGroupGlobalId ? (
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-theme-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            Đã chọn
          </span>
        ) : null}
      </div>
      <div className="min-w-0 shrink-0 space-y-2 border-b border-gray-100 px-3 py-2 dark:border-gray-800">
        <div className="flex h-10 items-stretch gap-2">
          <div className="min-w-0 flex-1 [&>div]:h-full [&_input]:!h-full">
            <Input
              value={groupSearch}
              onChange={(e) => setGroupSearch(e.target.value)}
              placeholder="Tìm nhóm..."
              disabled={!selectedAccountIds.length || saving}
              className="!h-full !min-h-10 !px-3 !py-2 !text-sm"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-10 shrink-0 whitespace-nowrap !py-0 px-3 text-xs"
            disabled={!selectedAccountIds.length || scanningGroups || saving}
            onClick={() => void handleScanGroups()}
          >
            {scanningGroups ? "Đang quét..." : "Quét nhóm"}
          </Button>
        </div>
      </div>
      <div
        className={
          isWizard
            ? campaignFormWizardListScrollClass
            : "custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5"
        }
        style={isWizard ? wizardListStyle : undefined}
      >
        {groupsListBody}
      </div>
      {selectedAccountIds.length > 0 && groupTotal > 0 ? (
        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-gray-100 px-3 py-2 dark:border-gray-800">
          <span className="text-theme-xs text-gray-500">
            Trang {groupPage}/{groupTotalPages} — {groupTotal} nhóm
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={groupPage <= 1 || groupsLoading || saving}
              onClick={() => setGroupPage((p) => Math.max(1, p - 1))}
            >
              Trước
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={
                groupPage >= groupTotalPages || groupsLoading || saving
              }
              onClick={() =>
                setGroupPage((p) => Math.min(groupTotalPages, p + 1))
              }
            >
              Sau
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );

  const membersListBody = !selectedGroupGlobalId ? (
    <p className="px-3 py-6 text-center text-xs text-gray-500">
      Chọn nhóm để xem thành viên
    </p>
  ) : membersLoading ? (
    <p className="px-3 py-6 text-center text-xs text-gray-500">Đang tải...</p>
  ) : filteredMembers.length === 0 ? (
    <p className="px-3 py-6 text-center text-xs text-gray-500">
      Chưa có thành viên trong nhóm (thử Quét TV nếu danh sách trống).
    </p>
  ) : (
    <ul className="space-y-0.5">
      {pageMembers.map((member) => {
        const selected = selectedMemberGlobalIds.includes(member.member_global_id);
        return (
          <li key={member.member_global_id}>
            <button
              type="button"
              disabled={!targetsEditable || saving}
              onClick={() => toggleMember(member.member_global_id)}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition ${
                selected
                  ? "bg-brand-50 dark:bg-brand-500/10"
                  : "hover:bg-gray-50 dark:hover:bg-white/[0.04]"
              }`}
            >
              <ContactAvatar
                name={member.name}
                avatar={member.avatar}
                size="sm"
              />
              <span className="min-w-0 flex-1 truncate text-gray-800 dark:text-white/90">
                {member.name}
              </span>
              {member.is_creator ? (
                <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  Trưởng nhóm
                </span>
              ) : member.is_admin ? (
                <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                  Phó nhóm
                </span>
              ) : null}
              {selected ? (
                <span className="shrink-0 text-brand-600 dark:text-brand-400">✓</span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );

  const membersPanel = (
    <div
      className={
        isWizard
          ? campaignFormWizardSelectionPanelClass
          : "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]"
      }
    >
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-3 py-2 dark:border-gray-800">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <UserIcon className="size-3.5" />
          </span>
          <div className="min-w-0">
            <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
              Thành viên
            </span>
            <p className="text-[11px] leading-tight text-gray-500">
              Tick nhiều trang — giữ lựa chọn khi lật trang
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
          <button
            type="button"
            disabled={!targetsEditable || saving || !pageMembers.length}
            onClick={toggleAllPageMembers}
            className="text-theme-xs font-semibold text-brand-600 hover:underline disabled:opacity-50 dark:text-brand-400"
          >
            {allPageMembersSelected ? "Bỏ chọn trang" : "Chọn trang"}
          </button>
          <button
            type="button"
            disabled={!targetsEditable || saving || !filteredMembers.length}
            onClick={selectAllFilteredMembers}
            className="text-theme-xs font-semibold text-brand-600 hover:underline disabled:opacity-50 dark:text-brand-400"
          >
            {allFilteredMembersSelected ? "Đã chọn hết filter" : "Chọn tất cả"}
          </button>
          <button
            type="button"
            disabled={
              !targetsEditable || saving || selectedMemberGlobalIds.length === 0
            }
            onClick={clearAllSelectedMembers}
            className="text-theme-xs font-semibold text-error-600 hover:underline disabled:opacity-50 dark:text-error-400"
          >
            Bỏ chọn hết
          </button>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-theme-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            {selectedMemberGlobalIds.length} đã chọn
          </span>
        </div>
      </div>

      {!targetsEditable ? (
        <p className="shrink-0 border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          Kịch bản đang chạy — không thể thay đổi thành viên.
        </p>
      ) : null}

      <div className="shrink-0 border-b border-gray-100 px-3 py-2 dark:border-gray-800">
        <div className="flex h-10 items-stretch gap-2">
          <div className="min-w-0 flex-1 [&>div]:h-full [&_input]:!h-full">
            <Input
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Tìm thành viên..."
              disabled={!selectedGroupGlobalId || saving}
              className="!h-full !min-h-10 !px-3 !py-2 !text-sm"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-10 shrink-0 whitespace-nowrap !py-0 px-3 text-xs"
            disabled={
              !selectedAccountIds.length ||
              !selectedGroupGlobalId ||
              membersLoading ||
              scanningMembers ||
              saving
            }
            onClick={() => void handleScanMembers()}
          >
            {scanningMembers ? "Đang quét..." : "Quét TV"}
          </Button>
        </div>
      </div>

      <div
        className={
          isWizard
            ? campaignFormWizardListScrollClass
            : "custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5"
        }
        style={isWizard ? wizardListStyle : undefined}
      >
        {membersListBody}
      </div>

      {selectedGroupGlobalId && filteredMembers.length > 0 ? (
        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-gray-100 px-3 py-2 dark:border-gray-800">
          <span className="text-theme-xs text-gray-500">
            Trang {Math.min(memberPage, memberTotalPages)}/{memberTotalPages} —{" "}
            {filteredMembers.length} TV
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={memberPage <= 1 || membersLoading || saving}
              onClick={() => setMemberPage((p) => Math.max(1, p - 1))}
            >
              Trước
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={
                memberPage >= memberTotalPages || membersLoading || saving
              }
              onClick={() =>
                setMemberPage((p) => Math.min(memberTotalPages, p + 1))
              }
            >
              Sau
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );

  const wizardBody =
    wizardStep === 0
      ? configFields
      : wizardStep === 1
        ? accountsPanel
        : wizardStep === 2
          ? groupsPanel
          : membersPanel;

  /** Step list (1 nick / 2 nhóm / 3 TV): flex overflow-hidden + height tường minh. */
  const isWizardListStep = wizardStep >= 1;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      className={
        isWizard
          ? campaignFormModalPanelClassWizard
          : campaignFormModalPanelClass.xl
      }
      showCloseButton
    >
      <div className={campaignFormBodyClass}>
        {isWizard ? (
          <>
            <div className="mb-1 min-w-0 max-w-full shrink-0 pr-9">
              <h3 className="text-sm font-semibold leading-snug break-words text-gray-900 dark:text-white">
                {modalTitle}
              </h3>
            </div>
            <CampaignFormWizardHeader
              steps={wizardSteps}
              current={wizardStep}
              onJump={(index) => {
                if (index < wizardStep) setWizardStep(index);
              }}
            />
            <div
              className={
                isWizardListStep
                  ? "flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-hidden"
                  : "custom-scrollbar min-h-0 min-w-0 max-w-full flex-1 overflow-y-auto overscroll-contain"
              }
              style={
                isWizardListStep
                  ? undefined
                  : { WebkitOverflowScrolling: "touch", touchAction: "pan-y" }
              }
            >
              <fieldset
                disabled={readOnly}
                className={
                  isWizardListStep
                    ? "flex min-h-0 min-w-0 flex-1 flex-col border-0 p-0"
                    : "min-w-0 border-0 p-0"
                }
              >
                {wizardBody}
              </fieldset>
            </div>
            <div className="relative z-10 shrink-0 border-t border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
              <CampaignFormWizardFooter
                current={wizardStep}
                total={wizardSteps.length}
                onBack={goBack}
                onNext={() => {
                  if (!validateWizardStep(wizardStep)) return;
                  goNext(wizardSteps.length - 1);
                }}
                onCancel={onClose}
                onSubmit={() => void handleSave()}
                saving={saving}
                readOnly={readOnly}
              />
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 shrink-0 pr-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {modalTitle}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Multi-nick: chọn nick → nhóm chung (globalId) → thành viên → chế độ
                chia
              </p>
            </div>

            <div className={campaignFormMainClass}>
              <fieldset disabled={readOnly} className="contents">
                <div className="grid gap-4 max-lg:grid-cols-1 max-lg:auto-rows-auto lg:h-full lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:grid-rows-1 lg:overflow-hidden">
                  <div className={campaignFormScrollPaneClass}>
                    {configFields}
                  </div>

                  <div
                    className={`${campaignFormSidePaneClass} gap-3 rounded-2xl border border-gray-200 bg-gray-50/40 p-3 dark:border-gray-800 dark:bg-white/[0.02]`}
                  >
                    {accountsPanel}
                    <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
                      {groupsPanel}
                      {membersPanel}
                    </div>
                  </div>
                </div>
              </fieldset>
            </div>

            <div className="mt-4 flex shrink-0 justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
              {readOnly ? (
                <Button variant="outline" onClick={onClose}>
                  Đóng
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={onClose} disabled={saving}>
                    Hủy
                  </Button>
                  <Button onClick={() => void handleSave()} disabled={saving}>
                    {saving ? "Đang lưu..." : "Lưu kịch bản"}
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
