import AdminShell from "@/layout/AdminShell";
import { ADMIN_ROBOTS } from "@/lib/seo/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: ADMIN_ROBOTS,
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}