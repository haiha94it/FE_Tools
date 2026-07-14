import TeamEmployeesView from "@/components/team/TeamEmployeesView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý nhân viên | Zalo Admin",
  description: "Gán nick Zalo và phân quyền chiến dịch cho nhân viên",
};

export default function TeamEmployeesPage() {
  return <TeamEmployeesView />;
}