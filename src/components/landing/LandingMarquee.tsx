const MARQUEE_ITEMS = [
  "Tin nhắn realtime",
  "Chiến dịch tự động",
  "Quản lý đa nick",
  "Shop online",
  "WebSocket sync",
  "Phân quyền team",
  "Proxy & bảo mật",
  "Template nhanh",
] as const;

function MarqueeGroup() {
  return (
    <div className="flex shrink-0 items-center gap-3 pr-3">
      {MARQUEE_ITEMS.map((item) => (
        <span
          key={item}
          className="landing-marquee-pill shrink-0 rounded-full px-4 py-1.5 text-xs font-medium"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export default function LandingMarquee() {
  return (
    <section
      className="landing-marquee-section overflow-x-hidden py-4 backdrop-blur-sm"
      aria-label="Điểm nổi bật sản phẩm"
    >
      <div className="landing-marquee-mask relative w-full overflow-hidden">
        <div className="landing-marquee-track flex w-max flex-nowrap">
          <MarqueeGroup />
          <div aria-hidden>
            <MarqueeGroup />
          </div>
        </div>
      </div>
    </section>
  );
}