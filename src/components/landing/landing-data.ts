import type { ComponentType, SVGProps } from "react";

export type LandingIcon = ComponentType<SVGProps<SVGSVGElement>>;

export const LANDING_STATS = [
  { value: "10K+", label: "Tài khoản Zalo quản lý" },
  { value: "2M+", label: "Tin nhắn gửi mỗi tháng" },
  { value: "99.9%", label: "Uptime hệ thống" },
  { value: "24/7", label: "Hỗ trợ kỹ thuật" },
] as const;

export const LANDING_FEATURES = [
  {
    title: "Quản lý tài khoản",
    description:
      "Tập trung nhiều nick Zalo, proxy, danh bạ và trạng thái kết nối trên một bảng điều khiển.",
    tone: "brand" as const,
    iconKey: "users",
  },
  {
    title: "Tin nhắn realtime",
    description:
      "Hộp thư đồng bộ WebSocket, gửi tin tức thì, theo dõi ACK và lịch sử hội thoại đầy đủ.",
    tone: "success" as const,
    iconKey: "chat",
  },
  {
    title: "Chiến dịch tự động",
    description:
      "Kết bạn, mời nhóm, gửi tin hàng loạt và đăng video — lên lịch và theo dõi tiến độ.",
    tone: "purple" as const,
    iconKey: "campaign",
  },
  {
    title: "Cửa hàng online",
    description:
      "Tạo danh mục, sản phẩm và đơn hàng; chia sẻ link shop cho khách mua trực tiếp.",
    tone: "warning" as const,
    iconKey: "shop",
  },
  {
    title: "Tài nguyên & hướng dẫn",
    description:
      "Kho template, media và tài liệu vận hành giúp team onboard nhanh, làm việc thống nhất.",
    tone: "info" as const,
    iconKey: "docs",
  },
  {
    title: "Bảo mật & phân quyền",
    description:
      "Đổi mật khẩu, phân vai admin/sale và kiểm soát truy cập theo từng module.",
    tone: "neutral" as const,
    iconKey: "shield",
  },
] as const;

export const LANDING_STEPS = [
  {
    step: "01",
    title: "Đăng ký tài khoản",
    description: "Tạo tài khoản CAREVIPPRO và đăng nhập vào bảng điều khiển.",
  },
  {
    step: "02",
    title: "Kết nối Zalo",
    description: "Thêm nick Zalo, cấu hình proxy và đồng bộ danh bạ.",
  },
  {
    step: "03",
    title: "Vận hành & tăng trưởng",
    description: "Chat, chạy chiến dịch và bán hàng — tất cả trên một nền tảng.",
  },
] as const;

export const LANDING_TESTIMONIALS = [
  {
    quote:
      "Chuyển từ quản lý thủ công sang CAREVIPPRO giúp team sale xử lý tin nhắn nhanh gấp đôi.",
    name: "Nguyễn Minh Anh",
    role: "Trưởng nhóm Sale",
    initials: "MA",
  },
  {
    quote:
      "Module chiến dịch và shop tích hợp sẵn — không cần nhảy qua nhiều công cụ khác nhau.",
    name: "Trần Hoàng Long",
    role: "Marketing Manager",
    initials: "HL",
  },
  {
    quote:
      "Giao diện rõ ràng, dễ onboard nhân viên mới. Hỗ trợ phản hồi nhanh khi cần.",
    name: "Lê Thị Hương",
    role: "Chủ shop online",
    initials: "TH",
  },
] as const;

