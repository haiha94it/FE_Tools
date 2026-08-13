/** Profile từ GET /api/users/me */
export interface ApiUserProfile {
  id: number | string;
  username: string;
  fullname?: string;
  full_name?: string;
  mail?: string;
  phone_number?: string;
  is_admin?: boolean;
  is_superuser?: boolean;
  is_premium?: boolean;
  is_staff?: boolean;
  is_locked?: boolean;
  is_active?: boolean;
  created_at?: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  name: string;
  phone?: string;
  isAdmin?: boolean;
  isPremium?: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export type LoginResponse = AuthTokens;
