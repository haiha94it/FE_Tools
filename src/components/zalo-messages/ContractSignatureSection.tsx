"use client";

import { memo } from "react";
import SignaturePad from "./SignaturePad";

interface ContractSignatureSectionProps {
  disabled?: boolean;
  onSignatureChange: (hasSignature: boolean, dataUrl: string | null) => void;
}

function ContractSignatureSection({
  disabled = false,
  onSignatureChange,
}: ContractSignatureSectionProps) {
  return (
    <div className="rounded-xl border-2 border-brand-200 bg-brand-50/40 p-4 dark:border-brand-500/30 dark:bg-brand-500/5">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">
        Chữ ký người sử dụng phần mềm
      </p>
      <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        Cuộn tới trang cuối (Bên A / Bên B) trong PDF. Bạn ký bên dưới — hệ thống ghép
        chữ ký vào ô nét đứt phía Bên B.
      </p>
      <div className="mt-3">
        <SignaturePad onChange={onSignatureChange} disabled={disabled} />
      </div>
    </div>
  );
}

export default memo(ContractSignatureSection);