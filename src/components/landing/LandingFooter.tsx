import LandingAuthActions from "@/components/landing/LandingAuthActions";
import { APP_NAME, LEGAL_BRAND_NAME } from "@/constants/brand";
import Image from "next/image";
import Link from "next/link";

export default function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="landing-section border-t py-10 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <Link href="/" className="inline-block cursor-pointer">
              <img
                src="/images/logo/logobanner.png"
                alt={APP_NAME}
                width={140}
                height={36}
                className="h-8 w-auto transition-transform duration-300 hover:scale-[1.02] sm:h-9 object-contain"
              />
            </Link>
            <p className="landing-lead mt-3 text-sm leading-relaxed">
              Nền tảng quản trị Zalo — marketing, bán hàng và vận hành tự động cho doanh
              nghiệp.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-10 gap-y-4 text-sm" aria-label="Liên kết chân trang">
            <div>
              <p className="landing-title font-semibold">Sản phẩm</p>
              <ul className="landing-lead mt-3 space-y-2">
                <li>
                  <a href="#san-pham" className="cursor-pointer hover:text-gray-800 dark:hover:text-white/80">
                    Xem sản phẩm
                  </a>
                </li>
                <li>
                  <a href="#tinh-nang" className="cursor-pointer hover:text-gray-800 dark:hover:text-white/80">
                    Tính năng
                  </a>
                </li>
                <li>
                  <a href="#so-sanh" className="cursor-pointer hover:text-gray-800 dark:hover:text-white/80">
                    So sánh
                  </a>
                </li>
                <li>
                  <a href="#faq" className="cursor-pointer hover:text-gray-800 dark:hover:text-white/80">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#danh-gia" className="cursor-pointer hover:text-gray-800 dark:hover:text-white/80">
                    Đánh giá
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="landing-title font-semibold">Tài khoản</p>
              <ul className="landing-lead mt-3 space-y-2">
                <LandingAuthActions variant="footer" />
              </ul>
            </div>
            <div>
              <p className="landing-title font-semibold">Pháp lý</p>
              <ul className="landing-lead mt-3 space-y-2">
                <li>
                  <Link href="/dieu-khoan" className="cursor-pointer hover:text-gray-800 dark:hover:text-white/80">
                    Điều khoản sử dụng
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="landing-lead mt-8 flex flex-col gap-2 border-t border-gray-100 pt-6 text-xs dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {LEGAL_BRAND_NAME}. {APP_NAME} — Bảo lưu mọi quyền.
          </p>
          <p>Made for Zalo operations teams</p>
        </div>
      </div>
    </footer>
  );
}