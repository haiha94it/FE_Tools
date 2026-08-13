"use client";

import AppToaster from "@/components/common/AppToaster";
import { StoreHydration } from "@/components/providers/store-hydration";
import { ConfirmProvider } from "@/components/providers/confirm-provider";
import { TooltipProvider } from "@/components/ui/tooltip/Tooltip";

/** Provider gốc — hydrate auth + toast + tooltip */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={150}>
      <ConfirmProvider>
        <StoreHydration />
        {children}
        <AppToaster />
      </ConfirmProvider>
    </TooltipProvider>
  );
}
