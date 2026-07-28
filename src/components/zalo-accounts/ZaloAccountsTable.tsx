"use client";

import Checkbox from "@/components/form/input/Checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ZaloAccount } from "@/types/zalo-account";
import { memo, useCallback, useMemo } from "react";
import ZaloAccountTableRow from "./ZaloAccountTableRow";

interface ZaloAccountsTableProps {
  canManageNick?: boolean;
  accounts: ZaloAccount[];
  selectedIds: number[];
  checkingIds: number[];
  loadingToggleMessageId: number | null;
  loadingToggleChatbotId: number | null;
  loadingToggleChatbotReactionId: number | null;
  showSensitiveInfo: boolean;
  isLoading: boolean;
  onToggleAll: () => void;
  onToggleOne: (id: number) => void;
  onToggleMessage: (accountId: number, checked: boolean) => void;
  onToggleChatbot: (accountId: number, checked: boolean) => void;
  onToggleChatbotReaction: (accountId: number, checked: boolean) => void;
  onEdit: (account: ZaloAccount) => void;
  onRelogin: (account: ZaloAccount) => void;
  onDelete: (account: ZaloAccount) => void;
}

const headerClass =
  "px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400";

function ZaloAccountsTable({
  canManageNick = true,
  accounts,
  selectedIds,
  checkingIds,
  loadingToggleMessageId,
  loadingToggleChatbotId,
  loadingToggleChatbotReactionId,
  showSensitiveInfo,
  isLoading,
  onToggleAll,
  onToggleOne,
  onToggleMessage,
  onToggleChatbot,
  onToggleChatbotReaction,
  onEdit,
  onRelogin,
  onDelete,
}: ZaloAccountsTableProps) {
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const checkingIdSet = useMemo(() => new Set(checkingIds), [checkingIds]);

  const allSelected =
    accounts.length > 0 && accounts.every((a) => selectedIdSet.has(a.id));

  const handleToggleMessage = useCallback(
    (accountId: number, checked: boolean) => {
      onToggleMessage(accountId, checked);
    },
    [onToggleMessage],
  );

  const handleToggleChatbot = useCallback(
    (accountId: number, checked: boolean) => {
      onToggleChatbot(accountId, checked);
    },
    [onToggleChatbot],
  );

  const handleToggleChatbotReaction = useCallback(
    (accountId: number, checked: boolean) => {
      onToggleChatbotReaction(accountId, checked);
    },
    [onToggleChatbotReaction],
  );

  if (isLoading) {
    return (
      <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
        Đang tải danh sách tài khoản...
      </p>
    );
  }

  if (accounts.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
        {canManageNick
          ? "Chưa có tài khoản Zalo. Bấm \"Thêm tài khoản\" để bắt đầu."
          : "Chưa có nick Zalo được gán. Liên hệ manager để được gán nick."}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1200px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className={headerClass}>
                  <Checkbox checked={allSelected} onChange={() => onToggleAll()} />
                </TableCell>
                <TableCell isHeader className={headerClass}>
                  STT
                </TableCell>
                <TableCell isHeader className={headerClass}>
                  Tên tài khoản
                </TableCell>
                <TableCell isHeader className={headerClass}>
                  Số điện thoại
                </TableCell>
                <TableCell isHeader className={headerClass}>
                  Proxy
                </TableCell>
                <TableCell isHeader className={headerClass}>
                  Ghi chú
                </TableCell>
                <TableCell isHeader className={headerClass}>
                  Trạng thái tài khoản
                </TableCell>
                <TableCell isHeader className={headerClass}>
                  Trạng thái proxy
                </TableCell>
                <TableCell isHeader className={headerClass}>
                  Tin nhắn
                </TableCell>
                <TableCell isHeader className={headerClass}>
                  Chatbot
                </TableCell>
                <TableCell isHeader className={headerClass}>
                  Thả tim
                </TableCell>
                <TableCell isHeader className={`${headerClass} text-end`}>
                  Tuỳ chọn
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {accounts.map((account, index) => (
                <ZaloAccountTableRow
                  key={account.id}
                  canManageNick={canManageNick}
                  account={account}
                  index={index}
                  isSelected={selectedIdSet.has(account.id)}
                  isChecking={checkingIdSet.has(account.id)}
                  isMessageLoading={loadingToggleMessageId === account.id}
                  isChatbotLoading={loadingToggleChatbotId === account.id}
                  isChatbotReactionLoading={
                    loadingToggleChatbotReactionId === account.id
                  }
                  showSensitiveInfo={showSensitiveInfo}
                  onToggleSelect={onToggleOne}
                  onToggleMessage={handleToggleMessage}
                  onToggleChatbot={handleToggleChatbot}
                  onToggleChatbotReaction={handleToggleChatbotReaction}
                  onEdit={onEdit}
                  onRelogin={onRelogin}
                  onDelete={onDelete}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

export default memo(ZaloAccountsTable);