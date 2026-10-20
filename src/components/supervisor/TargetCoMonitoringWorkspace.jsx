import { useMemo, useState } from "react";
import { AlertCircle, CalendarDays, CheckCircle2, Download, ChevronLeft, ChevronRight, Eye, FileText, Search, Target, Wallet, X, Building2, UserRound, Clock3, LoaderCircle } from "lucide-react";
import { exportMonitoringExcel } from "../../utils/exportMonitoringExcel";
const UNITS = ["SURAKARTA", "NUSUKAN", "GADING", "BOYOLALI", "PALUR", "MANAHAN"];

const PAGE_SIZE = 12;

function formatRupiah(value) {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) return "Rp0";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(date) + " WIB"
  );
}

function getStatus(status) {
  const normalized = String(status ?? "").toUpperCase();

  const statuses = {
    PENDING_APPROVAL: {
      label: "Menunggu Persetujuan",
      className: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/20",
    },
    APPROVED: {
      label: "Disetujui",
      className: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20",
    },
    REVISION: {
      label: "Perlu Revisi",
      className: "bg-orange-50 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-400/10 dark:text-orange-300 dark:ring-orange-400/20",
    },
    REJECTED: {
      label: "Ditolak",
      className: "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/20",
    },
  };

  // Data lama tanpa status diperlakukan sebagai data yang disetujui.
  if (!normalized) return statuses.APPROVED;

  return (
    statuses[normalized] ?? {
      label: status,
      className: "bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:ring-slate-600",
    }
  );
}

function SummaryCard({ icon: Icon, label, value, description }) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>

          <p className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>

          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p>
        </div>

        <div className="shrink-0 rounded-xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
          <Icon size={21} />
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }) {
  const config = getStatus(status);

  return <span className={`inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-xs font-semibold ${config.className}`}>{config.label}</span>;
}