export const LANDING_SHOWCASE_TABS = [
  {
    id: "messenger",
    label: "Tin nhắn",
    title: "Hộp thư Zalo realtime — đa nick, đa hội thoại",
    description:
      "Đồng bộ WebSocket, gửi tin tức thì, sticker, file và theo dõi trạng thái ACK. Nhãn, ghi chú và lọc hội thoại giúp sale không bỏ sót khách.",
    highlights: ["WebSocket realtime", "Đa tài khoản", "Nhãn & ghi chú", "Fast reply"],
  },
  {
    id: "campaigns",
    label: "Chiến dịch",
    title: "Tự động hóa marketing Zalo quy mô lớn",
    description:
      "Kết bạn, mời nhóm, gửi tin theo số điện thoại, đăng video và chúc mừng sinh nhật — lên lịch, theo dõi tiến độ từng chiến dịch.",
    highlights: ["Gửi tin hàng loạt", "Kết bạn tự động", "Mời nhóm", "Lên lịch"],
  },
  {
    id: "shop",
    label: "Cửa hàng",
    title: "Shop online gắn trực tiếp với Zalo",
    description:
      "Tạo danh mục, sản phẩm, quản lý đơn hàng và chia sẻ link shop. Khách xem và đặt hàng mà không cần rời hệ sinh thái Zalo.",
    highlights: ["Danh mục & sản phẩm", "Link shop công khai", "Quản lý đơn", "Ảnh & mô tả"],
  },
  {
    id: "accounts",
    label: "Tài khoản",
    title: "Trung tâm điều khiển mọi nick Zalo",
    description:
      "Quản lý proxy, danh bạ, trạng thái online và phân quyền team. Một nơi để giám sát toàn bộ tài sản Zalo của doanh nghiệp.",
    highlights: ["Proxy & kết nối", "Danh bạ đồng bộ", "Phân quyền", "Giám sát trạng thái"],
  },
] as const;

export type ShowcaseTabId = (typeof LANDING_SHOWCASE_TABS)[number]["id"];

export const LANDING_USE_CASES = [
  {
    title: "Team Sale",
    subtitle: "Xử lý inbox hàng ngày",
    pain: "Nhiều nick, nhiều tab, dễ trễ tin và nhầm khách.",
    solution: "Một inbox tập trung, realtime, nhãn hội thoại và fast reply.",
    tone: "success" as const,
    iconKey: "chat" as const,
  },
  {
    title: "Marketing",
    subtitle: "Chạy chiến dịch tự động",
    pain: "Thao tác thủ công tốn thời gian, khó theo dõi tiến độ.",
    solution: "Chiến dịch kết bạn, gửi tin, mời nhóm có lịch và báo cáo.",
    tone: "purple" as const,
    iconKey: "campaign" as const,
  },
  {
    title: "Chủ shop",
    subtitle: "Bán hàng qua Zalo",
    pain: "Chốt đơn thủ công, không có catalog chuyên nghiệp.",
    solution: "Shop online + link sản phẩm gửi thẳng trong chat.",
    tone: "warning" as const,
    iconKey: "shop" as const,
  },
  {
    title: "Quản lý",
    subtitle: "Giám sát & phân quyền",
    pain: "Không kiểm soát được nhân viên truy cập nick nào.",
    solution: "Phân vai admin/sale, module riêng, bảo mật tài khoản.",
    tone: "brand" as const,
    iconKey: "shield" as const,
  },
] as const;

export const LANDING_COMPARISON = {
  beforeLabel: "Quản lý thủ công",
  afterLabel: "CAREVIPPRO",
  rows: [
    { aspect: "Tài khoản Zalo", before: "Nhiều thiết bị, nhiều tab", after: "Một dashboard tập trung" },
    { aspect: "Tin nhắn khách", before: "Refresh thủ công, dễ trễ", after: "Realtime WebSocket" },
    { aspect: "Chiến dịch", before: "Copy-paste từng nick", after: "Tự động + theo dõi tiến độ" },
    { aspect: "Bán hàng", before: "Gửi ảnh + giá tay", after: "Link shop & quản lý đơn" },
    { aspect: "Phân quyền", before: "Chia nick bằng Excel", after: "Vai trò admin/sale rõ ràng" },
    { aspect: "Bảo mật", before: "Mật khẩu chung team", after: "Tài khoản riêng, đổi MK" },
  ],
} as const;

