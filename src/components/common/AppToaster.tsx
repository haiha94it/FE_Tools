"use client";

import { useTheme } from "@/context/ThemeContext";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Toaster } from "sonner";

export default function AppToaster() {
  const { theme } = useTheme();
  const isMobile = useMediaQuery("(max-width: 639px)");

  return (
    <Toaster
      theme={theme}
      position={isMobile ? "top-center" : "top-right"}
      richColors
      closeButton
      offset={isMobile ? undefined : { top: "4.5rem", right: "1rem" }}
      mobileOffset={{ top: "4rem", left: "1rem", right: "1rem" }}
      toastOptions={{
        classNames: {
          toast:
            "rounded-xl border border-gray-200 bg-white text-gray-800 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 !w-[calc(100vw-2rem)] sm:!w-auto sm:!max-w-sm",
          title: "text-sm font-medium",
          description: "text-sm text-gray-500 dark:text-gray-400",
        },
      }}
    />
  );
}