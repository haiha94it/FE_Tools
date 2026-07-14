import "axios";

declare module "axios" {
  export interface AxiosResponse<T = unknown> {
    /** Message từ envelope { success, message, data } */
    apiMessage?: string;
  }

  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}