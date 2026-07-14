import axios from "axios";
import { API_BASE_URL } from "@/config/api";
import { normalizeApiResponse } from "@/lib/api-response";

/** Axios không gắn JWT — dùng storefront công khai (GET/POST cart, order) */
const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

publicApi.interceptors.response.use((response) => normalizeApiResponse(response));

export default publicApi;