/** Popup thông báo — GET /api/popup/alert/get */
export interface PopupAlertItem {
  id: number;
  link?: string;
  image?: string;
  active?: boolean;
}

export interface PopupContentItem {
  id?: number;
  content?: string;
  link?: string;
  image?: string;
  active?: boolean;
}

export interface PopupLogoItem {
  link?: string;
  image?: string;
}

export interface SavePopupAlertPayload {
  id?: number | null;
  link?: string;
  image: string;
  active: boolean;
}

export interface SaveRegisterPopupPayload {
  id?: number | null;
  content?: string;
  image: string;
}

export interface SaveExpirationPopupPayload {
  content?: string;
  link?: string;
  image: string;
}

export interface SaveHtmlPopupPayload {
  content: string;
  active: boolean;
  image?: string;
}

export interface SaveCommunityPopupPayload {
  content: string;
  link: string;
  active: boolean;
  type?: string;
}

export interface SaveLogoPayload {
  link: string;
}

export type AdminSettingsTabKey =
  | "alert"
  | "community"
  | "expiration"
  | "logo"
  | "register"
  | "first-login"
  | "decree";