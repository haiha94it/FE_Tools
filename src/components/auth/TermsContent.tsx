"use client";

import { popupService } from "@/services/popup.service";
import { useEffect, useState } from "react";

export default function TermsContent() {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    popupService
      .getDecree()
      .then((decree) => {
        setContent(decree?.content?.replace(/&nbsp;/g, " ") ?? null);
      })
      .catch(() => setContent(null))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!content) {
    return (
      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Không tải được nội dung điều khoản. Vui lòng thử lại sau.
      </p>
    );
  }

  return (
    <div
      className="prose prose-sm max-w-none text-gray-700 dark:prose-invert dark:text-gray-300"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}