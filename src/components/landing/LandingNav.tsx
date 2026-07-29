"use client";

import LandingAuthActions from "@/components/landing/LandingAuthActions";
import { LANDING_NAV_LINKS } from "@/components/landing/landing-data";
import { IconClose, IconMenu } from "@/components/landing/LandingIcons";
import LandingThemeToggle from "@/components/landing/LandingThemeToggle";
import { APP_NAME } from "@/constants/brand";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const SECTION_IDS = LANDING_NAV_LINKS.map((l) => l.href.replace("#", ""));

export default function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { rootMargin: "-40% 0px -50% 0px", threshold: 0 },
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "landing-nav-scrolled backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[4.5rem] sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <img
            src="/images/logo/logobanner.png"
            alt={APP_NAME}
            width={140}
            height={36}
            className="h-8 w-auto transition-transform duration-300 hover:scale-[1.02] sm:h-9 object-contain"
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Điều hướng chính">
          {LANDING_NAV_LINKS.map((link) => {
            const sectionId = link.href.replace("#", "");
            return (
              <a
                key={link.href}
                href={link.href}
                className={`landing-nav-link cursor-pointer text-sm font-medium ${
                  activeSection === sectionId ? "is-active" : ""
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LandingThemeToggle />
          <LandingAuthActions variant="nav" />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LandingThemeToggle />
          <button
            type="button"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-gray-200 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
            aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        className={`overflow-hidden backdrop-blur-xl transition-all duration-300 md:hidden ${
          mobileOpen
            ? "landing-nav-mobile-panel max-h-96 opacity-100"
            : "max-h-0 opacity-0 border-t-0"
        }`}
      >
        <nav className="flex flex-col gap-1 px-4 py-4" aria-label="Menu di động">
          {LANDING_NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="landing-nav-link cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">
            <LandingAuthActions
              variant="nav-mobile"
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </nav>
      </div>
    </header>
  );
}