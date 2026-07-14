import { LANDING_FAQ } from "@/components/landing/landing-data";
import { APP_NAME, LEGAL_BRAND_NAME } from "@/constants/brand";
import { DEFAULT_DESCRIPTION, getSiteUrl, SITE_TAGLINE } from "@/config/seo";

export default function LandingJsonLd() {
  const siteUrl = getSiteUrl();

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: APP_NAME,
    legalName: LEGAL_BRAND_NAME,
    url: siteUrl,
    logo: `${siteUrl}/images/logo/logo.png`,
    description: DEFAULT_DESCRIPTION,
    sameAs: [] as string[],
  };

  const webSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: APP_NAME,
    url: siteUrl,
    description: DEFAULT_DESCRIPTION,
    inLanguage: "vi-VN",
    publisher: {
      "@type": "Organization",
      name: APP_NAME,
      logo: `${siteUrl}/images/logo/logo.png`,
    },
  };

  const softwareApp = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: APP_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: siteUrl,
    description: DEFAULT_DESCRIPTION,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "VND",
      description: "Dùng thử miễn phí",
    },
    featureList: [
      "Quản lý tài khoản Zalo",
      "Tin nhắn realtime WebSocket",
      "Chiến dịch marketing tự động",
      "Cửa hàng online",
      "Phân quyền team",
    ],
  };

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${APP_NAME} — ${SITE_TAGLINE}`,
    url: siteUrl,
    description: DEFAULT_DESCRIPTION,
    inLanguage: "vi-VN",
    isPartOf: { "@id": `${siteUrl}/#website` },
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: LANDING_FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  const graph = [
    { ...organization, "@id": `${siteUrl}/#organization` },
    { ...webSite, "@id": `${siteUrl}/#website` },
    softwareApp,
    webPage,
    faqPage,
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}