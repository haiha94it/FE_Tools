"use client";

import { useLandingReveal } from "@/hooks/use-landing-reveal";
import type { CSSProperties, ReactNode } from "react";

type RevealVariant = "up" | "fade" | "scale" | "left" | "right";

interface LandingRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: RevealVariant;
  as?: "div" | "section" | "article" | "li" | "figure";
}

export default function LandingReveal({
  children,
  className = "",
  delay = 0,
  variant = "up",
  as: Tag = "div",
}: LandingRevealProps) {
  const { ref, visible } = useLandingReveal<HTMLElement>();

  const style = {
    "--reveal-delay": `${delay}ms`,
  } as CSSProperties;

  return (
    <Tag
      ref={ref as never}
      className={`landing-reveal landing-reveal-${variant} ${visible ? "is-visible" : ""} ${className}`}
      style={style}
    >
      {children}
    </Tag>
  );
}