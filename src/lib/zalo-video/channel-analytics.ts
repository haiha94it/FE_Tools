/**
 * Parse thống kê kênh Zalo (channel/general + channel/series) — port logic Care3.
 * Dùng cho tab Phân tích dữ liệu (`AnalyticsPanel`).
 */

export type PeriodKey = "7" | "14" | "30";

export type MetricStats = {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  viewers: number;
};

export type SeriesPoint = { ymd: string; date: string; value: number };

export const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "7", label: "7 ngày" },
  { key: "14", label: "14 ngày" },
  { key: "30", label: "30 ngày" },
];

export const EMPTY_STATS: MetricStats = {
  views: 0,
  likes: 0,
  comments: 0,
  shares: 0,
  viewers: 0,
};

export function formatCompact(n?: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  if (Math.abs(n) >= 1_000_000)
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (Math.abs(n) >= 10_000)
    return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`.replace(".", ",");
  return n.toLocaleString("vi-VN");
}

export function formatYmdLabel(ymd?: string): string {
  if (!ymd || ymd.length < 8) return "—";
  return `${ymd.slice(6, 8)}/${ymd.slice(4, 6)}`;
}

export function formatYmdRange(start?: string, end?: string): string {
  if (!start || !end) return "—";
  return `${formatYmdLabel(start)} - ${formatYmdLabel(end)}`;
}

export function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function ymdFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export function parseYmd(s: string): Date {
  return new Date(
    Number(s.slice(0, 4)),
    Number(s.slice(4, 6)) - 1,
    Number(s.slice(6, 8)),
  );
}

/** Kỳ trước cùng độ dài (so sánh 2 đường chart). */
export function previousRange(
  startYmd: string,
  endYmd: string,
): { start: string; end: string } {
  const start = parseYmd(startYmd);
  const end = parseYmd(endYmd);
  const spanMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 24 * 3600 * 1000);
  const prevStart = new Date(prevEnd.getTime() - spanMs);
  return { start: ymdFromDate(prevStart), end: ymdFromDate(prevEnd) };
}

export function rangeForDays(days: number): { start: string; end: string } {
  const today = new Date();
  const offsetEnd = 2;
  const offsetStart = days === 14 ? 15 : days === 30 ? 32 : 8;
  const end = new Date(today);
  end.setDate(end.getDate() - offsetEnd);
  const start = new Date(today);
  start.setDate(start.getDate() - offsetStart);
  return { start: ymdFromDate(start), end: ymdFromDate(end) };
}

function pickMetricBlock(
  src: Record<string, unknown> | null | undefined,
): MetricStats {
  if (!src) return { ...EMPTY_STATS };
  return {
    views: num(src.views) ?? 0,
    likes: num(src.likes) ?? 0,
    comments: num(src.comments) ?? 0,
    shares: num(src.shares) ?? 0,
    viewers: num(src.viewers) ?? num(src.avgViewers) ?? 0,
  };
}

/** channel/general: data.total = tuyệt đối kỳ; data.changes = chênh so kỳ trước. */
export function pickTotals(block: unknown): MetricStats {
  if (!block || typeof block !== "object") return { ...EMPTY_STATS };
  const root = block as Record<string, unknown>;
  if (root.total && typeof root.total === "object" && !Array.isArray(root.total)) {
    return pickMetricBlock(root.total as Record<string, unknown>);
  }
  if ("views" in root || "likes" in root) {
    return pickMetricBlock(root);
  }
  if (root.changes && typeof root.changes === "object") {
    return pickMetricBlock(root.changes as Record<string, unknown>);
  }
  return { ...EMPTY_STATS };
}

export function pickDeltas(block: unknown): MetricStats | null {
  if (!block || typeof block !== "object") return null;
  const root = block as Record<string, unknown>;
  if (!root.changes || typeof root.changes !== "object") return null;
  return pickMetricBlock(root.changes as Record<string, unknown>);
}

export function enumerateYmd(startYmd: string, endYmd: string): string[] {
  if (!/^\d{8}$/.test(startYmd) || !/^\d{8}$/.test(endYmd)) return [];
  const out: string[] = [];
  const cur = parseYmd(startYmd);
  const end = parseYmd(endYmd);
  for (let i = 0; i < 400; i++) {
    const y = ymdFromDate(cur);
    out.push(y);
    if (y >= endYmd || cur.getTime() >= end.getTime()) break;
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function toYmdToken(raw: unknown, index: number): string {
  if (raw == null) return "";
  const s = String(raw);
  if (/^\d{8}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10).replace(/-/g, "");
  if (/^\d{10,13}$/.test(s)) {
    let ms = Number(s);
    if (ms < 1e12) ms *= 1000;
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) return ymdFromDate(d);
  }
  void index;
  return "";
}

/**
 * Parse channel/series (key=view).
 * Zalo: { total: number[] } — 1 phần tử / ngày trong [start,end].
 */
export function parseViewSeries(
  payload: unknown,
  seriesStart?: string,
  seriesEnd?: string,
): SeriesPoint[] {
  if (!payload) return [];

  const root =
    typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};

  const dateAxis =
    seriesStart && seriesEnd ? enumerateYmd(seriesStart, seriesEnd) : [];

  const attachDates = (values: number[]): SeriesPoint[] =>
    values.map((value, i) => {
      const ymd = dateAxis[i] ?? "";
      return {
        ymd,
        date: ymd ? formatYmdLabel(ymd) : String(i + 1),
        value: Number.isFinite(value) ? value : 0,
      };
    });

  if (Array.isArray(root.total) && root.total.length > 0) {
    if (typeof root.total[0] === "number") {
      return attachDates(root.total.map((v) => num(v) ?? 0));
    }
  }

  const candidates: unknown[] = [
    root.series,
    root.list,
    root.points,
    root.chart,
    root.daily,
    root.history,
    root.view,
    root.views,
    root.data,
    Array.isArray(payload) ? payload : null,
  ];

  for (const c of candidates) {
    if (!Array.isArray(c) || c.length === 0) continue;
    if (Array.isArray(c[0]) && typeof c[0][0] !== "number") continue;

    if (typeof c[0] === "number") {
      return attachDates(c.map((v) => num(v) ?? 0));
    }

    return c.map((row, i) => {
      if (typeof row === "number") {
        const ymd = dateAxis[i] ?? "";
        return {
          ymd,
          date: ymd ? formatYmdLabel(ymd) : String(i + 1),
          value: row,
        };
      }
      const r = (
        row && typeof row === "object" ? row : {}
      ) as Record<string, unknown>;
      const ymd =
        toYmdToken(r.date ?? r.day ?? r.time ?? r.label ?? r.x, i) ||
        dateAxis[i] ||
        "";
      const date = ymd ? formatYmdLabel(ymd) : String(i + 1);
      const value =
        num(r.views) ??
        num(r.view) ??
        num(r.value) ??
        num(r.count) ??
        num(r.y) ??
        num(r.total) ??
        0;
      return { ymd, date, value: value ?? 0 };
    });
  }

  if (root && typeof root === "object" && !Array.isArray(root)) {
    const entries = Object.entries(root).filter(([k]) => /^\d{8}$/.test(k));
    if (entries.length > 0) {
      return entries
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => ({
          ymd: k,
          date: formatYmdLabel(k),
          value:
            num(v) ??
            (typeof v === "object" && v
              ? (num((v as Record<string, unknown>).value) ??
                num((v as Record<string, unknown>).views) ??
                0)
              : 0),
        }));
    }
  }

  return [];
}

export function splitSeries(
  points: SeriesPoint[],
  currentStart: string,
  currentEnd: string,
): { current: SeriesPoint[]; previous: SeriesPoint[] } {
  if (points.length === 0) return { current: [], previous: [] };

  const hasYmd = points.some((p) => p.ymd && /^\d{8}$/.test(p.ymd));
  if (hasYmd) {
    const current = points.filter(
      (p) => p.ymd && p.ymd >= currentStart && p.ymd <= currentEnd,
    );
    const previous = points.filter((p) => p.ymd && p.ymd < currentStart);
    return { current, previous };
  }

  const mid = Math.floor(points.length / 2);
  return {
    previous: points.slice(0, mid),
    current: points.slice(mid),
  };
}

/** Parse series key=follower — { total, increase, decrease } number[]. */
export function parseFollowerSeries(
  payload: unknown,
  startYmd?: string,
  endYmd?: string,
): {
  points: { date: string; total: number; follow: number; unfollow: number }[];
} {
  if (!payload) return { points: [] };
  const root =
    typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};
  const dateAxis =
    startYmd && endYmd ? enumerateYmd(startYmd, endYmd) : [];

  if (
    Array.isArray(root.total) &&
    root.total.length > 0 &&
    typeof root.total[0] === "number"
  ) {
    const totals = root.total as unknown[];
    const increases = Array.isArray(root.increase)
      ? (root.increase as unknown[])
      : [];
    const decreases = Array.isArray(root.decrease)
      ? (root.decrease as unknown[])
      : [];
    return {
      points: totals.map((v, i) => {
        const ymdTok = dateAxis[i] ?? "";
        return {
          date: ymdTok ? formatYmdLabel(ymdTok) : String(i + 1),
          total: num(v) ?? 0,
          follow: num(increases[i]) ?? 0,
          unfollow: num(decreases[i]) ?? 0,
        };
      }),
    };
  }

  if (Array.isArray(root.total) && typeof root.total?.[0] === "number") {
    return {
      points: (root.total as unknown[]).map((v, i) => {
        const ymdTok = dateAxis[i] ?? "";
        return {
          date: ymdTok ? formatYmdLabel(ymdTok) : String(i + 1),
          total: num(v) ?? 0,
          follow: 0,
          unfollow: 0,
        };
      }),
    };
  }

  return { points: [] };
}

export type ActivePoint = {
  idx: number;
  time: string;
  tick: string;
  value: number;
  isPeak?: boolean;
  hour?: number;
};

function buildActivePoints(
  values: number[],
  startYmd?: string,
  endYmd?: string,
  peakHourHint: number | null = null,
): { points: ActivePoint[]; peakLabel: string } {
  const n = values.length;
  const isHourly = n % 24 === 0 && n >= 24;
  const days = isHourly ? n / 24 : 0;
  const dateAxis =
    startYmd && endYmd && days > 0 ? enumerateYmd(startYmd, endYmd) : [];

  const points: ActivePoint[] = values.map((value, i) => {
    if (isHourly) {
      const dayIdx = Math.floor(i / 24);
      const hour = i % 24;
      const hh = String(hour).padStart(2, "0");
      const ymdTok = dateAxis[dayIdx] ?? "";
      const dayLabel = ymdTok ? formatYmdLabel(ymdTok) : `D${dayIdx + 1}`;
      return {
        idx: i,
        time: `${dayLabel} ${hh}:00`,
        tick: hour === 0 ? dayLabel : "",
        value,
        hour,
        isPeak: false,
      };
    }
    return {
      idx: i,
      time: String(i + 1),
      tick: String(i + 1),
      value,
      isPeak: false,
    };
  });

  let max = -1;
  let maxIdx = 0;
  points.forEach((p, i) => {
    if (p.value > max) {
      max = p.value;
      maxIdx = i;
    }
  });
  if (points[maxIdx]) points[maxIdx] = { ...points[maxIdx], isPeak: true };

  const peakHour = peakHourHint ?? (isHourly ? maxIdx % 24 : null);
  const peakLabel =
    peakHour != null
      ? `${String(peakHour).padStart(2, "0")}:00`
      : (points[maxIdx]?.time ?? "—");

  return { points, peakLabel };
}

/** Parse follower-active-times — number[] hourly (days×24). */
export function parseActiveTimes(
  payload: unknown,
  startYmd?: string,
  endYmd?: string,
): { points: ActivePoint[]; peakLabel: string } {
  if (!payload) return { points: [], peakLabel: "—" };

  let values: number[] | null = null;
  const root =
    typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : null;

  if (Array.isArray(payload) && payload.length > 0) {
    if (typeof payload[0] === "number") {
      values = payload.map((v) => num(v) ?? 0);
    } else if (Array.isArray(payload[0])) {
      values = (payload as unknown[][]).flatMap((row) =>
        Array.isArray(row) ? row.map((v) => num(v) ?? 0) : [num(row) ?? 0],
      );
    }
  } else if (root) {
    const peakHourHint =
      num(root.peakHour) ??
      num(root.peak_hour) ??
      num(root.peakTime) ??
      null;
    const candidates = [
      root.series,
      root.list,
      root.points,
      root.times,
      root.hours,
      root.activeTimes,
      root.total,
      root.data,
    ];
    for (const c of candidates) {
      if (!Array.isArray(c) || c.length === 0) continue;
      if (typeof c[0] === "number") {
        values = c.map((v) => num(v) ?? 0);
        break;
      }
      if (Array.isArray(c[0])) {
        values = (c as unknown[][]).flatMap((row) =>
          Array.isArray(row) ? row.map((v) => num(v) ?? 0) : [num(row) ?? 0],
        );
        break;
      }
    }
    if (values && values.length > 0) {
      return buildActivePoints(values, startYmd, endYmd, peakHourHint);
    }
    return {
      points: [],
      peakLabel:
        peakHourHint != null
          ? `${String(peakHourHint).padStart(2, "0")}:00`
          : "—",
    };
  }

  if (!values || values.length === 0) return { points: [], peakLabel: "—" };
  return buildActivePoints(values, startYmd, endYmd, null);
}
