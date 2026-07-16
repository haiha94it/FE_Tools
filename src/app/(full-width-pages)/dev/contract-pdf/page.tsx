import ContractPdfTestView from "@/components/dev/contract-pdf-test";
import { pageTitle } from "@/constants/brand";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: pageTitle("Test hợp đồng PDF"),
  description: "Trang test ký và tải hợp đồng PDF — không cần đăng nhập.",
};

export default function ContractPdfTestPage() {
  return <ContractPdfTestView />;
}