/**
 * Item từ POST /api/campaign/all-group/
 * Gộp nhóm theo globalId (intersection multi-nick).
 */
export interface CampaignCommonGroupItem {
  id?: number;
  uid?: string;
  name: string;
  avt?: string;
  avatar?: string;
  total_member?: number;
  link_group?: string;
  is_joined?: boolean;
  is_blocked_chat?: boolean;
  /** Identity multi-nick — mess-member lưu vào group_global_id */
  globalId?: string;
}
