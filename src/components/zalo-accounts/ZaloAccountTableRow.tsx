"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Switch from "@/components/form/switch/Switch";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  getProxyDisplay,
  getZaloAccountStatus,
  getZaloProxyStatus,
  isZaloChatbotEnabled,
  isZaloChatbotReactionEnabled,
  isZaloMessageEnabled,
  maskPhone,
} from "@/lib/zalo-account-utils";
import type { ZaloAccount } from "@/types/zalo-account";
import Image from "next/image";
import { memo } from "react";

const cellClass =
  "px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400";

export interface ZaloAccountTableRowProps {
  canManageNick?: boolean;
  account: ZaloAccount;
  index: number;
  isSelected: boolean;
  isChecking: boolean;
  isMessageLoading: boolean;
  isChatbotLoading: boolean;
  isChatbotReactionLoading: boolean;
  showSensitiveInfo: boolean;
  onToggleSelect: (id: number) => void;
  onToggleMessage: (accountId: number, checked: boolean) => void;
  onToggleChatbot: (accountId: number, checked: boolean) => void;
  onToggleChatbotReaction: (accountId: number, checked: boolean) => void;
  onEdit: (account: ZaloAccount) => void;
  onRelogin: (account: ZaloAccount) => void;
  onDelete: (account: ZaloAccount) => void;
}

function ZaloAccountTableRow({
  canManageNick = true,
  account,
  index,
  isSelected,
  isChecking,
  isMessageLoading,
  isChatbotLoading,
  isChatbotReactionLoading,
  showSensitiveInfo,
  onToggleSelect,
  onToggleMessage,
  onToggleChatbot,
  onToggleChatbotReaction,
  onEdit,
  onRelogin,
  onDelete,
}: ZaloAccountTableRowProps) {
  const status = isChecking
    ? { label: "Đang kiểm tra", color: "warning" as const }
    : getZaloAccountStatus(account, []);
  const proxyStatus = getZaloProxyStatus(account);
  const displayName = account.name || "Chưa có tên";
  const needsRelogin = account.checkpoint !== false;
  const messageEnabled = isZaloMessageEnabled(account);
  const chatbotEnabled = isZaloChatbotEnabled(account);
  const reactionEnabled = isZaloChatbotReactionEnabled(account);
  const isCheckpoint = account.checkpoint === true;

  return (
    <TableRow>
      <TableCell className="px-5 py-4 sm:px-6">
        <Checkbox
          checked={isSelected}
          onChange={() => onToggleSelect(account.id)}
        />
      </TableCell>
      <TableCell className={cellClass}>{index + 1}</TableCell>
      <TableCell className="px-5 py-4 sm:px-6 text-start">
        <div className="flex items-center gap-3">
          {account.avatar ? (
            <div className="h-10 w-10 overflow-hidden rounded-full">
              <Image
                width={40}
                height={40}
                src={account.avatar}
                alt={displayName}
                className="h-full w-full object-cover"
                unoptimized
              />
            </div>
          ) : (
            <AvatarText name={displayName} />
          )}
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {displayName}
          </span>
        </div>
      </TableCell>
      <TableCell className={cellClass}>
        {maskPhone(account.phone_number, showSensitiveInfo)}
      </TableCell>
      <TableCell className={cellClass}>
        <span className="block max-w-[220px] truncate">
          {getProxyDisplay(account.proxy, !showSensitiveInfo)}
        </span>
      </TableCell>
      <TableCell className={cellClass}>{account.note || "—"}</TableCell>
      <TableCell className={cellClass}>
        <Badge size="sm" color={status.color}>
          {status.label}
        </Badge>
      </TableCell>
      <TableCell className={cellClass}>
        <Badge size="sm" color={proxyStatus.color}>
          {proxyStatus.label}
        </Badge>
      </TableCell>
      <TableCell className={cellClass}>
        {canManageNick ? (
          <Switch
            key={`msg-${account.id}-${messageEnabled}`}
            checked={messageEnabled}
            disabled={isCheckpoint || isMessageLoading || isChatbotLoading}
            onChange={(checked) => onToggleMessage(account.id, checked)}
          />
        ) : (
          <Badge size="sm" color={messageEnabled ? "success" : "light"}>
            {messageEnabled ? "Bật" : "Tắt"}
          </Badge>
        )}
      </TableCell>
      <TableCell className={cellClass}>
        {canManageNick ? (
          <Switch
            key={`bot-${account.id}-${chatbotEnabled}`}
            checked={chatbotEnabled}
            disabled={isCheckpoint || isChatbotLoading}
            onChange={(checked) => onToggleChatbot(account.id, checked)}
          />
        ) : (
          <Badge size="sm" color={chatbotEnabled ? "success" : "light"}>
            {chatbotEnabled ? "Bật" : "Tắt"}
          </Badge>
        )}
      </TableCell>
      <TableCell className={cellClass}>
        {canManageNick ? (
          <Switch
            key={`react-${account.id}-${reactionEnabled}`}
            checked={reactionEnabled}
            disabled={
              isCheckpoint ||
              !chatbotEnabled ||
              isChatbotLoading ||
              isChatbotReactionLoading
            }
            onChange={(checked) => onToggleChatbotReaction(account.id, checked)}
          />
        ) : (
          <Badge size="sm" color={reactionEnabled && chatbotEnabled ? "success" : "light"}>
            {reactionEnabled && chatbotEnabled ? "Bật" : "Tắt"}
          </Badge>
        )}
      </TableCell>
      <TableCell className="px-4 py-3 text-end">
        {canManageNick ? (
        <div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit(account)}>
            Sửa
          </Button>
          {needsRelogin && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRelogin(account)}
            >
              Đăng nhập lại
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="!text-error-600 !ring-error-200 hover:!bg-error-50"
            onClick={() => onDelete(account)}
          >
            Xóa
          </Button>
        </div>
        ) : (
          <span className="text-xs text-gray-400">Chỉ xem</span>
        )}
      </TableCell>
    </TableRow>
  );
}

export default memo(ZaloAccountTableRow);