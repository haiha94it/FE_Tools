import { createPublicMetadata } from "@/lib/seo/metadata";
import type { Metadata } from "next";
import PublicShell from "@/components/public/PublicShell";

export const metadata: Metadata = createPublicMetadata({
  title: "Chính sách bảo mật — Công cụ xanh",
  description: "Chính sách bảo mật của Công cụ xanh – công cụ tính toán miễn phí, không yêu cầu đăng nhập.",
  path: "/bao-mat",
  absoluteTitle: true,
});

export default function PrivacyPage() {
  return (
    <PublicShell>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="border-b border-slate-200 pb-5">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Chính sách bảo mật – Công cụ xanh
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Cập nhật lần cuối: 13/08/2026
          </p>
        </div>
        
        <div className="mt-8 text-slate-700">
          <p className="leading-7">
            Công cụ xanh (tools.dahangsi.com) cam kết minh bạch về cách chúng tôi xử lý thông tin khi bạn sử dụng website.
          </p>

          <div className="mt-8 space-y-8">
            <section className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">1. Phạm vi áp dụng</h2>
              <p className="leading-7">
                Chính sách này áp dụng cho toàn bộ website Công cụ xanh và các công cụ tính toán trên đó.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">2. Chúng tôi không thu thập gì</h2>
              <ul className="list-disc pl-5 space-y-2 leading-7">
                <li>Không yêu cầu đăng nhập để sử dụng hầu hết công cụ.</li>
                <li>Không thu thập họ tên, số điện thoại, email, địa chỉ hay thông tin định danh cá nhân của người dùng thông thường.</li>
                <li>Không yêu cầu bạn cung cấp hồ sơ thuế, dữ liệu công trình hay thông tin nhạy cảm để chạy công cụ.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">3. Dữ liệu có thể được ghi nhận</h2>
              <p className="leading-7">
                Để vận hành và cải thiện dịch vụ, chúng tôi có thể ghi nhận một số dữ liệu kỹ thuật ẩn danh, bao gồm:
              </p>
              <ul className="list-disc pl-5 space-y-2 leading-7">
                <li>Lượt xem trang và lượt sử dụng công cụ</li>
                <li>Địa chỉ IP đã được mã hóa (hash), không lưu IP gốc dạng có thể nhận diện dễ dàng</li>
                <li>Loại trình duyệt, thiết bị (thông tin cơ bản)</li>
                <li>Thời điểm truy cập</li>
              </ul>
              <p className="leading-7 mt-2">
                Dữ liệu này dùng để:
              </p>
              <ul className="list-disc pl-5 space-y-2 leading-7">
                <li>Thống kê mức độ sử dụng</li>
                <li>Phát hiện spam / lạm dụng</li>
                <li>Cải thiện tốc độ và trải nghiệm website</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">4. Cookie và công nghệ tương tự</h2>
              <p className="leading-7">
                Website có thể dùng cookie kỹ thuật cần thiết để hoạt động ổn định.
                <br />
                Hiện tại chúng tôi <strong>không</strong> dùng cookie quảng cáo hay theo dõi hành vi cho mục đích marketing.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">5. Chia sẻ dữ liệu</h2>
              <ul className="list-disc pl-5 space-y-2 leading-7">
                <li>Không bán thông tin người dùng.</li>
                <li>Không chia sẻ dữ liệu cá nhân cho bên thứ ba để quảng cáo.</li>
                <li>Chỉ có thể cung cấp thông tin khi pháp luật yêu cầu hoặc để bảo vệ hệ thống khỏi tấn công.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">6. Bảo mật</h2>
              <p className="leading-7">
                Chúng tôi áp dụng các biện pháp kỹ thuật hợp lý (phân quyền, giới hạn tần suất truy cập, mã hóa một phần dữ liệu kỹ thuật…) để giảm rủi ro lạm dụng và tấn công.
                <br />
                Không có hệ thống nào an toàn tuyệt đối; bạn nên tự bảo vệ thiết bị và kết nối mạng của mình.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">7. Công cụ tính toán</h2>
              <p className="leading-7">
                Phần lớn phép tính được thực hiện ngay trên trình duyệt của bạn.
                <br />
                Kết quả mang tính tham khảo. Chi tiết trách nhiệm xem tại <strong>Điều khoản sử dụng</strong>.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">8. Thay đổi chính sách</h2>
              <p className="leading-7">
                Chúng tôi có thể cập nhật chính sách này theo thời gian. Bản mới có hiệu lực khi được đăng trên website.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900">9. Liên hệ</h2>
              <p className="leading-7">
                Nếu có câu hỏi về bảo mật hoặc góp ý, vui lòng liên hệ qua nhóm Zalo:
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
            Cảm ơn bạn đã tin dùng Công cụ xanh.
          </p>
        </div>
      </div>
    </PublicShell>
  );
}
