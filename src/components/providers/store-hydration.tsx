"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/use-auth-store";

/** Hydrate Zustand persist store sau mount — tránh SSR mismatch */
export function StoreHydration() {
  useEffect(() => {
    useAuthStore.persist.onFinishHydration(() => {
      void useAuthStore.getState().bootstrap();
    });
    useAuthStore.persist.rehydrate();
  }, []);

  return null;
}