import { APP_NAME } from "@/constants/brand";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Điều khoản — {APP_NAME}</h1>
      <p className="mt-4 text-gray-600">
        Nội dung điều khoản sẽ được cập nhật. Sử dụng tool công khai miễn phí;
        khu vực quản trị yêu cầu tài khoản do admin cấp.
      </p>
      <Link href="/" className="mt-6 inline-block text-brand-500">
        Về trang chủ
      </Link>
    </div>
  );
}
