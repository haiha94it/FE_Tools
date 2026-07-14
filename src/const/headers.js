"use client";

import { getAccessToken } from "@/lib/axios";

export const useHeaders = () => {
  const token = getAccessToken();
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  };
};