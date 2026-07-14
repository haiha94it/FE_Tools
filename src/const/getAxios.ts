"use client";

import api from "@/lib/axios";
import { getAccessToken } from "@/lib/axios";

export const getAxios = async (
  url: string,
  setData: (data: unknown) => void,
): Promise<void> => {
  const token = getAccessToken();
  try {
    const res = await api.get(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    setData(res.data);
  } catch {
    setData(null);
  }
};