import { useMemo, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, Building2, CalendarDays, CheckCircle2, ClipboardList, FileText, RefreshCw, ShieldAlert, Target, TrendingUp, XCircle } from "lucide-react";
import AnimatedSection from "./AnimatedSection";

const PERIODS = [
  { value: "day", label: "Harian" },
  { value: "week", label: "Mingguan" },
  { value: "month", label: "Bulanan" },
];

const REPORT_TYPES = [
  { key: "proposal", label: "Proposal" },
  { key: "ots_area", label: "OTS Area" },
  { key: "target_co", label: "Target CO" },
];

const STATUS_META = {
  PENDING_APPROVAL: { label: "Menunggu approval", color: "bg-amber-500" },
  APPROVED: { label: "Approved", color: "bg-emerald-500" },
  REVISION: { label: "Perlu revisi", color: "bg-orange-500" },
  REJECTED: { label: "Rejected", color: "bg-rose-500" },
};

function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function startOfWeek(date) {
  const result = startOfDay(date);
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  return result;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date, amount) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function formatNumber(value) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatPercent(value) {
  return `${value.toLocaleString("id-ID", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  })}%`;
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function formatMonth(date) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

function getTimestamp(item) {
  if (!item?.created_at) return null;

  const timestamp = new Date(item.created_at).getTime();

  return Number.isFinite(timestamp) ? timestamp : null;
}

function isInRange(item, start, end) {
  const timestamp = getTimestamp(item);

  return timestamp !== null && timestamp >= start.getTime() && timestamp < end.getTime();
}

function countByStatus(items, status) {
  return items.filter((item) => item.approval_status === status).length;
}

function getPeriodRange(period, now) {
  if (period === "day") {
    const start = startOfDay(now);
    const end = addDays(start, 1);
    const previousStart = addDays(start, -1);

    return {
      start,
      end,
      previousStart,
      previousEnd: start,
      label: "Hari ini",
      comparisonLabel: "dibanding kemarin",
    };
  }

  if (period === "week") {
    const start = startOfWeek(now);
    const end = addDays(start, 7);
    const previousStart = addDays(start, -7);

    return {
      start,
      end,
      previousStart,
      previousEnd: start,
      label: "Minggu ini",
      comparisonLabel: "dibanding minggu lalu",
    };
  }

  const start = startOfMonth(now);
  const end = addMonths(start, 1);
  const previousStart = addMonths(start, -1);

  return {
    start,
    end,
    previousStart,
    previousEnd: start,
    label: "Bulan ini",
    comparisonLabel: "dibanding bulan lalu",
  };
}

function getTrendPoints(items, period, now) {
  if (period === "day") {
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(startOfDay(now), index - 6);
      const end = addDays(date, 1);

      return {
        key: date.toISOString(),
        label: formatShortDate(date),
        value: items.filter((item) => isInRange(item, date, end)).length,
      };
    });
  }

  if (period === "week") {
    const currentWeek = startOfWeek(now);

    return Array.from({ length: 8 }, (_, index) => {
      const start = addDays(currentWeek, (index - 7) * 7);
      const end = addDays(start, 7);

      return {
        key: start.toISOString(),
        label: formatShortDate(start),
        value: items.filter((item) => isInRange(item, start, end)).length,
      };
    });
  }

  const currentMonth = startOfMonth(now);

  return Array.from({ length: 6 }, (_, index) => {
    const start = addMonths(currentMonth, index - 5);
    const end = addMonths(start, 1);

    return {
      key: start.toISOString(),
      label: formatMonth(start),
      value: items.filter((item) => isInRange(item, start, end)).length,
    };
  });
}

