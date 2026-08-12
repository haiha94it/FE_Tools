"use client";

import Select from "@/components/form/Select";
import {
  EMPTY_STATS,
  PERIOD_OPTIONS,
  type MetricStats,
  type PeriodKey,
  type SeriesPoint,
  formatCompact,
  formatYmdRange,
  parseViewSeries,
  pickDeltas,
  pickTotals,
  previousRange,
  splitSeries,
} from "@/lib/zalo-video/channel-analytics";
import { getAccountSession } from "@/lib/zalo-video/session";
import { toast } from "@/lib/toast";
import { useZaloVideoStore } from "@/stores/use-zalo-video-store";
import type { RenewGeneralType, ZaloChannelInfo } from "@/types/zalo-video";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HiOutlineArrowDown,
  HiOutlineArrowUp,
  HiOutlineEye,
} from "react-icons/hi2";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import FollowersAnalyticsSection from "./FollowersAnalyticsSection";

interface AnalyticsPanelProps {
  accountId: number;
  channelInfo: ZaloChannelInfo;
}

type AnalyticsTab = "overview" | "followers";

const WEEK_OPTIONS = [
  { value: "seven_day", label: "DB 7 ngày" },
  { value: "fourteen_day", label: "DB 14 ngày" },
  { value: "thirty_day", label: "DB 30 ngày" },
] as const;

function formatStat(value?: number) {
  if (value == null) return "—";
  return value.toLocaleString("vi-VN");
}

