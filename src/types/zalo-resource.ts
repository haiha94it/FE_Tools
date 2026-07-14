export interface ZaloResourceItem {
  id: number;
  content: string;
  link: string;
}

export interface ZaloProductAppItem {
  id: number;
  title: string;
  content: string;
  link: string;
  image: string;
}

export interface ZaloResourceFormPayload {
  id: number | null;
  content: string;
  link: string;
}

export interface ZaloProductAppFormPayload {
  id: number | null;
  title: string;
  content: string;
  link: string;
  image: string;
}