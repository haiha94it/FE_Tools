import ComponentCard from "@/components/common/ComponentCard";
import { APP_NAME } from "@/constants/brand";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";

export default function DashboardPlaceholder() {
  return (
    <div>
      <PageBreadCrumb pageTitle="Tổng quan" />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <ComponentCard
            title={APP_NAME}
            desc="Hệ thống quản trị Zalo — sẵn sàng tích hợp"
          >
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/10">
                <svg
                  className="h-8 w-8 text-brand-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                  />
                </svg>
              </div>
              <h4 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">
                Chưa có module nào được kích hoạt
              </h4>
              <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
                Các tính năng demo đã được ẩn. Thêm module mới qua
                sidebar khi bắt đầu tích hợp tài khoản Zalo, tin nhắn, nhóm...
              </p>
            </div>
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}