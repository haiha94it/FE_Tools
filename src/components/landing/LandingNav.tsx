"use client";

import BrandLogo from "@/components/common/BrandLogo";
import LandingAuthActions from "@/components/landing/LandingAuthActions";
import { LANDING_NAV_LINKS } from "@/components/landing/landing-data";
import { IconClose, IconMenu } from "@/components/landing/LandingIcons";
import LandingThemeToggle from "@/components/landing/LandingThemeToggle";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap-config";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const SECTION_IDS = LANDING_NAV_LINKS.map((l) => l.href.replace("#", ""));

export default function LandingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

  const headerRef = useRef<HTMLElement>(null);
  const navBarRef = useRef<HTMLDivElement>(null);
  const navListRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const rightDockRef = useRef<HTMLDivElement>(null);
  const dockListRef = useRef<HTMLDivElement>(null);
  const dockIndicatorRef = useRef<HTMLDivElement>(null);
  const magneticAuthRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);

  const lastScrollY = useRef(0);
  const mobileOpenRef = useRef(mobileOpen);

  // 1. Intersection Observer theo dõi active section
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { rootMargin: "-35% 0px -45% 0px", threshold: 0 }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // 2. Lock scroll body khi mở mobile menu
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Sync mobileOpen ref để scroll handler không phải tái tạo ScrollTrigger
  useEffect(() => {
    mobileOpenRef.current = mobileOpen;
  }, [mobileOpen]);

  // 3. GSAP SCROLLTRIGGER DIRECT FLIGHT ULTRA-SLOW MOTION
  useGSAP(() => {
    if (!navBarRef.current || !rightDockRef.current || !navListRef.current) return;

    const headerNavItems = navListRef.current.querySelectorAll(".nav-header-item");
    const dockNavItems = rightDockRef.current.querySelectorAll(".nav-dock-item");

    // Timeline Scrubbing ULTRA SLOW MOTION
    const scrubTl = gsap.timeline({
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "1200px top",
        scrub: 4.0,
      },
    });

    // A. Header Bar co gọn chiều rộng
    scrubTl.to(
      navBarRef.current,
      {
        maxWidth: "760px",
        paddingLeft: "1.25rem",
        paddingRight: "1.25rem",
        borderRadius: "9999px",
        marginTop: "0.5rem",
        backgroundColor: "var(--nav-scrolled-bg)",
        borderColor: "var(--nav-scrolled-border)",
        backdropFilter: "blur(16px)",
        boxShadow: "var(--nav-scrolled-shadow)",
        ease: "none",
      },
      0
    );

    // B. ẨN TRIỆT ĐỂ VÒNG INDICATOR TRÊN HEADER KHÔNG CHO DÍNH VẾT
    if (indicatorRef.current) {
      scrubTl.to(
        indicatorRef.current,
        {
          opacity: 0,
          scale: 0.8,
          ease: "none",
        },
        0
      );
    }

    // C. ANİMATE TỪNG CHỮ MỤC MENU TRẮNG TRÔI ULTRA-SLOW TỪ HEADER DỌC XUỐNG CỘT DỌC PHẢI
    headerNavItems.forEach((item, index) => {
      const targetX = 240 - index * 32;
      const targetY = 180 + index * 42;

      scrubTl.to(
        item,
        {
          x: targetX,
          y: targetY,
          scale: 0.85,
          opacity: 0,
          ease: "power1.inOut",
        },
        index * 0.3
      );
    });

    // D. Cột Dọc Phải hiện lên đón nhận các chữ
    scrubTl.to(
      rightDockRef.current,
      {
        x: 0,
        opacity: 1,
        pointerEvents: "auto",
        ease: "none",
      },
      0.6
    );

    scrubTl.fromTo(
      dockNavItems,
      { opacity: 0, scale: 0.85, y: -10 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        stagger: 0.12,
        ease: "power1.out",
      },
      0.7
    );

    // Smart Hide / Show Header khi cuộn sâu hẳn (> 1250px)
    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;

      if (currentY > 1250 && delta > 8 && !mobileOpenRef.current) {
        gsap.to(headerRef.current, {
          yPercent: -120,
          duration: 0.35,
          ease: "power2.inOut",
        });
      } else if (delta < -4 || currentY <= 50) {
        gsap.to(headerRef.current, {
          yPercent: 0,
          duration: 0.35,
          ease: "power2.out",
        });
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 4. GSAP Logic: Active LED Indicator Slide cho Header Menu
  useGSAP(() => {
    const targetId = hoveredSection || activeSection;
    if (!targetId || !navListRef.current || !indicatorRef.current) {
      if (!targetId && indicatorRef.current) {
        gsap.to(indicatorRef.current, { opacity: 0, duration: 0.2 });
      }
      return;
    }

    if (window.scrollY > 80) {
      gsap.to(indicatorRef.current, { opacity: 0, duration: 0.1 });
      return;
    }

    const activeEl = navListRef.current.querySelector<HTMLElement>(
      `[data-section="${targetId}"]`
    );

    if (activeEl) {
      const { offsetLeft, offsetWidth, offsetHeight, offsetTop } = activeEl;
      gsap.to(indicatorRef.current, {
        x: offsetLeft,
        y: offsetTop,
        width: offsetWidth,
        height: offsetHeight,
        opacity: 1,
        duration: 0.25,
        ease: "power2.out",
      });
    } else {
      gsap.to(indicatorRef.current, { opacity: 0, duration: 0.1 });
    }
  }, [activeSection, hoveredSection]);

  // 5. GSAP Logic: Active LED Indicator Slide cho Right Vertical Dock (TỰ ĐỘNG ẨN HẲN NẾU CHƯA CÓ ITEM CẦN ACTIVE)
  useGSAP(() => {
    const targetId = hoveredSection || activeSection;
    if (!targetId || !dockListRef.current || !dockIndicatorRef.current) {
      if (dockIndicatorRef.current) {
        gsap.to(dockIndicatorRef.current, { opacity: 0, duration: 0.15 });
      }
      return;
    }

    const activeEl = dockListRef.current.querySelector<HTMLElement>(
      `[data-dock-section="${targetId}"]`
    );

    if (activeEl) {
      const { offsetTop, offsetHeight, offsetWidth, offsetLeft } = activeEl;
      gsap.to(dockIndicatorRef.current, {
        y: offsetTop,
        x: offsetLeft,
        height: offsetHeight,
        width: offsetWidth,
        opacity: 1,
        duration: 0.25,
        ease: "back.out(1.2)",
      });
    } else if (dockIndicatorRef.current) {
      gsap.to(dockIndicatorRef.current, { opacity: 0, duration: 0.15 });
    }
  }, [activeSection, hoveredSection]);

  // 6. GSAP Logic: Mobile Menu Entrance
  useGSAP(() => {
    if (mobileOpen && mobilePanelRef.current) {
      const items = mobilePanelRef.current.querySelectorAll(".mobile-nav-item");
      gsap.fromTo(
        items,
        { y: 15, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.35,
          stagger: 0.05,
          ease: "power3.out",
        }
      );
    }
  }, [mobileOpen]);

  // Logo Hover Effect
  const handleLogoHover = () => {
    if (!logoRef.current) return;
    gsap.fromTo(
      logoRef.current,
      { scale: 1 },
      {
        scale: 1.03,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: "power1.inOut",
      }
    );
  };

  // Magnetic Effect cho Auth Actions
  const handleMagneticMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!magneticAuthRef.current) return;
    const rect = magneticAuthRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    gsap.to(magneticAuthRef.current, {
      x: x * 0.15,
      y: y * 0.15,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleMagneticLeave = () => {
    if (!magneticAuthRef.current) return;
    gsap.to(magneticAuthRef.current, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: "elastic.out(1, 0.4)",
    });
  };

  return (
    <>
      {/* 1. Header Navigation Chồng Trên Top */}
      <header
        ref={headerRef}
        className="fixed inset-x-0 top-0 z-50 transition-all duration-300 pointer-events-none"
      >
        <div className="mx-auto px-3 sm:px-6 lg:px-8">
          <div
            ref={navBarRef}
            className="pointer-events-auto mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 transition-colors duration-300 sm:h-[4.25rem] sm:px-6 bg-transparent border border-transparent shadow-none"
          >
            {/* Logo */}
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2.5"
              onMouseEnter={handleLogoHover}
            >
              <BrandLogo
                ref={logoRef}
                width={140}
                height={36}
                className="h-8 w-auto shrink-0 object-contain transition-transform duration-300 sm:h-9"
              />
            </Link>

            {/* Desktop Navigation */}
            <div ref={navListRef} className="relative hidden items-center lg:flex min-w-0">
              <div
                ref={indicatorRef}
                className="pointer-events-none absolute left-0 top-0 rounded-full bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/20 opacity-0 transition-opacity"
              />

              <nav
                className="relative z-10 flex items-center gap-1"
                aria-label="Điều hướng chính"
              >
                {LANDING_NAV_LINKS.map((link) => {
                  const sectionId = link.href.replace("#", "");
                  const isActive = activeSection === sectionId;

                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      data-section={sectionId}
                      onMouseEnter={() => setHoveredSection(sectionId)}
                      onMouseLeave={() => setHoveredSection(null)}
                      className={`nav-header-item cursor-pointer whitespace-nowrap shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold sm:text-sm transition-colors duration-200 ${
                        isActive
                          ? "text-brand-600 dark:text-brand-400 font-semibold"
                          : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                      }`}
                    >
                      {link.label}
                    </a>
                  );
                })}
              </nav>
            </div>

            {/* Magnetic Auth Buttons & Theme Toggle */}
            <div className="hidden items-center gap-3 lg:flex shrink-0">
              <LandingThemeToggle />
              <div
                ref={magneticAuthRef}
                onMouseMove={handleMagneticMove}
                onMouseLeave={handleMagneticLeave}
                className="inline-flex items-center shrink-0"
              >
                <LandingAuthActions variant="nav" />
              </div>
            </div>

            {/* Mobile Toggle Button */}
            <div className="flex items-center gap-2 lg:hidden shrink-0">
              <LandingThemeToggle />
              <button
                type="button"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white/80 text-gray-700 backdrop-blur-md transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900/80 dark:text-gray-300 dark:hover:bg-white/[0.05]"
                aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((v) => !v)}
              >
                {mobileOpen ? (
                  <IconClose className="h-5 w-5" />
                ) : (
                  <IconMenu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        <div
          ref={mobilePanelRef}
          className={`pointer-events-auto overflow-hidden transition-all duration-300 lg:hidden ${
            mobileOpen
              ? "landing-nav-mobile-panel max-h-96 opacity-100 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur-2xl shadow-xl"
              : "max-h-0 opacity-0"
          }`}
        >
          <nav className="flex flex-col gap-1.5 px-6 py-5" aria-label="Menu di động">
            {LANDING_NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="mobile-nav-item cursor-pointer rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:text-gray-300 dark:hover:bg-brand-500/10 dark:hover:text-brand-400"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="mobile-nav-item mt-3 border-t border-gray-100 pt-4 dark:border-gray-800">
              <LandingAuthActions
                variant="nav-mobile"
                onNavigate={() => setMobileOpen(false)}
              />
            </div>
          </nav>
        </div>
      </header>

      {/* 2. CỘT DỌC PHẢI VỚI Z-INDEX Z-60 CAO NHẤT VÀ TRIỆT TIÊU TOÀN BỘ VẾT MỜ RỖNG RẮC RỐI */}
      <aside
        ref={rightDockRef}
        className="fixed right-5 top-1/2 -translate-y-1/2 z-60 hidden lg:flex flex-col items-end opacity-0 pointer-events-none translate-x-6"
        aria-label="Menu cuộn dọc bên phải"
      >
        <div className="relative rounded-3xl border border-white/60 bg-white/85 p-1.5 shadow-2xl shadow-gray-950/10 backdrop-blur-2xl dark:border-gray-800/80 dark:bg-gray-950/85 dark:shadow-black/40">
          <div ref={dockListRef} className="relative z-10 flex flex-col gap-1">
            {/* Active Capsule Backdrop Indicator - BẮT BỘC MẶC ĐỊNH OPACITY-0 */}
            <div
              ref={dockIndicatorRef}
              className="pointer-events-none absolute left-0 top-0 rounded-2xl border border-brand-500/30 bg-gradient-to-r from-brand-500/15 via-brand-500/10 to-brand-500/5 shadow-xs opacity-0 transition-opacity"
            />

            {LANDING_NAV_LINKS.map((link) => {
              const sectionId = link.href.replace("#", "");
              const isActive = activeSection === sectionId;

              return (
                <a
                  key={link.href}
                  href={link.href}
                  data-dock-section={sectionId}
                  onMouseEnter={() => setHoveredSection(sectionId)}
                  onMouseLeave={() => setHoveredSection(null)}
                  className={`nav-dock-item group relative flex items-center justify-between gap-4 rounded-2xl px-4 py-2.5 text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "text-brand-600 dark:text-brand-400 font-bold"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <span className="tracking-tight">{link.label}</span>
                  <span
                    className={`h-2 w-2 rounded-full transition-all duration-300 shrink-0 ${
                      isActive
                        ? "bg-brand-500 scale-125 shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse"
                        : "bg-gray-300 group-hover:bg-gray-400 dark:bg-gray-700"
                    }`}
                  />
                </a>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}