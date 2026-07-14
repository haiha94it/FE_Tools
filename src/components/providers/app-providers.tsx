"use client";

import AppToaster from "@/components/common/AppToaster";
import { StoreHydration } from "@/components/providers/store-hydration";
import { WebSocketBridge } from "@/components/providers/websocket-bridge";
import { ConfirmProvider } from "@/components/providers/confirm-provider";
import { TooltipProvider } from "@/components/ui/tooltip/Tooltip";
import dynamic from "next/dynamic";

const GlobalMessengerNotificationListener = dynamic(
  () => import("@/components/zalo-messages/GlobalMessengerNotificationListener"),
  { ssr: false },
);

/** Provider gốc — hydrate Zustand stores + toast + tooltip global */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={150}>
      <ConfirmProvider>
        <StoreHydration />
        <WebSocketBridge />
        <GlobalMessengerNotificationListener />
        {children}
        <AppToaster />
      </ConfirmProvider>
    </TooltipProvider>
  );
}