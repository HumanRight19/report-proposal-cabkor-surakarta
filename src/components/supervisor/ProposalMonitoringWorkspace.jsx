import { useMemo, useState } from "react";
import { Search, FileText, Eye, X, Download, LoaderCircle, ChevronDown, Wallet, CheckCircle2, Clock3, RotateCcw, Ban, CalendarDays, Building2, UserRound, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { exportMonitoringExcel } from "../../utils/exportMonitoringExcel";
import { formatRupiah } from "../../utils/format";

const UNITS = ["SURAKARTA", "NUSUKAN", "GADING", "BOYOLALI", "PALUR", "MANAHAN"];

const STATUS_OPTIONS = [
  { value: "PENDING_APPROVAL", label: "Menunggu Approval" },
  { value: "APPROVED", label: "Approved" },
  { value: "REVISION", label: "Perlu Revisi" },
  { value: "REJECTED", label: "Rejected" },
];

const PAGE_SIZE = 12;

function getDisplayName(item) {
  return item.cadeb || item.nama || "Data tanpa nama";
}

function getStatusLabel(status) {
  const found = STATUS_OPTIONS.find((item) => item.value === status);
  return found?.label || status || "Belum ada status";
}

function getStatusStyle(status) {
  switch (status) {
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-400";
    case "REVISION":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-400";
    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400";
    case "PENDING_APPROVAL":
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-400";
    default:
      return "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
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

function SummaryCard({ label, value, icon: Icon, color }) {
  const colors = {
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    red: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
  };

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Proposal</span>
      </div>

      <p className="mt-4 text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 break-words text-2xl font-black tracking-tight text-slate-900 dark:text-white">{value}</p>
    </article>
  );
}

function StatusBadge({ status }) {
  return <span className={`inline-flex max-w-full whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-black ${getStatusStyle(status)}`}>{getStatusLabel(status)}</span>;
}

function DetailItem({ label, value }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-slate-800 dark:text-slate-200">{value || "-"}</p>
    </div>
  );
}

function ProposalDetail({ proposal, onClose }) {
  if (!proposal) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="proposal-detail-title"
        className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-[28px] sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <FileText className="h-5 w-5" />
            </span>

            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">Detail Monitoring Proposal</p>
              <h3 id="proposal-detail-title" className="mt-1 break-words text-xl font-black text-slate-900 dark:text-white">
                {getDisplayName(proposal)}
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{proposal.unit || "Unit tidak tersedia"}</p>
            </div>
          </div>

          <button type="button" onClick={onClose} aria-label="Tutup detail" className="shrink-0 rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
          <p className="text-xs text-slate-500 dark:text-slate-400">Status persetujuan</p>
          <div className="mt-2">
            <StatusBadge status={proposal.approval_status} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DetailItem label="Nama Calon Debitur" value={getDisplayName(proposal)} />
          <DetailItem label="Unit / Capem" value={proposal.unit} />
          <DetailItem label="Plafond" value={formatRupiah(proposal.plafond)} />
          <DetailItem label="Fresh Money" value={formatRupiah(proposal.fresh_money)} />
          <DetailItem label="Produk" value={proposal.produk} />
          <DetailItem label="Jenis Usaha" value={proposal.usaha} />
          <DetailItem label="Nama SO" value={proposal.nama_so} />
          <DetailItem label="Dibuat pada" value={formatDate(proposal.created_at)} />
          <DetailItem label="Terakhir diperbarui" value={formatDate(proposal.updated_at)} />
          <DetailItem label="ID Proposal" value={proposal.id} />
        </div>

        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/70 p-3 dark:border-blue-900/50 dark:bg-blue-950/20">
          <p className="text-xs leading-5 text-blue-800 dark:text-blue-300">Halaman ini hanya untuk monitoring. Perubahan status dan keputusan approval tetap dilakukan melalui menu Approval.</p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-black text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          Tutup Detail
        </button>
      </section>
    </div>
  );
}

