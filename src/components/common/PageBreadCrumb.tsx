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

const PageBreadcrumb: React.FC<BreadcrumbProps> = ({
  pageTitle,
  parents,
  showPageTitle = true,
  className = "",
}) => {
  return (
    <div
      className={`flex shrink-0 flex-wrap items-center gap-3 ${
        showPageTitle ? "mb-6 justify-between" : "mb-4"
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
      <nav className={showPageTitle ? "" : "w-full"}>
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
    </div>
  );
};

export default PageBreadcrumb;
