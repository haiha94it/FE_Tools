"use client";

import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap-config";
import type { ElementType, ReactNode } from "react";
import { useRef } from "react";

type RevealVariant = "up" | "fade" | "scale" | "left" | "right";

interface LandingRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: RevealVariant;
  as?: ElementType;
}

export default function LandingReveal({
  children,
  className = "",
  delay = 0,
  variant = "up",
  as: Tag = "div",
}: LandingRevealProps) {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    let fromVars: gsap.TweenVars = { opacity: 0 };
    const toVars: gsap.TweenVars = {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      duration: 0.8,
      delay: delay / 1000,
      ease: "power3.out",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 88%",
        toggleActions: "play none none reverse",
      },
    };

    switch (variant) {
      case "up":
        fromVars = { opacity: 0, y: 40 };
        break;
      case "left":
        fromVars = { opacity: 0, x: -40 };
        break;
      case "right":
        fromVars = { opacity: 0, x: 40 };
        break;
      case "scale":
        fromVars = { opacity: 0, scale: 0.9, y: 20 };
        break;
      case "fade":
      default:
        fromVars = { opacity: 0 };
        break;
    }

    gsap.fromTo(containerRef.current, fromVars, toVars);
  }, [variant, delay]);

  return (
    <Tag ref={containerRef as never} className={className}>
      {children}
    </Tag>
  );
}