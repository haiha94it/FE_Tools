import { createPublicMetadata } from "@/lib/seo/metadata";
import type { Metadata } from "next";
import PublicShell from "@/components/public/PublicShell";

export const metadata: Metadata = createPublicMetadata({
  title: "Điều khoản sử dụng — Công Cụ Nghề",
  description: "Điều khoản sử dụng website Công Cụ Nghề – máy tính online cho người làm nghề.",
  path: "/dieu-khoan",
  absoluteTitle: true,
});

export default function TermsPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="border-b border-slate-200 pb-5">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Điều khoản sử dụng – Công Cụ Nghề
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Cập nhật lần cuối: 13/08/2026
          </p>
        </div>
        
        <div className="mt-8 text-slate-700">
          <p className="leading-7">
            Chào mừng bạn đến với <strong>Công Cụ Nghề</strong> (tools.dahangsi.com). Khi truy cập và sử dụng các công cụ trên website, bạn được xem là đã đọc, hiểu và đồng ý với các điều khoản dưới đây.
          </p>

          <div className="mt-8 space-y-8">
            <section className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">1. Giới thiệu</h2>
              <p className="leading-7">
                Công Cụ Nghề cung cấp các công cụ tính toán đơn giản, miễn phí, bằng tiếng Việt, phục vụ người làm nghề (kế toán hộ kinh doanh, thợ xây, thầu phụ…). Hầu hết công cụ không yêu cầu đăng nhập.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">2. Tính chất tham khảo</h2>
              <ul className="list-disc pl-5 space-y-2 leading-7">
                <li>Kết quả từ các công cụ chỉ mang tính <strong>tham khảo</strong>.</li>
                <li>Không thay thế tư vấn của kế toán, kỹ sư, cơ quan thuế hoặc đơn vị chuyên môn.</li>
                <li>Đặc biệt với công cụ liên quan thuế, khấu hao, vật liệu xây dựng, định mức… bạn cần tự đối chiếu với quy định pháp luật và thực tế công trình trước khi áp dụng.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">3. Trách nhiệm của người dùng</h2>
              <ul className="list-disc pl-5 space-y-2 leading-7">
                <li>Bạn tự chịu trách nhiệm khi sử dụng kết quả tính toán.</li>
                <li>Không sử dụng website để spam, tấn công, phá hoại hệ thống hoặc gây ảnh hưởng đến người dùng khác.</li>
                <li>Không lợi dụng công cụ cho mục đích vi phạm pháp luật.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">4. Giới hạn trách nhiệm</h2>
              <p className="leading-7">
                Công Cụ Nghề và người vận hành <strong>không chịu trách nhiệm</strong> đối với:
              </p>
              <ul className="list-disc pl-5 space-y-2 leading-7">
                <li>Thiệt hại phát sinh từ việc sử dụng hoặc không thể sử dụng công cụ.</li>
                <li>Sai sót, gián đoạn, hoặc kết quả không chính xác.</li>
                <li>Quyết định kinh doanh, kê khai thuế, thi công dựa trên kết quả từ website.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">5. Dữ liệu và bảo mật</h2>
              <ul className="list-disc pl-5 space-y-2 leading-7">
                <li>Không bắt buộc đăng nhập để dùng hầu hết công cụ.</li>
                <li>Chúng tôi có thể ghi nhận lượt sử dụng ẩn danh (ví dụ IP đã được mã hóa) để cải thiện dịch vụ.</li>
                <li>
                  Chi tiết xem tại <strong>Chính sách bảo mật</strong>.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">6. Thay đổi dịch vụ</h2>
              <p className="leading-7">
                Chúng tôi có quyền thay đổi, tạm ngưng hoặc gỡ bỏ bất kỳ công cụ nào, cũng như cập nhật điều khoản này mà không cần báo trước. Phiên bản mới sẽ có hiệu lực ngay khi được đăng tải.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">7. Liên hệ</h2>
              <p className="leading-7">
                Mọi góp ý, đề xuất công cụ mới hoặc báo lỗi, vui lòng tham gia nhóm Zalo:
                <br />
                <a 
                  href="https://zalo.me/g/m7q5sdrvbdlmrmu590t6" 
                  target="_blank" 
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded px-1 py-0.5"
                >
                  https://zalo.me/g/m7q5sdrvbdlmrmu590t6
                </a>
              </p>
            </section>
          </div>

          <p className="mt-12 text-sm text-slate-500 italic">
            Cảm ơn bạn đã sử dụng Công Cụ Nghề.
          </p>
        </div>
      </div>
    </PublicShell>
  );
}
