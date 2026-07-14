"use client";

import LandingCountUp from "@/components/landing/LandingCountUp";
import { useLandingReveal } from "@/hooks/use-landing-reveal";
import type { CSSProperties } from "react";

interface LandingStatItemProps {
  value: string;
  label: string;
  delay?: number;
}

export default function LandingStatItem({
  value,
  label,
  delay = 0,
}: LandingStatItemProps) {
  const { ref, visible } = useLandingReveal<HTMLDivElement>();

  const style = {
    "--reveal-delay": `${delay}ms`,
  } as CSSProperties;

  return (
    <div
      ref={ref}
      className={`landing-reveal landing-reveal-up landing-stat-item text-center md:text-left ${
        visible ? "is-visible" : ""
      }`}
      style={style}
    >
      <p className="landing-title text-2xl font-bold tracking-tight sm:text-3xl">
        <LandingCountUp value={value} active={visible} />
      </p>
      <p className="landing-lead mt-1 text-xs sm:text-sm">{label}</p>
    </div>
  );
}