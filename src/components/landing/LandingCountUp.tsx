"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface LandingCountUpProps {
  value: string;
  /** Bắt đầu đếm khi section vào viewport */
  active?: boolean;
  className?: string;
}

type ParsedStat = {
  prefix: string;
  target: number;
  suffix: string;
  decimals: number;
  staticValue: string | null;
};

function parseStatValue(raw: string): ParsedStat {
  if (raw === "24/7") {
    return { prefix: "", target: 0, suffix: "", decimals: 0, staticValue: raw };
  }

  if (!/\d/.test(raw)) {
    return { prefix: "", target: 0, suffix: "", decimals: 0, staticValue: raw };
  }

  const match = raw.match(/^([^0-9]*)([0-9]+(?:\.[0-9]+)?)(.*)$/);
  if (!match) {
    return { prefix: "", target: 0, suffix: "", decimals: 0, staticValue: raw };
  }

  const numericPart = match[2];
  return {
    prefix: match[1],
    target: Number(numericPart),
    suffix: match[3],
    decimals: numericPart.includes(".") ? numericPart.split(".")[1].length : 0,
    staticValue: null,
  };
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function formatStat(
  prefix: string,
  current: number,
  suffix: string,
  decimals: number,
): string {
  return `${prefix}${current.toFixed(decimals)}${suffix}`;
}

export default function LandingCountUp({
  value,
  active = true,
  className = "",
}: LandingCountUpProps) {
  const parsed = useMemo(() => parseStatValue(value), [value]);
  const [display, setDisplay] = useState(value);
  const hasAnimatedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;

    if (parsed.staticValue !== null) {
      setDisplay(parsed.staticValue);
      return;
    }

    if (hasAnimatedRef.current) {
      setDisplay(value);
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      hasAnimatedRef.current = true;
      return;
    }

    hasAnimatedRef.current = true;
    const duration = 1400;
    let start: number | null = null;

    const tick = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const current = parsed.target * easeOutCubic(progress);
      setDisplay(
        formatStat(parsed.prefix, current, parsed.suffix, parsed.decimals),
      );

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    };

    setDisplay(formatStat(parsed.prefix, 0, parsed.suffix, parsed.decimals));
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [
    active,
    value,
    parsed.staticValue,
    parsed.prefix,
    parsed.target,
    parsed.suffix,
    parsed.decimals,
  ]);

  return (
    <span className={`tabular-nums ${className}`}>{display}</span>
  );
}