function ProposalCard({ item, onViewDetail }) {
  return (
    <article className="group flex min-w-0 flex-col rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-400/40">
      {/* Identitas debitur */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300">
            <UserRound size={21} />
          </div>

          <div className="min-w-0">
            <h3 className="break-words text-base font-bold text-slate-900 dark:text-white">{getDisplayName(item)}</h3>
            <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">{item.nama_so || "Nama SO belum tersedia"}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onViewDetail(item)}
          aria-label={`Lihat detail ${getDisplayName(item)}`}
          className="shrink-0 rounded-xl p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-400/10 dark:hover:text-blue-300"
        >
          <Eye size={19} />
        </button>
      </div>

      {/* Status */}
      <div className="mt-4">
        <StatusBadge status={item.approval_status} />
      </div>

      {/* Angka utama */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-700 dark:bg-slate-800/70">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Wallet size={15} />
            Plafond
          </div>
          <p className="mt-2 break-words text-sm font-bold text-slate-900 dark:text-white">{formatRupiah(item.plafond)}</p>
        </div>

        <div className="min-w-0 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3.5 dark:border-emerald-400/20 dark:bg-emerald-400/10">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <Wallet size={15} />
            Fresh Money
          </div>
          <p className="mt-2 break-words text-sm font-bold text-emerald-800 dark:text-emerald-200">{formatRupiah(item.fresh_money)}</p>
        </div>
      </div>

      {/* Metadata */}
      <div className="mt-4 space-y-3 rounded-2xl border border-slate-100 px-3.5 py-3 dark:border-slate-700">
        <div className="flex items-start justify-between gap-3">
          <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">Unit / Capem</span>
          <span className="break-words text-right text-xs font-semibold text-slate-800 dark:text-slate-200">{item.unit || "-"}</span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">Produk</span>
          <span className="break-words text-right text-xs font-semibold text-slate-800 dark:text-slate-200">{item.produk || "-"}</span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">Jenis Usaha</span>
          <span className="break-words text-right text-xs font-semibold text-slate-800 dark:text-slate-200">{item.usaha || "-"}</span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">Tanggal Pengajuan</span>
          <span className="text-right text-xs text-slate-500 dark:text-slate-400">{formatDate(item.created_at)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onViewDetail(item)}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-400/30 dark:hover:bg-blue-400/10 dark:hover:text-blue-300"
      >
        <Eye size={16} />
        Lihat Detail
      </button>
    </article>
  );
}

export default function ProposalMonitoringWorkspace({ proposals = [], loading = false }) {
  const [unitFilter, setUnitFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const safeProposals = Array.isArray(proposals) ? proposals : [];

  const summary = useMemo(() => {
    return {
      total: safeProposals.length,
      pending: safeProposals.filter((item) => item.approval_status === "PENDING_APPROVAL").length,
      approved: safeProposals.filter((item) => item.approval_status === "APPROVED").length,
      revision: safeProposals.filter((item) => item.approval_status === "REVISION").length,
      rejected: safeProposals.filter((item) => item.approval_status === "REJECTED").length,
    };
  }, [safeProposals]);

  const filteredProposals = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return [...safeProposals]
      .filter((item) => {
        return unitFilter === "ALL" || item.unit === unitFilter;
      })
      .filter((item) => {
        return statusFilter === "ALL" || item.approval_status === statusFilter;
      })
      .filter((item) => {
        if (!keyword) return true;

        const searchableValues = [getDisplayName(item), item.unit, item.produk, item.usaha, item.nama_so, item.id];

        return searchableValues.some((value) =>
          String(value ?? "")
            .toLowerCase()
            .includes(keyword),
        );
      })
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [safeProposals, unitFilter, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredProposals.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;

  const paginatedProposals = filteredProposals.slice(startIndex, startIndex + PAGE_SIZE);

  async function handleExportExcel() {
    if (isExporting || loading) return;

    setIsExporting(true);

    try {
      // Beri kesempatan React menampilkan indikator loading.
      await new Promise((resolve) => window.setTimeout(resolve, 50));

      exportMonitoringExcel(filteredProposals, "Monitoring-Proposal", "Proposal");
    } catch (error) {
      console.error("Gagal mengekspor data Proposal:", error);
      window.alert("Gagal mengekspor Excel Proposal. Silakan coba kembali.");
    } finally {
      setIsExporting(false);
    }
  }

  function resetFilters() {
    setSearch("");
    setUnitFilter("ALL");
    setStatusFilter("ALL");
    setPage(1);
  }

  function changeSearch(value) {
    setSearch(value);
    setPage(1);
  }

  function changeUnit(value) {
    setUnitFilter(value);
    setPage(1);
  }

  function changeStatus(value) {
    setStatusFilter(value);
    setPage(1);
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Supervisor Workspace</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">Monitoring Proposal</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Pantau data proposal dari setiap Capem, termasuk nilai plafond, Fresh Money, dan status pengajuan.</p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-900">
          <Building2 className="h-4 w-4" />
          Semua data proposal
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <SummaryCard label="Total Proposal" value={summary.total} icon={FileText} color="slate" />
        <SummaryCard label="Menunggu Approval" value={summary.pending} icon={Clock3} color="blue" />
        <SummaryCard label="Approved" value={summary.approved} icon={CheckCircle2} color="green" />
        <SummaryCard label="Perlu Revisi" value={summary.revision} icon={RotateCcw} color="amber" />
        <SummaryCard label="Rejected" value={summary.rejected} icon={Ban} color="red" />
      </div>

      {/* Filter */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => changeSearch(event.target.value)}
              placeholder="Cari nama debitur, produk, SO, atau ID..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-950"
            />
          </div>

          <div className="relative">
            <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={unitFilter}
              onChange={(event) => changeUnit(event.target.value)}
              aria-label="Filter unit"
              className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-xs font-bold text-slate-700 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 sm:w-48"
            >
              <option value="ALL">Semua Unit</option>
              {UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(event) => changeStatus(event.target.value)}
              aria-label="Filter status"
              className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-xs font-bold text-slate-700 outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 sm:w-52"
            >
              <option value="ALL">Semua Status</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500">
            Menampilkan{" "}
            <span className="font-black text-slate-900 dark:text-white">
              {filteredProposals.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + PAGE_SIZE, filteredProposals.length)}
            </span>{" "}
            dari <span className="font-black text-slate-900 dark:text-white">{filteredProposals.length}</span> proposal
          </p>

          {(search || unitFilter !== "ALL" || statusFilter !== "ALL") && (
            <button type="button" onClick={resetFilters} className="rounded-lg px-3 py-2 text-xs font-black text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white">
              Reset Filter
            </button>
          )}

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={loading || isExporting}
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

      {/* Daftar card */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-72 animate-pulse rounded-3xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
          ))}
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <FileText className="h-6 w-6" />
          </span>

          <h3 className="mt-4 text-base font-black text-slate-800 dark:text-white">{summary.total === 0 ? "Belum ada data proposal" : "Proposal tidak ditemukan"}</h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            {summary.total === 0 ? "Belum ada data proposal yang tersedia untuk ditampilkan." : "Tidak ada proposal yang cocok dengan pencarian atau filter saat ini."}
          </p>

          {summary.total > 0 && (
            <button type="button" onClick={resetFilters} className="mt-4 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white dark:bg-white dark:text-slate-900">
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {paginatedProposals.map((item) => (
              <ProposalCard key={item.id} item={item} onViewDetail={setSelected} />
            ))}
          </div>

          {/* Pagination */}
          {filteredProposals.length > PAGE_SIZE && (
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Halaman {currentPage} dari {totalPages}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{PAGE_SIZE} card per halaman maksimal</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <ChevronLeft size={16} />
                  Sebelumnya
                </button>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Berikutnya
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {selected && <ProposalDetail proposal={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
