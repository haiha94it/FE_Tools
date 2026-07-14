import api from "@/lib/axios";

/** SWR fetcher — tương thích ZaloCN `lib/fetcher` */
export const fetcher = (url: string) =>
  api.get(url).then((res) => res.data);

export default api;