function DetailRow({ label, value }) {
  const displayValue = value === null || value === undefined || value === "" ? "-" : value;

  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-0 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
      <span className="shrink-0 text-sm text-slate-500 dark:text-slate-400">{label}</span>

      <span className="break-words text-sm font-semibold text-slate-800 dark:text-slate-100 sm:text-right">{displayValue}</span>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, accent = false }) {
  return (
    <div
      className={
        accent
          ? "min-w-0 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 shadow-sm dark:border-indigo-400/20 dark:bg-indigo-400/10"
          : "min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      }
    >
      <div className={accent ? "flex items-center gap-2 text-sm text-indigo-700 dark:text-indigo-300" : "flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400"}>
        <Icon size={17} />
        {label}
      </div>

      <p className={accent ? "mt-2 break-words text-xl font-bold text-indigo-800 dark:text-indigo-200" : "mt-2 break-words text-xl font-bold text-slate-900 dark:text-white"}>{value}</p>
    </div>
  );
}

function TargetCoDetailModal({ item, onClose }) {
  if (!item) return null;

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={handleBackdropClick}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="target-co-detail-title"
        className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-3xl sm:p-6"
      >
        {/* Header modal */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
              <Target size={23} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">Monitoring Supervisor</p>

              <h2 id="target-co-detail-title" className="mt-1 break-words text-xl font-bold text-slate-900 dark:text-white">
                {item.nama || "Data tanpa nama"}
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Detail laporan Target CO</p>
            </div>
          </div>

          <button type="button" onClick={onClose} aria-label="Tutup detail" className="shrink-0 rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Status dan tanggal laporan */}
        <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400">Status persetujuan</p>

            <div className="mt-2">
              <StatusBadge status={item.approval_status} />
            </div>
          </div>

          <div className="min-w-0 sm:text-right">
            <p className="text-xs text-slate-500 dark:text-slate-400">Tanggal laporan</p>

            <p className="mt-1 break-words text-sm font-semibold text-slate-800 dark:text-slate-200">{formatDate(item.created_at)}</p>
          </div>
        </div>

        {/* Ringkasan nilai */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MetricCard icon={Wallet} label="Plafond" value={formatRupiah(item.plafond)} />

          <MetricCard icon={Target} label="New Ijin" value={item.new_ijin || "-"} accent />
        </div>

        {/* Informasi laporan */}
        <div className="mt-6">
          <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">Informasi Laporan</h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Nama Debitur / Target CO</p>
              <p className="mt-2 break-words text-sm font-semibold text-slate-900 dark:text-white">{item.nama || "-"}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Unit</p>
              <p className="mt-2 break-words text-sm font-semibold text-slate-900 dark:text-white">{item.unit || "-"}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Nama SO</p>
              <p className="mt-2 break-words text-sm font-semibold text-slate-900 dark:text-white">{item.nama_so || "-"}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Produk</p>
              <p className="mt-2 break-words text-sm font-semibold text-slate-900 dark:text-white">{item.produk || "-"}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <CalendarDays size={14} />
                Tanggal Dibuat
              </div>
              <p className="mt-2 break-words text-sm font-semibold text-slate-900 dark:text-white">{formatDate(item.created_at)}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <Clock3 size={14} />
                Terakhir Diperbarui
              </div>
              <p className="mt-2 break-words text-sm font-semibold text-slate-900 dark:text-white">{formatDate(item.updated_at)}</p>
            </div>
          </div>
        </div>

        {/* Catatan supervisor */}
        {item.revision_note && (
          <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-400/20 dark:bg-orange-400/10">
            <div className="flex items-center gap-2 text-sm font-semibold text-orange-800 dark:text-orange-300">
              <AlertCircle size={17} />
              Catatan Supervisor
            </div>

            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-orange-800 dark:text-orange-200">{item.revision_note}</p>
          </div>
        )}

        {/* Footer modal */}
        <div className="mt-6 flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
          <button type="button" onClick={onClose} className="w-full rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 sm:w-auto">
            Tutup Detail
          </button>
        </div>
      </section>
    </div>
  );
}

function TargetCoCard({ item, onViewDetail }) {
  return (
    <article className="group flex min-w-0 flex-col rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-400/40">
      {/* Nama dan tombol detail */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
            <Target size={21} />
          </div>

          <div className="min-w-0">
            <h3 className="break-words text-base font-bold text-slate-900 dark:text-white">{item.nama || "Data tanpa nama"}</h3>

            <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">{item.nama_so || "Nama SO belum tersedia"}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onViewDetail(item)}
          aria-label={`Lihat detail ${item.nama || "Target CO"}`}
          className="shrink-0 rounded-xl p-2 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-400/10 dark:hover:text-indigo-300"
        >
          <Eye size={19} />
        </button>
      </div>

      {/* Status */}
      <div className="mt-4">
        <StatusBadge status={item.approval_status} />
      </div>

      {/* Nilai utama */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-800/70">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Wallet size={15} />
            Plafond
          </div>

          <p className="mt-2 break-words text-sm font-bold text-slate-900 dark:text-white">{formatRupiah(item.plafond)}</p>
        </div>

        <div className="min-w-0 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-3.5 dark:border-indigo-400/20 dark:bg-indigo-400/10">
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-700 dark:text-indigo-300">
            <Target size={15} />
            New Ijin
          </div>

          <p className="mt-2 break-words text-sm font-bold text-indigo-800 dark:text-indigo-200">{item.new_ijin || "-"}</p>
        </div>
      </div>

      {/* Metadata */}
      <div className="mt-4 space-y-3 rounded-2xl border border-slate-100 px-3.5 py-3 dark:border-slate-700">
        <div className="flex items-start justify-between gap-3">
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Building2 size={13} />
            Unit
          </span>

          <span className="break-words text-right text-xs font-semibold text-slate-800 dark:text-slate-200">{item.unit || "-"}</span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">Produk</span>

          <span className="break-words text-right text-xs font-semibold text-slate-800 dark:text-slate-200">{item.produk || "-"}</span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <CalendarDays size={13} />
            Tanggal Laporan
          </span>

          <span className="text-right text-xs text-slate-500 dark:text-slate-400">{formatDate(item.created_at)}</span>
        </div>
      </div>

      {/* Catatan revisi */}
      {item.revision_note && (
        <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-3.5 dark:border-orange-400/20 dark:bg-orange-400/10">
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-800 dark:text-orange-300">
            <AlertCircle size={15} />
            Catatan Supervisor
          </div>

          <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-xs leading-5 text-orange-800 dark:text-orange-200">{item.revision_note}</p>
        </div>
      )}

      {/* Tombol detail */}
      <button
        type="button"
        onClick={() => onViewDetail(item)}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-400/30 dark:hover:bg-indigo-400/10 dark:hover:text-indigo-300"
      >
        <Eye size={16} />
        Lihat Detail
      </button>
    </article>
  );
}

export default function TargetCoMonitoringWorkspace({ targetCo = [], loading = false }) {
  const [search, setSearch] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("SEMUA UNIT");
  const [selectedStatus, setSelectedStatus] = useState("SEMUA STATUS");
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...targetCo]
      .filter((item) => {
        const searchableValues = [item.nama, item.unit, item.nama_so, item.produk, item.revision_note];

        const matchesSearch =
          !query ||
          searchableValues.some((value) =>
            String(value ?? "")
              .toLowerCase()
              .includes(query),
          );

        const matchesUnit = selectedUnit === "SEMUA UNIT" || item.unit === selectedUnit;

        const status = String(item.approval_status ?? "APPROVED").toUpperCase();

        const matchesStatus = selectedStatus === "SEMUA STATUS" || status === selectedStatus;

        return matchesSearch && matchesUnit && matchesStatus;
      })
      .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
  }, [targetCo, search, selectedUnit, selectedStatus]);

  const summary = useMemo(() => {
    const totalPlafond = targetCo.reduce((sum, item) => sum + (Number(item.plafond) || 0), 0);

    const pending = targetCo.filter((item) => String(item.approval_status ?? "").toUpperCase() === "PENDING_APPROVAL").length;

    const approved = targetCo.filter((item) => !item.approval_status || String(item.approval_status).toUpperCase() === "APPROVED").length;

    const revisions = targetCo.filter((item) => String(item.approval_status ?? "").toUpperCase() === "REVISION").length;

    return {
      total: targetCo.length,
      totalPlafond,
      pending,
      approved,
      revisions,
    };
  }, [targetCo]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleRows = rows.slice(startIndex, startIndex + PAGE_SIZE);

  async function handleExportExcel() {
    if (isExporting || loading) return;

    if (rows.length === 0) {
      window.alert("Tidak ada data Target CO untuk diekspor.");
      return;
    }

    setIsExporting(true);

    try {
      // Beri kesempatan React menampilkan indikator loading.
      await new Promise((resolve) => window.setTimeout(resolve, 50));

      // Ekspor seluruh data sesuai filter, bukan hanya halaman aktif.
      exportMonitoringExcel(rows, "Monitoring-Target-CO", "Target CO");
    } catch (error) {
      console.error("Gagal mengekspor data Target CO:", error);
      window.alert("Gagal mengekspor Excel Target CO. Silakan coba kembali.");
    } finally {
      setIsExporting(false);
    }
  }

  function updateFilter(setter, value) {
    setter(value);
    setPage(1);
  }

  function resetFilters() {
    setSearch("");
    setSelectedUnit("SEMUA UNIT");
    setSelectedStatus("SEMUA STATUS");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
              <Target size={22} />
            </div>

            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">Monitoring Target CO</h1>
          </div>

          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Pantau laporan Target CO, nilai plafond, New Ijin, dan status persetujuan dari seluruh unit.</p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          <CalendarDays size={15} />
          Data laporan
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={FileText} label="Total Laporan" value={summary.total} description="Seluruh laporan Target CO" />

        <SummaryCard icon={Wallet} label="Total Plafond" value={formatRupiah(summary.totalPlafond)} description="Akumulasi plafond seluruh laporan" />

        <SummaryCard icon={CheckCircle2} label="Disetujui" value={summary.approved} description="Laporan berstatus disetujui" />

        <SummaryCard icon={AlertCircle} label="Perlu Ditindaklanjuti" value={summary.pending + summary.revisions} description={`${summary.pending} menunggu · ${summary.revisions} revisi`} />
      </div>

      {/* Filter dan daftar laporan */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5">
          <div className="flex flex-col gap-3 xl:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                value={search}
                onChange={(event) => updateFilter(setSearch, event.target.value)}
                placeholder="Cari nama, unit, SO, produk, atau catatan..."
                aria-label="Cari laporan Target CO"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:w-[420px]">
              <select
                value={selectedUnit}
                onChange={(event) => updateFilter(setSelectedUnit, event.target.value)}
                aria-label="Filter unit"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="SEMUA UNIT">Semua Unit</option>

                {UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(event) => updateFilter(setSelectedStatus, event.target.value)}
                aria-label="Filter status persetujuan"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="SEMUA STATUS">Semua Status</option>
                <option value="PENDING_APPROVAL">Menunggu Persetujuan</option>
                <option value="APPROVED">Disetujui</option>
                <option value="REVISION">Perlu Revisi</option>
                <option value="REJECTED">Ditolak</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Menampilkan{" "}
              <strong className="text-slate-700 dark:text-slate-200">
                {rows.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, rows.length)}
              </strong>{" "}
              dari <strong className="text-slate-700 dark:text-slate-200">{rows.length}</strong> laporan
            </span>

            {(search || selectedUnit !== "SEMUA UNIT" || selectedStatus !== "SEMUA STATUS") && (
              <button type="button" onClick={resetFilters} className="font-semibold text-indigo-600 transition hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-200">
                Reset filter
              </button>
            )}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={loading || isExporting || rows.length === 0}
                aria-live="polite"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:hover:bg-emerald-400/20"
              >
                {isExporting ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    Menyiapkan Excel...
                  </>
                ) : (
                  <>
                    <Download size={17} />
                    Export Excel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="h-72 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : visibleRows.length === 0 ? (
          /* Empty state */
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
              <Target size={25} />
            </div>

            <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">Data Target CO tidak ditemukan</h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">Belum ada laporan yang sesuai dengan pencarian atau filter yang dipilih.</p>

            {(search || selectedUnit !== "SEMUA UNIT" || selectedStatus !== "SEMUA STATUS") && (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Reset filter
              </button>
            )}
          </div>
        ) : (
          /* Card list */
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleRows.map((item) => (
              <TargetCoCard key={item.id} item={item} onViewDetail={setSelectedItem} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && rows.length > PAGE_SIZE && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Halaman {currentPage} dari {totalPages}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <ChevronLeft size={16} />
                Sebelumnya
              </button>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Berikutnya
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Detail modal */}
      {selectedItem && <TargetCoDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
    </div>
  );
}
