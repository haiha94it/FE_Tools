"use client";

import Select from "@/components/form/Select";
import {
  PERIOD_OPTIONS,
  type ActivePoint,
  type PeriodKey,
  formatYmdRange,
  parseActiveTimes,
  parseFollowerSeries,
  rangeForDays,
} from "@/lib/zalo-video/channel-analytics";
import { getAccountSession } from "@/lib/zalo-video/session";
import { toast } from "@/lib/toast";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface FollowersAnalyticsSectionProps {
  accountId: number;
}

/**
 * Tab Người theo dõi — series follower + active times (Care3 port, TailAdmin).
 */
export default function FollowersAnalyticsSection({
  accountId,
}: FollowersAnalyticsSectionProps) {
  const [period, setPeriod] = useState<PeriodKey>("7");
  const [loading, setLoading] = useState(true);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [followerPoints, setFollowerPoints] = useState<
    { date: string; total: number; follow: number; unfollow: number }[]
  >([]);
  const [activePoints, setActivePoints] = useState<ActivePoint[]>([]);
  const [peakLabel, setPeakLabel] = useState("—");

  const load = useCallback(async () => {
    const session = getAccountSession(accountId);
    if (!session?.clientCookie) {
      toast.error("Chưa đăng nhập kênh video");
      return;
    }
    setLoading(true);
    const range = rangeForDays(Number(period));
    setStart(range.start);
    setEnd(range.end);

    try {
      const [seriesRes, activeRes] = await Promise.all([
        fetch("/next-api/get_channel_series", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientCookie: session.clientCookie,
            proxy: session.proxy,
            start: range.start,
            end: range.end,
            key: "follower",
          }),
        }),
        fetch("/next-api/get_follower_active_times", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientCookie: session.clientCookie,
            proxy: session.proxy,
            start: range.start,
            end: range.end,
          }),
        }),
      ]);

      if (seriesRes.ok) {
        const json = await seriesRes.json();
        const parsed = parseFollowerSeries(json.data, range.start, range.end);
        setFollowerPoints(parsed.points);
        if (parsed.points.length === 0) {
          toast.error("Không parse được chuỗi người theo dõi");
        }
      } else {
        setFollowerPoints([]);
        toast.error("Không tải được chuỗi người theo dõi");
      }

      if (activeRes.ok) {
        const json = await activeRes.json();
        const parsed = parseActiveTimes(json.data, range.start, range.end);
        setActivePoints(parsed.points);
        setPeakLabel(parsed.peakLabel);
      } else {
        setActivePoints([]);
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Lỗi tải thống kê người theo dõi",
      );
      setFollowerPoints([]);
      setActivePoints([]);
    } finally {
      setLoading(false);
    }
  }, [accountId, period]);

  useEffect(() => {
    void load();
  }, [load]);

  const lastPoint = followerPoints[followerPoints.length - 1];
  const totalFollow = useMemo(
    () => followerPoints.reduce((s, p) => s + (p.follow || 0), 0),
    [followerPoints],
  );
  const totalUnfollow = useMemo(
    () => followerPoints.reduce((s, p) => s + (p.unfollow || 0), 0),
    [followerPoints],
  );

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
          {formatYmdRange(start, end)}
        </span>
        <div className="w-[120px]">
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
          disabled={loading}
          onClick={() => void load()}
          className="h-9 rounded-lg border border-gray-200 px-2.5 text-[11px] font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300"
        >
          {loading ? "Đang tải…" : "Làm mới"}
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <span className="size-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-1.5">
              <h3 className="text-xs font-bold text-gray-800 dark:text-white/90">
                Tổng người theo dõi
              </h3>
              <p className="text-[11px] text-gray-500">
                {lastPoint
                  ? `Hiện tại: ${lastPoint.total.toLocaleString("vi-VN")}`
                  : "Series Zalo Creator"}
              </p>
            </div>
            <div className="mb-2 flex flex-wrap gap-3 text-[11px] text-gray-500">
              <span>
                + Mới:{" "}
                <strong className="text-success-600">
                  {totalFollow.toLocaleString("vi-VN")}
                </strong>
              </span>
              <span>
                − Bỏ:{" "}
                <strong className="text-error-500">
                  {totalUnfollow.toLocaleString("vi-VN")}
                </strong>
              </span>
            </div>
            {followerPoints.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">
                Không có dữ liệu series follower
              </p>
            ) : (
              <div className="h-[200px] w-full sm:h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={followerPoints}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="fillFollowerTotal"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#465fff" stopOpacity={0.3} />
                        <stop
                          offset="100%"
                          stopColor="#465fff"
                          stopOpacity={0.02}
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
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                    />
                    {/*
                      Chỉ plot `total` (Care3) — nếu thêm follow/unfollow,
                      dataMin≈0 → chart phẳng 0–max.
                      domain zoom ~0.2% min/max.
                    */}
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      width={48}
                      domain={[
                        (dataMin: number) =>
                          Number.isFinite(dataMin)
                            ? Math.floor(dataMin * 0.998)
                            : 0,
                        (dataMax: number) =>
                          Number.isFinite(dataMax)
                            ? Math.ceil(dataMax * 1.002)
                            : 1,
                      ]}
                      tickFormatter={(v: number) =>
                        Number.isFinite(v)
                          ? Math.round(v).toLocaleString("vi-VN")
                          : String(v)
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e5e7eb",
                        fontSize: 12,
                      }}
                      formatter={(value) =>
                        typeof value === "number"
                          ? Math.round(value).toLocaleString("vi-VN")
                          : String(value ?? "")
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      name="Tổng follow"
                      stroke="#465fff"
                      fill="url(#fillFollowerTotal)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-1.5">
              <h3 className="text-xs font-bold text-gray-800 dark:text-white/90">
                Thời điểm hoạt động
              </h3>
              <p className="text-[11px] text-gray-500">Peak ≈ {peakLabel}</p>
            </div>
            {activePoints.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">
                Không có dữ liệu active times
              </p>
            ) : (
              <div className="h-[180px] w-full sm:h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={activePoints}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="idx"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: "#9ca3af" }}
                      tickFormatter={(idx: number) => {
                        const p = activePoints[idx];
                        return p?.tick || "";
                      }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      width={40}
                    />
                    <Tooltip
                      labelFormatter={(idx) => {
                        const p = activePoints[Number(idx)];
                        return p?.time ?? String(idx);
                      }}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e5e7eb",
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      name="Active"
                      stroke="#465fff"
                      fill="#465fff22"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
