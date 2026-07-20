import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "flatpickr/dist/flatpickr.css";
import { AppProviders } from "@/components/providers/app-providers";
import { createRootMetadata } from "@/lib/seo/metadata";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = createRootMetadata();

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-plus-jakarta",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${plusJakarta.variable} ${plusJakarta.className} antialiased dark:bg-gray-900`}
      >
        <ThemeProvider>
          <SidebarProvider>
            <AppProviders>{children}</AppProviders>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