function MetricCard({ label, value, detail, icon: Icon, tone = "slate" }) {
  const tones = {
    slate: "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
    blue: "border-blue-200 bg-blue-50/70 dark:border-blue-900/60 dark:bg-blue-950/20",
    green: "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/60 dark:bg-emerald-950/20",
    amber: "border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/20",
    rose: "border-rose-200 bg-rose-50/70 dark:border-rose-900/60 dark:bg-rose-950/20",
  };

  return (
    <article className={`min-w-0 rounded-2xl border p-4 shadow-sm sm:p-5 ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold leading-5 text-slate-500 dark:text-slate-400">{label}</p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/80 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <p className="mt-3 break-words text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">{value}</p>

      {detail && <p className="mt-2 text-[11px] leading-5 text-slate-500 dark:text-slate-400">{detail}</p>}
    </article>
  );
}

function Panel({ title, description, icon: Icon, children, action }) {
  return (
    <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5 lg:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <Icon className="h-5 w-5" />
          </span>

          <div className="min-w-0">
            <h3 className="font-black text-slate-900 dark:text-white">{title}</h3>
            {description && <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
        </div>

        {action}
      </div>

      {children}
    </section>
  );
}

function TrendChart({ points }) {
  const maxValue = Math.max(1, ...points.map((point) => point.value));

  return (
    <div>
      <div className="flex h-52 items-end gap-2 border-b border-slate-200 pb-2 dark:border-slate-800 sm:gap-3">
        {points.map((point) => {
          const height = point.value === 0 ? 3 : Math.max(8, (point.value / maxValue) * 100);

          return (
            <div key={point.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2" title={`${point.label}: ${formatNumber(point.value)} laporan`}>
              <span className="text-[10px] font-bold text-slate-500">{point.value > 0 ? formatNumber(point.value) : ""}</span>
              <div className="flex h-[70%] w-full items-end justify-center">
                <div
                  className="
                    w-full max-w-10 rounded-t-lg
                    bg-indigo-500
                    transition-[height] duration-500 ease-in-out
                    motion-reduce:transition-none
                  "
                  style={{
                    height: `${height}%`,
                    minHeight: "3px",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex gap-2 sm:gap-3">
        {points.map((point) => (
          <span key={point.key} className="min-w-0 flex-1 truncate text-center text-[9px] font-semibold text-slate-400 sm:text-[10px]" title={point.label}>
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SupervisorDashboard({ allItems = [], cancellationRequests = [], loading = false }) {
  const [period, setPeriod] = useState("week");
  const [unitSort, setUnitSort] = useState("total");

  const now = useMemo(() => new Date(), []);

  const range = useMemo(() => getPeriodRange(period, new Date()), [period, loading]);

  const periodItems = useMemo(() => allItems.filter((item) => isInRange(item, range.start, range.end)), [allItems, range]);

  const previousItems = useMemo(() => allItems.filter((item) => isInRange(item, range.previousStart, range.previousEnd)), [allItems, range]);

  const statusCounts = useMemo(
    () => ({
      pending: countByStatus(periodItems, "PENDING_APPROVAL"),
      approved: countByStatus(periodItems, "APPROVED"),
      revision: countByStatus(periodItems, "REVISION"),
      rejected: countByStatus(periodItems, "REJECTED"),
    }),
    [periodItems],
  );

  const previousStatusCounts = useMemo(
    () => ({
      pending: countByStatus(previousItems, "PENDING_APPROVAL"),
      approved: countByStatus(previousItems, "APPROVED"),
      revision: countByStatus(previousItems, "REVISION"),
      rejected: countByStatus(previousItems, "REJECTED"),
    }),
    [previousItems],
  );

  const reportCount = periodItems.length;
  const previousReportCount = previousItems.length;

  const growth = previousReportCount === 0 ? null : ((reportCount - previousReportCount) / previousReportCount) * 100;

  const approvalRate = reportCount === 0 ? 0 : (statusCounts.approved / reportCount) * 100;

  const decidedCount = statusCounts.approved + statusCounts.revision + statusCounts.rejected;

  const decisionRate = reportCount === 0 ? 0 : (decidedCount / reportCount) * 100;

  const currentPending = allItems.filter((item) => item.approval_status === "PENDING_APPROVAL").length;

  const currentRevision = allItems.filter((item) => item.approval_status === "REVISION").length;

  const pendingCancellations = cancellationRequests.filter((item) => String(item.status || "").toUpperCase() === "PENDING").length;

  const periodCancellations = cancellationRequests.filter((item) => isInRange(item, range.start, range.end)).length;

  const trendPoints = useMemo(() => getTrendPoints(allItems, period, new Date()), [allItems, period]);

  const typeStats = useMemo(() => {
    const totalReports = periodItems.length;

    return REPORT_TYPES.map((type) => {
      const items = periodItems.filter((item) => item.entityType === type.key);

      const total = items.length;
      const approved = countByStatus(items, "APPROVED");
      const pending = countByStatus(items, "PENDING_APPROVAL");
      const revision = countByStatus(items, "REVISION");
      const rejected = countByStatus(items, "REJECTED");
      const decided = approved + revision + rejected;

      return {
        ...type,
        total,
        approved,
        pending,
        revision,
        rejected,
        decided,
        approvalRate: total ? (approved / total) * 100 : 0,
        decisionRate: total ? (decided / total) * 100 : 0,
        share: totalReports ? (total / totalReports) * 100 : 0,
      };
    });
  }, [periodItems]);

  const unitStats = useMemo(() => {
    const units = new Map();

    periodItems.forEach((item) => {
      const unit = String(item.unit || "UNIT TIDAK DIKETAHUI")
        .trim()
        .toUpperCase();

      if (!units.has(unit)) {
        units.set(unit, {
          unit,
          total: 0,
          approved: 0,
          pending: 0,
          revision: 0,
          rejected: 0,
          decided: 0,
          proposal: 0,
          otsArea: 0,
          targetCo: 0,
        });
      }

      const stats = units.get(unit);

      stats.total += 1;

      if (item.entityType === "proposal") stats.proposal += 1;
      if (item.entityType === "ots_area") stats.otsArea += 1;
      if (item.entityType === "target_co") stats.targetCo += 1;

      if (item.approval_status === "APPROVED") stats.approved += 1;
      if (item.approval_status === "PENDING_APPROVAL") stats.pending += 1;
      if (item.approval_status === "REVISION") stats.revision += 1;
      if (item.approval_status === "REJECTED") stats.rejected += 1;
    });

    return [...units.values()]
      .map((unit) => {
        const decided = unit.approved + unit.revision + unit.rejected;
        const followUp = unit.pending + unit.revision + unit.rejected;

        return {
          ...unit,
          decided,
          followUp,
          approvalRate: unit.total ? (unit.approved / unit.total) * 100 : 0,
          decisionRate: unit.total ? (decided / unit.total) * 100 : 0,
        };
      })
      .sort((a, b) => {
        if (unitSort === "approved") return b.approved - a.approved;
        if (unitSort === "pending") return b.pending - a.pending;
        if (unitSort === "revision") return b.revision - a.revision;
        if (unitSort === "approvalRate") {
          return b.approvalRate - a.approvalRate || b.total - a.total;
        }
        if (unitSort === "followUp") return b.followUp - a.followUp;

        return b.total - a.total;
      })
      .slice(0, 8);
  }, [periodItems, unitSort]);

  const recentItems = useMemo(() => [...allItems].sort((a, b) => (getTimestamp(b) ?? 0) - (getTimestamp(a) ?? 0)).slice(0, 5), [allItems]);

  const periodLabel =
    period === "day"
      ? new Intl.DateTimeFormat("id-ID", {
          dateStyle: "full",
        }).format(now)
      : period === "week"
        ? `${formatShortDate(range.start)} – ${formatShortDate(addDays(range.start, 6))}`
        : new Intl.DateTimeFormat("id-ID", {
            month: "long",
            year: "numeric",
          }).format(range.start);

  return (
    <div className="mb-8 space-y-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.15em] text-indigo-500">
              <Activity className="h-4 w-4" />
              Analitik operasional
            </div>

            <h2 className="mt-2 text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">Ringkasan kinerja laporan</h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{periodLabel}</p>
          </div>

          <div className="inline-flex w-full rounded-xl bg-slate-100 p-1 dark:bg-slate-800 sm:w-auto">
            {PERIODS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setPeriod(item.value)}
                className={`flex-1 rounded-lg px-4 py-2.5 text-xs font-black transition sm:flex-none ${
                  period === item.value ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50/70 px-5 py-3 dark:border-slate-800 dark:bg-slate-950/40 sm:px-6">
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
            <CalendarDays className="mr-1 inline h-3.5 w-3.5" />
            Total dan status di bawah dihitung berdasarkan tanggal pembuatan laporan dalam periode yang dipilih. Status mencerminkan kondisi laporan saat ini, bukan riwayat perubahan status.
          </p>
        </div>
      </section>

      {loading && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-300">
          <RefreshCw className="mr-2 inline h-4 w-4 animate-spin" />
          Memuat dan menghitung statistik...
        </div>
      )}

      <AnimatedSection animationKey={period} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Laporan dibuat"
          value={formatNumber(reportCount)}
          detail={`${range.label} · ${previousReportCount === 0 ? "Belum ada data periode pembanding" : `${growth > 0 ? "+" : ""}${formatPercent(growth)} ${range.comparisonLabel}`}`}
          icon={FileText}
          tone="blue"
        />

        <MetricCard label="Disetujui" value={formatNumber(statusCounts.approved)} detail={`Tingkat approval: ${formatPercent(approvalRate)} dari laporan periode ini`} icon={CheckCircle2} tone="green" />

        <MetricCard label="Masih menunggu approval" value={formatNumber(currentPending)} detail={`${formatNumber(statusCounts.pending)} dibuat pada periode ini`} icon={ClipboardList} tone="amber" />

        <MetricCard
          label="Perlu tindak lanjut"
          value={formatNumber(currentRevision + pendingCancellations)}
          detail={`${formatNumber(currentRevision)} revisi aktif · ${formatNumber(pendingCancellations)} pembatalan menunggu`}
          icon={ShieldAlert}
          tone="rose"
        />
      </AnimatedSection>

      <AnimatedSection animationKey={period} className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
        <Panel
          title="Tren pembuatan laporan"
          description={period === "day" ? "Jumlah laporan per hari selama 7 hari terakhir" : period === "week" ? "Jumlah laporan per minggu selama 8 minggu terakhir" : "Jumlah laporan per bulan selama 6 bulan terakhir"}
          icon={TrendingUp}
          action={<span className="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-[10px] font-black text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">BERDASARKAN created_at</span>}
        >
          {trendPoints.every((point) => point.value === 0) ? <div className="flex h-56 items-center justify-center text-center text-sm text-slate-400">Belum ada laporan pada rentang grafik ini.</div> : <TrendChart points={trendPoints} />}

          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-950/60">
            <span className="text-xs font-semibold text-slate-500">Total dalam rentang grafik</span>
            <span className="text-sm font-black text-slate-900 dark:text-white">{formatNumber(trendPoints.reduce((sum, point) => sum + point.value, 0))} laporan</span>
          </div>
        </Panel>

        <Panel title="Komposisi status" description={`Status terkini laporan yang dibuat ${range.label.toLowerCase()}`} icon={BarChart3}>
          <div className="space-y-5">
            {[
              {
                label: "Approved",
                count: statusCounts.approved,
                color: "bg-emerald-500",
              },
              {
                label: "Menunggu approval",
                count: statusCounts.pending,
                color: "bg-amber-500",
              },
              {
                label: "Perlu revisi",
                count: statusCounts.revision,
                color: "bg-orange-500",
              },
              {
                label: "Rejected",
                count: statusCounts.rejected,
                color: "bg-rose-500",
              },
            ].map((item) => {
              const percent = reportCount === 0 ? 0 : (item.count / reportCount) * 100;

              return (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{item.label}</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {formatNumber(item.count)} <span className="font-semibold text-slate-400">({formatPercent(percent)})</span>
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className={`h-full rounded-full transition-all ${item.color}`} style={{ width: `${Math.min(100, percent)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-400">Keputusan selain pending</p>
              <p className="mt-1 text-xl font-black text-slate-900 dark:text-white">{formatNumber(decidedCount)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-400">Rasio keputusan</p>
              <p className="mt-1 text-xl font-black text-slate-900 dark:text-white">{formatPercent(decisionRate)}</p>
            </div>
          </div>
        </Panel>
      </AnimatedSection>

      <AnimatedSection animationKey={period} className="grid min-w-0 gap-5 xl:grid-cols-2">
        {/* PERBANDINGAN TIGA JENIS LAPORAN */}
        <Panel title="Perbandingan jenis laporan" description="Volume, tingkat approval, dan distribusi status setiap jenis laporan" icon={Target}>
          <div className="space-y-5">
            {typeStats.map((type) => {
              const maxTotal = Math.max(1, ...typeStats.map((item) => item.total));

              const statuses = [
                { key: "approved", value: type.approved, color: "bg-emerald-500" },
                { key: "pending", value: type.pending, color: "bg-amber-500" },
                { key: "revision", value: type.revision, color: "bg-orange-500" },
                { key: "rejected", value: type.rejected, color: "bg-rose-500" },
              ];

              return (
                <div
                  key={type.key}
                  className="
                    rounded-2xl border border-slate-200 p-4
                    transition-all duration-300 ease-out
                    hover:-translate-y-0.5 hover:shadow-md
                    dark:border-slate-800
                    motion-reduce:transition-none
                  "
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{type.label}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatNumber(type.total)} laporan · {formatPercent(type.share)} dari total
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{formatPercent(type.approvalRate)}</p>
                      <p className="text-[10px] font-semibold text-slate-400">Tingkat approval</p>
                    </div>
                  </div>

                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all"
                      style={{
                        width: `${(type.total / maxTotal) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    {statuses.map((status) => (
                      <div
                        key={status.key}
                        className={`${status.color} transition-all`}
                        style={{
                          width: `${type.total ? (status.value / type.total) * 100 : 0}%`,
                        }}
                        title={`${status.key}: ${status.value}`}
                      />
                    ))}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4">
                    {statuses.map((status) => (
                      <div key={status.key} className="flex items-center gap-2">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${status.color}`} />
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-500">{status.key === "approved" ? "Approved" : status.key === "pending" ? "Pending" : status.key === "revision" ? "Revisi" : "Rejected"}</p>
                          <p className="text-xs font-black text-slate-800 dark:text-slate-200">{formatNumber(status.value)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <div>
                      <p className="text-[10px] text-slate-400">Tingkat keputusan</p>
                      <p className="mt-1 text-sm font-black text-slate-800 dark:text-slate-200">{formatPercent(type.decisionRate)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Belum diputuskan</p>
                      <p className="mt-1 text-sm font-black text-amber-600 dark:text-amber-400">{formatNumber(type.pending)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-[11px] leading-5 text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
            Tingkat approval = laporan Approved ÷ seluruh laporan jenis tersebut. Tingkat keputusan = Approved + Revisi + Rejected ÷ seluruh laporan.
          </div>
        </Panel>

        {/* PERFORMA CAPEM */}
        <Panel
          title="Performa per Capem"
          description="Produktivitas, kontribusi jenis laporan, tingkat approval, dan beban tindak lanjut"
          icon={Building2}
          action={
            <select
              value={unitSort}
              onChange={(event) => setUnitSort(event.target.value)}
              className="max-w-40 rounded-lg border border-slate-200 bg-white px-2 py-2 text-[10px] font-bold text-slate-600 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
            >
              <option value="total">Produktivitas</option>
              <option value="approved">Jumlah Approved</option>
              <option value="approvalRate">Tingkat approval</option>
              <option value="pending">Pending terbanyak</option>
              <option value="revision">Revisi terbanyak</option>
              <option value="followUp">Tindak lanjut terbanyak</option>
            </select>
          }
        >
          {unitStats.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">Belum ada data unit pada periode ini.</p>
          ) : (
            <div className="space-y-3">
              {unitStats.map((unit, index) => {
                const selectedValue =
                  unitSort === "approved"
                    ? unit.approved
                    : unitSort === "approvalRate"
                      ? unit.approvalRate
                      : unitSort === "pending"
                        ? unit.pending
                        : unitSort === "revision"
                          ? unit.revision
                          : unitSort === "followUp"
                            ? unit.followUp
                            : unit.total;

                return (
                  <div
                    key={unit.unit}
                    className="
                      rounded-2xl border border-slate-200 p-4
                      transition-all duration-300 ease-out
                      hover:-translate-y-0.5 hover:shadow-md
                      dark:border-slate-800
                      motion-reduce:transition-none
                    "
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">{index + 1}</span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-black text-slate-900 dark:text-white">{unit.unit}</p>

                          <p className="text-lg font-black text-slate-900 dark:text-white">{unitSort === "approvalRate" ? formatPercent(selectedValue) : formatNumber(selectedValue)}</p>
                        </div>

                        <p className="mt-1 text-[11px] text-slate-500">
                          {formatNumber(unit.total)} laporan · {formatNumber(unit.approved)} approved · {formatNumber(unit.followUp)} perlu tindak lanjut
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="mb-1.5 flex justify-between gap-2 text-[10px]">
                        <span className="font-semibold text-slate-500">Tingkat approval</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400">{formatPercent(unit.approvalRate)}</span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{
                            width: `${Math.min(100, unit.approvalRate)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {[
                        {
                          label: "Proposal",
                          value: unit.proposal,
                          color: "text-indigo-600 dark:text-indigo-400",
                        },
                        {
                          label: "OTS Area",
                          value: unit.otsArea,
                          color: "text-sky-600 dark:text-sky-400",
                        },
                        {
                          label: "Target CO",
                          value: unit.targetCo,
                          color: "text-violet-600 dark:text-violet-400",
                        },
                      ].map((report) => (
                        <div key={report.label} className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-950/60">
                          <p className="text-[10px] text-slate-500">{report.label}</p>
                          <p className={`mt-1 text-base font-black ${report.color}`}>{formatNumber(report.value)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-slate-100 pt-3 text-[10px] font-semibold dark:border-slate-800">
                      <span className="text-emerald-600 dark:text-emerald-400">Approved {unit.approved}</span>
                      <span className="text-amber-600 dark:text-amber-400">Pending {unit.pending}</span>
                      <span className="text-orange-600 dark:text-orange-400">Revisi {unit.revision}</span>
                      <span className="text-rose-600 dark:text-rose-400">Rejected {unit.rejected}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-[11px] leading-5 text-slate-500 dark:bg-slate-950/50 dark:text-slate-400">
            Peringkat dihitung berdasarkan filter yang dipilih. Beban tindak lanjut menjumlahkan Pending, Revisi, dan Rejected. Satu laporan dihitung berdasarkan status terkini.
          </div>
        </Panel>
      </AnimatedSection>

      <AnimatedSection animationKey={period} className="grid min-w-0 gap-5 xl:grid-cols-2">
        <Panel title="Pusat tindak lanjut" description="Backlog saat ini dan aktivitas pembatalan pada periode terpilih" icon={ShieldAlert}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
              <ClipboardList className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <p className="mt-3 text-xs font-bold text-slate-500 dark:text-slate-400">Semua laporan pending</p>
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{formatNumber(currentPending)}</p>
              <p className="mt-1 text-[10px] text-slate-500">Perlu diperiksa Supervisor</p>
            </div>

            <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-4 dark:border-orange-900/60 dark:bg-orange-950/20">
              <RefreshCw className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <p className="mt-3 text-xs font-bold text-slate-500 dark:text-slate-400">Semua laporan revisi</p>
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{formatNumber(currentRevision)}</p>
              <p className="mt-1 text-[10px] text-slate-500">Perlu tindak lanjut Sales</p>
            </div>

            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/20">
              <ShieldAlert className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <p className="mt-3 text-xs font-bold text-slate-500 dark:text-slate-400">Pembatalan pending</p>
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{formatNumber(pendingCancellations)}</p>
              <p className="mt-1 text-[10px] text-slate-500">Semua periode</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
              <FileText className="h-5 w-5 text-slate-500" />
              <p className="mt-3 text-xs font-bold text-slate-500 dark:text-slate-400">Permintaan pembatalan baru</p>
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{formatNumber(periodCancellations)}</p>
              <p className="mt-1 text-[10px] text-slate-500">Dibuat pada periode terpilih</p>
            </div>
          </div>
        </Panel>

        <Panel title="Laporan terbaru" description="Lima laporan terakhir berdasarkan waktu pembuatan" icon={Activity}>
          {recentItems.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">Belum ada laporan.</p>
          ) : (
            <div className="space-y-3">
              {recentItems.map((item) => {
                const meta = STATUS_META[item.approval_status] ?? {
                  label: item.approval_status || "Status tidak diketahui",
                  color: "bg-slate-400",
                };

                const typeLabel = REPORT_TYPES.find((type) => type.key === item.entityType)?.label ?? item.entityType;

                const title = item.cadeb ?? item.nama ?? item.nama_debitur ?? item.name ?? item.unit ?? "Laporan";

                return (
                  <div key={`${item.entityType}-${item.id}`} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${meta.color}`} />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black text-slate-800 dark:text-slate-200">{title}</p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {typeLabel}
                        {item.unit ? ` · ${item.unit}` : ""}
                        {` · ${formatShortDate(new Date(item.created_at))}`}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-[9px] font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">{meta.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </AnimatedSection>

      <p className="text-[11px] leading-5 text-slate-400">
        Interpretasi data: jumlah laporan dihitung berdasarkan waktu pembuatan. Status approval menggunakan status terkini pada data yang dimuat. Angka ini bukan jumlah keputusan approval yang terjadi dalam periode tersebut. Data mengikuti
        laporan aktif yang diberikan halaman Supervisor.
      </p>
    </div>
  );
}