export const LANDING_DEEP_DIVES = [
  {
    id: "messenger",
    badge: "Tin nhắn",
    title: "Chat khách không bỏ sót — kể cả khi có hàng trăm hội thoại",
    description:
      "Giao diện 3 cột quen thuộc: tài khoản → danh sách chat → nội dung. WebSocket đẩy tin mới tức thì, hỗ trợ sticker, file, mention và chia sẻ tin.",
    bullets: [
      "Thông báo tin mới khi đang ở module khác",
      "Nhãn màu phân loại khách VIP, mới, follow-up",
      "Fast reply và template tin nhắn nhanh",
    ],
    image: "/images/chat/chat.jpg",
    imageAlt: "Giao diện chat Zalo CAREVIPPRO",
    tone: "success" as const,
    reverse: false,
  },
  {
    id: "campaigns",
    badge: "Chiến dịch",
    title: "Scale marketing Zalo mà không cần thuê thêm người",
    description:
      "Từ kết bạn tự động đến gửi tin theo danh sách SĐT, mời nhóm và đăng video — mỗi chiến dịch có trạng thái, log và điều khiển tạm dừng.",
    bullets: [
      "Gửi tin hàng loạt theo nhóm hoặc SĐT",
      "Chiến dịch sinh nhật tự động",
      "Theo dõi % hoàn thành realtime",
    ],
    image: "/images/carousel/carousel-02.png",
    imageAlt: "Module chiến dịch marketing Zalo",
    tone: "purple" as const,
    reverse: true,
  },
  {
    id: "shop",
    badge: "Cửa hàng",
    title: "Biến Zalo thành kênh bán hàng chuyên nghiệp",
    description:
      "Tạo danh mục, upload sản phẩm, quản lý đơn và chia sẻ link shop công khai. Sale gửi link sản phẩm ngay trong hội thoại — khách đặt hàng nhanh hơn.",
    bullets: [
      "Trang shop responsive cho khách xem",
      "Quản lý đơn hàng trong admin",
      "Ảnh sản phẩm, giá và mô tả đầy đủ",
    ],
    image: "/images/product/product-01.jpg",
    imageAlt: "Cửa hàng online trên CAREVIPPRO",
    tone: "warning" as const,
    reverse: false,
  },
] as const;

export const LANDING_FAQ = [
  {
    q: "CAREVIPPRO là gì và dành cho ai?",
    a: "CAREVIPPRO là nền tảng web giúp doanh nghiệp quản lý nhiều tài khoản Zalo, chat khách, chạy chiến dịch marketing và bán hàng trên một bảng điều khiển. Phù hợp team sale, marketing, shop online và quản lý vận hành.",
  },
  {
    q: "Tôi cần bao nhiêu tài khoản Zalo để bắt đầu?",
    a: "Bạn có thể bắt đầu với một nick và mở rộng dần. Hệ thống hỗ trợ quản lý nhiều tài khoản song song, mỗi nick có trạng thái kết nối và proxy riêng.",
  },
  {
    q: "Proxy có bắt buộc không?",
    a: "Tùy cách vận hành và chính sách kết nối của bạn. CAREVIPPRO có module cấu hình proxy riêng giúp ổn định kết nối khi quản lý nhiều nick.",
  },
  {
    q: "Tin nhắn có đồng bộ realtime không?",
    a: "Có. Module tin nhắn dùng WebSocket để nhận tin mới tức thì, cập nhật hội thoại và trạng thái gửi (ACK) mà không cần tải lại trang.",
  },
  {
    q: "Dữ liệu và tài khoản có an toàn không?",
    a: "Mỗi người dùng đăng nhập bằng tài khoản riêng, có đổi mật khẩu và phân quyền theo module. Admin kiểm soát ai được truy cập nick Zalo và tính năng nào.",
  },
  {
    q: "Có hỗ trợ chạy chiến dịch gửi tin hàng loạt không?",
    a: "Có — kết bạn, mời nhóm, gửi tin theo SĐT, gửi tin nhóm/thành viên, đăng video và chúc mừng sinh nhật. Mỗi chiến dịch có giao diện theo dõi riêng.",
  },
  {
    q: "Tôi có thể bán hàng trực tiếp trên nền tảng không?",
    a: "Có module Cửa hàng: tạo danh mục, sản phẩm, đơn hàng và link shop công khai để chia sẻ cho khách.",
  },
  {
    q: "Làm sao để bắt đầu sử dụng?",
    a: "Đăng ký tài khoản miễn phí → đăng nhập → thêm nick Zalo → bắt đầu chat hoặc chạy chiến dịch. Thiết lập cơ bản chỉ mất vài phút.",
  },
] as const;

export const LANDING_NAV_LINKS = [
  { label: "Sản phẩm", href: "#san-pham" },
  { label: "Đối tượng", href: "#doi-tuong" },
  { label: "Tính năng", href: "#tinh-nang" },
  { label: "So sánh", href: "#so-sanh" },
  { label: "FAQ", href: "#faq" },
] as const;