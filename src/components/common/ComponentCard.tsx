import React from "react";

interface ComponentCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  desc?: string;
  /** Ẩn mô tả trên mobile để dành chỗ cho bảng */
  hideDescOnMobile?: boolean;
  /** Card lấp phần còn lại viewport — dùng với adminDataPageClass */
  fill?: boolean;
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  children,
  className = "",
  desc = "",
  hideDescOnMobile = false,
  fill = false,
}) => {
  const hasHeader = Boolean(title || desc);

  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${
        fill ? "flex h-0 min-h-0 flex-1 flex-col overflow-hidden" : ""
      } ${className}`}
    >
      {hasHeader && (
        <div className="px-4 py-3 sm:px-6 sm:py-5">
          {title && (
            <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
              {title}
            </h3>
          )}
          {desc && (
            <p
              className={`text-sm text-gray-500 dark:text-gray-400 ${title ? "mt-1" : ""} ${hideDescOnMobile ? "hidden sm:block" : ""}`}
            >
              {desc}
            </p>
          )}
        </div>
      )}

      <div
        className={`p-3 sm:p-6 ${
          hasHeader ? "border-t border-gray-100 dark:border-gray-800" : ""
        } ${fill ? "flex h-0 min-h-0 flex-1 flex-col overflow-hidden" : ""}`}
      >
        <div
          className={
            fill
              ? "flex h-0 min-h-0 flex-1 flex-col gap-2 overflow-hidden sm:gap-4"
              : hasHeader
                ? "space-y-4 sm:space-y-6"
                : "space-y-3 sm:space-y-4"
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default ComponentCard;
