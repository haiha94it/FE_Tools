import Link from "next/link";
import React from "react";

interface BreadcrumbParent {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  pageTitle: string;
  parents?: BreadcrumbParent[];
  showPageTitle?: boolean;
  className?: string;
  /** Nút quay lại cùng hàng breadcrumb */
  backHref?: string;
  backLabel?: string;
}

const chevron = (
  <svg
    className="stroke-current"
    width="17"
    height="16"
    viewBox="0 0 17 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
      stroke=""
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const backChevron = (
  <svg
    className="size-4 shrink-0 stroke-current"
    viewBox="0 0 17 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M10.2432 12.667L6.0765 8.50033L10.2432 4.33366"
      stroke=""
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PageBreadcrumb: React.FC<BreadcrumbProps> = ({
  pageTitle,
  parents,
  showPageTitle = true,
  className = "",
  backHref,
  backLabel = "Quay lại",
}) => {
  return (
    <div
      className={`flex shrink-0 flex-wrap items-center gap-3 ${
        showPageTitle
          ? "mb-6 justify-between"
          : backHref
            ? "mb-4 justify-between"
            : "mb-4"
      } ${className}`}
    >
      {showPageTitle && (
        <h2
          className="text-xl font-semibold text-gray-800 dark:text-white/90"
          x-text="pageName"
        >
          {pageTitle}
        </h2>
      )}
      <nav className={showPageTitle ? "" : "min-w-0 flex-1"}>
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
              href="/me"
            >
              Trang chủ
              {chevron}
            </Link>
          </li>
          {parents?.map((parent) => (
            <li key={parent.label}>
              {parent.href ? (
                <Link
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
                  href={parent.href}
                >
                  {parent.label}
                  {chevron}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                  {parent.label}
                  {chevron}
                </span>
              )}
            </li>
          ))}
          <li className="text-sm text-gray-800 dark:text-white/90">
            {pageTitle}
          </li>
        </ol>
      </nav>
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-gray-600 dark:hover:bg-white/[0.04]"
        >
          {backChevron}
          {backLabel}
        </Link>
      ) : null}
    </div>
  );
};

export default PageBreadcrumb;
