import { API_TEAM } from "@/config/api";
import api from "@/lib/axios";
import { unwrapApiBody } from "@/lib/api-response";
import { extractZaloAccounts } from "@/lib/zalo-account-utils";
import type {
  CampaignPermissionsMap,
  CampaignTypeKey,
  EmployeeAccountAssignmentsResponse,
  EmployeeCampaignPermissionsResponse,
  MyCampaignPermissionsResponse,
  SetAccountAssignmentsBody,
  SetCampaignPermissionsBody,
  TeamEmployee,
} from "@/types/team-collaboration";
import type { ZaloAccount } from "@/types/zalo-account";

const ALL_CAMPAIGN_KEYS: CampaignTypeKey[] = [
  "add_friend",
  "join_group",
  "invite_group",
  "invite_phone_group",
  "mess_friend",
  "mess_group",
  "mess_member_group",
  "mess_phone",
  "mess_birthday",
  "spam_link_group",
  "auto_inbox",
];

export function createFullPermissionsMap(
  source?: Partial<Record<CampaignTypeKey, boolean>>,
  defaultValue = false,
): CampaignPermissionsMap {
  return ALL_CAMPAIGN_KEYS.reduce((acc, key) => {
    acc[key] = source?.[key] ?? defaultValue;
    return acc;
  }, {} as CampaignPermissionsMap);
}

export const teamPermissionsService = {
  async listEmployees(): Promise<TeamEmployee[]> {
    const response = await api.get(API_TEAM.GET_EMPLOYEES);
    const body = unwrapApiBody<TeamEmployee[] | { results?: TeamEmployee[] }>(
      response.data,
    );
    if (Array.isArray(body)) return body;
    return body.results ?? [];
  },

  async getEmployeeAccountAssignments(
    employeeId: number,
  ): Promise<EmployeeAccountAssignmentsResponse> {
    const response = await api.get(API_TEAM.EMPLOYEE_ACCOUNT_ASSIGNMENTS, {
      params: { employee_id: employeeId },
    });
    return unwrapApiBody<EmployeeAccountAssignmentsResponse>(response.data);
  },

  async setEmployeeAccountAssignments(
    payload: SetAccountAssignmentsBody,
  ): Promise<EmployeeAccountAssignmentsResponse> {
    const response = await api.post(
      API_TEAM.EMPLOYEE_ACCOUNT_ASSIGNMENTS_SET,
      payload,
    );
    return unwrapApiBody<EmployeeAccountAssignmentsResponse>(response.data);
  },

  async getMyAccountAssignments(): Promise<ZaloAccount[]> {
    const response = await api.get(API_TEAM.MY_ACCOUNT_ASSIGNMENTS);
    const body = response.data;
    return extractZaloAccounts(body);
  },

  async getEmployeeCampaignPermissions(
    employeeId: number,
  ): Promise<EmployeeCampaignPermissionsResponse> {
    const response = await api.get(API_TEAM.EMPLOYEE_CAMPAIGN_PERMISSIONS, {
      params: { employee_id: employeeId },
    });
    const data = unwrapApiBody<EmployeeCampaignPermissionsResponse>(response.data);
    return {
      ...data,
      permissions: createFullPermissionsMap(data.permissions),
    };
  },

  async setEmployeeCampaignPermissions(
    payload: SetCampaignPermissionsBody,
  ): Promise<EmployeeCampaignPermissionsResponse> {
    const response = await api.post(
      API_TEAM.EMPLOYEE_CAMPAIGN_PERMISSIONS_SET,
      payload,
    );
    const data = unwrapApiBody<EmployeeCampaignPermissionsResponse>(response.data);
    return {
      ...data,
      permissions: createFullPermissionsMap(data.permissions),
    };
  },

  async getMyCampaignPermissions(): Promise<CampaignPermissionsMap> {
    const response = await api.get(API_TEAM.MY_CAMPAIGN_PERMISSIONS);
    const data = unwrapApiBody<MyCampaignPermissionsResponse>(response.data);
    return createFullPermissionsMap(data.permissions);
  },
};