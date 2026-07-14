import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import "flatpickr/dist/flatpickr.css";
import { AppProviders } from "@/components/providers/app-providers";
import { createRootMetadata } from "@/lib/seo/metadata";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = createRootMetadata();

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <SidebarProvider>
            <AppProviders>{children}</AppProviders>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}