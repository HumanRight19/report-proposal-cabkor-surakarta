import { useMemo, useState } from "react";
import { AlertCircle, CalendarDays, CheckCircle2, LoaderCircle, Download, ChevronLeft, ChevronRight, Eye, FileCheck2, ListChecks, Search, Wallet, X } from "lucide-react";
import { exportMonitoringExcel } from "../../utils/exportMonitoringExcel";
import { formatRupiah } from "../../utils/format";

const UNITS = ["SURAKARTA", "NUSUKAN", "GADING", "BOYOLALI", "PALUR", "MANAHAN"];

const PAGE_SIZE = 12;

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("id-ID");
}

function isComplete(row) {
  return normalizeText(row.kelengkapan) === "sudah lengkap";
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

function approvalLabel(status) {
  const labels = {
    PENDING_APPROVAL: "Menunggu Approval",
    APPROVED: "Approved",
    REVISION: "Perlu Revisi",
    REJECTED: "Rejected",
  };

  return labels[status] || status || "Belum tersedia";
}

function approvalClass(status) {
  switch (status) {
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300";

    case "REVISION":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300";

    case "REJECTED":
      return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300";

    default:
      return "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
}

function OtsAreaMonitoringWorkspace({ otsArea = [], loading = false }) {
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("ALL");
  const [completenessFilter, setCompletenessFilter] = useState("ALL");
  const [approvalFilter, setApprovalFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const summary = useMemo(() => {
    const complete = otsArea.filter(isComplete).length;

    return {
      total: otsArea.length,
      complete,
      incomplete: otsArea.length - complete,
      totalPlafond: otsArea.reduce((total, row) => total + Number(row.plafond || 0), 0),
    };
  }, [otsArea]);

  const filteredData = useMemo(() => {
    const keyword = normalizeText(search);

    return [...otsArea]
      .filter((row) => {
        const matchesSearch = !keyword || [row.cadeb, row.nama, row.unit, row.usaha, row.nama_so, row.kelengkapan, row.kekurangan].some((value) => normalizeText(value).includes(keyword));

        const matchesUnit = unitFilter === "ALL" || row.unit === unitFilter;

        const matchesCompleteness = completenessFilter === "ALL" || (completenessFilter === "COMPLETE" && isComplete(row)) || (completenessFilter === "INCOMPLETE" && !isComplete(row));

        const matchesApproval = approvalFilter === "ALL" || row.approval_status === approvalFilter;

        return matchesSearch && matchesUnit && matchesCompleteness && matchesApproval;
      })
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [otsArea, search, unitFilter, completenessFilter, approvalFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedData = filteredData.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  async function handleExportExcel() {
    if (isExporting || loading) return;

    setIsExporting(true);

    try {
      // Beri kesempatan React menampilkan indikator loading.
      await new Promise((resolve) => window.setTimeout(resolve, 50));

      exportMonitoringExcel(filteredData, "Monitoring-OTS-Area", "OTS Area");
    } catch (error) {
      console.error("Gagal mengekspor data OTS Area:", error);
      window.alert("Gagal mengekspor Excel OTS Area. Silakan coba kembali.");
    } finally {
      setIsExporting(false);
    }
  }

  function updateFilter(setter, value) {
    setter(value);
    setCurrentPage(1);
  }

  return (
    <section className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Monitoring / OTS Area</p>

          <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white">Monitoring OTS Area</h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Pantau hasil OTS, kelengkapan berkas, dan status data dari seluruh unit dalam satu workspace.</p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <ListChecks className="h-4 w-4" />
          Semua Unit
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total OTS Area" value={summary.total.toLocaleString("id-ID")} icon={ListChecks} tone="indigo" />

        <SummaryCard label="Berkas Lengkap" value={summary.complete.toLocaleString("id-ID")} icon={CheckCircle2} tone="emerald" />

        <SummaryCard label="Belum Lengkap" value={summary.incomplete.toLocaleString("id-ID")} icon={AlertCircle} tone="rose" />

        <SummaryCard label="Total Plafond" value={formatRupiah(summary.totalPlafond)} icon={Wallet} tone="violet" compact />
      </div>

      {/* FILTERS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-400" />
          <h3 className="text-sm font-black text-slate-800 dark:text-white">Cari dan Filter Data</h3>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="relative sm:col-span-2 xl:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={search}
              onChange={(event) => updateFilter(setSearch, event.target.value)}
              placeholder="Cari nama, usaha, SO..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-950"
            />
          </div>

          <select
            value={unitFilter}
            onChange={(event) => updateFilter(setUnitFilter, event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="ALL">Semua Unit</option>
            {UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>

          <select
            value={completenessFilter}
            onChange={(event) => updateFilter(setCompletenessFilter, event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="ALL">Semua Kelengkapan</option>
            <option value="COMPLETE">Sudah Lengkap</option>
            <option value="INCOMPLETE">Belum Lengkap</option>
          </select>

          <select
            value={approvalFilter}
            onChange={(event) => updateFilter(setApprovalFilter, event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="ALL">Semua Status Approval</option>
            <option value="PENDING_APPROVAL">Menunggu Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REVISION">Perlu Revisi</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ditemukan <strong className="text-slate-800 dark:text-white">{filteredData.length.toLocaleString("id-ID")}</strong> data OTS Area
          </p>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setUnitFilter("ALL");
              setCompletenessFilter("ALL");
              setApprovalFilter("ALL");
              setCurrentPage(1);
            }}
            className="text-xs font-bold text-indigo-600 transition hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Reset filter
          </button>

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

      {/* DATA CARDS */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
          <p className="mt-3 text-sm font-semibold text-slate-500">Memuat data OTS Area...</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <ListChecks className="h-6 w-6" />
          </div>

          <h3 className="mt-4 font-bold text-slate-800 dark:text-white">Data OTS Area tidak ditemukan</h3>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Belum ada data atau tidak ada data yang sesuai dengan filter.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {paginatedData.map((row, index) => {
              const complete = isComplete(row);
              const rowNumber = (safePage - 1) * PAGE_SIZE + index + 1;

              return (
                <article key={row.id} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-black text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">{String(rowNumber).padStart(2, "0")}</span>

                      <div className="min-w-0">
                        <h3 className="break-words text-base font-black text-slate-900 dark:text-white">{row.cadeb || row.nama || "Tanpa nama"}</h3>

                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{row.unit || "Unit tidak tersedia"}</p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                        complete
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
                      }`}
                    >
                      {complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                      {complete ? "Sudah lengkap" : "Belum lengkap"}
                    </span>
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Plafond</p>
                    <p className="mt-1 break-words text-xl font-black text-slate-900 dark:text-white">{formatRupiah(row.plafond)}</p>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <InfoItem label="Usaha" value={row.usaha} />
                    <InfoItem label="Nama SO" value={row.nama_so} />
                    <InfoItem label="Tanggal Pengajuan" value={formatDate(row.created_at)} icon={CalendarDays} />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status Approval</p>
                      <span className={`mt-1 inline-flex max-w-full rounded-full border px-2.5 py-1 text-xs font-semibold ${approvalClass(row.approval_status)}`}>{approvalLabel(row.approval_status)}</span>
                    </div>
                  </div>

                  {!complete && row.kekurangan?.trim() && (
                    <div className="mt-3 rounded-xl border border-rose-200/80 bg-rose-50/60 p-3 dark:border-rose-500/20 dark:bg-rose-500/[0.06]">
                      <p className="text-xs font-bold text-rose-800 dark:text-rose-300">Kekurangan Berkas</p>
                      <p className="mt-1 line-clamp-2 break-words text-sm leading-5 text-rose-800/90 dark:text-rose-200/90">{row.kekurangan}</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelected(row)}
                    className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Eye className="h-4 w-4" />
                    Lihat Detail
                  </button>
                </article>
              );
            })}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Halaman {safePage} dari {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage === 1}
                  onClick={() => setCurrentPage((page) => page - 1)}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold disabled:opacity-40 dark:border-slate-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Sebelumnya
                </button>

                <button
                  type="button"
                  disabled={safePage === totalPages}
                  onClick={() => setCurrentPage((page) => page + 1)}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold disabled:opacity-40 dark:border-slate-700"
                >
                  Berikutnya
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* DETAIL MODAL */}
      {selected && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ots-monitoring-detail-title"
            className="my-auto w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-800">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider text-indigo-500">Detail Monitoring OTS</p>
                <h3 id="ots-monitoring-detail-title" className="mt-1 break-words text-lg font-black text-slate-900 dark:text-white">
                  {selected.cadeb || selected.nama || "Data OTS Area"}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selected.unit || "-"}</p>
              </div>

              <button type="button" onClick={() => setSelected(null)} aria-label="Tutup detail" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[65vh] space-y-4 overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoItem label="Nama Debitur" value={selected.cadeb || selected.nama} />
                <InfoItem label="Unit" value={selected.unit} />
                <InfoItem label="Usaha" value={selected.usaha} />
                <InfoItem label="Nama SO" value={selected.nama_so} />
                <InfoItem label="Plafond" value={formatRupiah(selected.plafond)} />
                <InfoItem label="Tanggal Pengajuan" value={formatDate(selected.created_at)} icon={CalendarDays} />
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Kelengkapan Berkas</p>
                <span
                  className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${
                    isComplete(selected)
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"
                  }`}
                >
                  {isComplete(selected) ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  {isComplete(selected) ? "Sudah lengkap" : "Belum lengkap"}
                </span>
              </div>

              {!isComplete(selected) && (
                <div className="rounded-xl border border-rose-200/80 bg-rose-50/60 p-4 dark:border-rose-500/20 dark:bg-rose-500/[0.06]">
                  <p className="text-xs font-bold text-rose-800 dark:text-rose-300">Kekurangan Berkas</p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-rose-800 dark:text-rose-200">{selected.kekurangan?.trim() || "Belum ada rincian kekurangan berkas."}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Status Approval</p>
                <span className={`mt-2 inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${approvalClass(selected.approval_status)}`}>{approvalLabel(selected.approval_status)}</span>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/30">
              <button type="button" onClick={() => setSelected(null)} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function SummaryCard({ label, value, icon: Icon, tone, compact = false }) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300",
    violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
  };

  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</p>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>

      <p className={`mt-4 break-words font-black tracking-tight text-slate-900 dark:text-white ${compact ? "text-base sm:text-lg" : "text-3xl"}`}>{value}</p>
    </article>
  );
}

function InfoItem({ label, value, icon: Icon }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </p>
      <p className="mt-1.5 break-words text-sm font-semibold text-slate-800 dark:text-slate-200">{value === null || value === undefined || value === "" ? "-" : value}</p>
    </div>
  );
}

export default OtsAreaMonitoringWorkspace;
