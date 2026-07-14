import { Calistoga, Inter } from "next/font/google";
import "@/components/storefront/store-theme.css";

const calistoga = Calistoga({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-calistoga",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${calistoga.variable} ${inter.variable} store-theme store-mesh-bg`}>
      {children}
    </div>
  );
}