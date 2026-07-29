"use client";

import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap-config";
import { useMemo, useRef, useState } from "react";

interface LandingCountUpProps {
  value: string;
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
  if (raw === "24/7" || !/\d/.test(raw)) {
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

function formatStat(
  prefix: string,
  current: number,
  suffix: string,
  decimals: number
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
  const spanRef = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    if (!active || parsed.staticValue !== null || !spanRef.current) {
      if (parsed.staticValue !== null) setDisplay(parsed.staticValue);
      return;
    }

    const obj = { val: 0 };
    gsap.to(obj, {
      val: parsed.target,
      duration: 1.4,
      ease: "power2.out",
      scrollTrigger: {
        trigger: spanRef.current,
        start: "top 90%",
        toggleActions: "play none none none",
      },
      onUpdate: () => {
        setDisplay(
          formatStat(parsed.prefix, obj.val, parsed.suffix, parsed.decimals)
        );
      },
      onComplete: () => {
        setDisplay(value);
      },
    });
  }, [value, active, parsed]);

  return (
    <span ref={spanRef} className={`tabular-nums ${className}`}>
      {display}
    </span>
  );
}