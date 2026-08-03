/** Cờ setting nhóm Zalo — đồng bộ Care SettingGroups / ZGroup setting/update */
export type ZaloGroupSettingKey =
  | "blockName"
  | "signAdminMsg"
  | "addMemberOnly"
  | "setTopicOnly"
  | "enableMsgHistory"
  | "lockCreatePost"
  | "lockCreatePoll"
  | "joinAppr"
  | "bannFeature"
  | "dirtyMedia"
  | "banDuration"
  | "lockSendMsg"
  | "lockViewMember";

export interface ZaloGroupSettingPayload {
  blockName?: number;
  signAdminMsg?: number;
  addMemberOnly?: number;
  setTopicOnly?: number;
  enableMsgHistory?: number;
  lockCreatePost?: number;
  lockCreatePoll?: number;
  joinAppr?: number;
  bannFeature?: number;
  dirtyMedia?: number;
  banDuration?: number;
  lockSendMsg?: number;
  lockViewMember?: number;
  blocked_members?: unknown[];
  /** Zalo group uid — bắt buộc khi change-group-setting */
  grid?: string;
  imei?: string;
}

export interface GroupSettingToggleDef {
  key: ZaloGroupSettingKey;
  title: string;
  desc: string;
}

/** UI toggle — giống Care SettingGroups.jsx (screenshot) */
export const GROUP_SETTING_TOGGLES: GroupSettingToggleDef[] = [
  {
    key: "blockName",
    title: "Thay đổi tên & ảnh đại diện",
    desc: "Cho phép thành viên thay đổi tên và hình ảnh hiển thị của nhóm.",
  },
  {
    key: "signAdminMsg",
    title: "Đánh dấu tin nhắn từ Admin",
    desc: "Hiển thị nhãn trưởng/phó nhóm trên tin nhắn của ban quản trị.",
  },
  {
    key: "setTopicOnly",
    title: "Ghim tin nhắn & bình chọn",
    desc: "Cho phép ghim tin nhắn, ghi chú, bình chọn lên đầu hội thoại.",
  },
  {
    key: "enableMsgHistory",
    title: "Đọc tin nhắn gần nhất",
    desc: "Cho phép thành viên mới gia nhập đọc các tin nhắn cũ gần nhất.",
  },
  {
    key: "lockCreatePost",
    title: "Tạo mới ghi chú, nhắc hẹn",
    desc: "Cho phép thành viên tạo các thông báo và nhắc hẹn nhóm.",
  },
  {
    key: "lockCreatePoll",
    title: "Tạo mới bình chọn",
    desc: "Cho phép thành viên tạo bình chọn (Poll) trong nhóm.",
  },
  {
    key: "joinAppr",
    title: "Phê duyệt thành viên mới",
    desc: "Yêu cầu trưởng/phó nhóm duyệt khi có người mới muốn tham gia.",
  },
  {
    key: "lockSendMsg",
    title: "Cho phép gửi tin nhắn",
    desc: "Quyền gửi tin nhắn của các thành viên trong nhóm.",
  },
];

export function emptyGroupSetting(grid = ""): ZaloGroupSettingPayload {
  return {
    blockName: 0,
    signAdminMsg: 0,
    addMemberOnly: 0,
    setTopicOnly: 0,
    enableMsgHistory: 0,
    lockCreatePost: 0,
    lockCreatePoll: 0,
    joinAppr: 0,
    bannFeature: 0,
    dirtyMedia: 0,
    banDuration: 0,
    lockSendMsg: 0,
    lockViewMember: 0,
    blocked_members: [],
    grid,
    imei: "",
  };
}

export function mergeGroupSetting(
  base: ZaloGroupSettingPayload,
  incoming?: Partial<ZaloGroupSettingPayload> | null,
  grid?: string,
): ZaloGroupSettingPayload {
  const next = { ...base, ...(incoming ?? {}) };
  if (grid) next.grid = grid;
  // Chuẩn 0/1
  for (const key of Object.keys(next) as (keyof ZaloGroupSettingPayload)[]) {
    if (
      key === "grid" ||
      key === "imei" ||
      key === "blocked_members" ||
      key === "banDuration"
    ) {
      continue;
    }
    const v = next[key];
    if (typeof v === "number") continue;
    if (v === true) (next as Record<string, unknown>)[key] = 1;
    else if (v === false || v == null) (next as Record<string, unknown>)[key] = 0;
  }
  return next;
}