function formatDateLabel(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function DeltaLine({
  delta,
  percent,
}: {
  delta: number | null;
  percent: number | null;
}) {
  if (delta == null && percent == null) return null;
  const down = (delta ?? percent ?? 0) < 0;
  const d = delta != null ? Math.abs(delta).toLocaleString("vi-VN") : null;
  const p =
    percent != null
      ? `${Math.abs(percent).toFixed(1).replace(".", ",")}%`
      : null;
  return (
    <p
      className={`mt-0.5 flex items-center gap-0.5 text-[10px] font-semibold ${
        down ? "text-error-500" : "text-success-500"
      }`}
    >
      {down ? (
        <HiOutlineArrowDown size={10} aria-hidden />
      ) : (
        <HiOutlineArrowUp size={10} aria-hidden />
      )}
      {d != null ? d : ""}
      {d != null && p != null ? " " : ""}
      {p != null ? `(${down ? "-" : "+"}${p})` : ""}
    </p>
  );
}

/** KPI compact 1 dòng. */
function KpiChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 flex-1 rounded-lg border border-gray-100 bg-gray-50/80 px-2.5 py-1.5 dark:border-gray-800 dark:bg-white/[0.03]">
      <p className="truncate text-[10px] font-medium text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="text-sm font-bold tabular-nums text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function StatMiniCard({
  label,
  value,
  delta,
  percent,
  highlight,
}: {
  label: string;
  value: string;
  delta: number | null;
  percent: number | null;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-2.5 py-2 ${
        highlight
          ? "border-brand-100 bg-brand-50/80 dark:border-brand-500/30 dark:bg-brand-500/10"
          : "border-gray-100 bg-white dark:border-gray-800 dark:bg-white/[0.02]"
      }`}
    >
      <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className="text-base font-extrabold tracking-tight tabular-nums text-gray-900 dark:text-white sm:text-lg">
        {value}
      </p>
      <DeltaLine delta={delta} percent={percent} />
    </div>
  );
}

/**
 * Tab Phân tích dữ liệu — KPI DB (renew-general) + chart live Zalo series (Care3 port).
 * Chỉ render từ VideoCreatorView khi tab analytics (slug rỗng).
 */
export default function AnalyticsPanel({
  accountId,
  channelInfo: _channelInfo,
}: AnalyticsPanelProps) {
  const renewGeneral = useZaloVideoStore((s) => s.renewGeneral);
  const channelInfo = useZaloVideoStore((s) => s.channelInfo) ?? _channelInfo;

  const [mainTab, setMainTab] = useState<AnalyticsTab>("overview");
  const [week, setWeek] = useState<RenewGeneralType>("seven_day");
  const [renewingGeneral, setRenewingGeneral] = useState(false);

  const [period, setPeriod] = useState<PeriodKey>("7");
  const [loadingRange, setLoadingRange] = useState(false);
  const [rangeStart, setRangeStart] = useState<string | undefined>();
  const [rangeEnd, setRangeEnd] = useState<string | undefined>();
  const [prevRangeStart, setPrevRangeStart] = useState<string | undefined>();
  const [prevRangeEnd, setPrevRangeEnd] = useState<string | undefined>();
  const [periodStats, setPeriodStats] = useState<MetricStats>({
    ...EMPTY_STATS,
  });
  const [apiDeltas, setApiDeltas] = useState<MetricStats | null>(null);
  const [prevStats, setPrevStats] = useState<MetricStats | null>(null);
  const [chartCurrent, setChartCurrent] = useState<SeriesPoint[]>([]);
  const [chartPrevious, setChartPrevious] = useState<SeriesPoint[]>([]);

  const daily = channelInfo.channel_daily;
  const general = channelInfo.channel_general;

  const handleRenewGeneral = async () => {
    setRenewingGeneral(true);
    try {
      await renewGeneral(accountId, week);
      toast.success("Đã làm mới thống kê DB");
    } catch {
      toast.error("Làm mới thống kê DB thất bại");
    } finally {
      setRenewingGeneral(false);
    }
  };

  const loadRange = useCallback(
    async (days: PeriodKey) => {
      const session = getAccountSession(accountId);
      if (!session?.clientCookie) {
        toast.error("Chưa đăng nhập kênh video");
        return;
      }
      setLoadingRange(true);
      try {
        const generalRes = await fetch("/next-api/get_channel_general", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientCookie: session.clientCookie,
            proxy: session.proxy,
            days: Number(days),
            includePrevious: true,
          }),
        });
        if (!generalRes.ok) throw new Error("Không tải được thống kê theo ngày");
        const generalData = (await generalRes.json()) as {
          start?: string;
          end?: string;
          current?: unknown;
          previous?: unknown;
        };

        const start = generalData.start ?? "";
        const end = generalData.end ?? "";
        setRangeStart(start || undefined);
        setRangeEnd(end || undefined);

        const cur = pickTotals(generalData.current);
        const prev = pickTotals(generalData.previous);
        const changes = pickDeltas(generalData.current);
        setPeriodStats(cur);
        setPrevStats(generalData.previous != null ? prev : null);
        setApiDeltas(changes);

        if (start && end) {
          const pr = previousRange(start, end);
          setPrevRangeStart(pr.start);
          setPrevRangeEnd(pr.end);

          try {
            const seriesRes = await fetch("/next-api/get_channel_series", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                clientCookie: session.clientCookie,
                proxy: session.proxy,
                start: pr.start,
                end,
                key: "view",
                referer: "https://video.zalo.me/creator/phan-tich/tong-quat",
              }),
            });
            if (seriesRes.ok) {
              const seriesJson = (await seriesRes.json()) as {
                data?: unknown;
                error?: number | string;
              };
              const points = parseViewSeries(seriesJson.data, pr.start, end);
              const split = splitSeries(points, start, end);
              setChartCurrent(split.current);
              setChartPrevious(split.previous);
              if (
                points.length === 0 &&
                seriesJson.error != null &&
                Number(seriesJson.error) !== 0
              ) {
                toast.error("Không tải được biểu đồ lượt xem");
              }
            } else {
              setChartCurrent([]);
              setChartPrevious([]);
              toast.error("Không tải được biểu đồ lượt xem");
            }
          } catch {
            setChartCurrent([]);
            setChartPrevious([]);
          }
        } else {
          setChartCurrent([]);
          setChartPrevious([]);
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Lỗi tải thống kê");
      } finally {
        setLoadingRange(false);
      }
    },
    [accountId],
  );

  useEffect(() => {
    if (mainTab !== "overview") return;
    void loadRange(period);
  }, [accountId, period, loadRange, mainTab]);

  const deltas = useMemo(() => {
    const d = (cur: number, prev: number) => cur - prev;
    const pct = (cur: number, prev: number) =>
      prev === 0 ? null : ((cur - prev) / prev) * 100;

    if (prevStats) {
      return {
        views: d(periodStats.views, prevStats.views),
        likes: d(periodStats.likes, prevStats.likes),
        comments: d(periodStats.comments, prevStats.comments),
        shares: d(periodStats.shares, prevStats.shares),
        viewers: d(periodStats.viewers, prevStats.viewers),
        viewsPct: pct(periodStats.views, prevStats.views),
        likesPct: pct(periodStats.likes, prevStats.likes),
        commentsPct: pct(periodStats.comments, prevStats.comments),
        sharesPct: pct(periodStats.shares, prevStats.shares),
        viewersPct: pct(periodStats.viewers, prevStats.viewers),
      };
    }

    if (apiDeltas) {
      const prevFromDelta = (total: number, change: number) => total - change;
      return {
        views: apiDeltas.views,
        likes: apiDeltas.likes,
        comments: apiDeltas.comments,
        shares: apiDeltas.shares,
        viewers: apiDeltas.viewers,
        viewsPct: pct(
          periodStats.views,
          prevFromDelta(periodStats.views, apiDeltas.views),
        ),
        likesPct: pct(
          periodStats.likes,
          prevFromDelta(periodStats.likes, apiDeltas.likes),
        ),
        commentsPct: pct(
          periodStats.comments,
          prevFromDelta(periodStats.comments, apiDeltas.comments),
        ),
        sharesPct: pct(
          periodStats.shares,
          prevFromDelta(periodStats.shares, apiDeltas.shares),
        ),
        viewersPct: pct(
          periodStats.viewers,
          prevFromDelta(periodStats.viewers, apiDeltas.viewers),
        ),
      };
    }

    return {
      views: null as number | null,
      likes: null as number | null,
      comments: null as number | null,
      shares: null as number | null,
      viewers: null as number | null,
      viewsPct: null as number | null,
      likesPct: null as number | null,
      commentsPct: null as number | null,
      sharesPct: null as number | null,
      viewersPct: null as number | null,
    };
  }, [periodStats, prevStats, apiDeltas]);

  const chartData = useMemo(() => {
    if (chartCurrent.length === 0 && chartPrevious.length === 0) return [];
    const maxLen = Math.max(chartCurrent.length, chartPrevious.length);
    const rows: { date: string; current: number; previous: number }[] = [];
    for (let i = 0; i < maxLen; i++) {
      rows.push({
        date: chartCurrent[i]?.date ?? chartPrevious[i]?.date ?? String(i + 1),
        current: chartCurrent[i]?.value ?? 0,
        previous: chartPrevious[i]?.value ?? 0,
      });
    }
    return rows;
  }, [chartCurrent, chartPrevious]);

  const periodLabel =
    PERIOD_OPTIONS.find((p) => p.key === period)?.label ?? "7 ngày";
  const prevRangeLabel = useMemo(() => {
    if (prevRangeStart && prevRangeEnd) {
      return formatYmdRange(prevRangeStart, prevRangeEnd);
    }
    if (chartPrevious.length >= 2) {
      return `${chartPrevious[0].date} - ${chartPrevious[chartPrevious.length - 1].date}`;
    }
    return "kỳ trước";
  }, [prevRangeStart, prevRangeEnd, chartPrevious]);

  return (
    <div className="relative">
      {/*
        Sticky tabs — che content khi cuộn:
        - Nền đặc 100% trên outer sticky (full-bleed -mx khớp main p-*)
        - z-50 + translateZ(0) tạo layer đè sibling content (z-0)
        - Không alpha / backdrop-blur
      */}
      <div
        className={[
          "sticky top-0 z-50",
          "-mx-2.5 sm:-mx-3 md:-mx-4",
          "bg-gray-50 dark:bg-gray-900",
          "border-b border-gray-200 dark:border-gray-800",
          "shadow-sm",
          "[transform:translateZ(0)]",
        ].join(" ")}
      >
        {/* Plate kín full chiều cao bar (tránh subpixel lộ content) */}
        <div className="pointer-events-none absolute inset-0 bg-gray-50 dark:bg-gray-900" aria-hidden />
        <div className="relative flex gap-4 px-2.5 py-2.5 sm:px-3 md:px-4">
          <button
            type="button"
            onClick={() => setMainTab("overview")}
            className={`pb-1 text-sm font-bold transition ${
              mainTab === "overview"
                ? "border-b-2 border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-b-2 border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Tổng quát
          </button>
          <button
            type="button"
            onClick={() => setMainTab("followers")}
            className={`pb-1 text-sm font-bold transition ${
              mainTab === "followers"
                ? "border-b-2 border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-b-2 border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Người theo dõi
          </button>
        </div>
      </div>

      {/* Content dưới sticky — z-0, không absolute KPI */}
      <div className="relative z-0 space-y-2.5 pt-3">
      {mainTab === "followers" ? (
        <FollowersAnalyticsSection accountId={accountId} />
      ) : null}

      {mainTab === "overview" ? (
        <div className="relative z-0 space-y-2.5 rounded-xl border border-gray-200 bg-white p-3 shadow-theme-xs dark:border-gray-800 dark:bg-gray-950 sm:p-3.5">
          {/* Hôm nay — 1 hàng KPI */}
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <h3 className="text-xs font-bold text-gray-800 dark:text-white/90">
                Hôm nay
              </h3>
              <span className="text-[10px] text-gray-400">từ 00:00 · DB</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              <KpiChip label="Xem" value={formatStat(daily?.views)} />
              <KpiChip label="Thích" value={formatStat(daily?.likes)} />
              <KpiChip label="Chia sẻ" value={formatStat(daily?.shares)} />
              <KpiChip label="Bình luận" value={formatStat(daily?.comments)} />
            </div>
          </div>

          {/* Toolbar: kỳ live + DB renew gộp 1 hàng */}
          <div className="flex flex-col gap-2 border-t border-gray-100 pt-2.5 dark:border-gray-800 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="text-xs font-bold text-gray-800 dark:text-white/90">
                Theo ngày (live)
              </h3>
              {rangeStart && rangeEnd ? (
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {formatYmdRange(rangeStart, rangeEnd)}
                </span>
              ) : null}
              <div className="w-[110px]">
                <Select
                  options={PERIOD_OPTIONS.map((p) => ({
                    value: p.key,
                    label: p.label,
                  }))}
                  value={period}
                  onChange={(v) => setPeriod(v as PeriodKey)}
                />
              </div>
              <button
                type="button"
                disabled={loadingRange}
                onClick={() => void loadRange(period)}
                className="h-9 rounded-lg border border-gray-200 px-2.5 text-[11px] font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
              >
                {loadingRange ? "Đang tải…" : "Tải chart"}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-gray-400">
                DB
                {general?.start && general?.end
                  ? `: ${formatDateLabel(general.start)}→${formatDateLabel(general.end)}`
                  : ""}
              </span>
              <div className="w-[120px]">
                <Select
                  options={WEEK_OPTIONS.map((o) => ({
                    value: o.value,
                    label: o.label,
                  }))}
                  value={week}
                  onChange={(v) => setWeek(v as RenewGeneralType)}
                />
              </div>
              <button
                type="button"
                disabled={renewingGeneral}
                onClick={() => void handleRenewGeneral()}
                className="h-9 rounded-lg bg-brand-500 px-2.5 text-[11px] font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
              >
                {renewingGeneral ? "…" : "Làm mới DB"}
              </button>
            </div>
          </div>

          {/* Snapshot DB gọn (1 hàng) */}
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            <KpiChip label="DB xem" value={formatStat(general?.views)} />
            <KpiChip label="DB thích" value={formatStat(general?.likes)} />
            <KpiChip label="DB chia sẻ" value={formatStat(general?.shares)} />
            <KpiChip
              label="DB bình luận"
              value={formatStat(general?.comments)}
            />
          </div>

          {/* Chart + delta cards */}
          {loadingRange ? (
            <div className="flex min-h-[200px] items-center justify-center">
              <span className="size-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
          ) : (
            <div className="grid gap-2.5 lg:grid-cols-[minmax(0,200px)_1fr]">
              <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-1">
                <StatMiniCard
                  highlight
                  label="Lượt xem"
                  value={formatCompact(periodStats.views)}
                  delta={deltas.views}
                  percent={deltas.viewsPct}
                />
                <StatMiniCard
                  label="TB người xem"
                  value={formatCompact(periodStats.viewers)}
                  delta={deltas.viewers}
                  percent={deltas.viewersPct}
                />
                <StatMiniCard
                  label="Thích"
                  value={formatCompact(periodStats.likes)}
                  delta={deltas.likes}
                  percent={deltas.likesPct}
                />
                <StatMiniCard
                  label="Bình luận"
                  value={formatCompact(periodStats.comments)}
                  delta={deltas.comments}
                  percent={deltas.commentsPct}
                />
                <StatMiniCard
                  label="Chia sẻ"
                  value={formatCompact(periodStats.shares)}
                  delta={deltas.shares}
                  percent={deltas.sharesPct}
                />
              </div>

              <div className="min-w-0 rounded-lg border border-gray-100 p-2 dark:border-gray-800 sm:p-2.5">
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    <HiOutlineEye size={12} aria-hidden />
                    Lượt xem
                  </span>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-0.5 w-3 rounded bg-brand-500" />
                      {formatYmdRange(rangeStart, rangeEnd)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-0.5 w-3 rounded bg-brand-300/80" />
                      {prevRangeLabel}
                    </span>
                  </div>
                </div>

                {chartData.length === 0 ? (
                  <div className="flex h-[200px] flex-col items-center justify-center gap-0.5 text-xs text-gray-400">
                    <span>Không có dữ liệu biểu đồ</span>
                    <span className="text-[10px]">
                      Cần webSession kênh + series key=view
                    </span>
                  </div>
                ) : (
                  <div className="h-[200px] w-full sm:h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="fillCurrentCare2"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#465fff"
                              stopOpacity={0.35}
                            />
                            <stop
                              offset="100%"
                              stopColor="#465fff"
                              stopOpacity={0.02}
                            />
                          </linearGradient>
                          <linearGradient
                            id="fillPreviousCare2"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#9cb9ff"
                              stopOpacity={0.2}
                            />
                            <stop
                              offset="100%"
                              stopColor="#9cb9ff"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#e5e7eb"
                        />
                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 10, fill: "#9ca3af" }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 10, fill: "#9ca3af" }}
                          width={40}
                          tickFormatter={(v: number) => formatCompact(v)}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 10,
                            border: "1px solid #e5e7eb",
                            fontSize: 11,
                          }}
                          formatter={(value) =>
                            typeof value === "number"
                              ? value.toLocaleString("vi-VN")
                              : String(value ?? "")
                          }
                        />
                        <Area
                          type="monotone"
                          dataKey="previous"
                          name={prevRangeLabel}
                          stroke="#9cb9ff"
                          fill="url(#fillPreviousCare2)"
                          strokeWidth={1.5}
                          dot={false}
                        />
                        <Area
                          type="monotone"
                          dataKey="current"
                          name={periodLabel}
                          stroke="#465fff"
                          fill="url(#fillCurrentCare2)"
                          strokeWidth={2}
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : null}
      </div>
    </div>
  );
}
