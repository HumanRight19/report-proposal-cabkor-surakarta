import { useMemo, useState } from "react";
import { Archive, Check, CheckCircle2, Clock3, FileText, ListChecks, Search, Target, X } from "lucide-react";
import { formatRupiah } from "../../utils/format";

const ENTITY_META = {
  proposal: { label: "Proposal", icon: FileText },
  ots_area: { label: "OTS Area", icon: ListChecks },
  target_co: { label: "Target CO / Plan", icon: Target },
};

const STATUS_META = {
  PENDING: {
    label: "Menunggu Tinjauan",
    className: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  },
  APPROVED: {
    label: "Disetujui",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  REJECTED: {
    label: "Ditolak",
    className: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
  },
};

const UNITS = ["SURAKARTA", "NUSUKAN", "GADING", "BOYOLALI", "PALUR", "MANAHAN"];

function normalizeStatus(status) {
  return String(status || "").toUpperCase();
}

function getReportName(report, entityType) {
  if (!report) return "Data laporan tidak tersedia";

  if (entityType === "target_co") {
    return report.nama || report.cadeb || "Target CO tanpa nama";
  }

  return report.cadeb || report.nama || "Data tanpa nama";
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return (
    new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Jakarta",
    }).format(date) + " WIB"
  );
}

function getReportDetails(report) {
  if (!report) return [];

  const fields = [
    ["Nama Debitur / Target", report.cadeb || report.nama],
    ["Unit", report.unit],
    ["Plafond", report.plafond != null ? formatRupiah(report.plafond) : null],
    ["Fresh Money", report.fresh_money != null ? formatRupiah(report.fresh_money) : null],
    ["Produk", report.produk],
    ["Posisi", report.posisi],
    ["Jenis Usaha", report.usaha],
    ["Kelengkapan", report.kelengkapan],
    ["Kekurangan", report.kekurangan],
    ["Nama SO", report.nama_so],
    ["New Ijin", report.new_ijin],
    ["Status Approval Laporan", report.approval_status],
    ["Tanggal Laporan", formatDate(report.created_at)],
  ];

  return fields.filter(([, value]) => value !== null && value !== undefined && value !== "");
}

function CancellationWorkspace({ cancellationRequests = [], proposals = [], otsArea = [], targetCo = [], loading = false, onReview }) {
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [unitFilter, setUnitFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [action, setAction] = useState("");
  const [submittingId, setSubmittingId] = useState(null);
  const [localError, setLocalError] = useState("");

  const reportsByType = useMemo(
    () => ({
      proposal: proposals,
      ots_area: otsArea,
      target_co: targetCo,
    }),
    [proposals, otsArea, targetCo],
  );

  const requests = useMemo(() => {
    return cancellationRequests.map((request) => {
      const entityType = String(request.entity_type || "").toLowerCase();
      const report = (reportsByType[entityType] || []).find((item) => item.id === request.entity_id);

      return {
        ...request,
        entityType,
        report: report || null,
        normalizedStatus: normalizeStatus(request.status),
      };
    });
  }, [cancellationRequests, reportsByType]);

  const pendingCount = requests.filter((request) => request.normalizedStatus === "PENDING").length;

  const approvedCount = requests.filter((request) => request.normalizedStatus === "APPROVED").length;

  const rejectedCount = requests.filter((request) => request.normalizedStatus === "REJECTED").length;

  const filteredRequests = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return requests
      .filter((request) => {
        if (statusFilter !== "ALL" && request.normalizedStatus !== statusFilter) {
          return false;
        }

        if (typeFilter !== "ALL" && request.entityType !== typeFilter) {
          return false;
        }

        if (unitFilter !== "ALL" && request.report?.unit !== unitFilter) {
          return false;
        }

        if (!keyword) return true;

        const name = getReportName(request.report, request.entityType);

        return [name, request.report?.unit, request.reason, request.decision_note, ENTITY_META[request.entityType]?.label].filter(Boolean).some((value) => String(value).toLowerCase().includes(keyword));
      })
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  }, [requests, statusFilter, typeFilter, unitFilter, search]);

  function openDetail(request) {
    setSelected(request);
    setAction("");
    setDecisionNote("");
    setLocalError("");
  }

  function closeDetail() {
    if (submittingId) return;

    setSelected(null);
    setAction("");
    setDecisionNote("");
    setLocalError("");
  }

  async function submitDecision() {
    if (!selected || !action || submittingId) return;

    if (selected.normalizedStatus !== "PENDING" || typeof onReview !== "function") {
      return;
    }

    if (action === "REJECTED" && !decisionNote.trim()) {
      setLocalError("Catatan penolakan wajib diisi.");
      return;
    }

    setSubmittingId(selected.id);
    setLocalError("");

    try {
      await onReview(selected.id, action, decisionNote.trim());
      setSelected(null);
      setAction("");
      setDecisionNote("");
    } catch (error) {
      setLocalError(error?.message || "Gagal menyimpan keputusan pembatalan.");
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <section className="mt-8 space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Cancellation Workspace</p>

          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Pengajuan Pembatalan</h2>

            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">{pendingCount} menunggu</span>
          </div>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Tinjau alasan Sales sebelum menyetujui atau menolak pembatalan Proposal, OTS Area, dan Target CO.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard label="Menunggu Tinjauan" value={pendingCount} icon={Clock3} tone="amber" />
        <SummaryCard label="Disetujui" value={approvedCount} icon={CheckCircle2} tone="emerald" />
        <SummaryCard label="Ditolak" value={rejectedCount} icon={X} tone="rose" />
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama atau alasan..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </label>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="PENDING">Menunggu Tinjauan</option>
            <option value="ALL">Semua Status</option>
            <option value="APPROVED">Disetujui</option>
            <option value="REJECTED">Ditolak</option>
          </select>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="ALL">Semua Jenis Laporan</option>
            <option value="proposal">Proposal</option>
            <option value="ots_area">OTS Area</option>
            <option value="target_co">Target CO / Plan</option>
          </select>

          <select
            value={unitFilter}
            onChange={(event) => setUnitFilter(event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="ALL">Semua Unit</option>
            {UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Menampilkan {filteredRequests.length} dari {requests.length} permintaan
          </span>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatusFilter("PENDING");
              setTypeFilter("ALL");
              setUnitFilter("ALL");
            }}
            className="font-bold text-indigo-600 hover:text-indigo-500 dark:text-indigo-300"
          >
            Reset filter
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-500">Memuat permintaan pembatalan...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-300">
            <Archive className="h-7 w-7" />
          </div>
          <h3 className="mt-4 font-black text-slate-900 dark:text-white">Tidak ada permintaan yang cocok</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Coba ubah filter atau kata kunci pencarian.</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredRequests.map((request) => {
            const meta = ENTITY_META[request.entityType] || {
              label: request.entity_type || "Laporan",
              icon: FileText,
            };
            const Icon = meta.icon;
            const status = STATUS_META[request.normalizedStatus] || STATUS_META.PENDING;

            return (
              <article key={request.id} className="min-w-0 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <Icon className="h-5 w-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{meta.label}</p>
                    <h3 className="mt-1 break-words font-black text-slate-900 dark:text-white">{getReportName(request.report, request.entityType)}</h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Unit: {request.report?.unit || "Tidak tersedia"}</p>
                  </div>

                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${status.className}`}>{status.label}</span>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Alasan Sales</p>
                  <p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 dark:text-slate-200">{request.reason || "-"}</p>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    <p>Diajukan</p>
                    <p className="mt-1 font-semibold">{formatDate(request.created_at)}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openDetail(request)}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {request.normalizedStatus === "PENDING" ? "Tinjau Permintaan" : "Lihat Riwayat"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <button type="button" aria-label="Tutup detail pembatalan" disabled={Boolean(submittingId)} onClick={closeDetail} className="absolute inset-0 cursor-default" />

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancellation-detail-title"
            className="relative z-10 flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-slate-50 shadow-2xl dark:border-slate-700 dark:bg-slate-950 sm:rounded-3xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-300">Detail Pembatalan</p>
                <h3 id="cancellation-detail-title" className="mt-1 break-words text-xl font-black text-slate-900 dark:text-white">
                  {getReportName(selected.report, selected.entityType)}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {ENTITY_META[selected.entityType]?.label || selected.entity_type}
                  {" · "}
                  {selected.report?.unit || "Unit tidak tersedia"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeDetail}
                disabled={Boolean(submittingId)}
                aria-label="Tutup modal"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
              <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/60 dark:bg-rose-950/20">
                <p className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-300">Alasan Pembatalan dari Sales</p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-rose-900 dark:text-rose-100">{selected.reason || "Alasan tidak tersedia."}</p>
                <p className="mt-3 text-xs text-rose-700/80 dark:text-rose-300/80">Waktu pengajuan: {formatDate(selected.created_at)}</p>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                <h4 className="font-black text-slate-900 dark:text-white">Detail Laporan</h4>

                {selected.report ? (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {getReportDetails(selected.report).map(([label, value]) => (
                      <div key={label} className="min-w-0 rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                        <p className="mt-1 break-words whitespace-pre-wrap text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 rounded-xl border border-dashed border-slate-300 p-4 text-sm leading-6 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    Data laporan aktif tidak ditemukan. Permintaan dan riwayat keputusannya tetap tersedia di sini.
                  </p>
                )}
              </section>

              {selected.normalizedStatus !== "PENDING" && (
                <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <h4 className="font-black text-slate-900 dark:text-white">Riwayat Keputusan</h4>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Status: {STATUS_META[selected.normalizedStatus]?.label || selected.status}</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Diputuskan: {formatDate(selected.reviewed_at)}</p>
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 dark:text-slate-200">{selected.decision_note || "Tidak ada catatan keputusan."}</p>
                </section>
              )}

              {selected.normalizedStatus === "PENDING" && (
                <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-5">
                  <h4 className="font-black text-slate-900 dark:text-white">Keputusan Supervisor</h4>
                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">Jika disetujui, laporan akan dibatalkan sesuai aturan sistem. Jika ditolak, laporan tetap aktif.</p>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={Boolean(submittingId)}
                      onClick={() => {
                        setAction("APPROVED");
                        setLocalError("");
                      }}
                      className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-black transition disabled:opacity-50 ${
                        action === "APPROVED" ? "border-emerald-500 bg-emerald-600 text-white" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                      }`}
                    >
                      <Check className="h-4 w-4" />
                      Setujui Pembatalan
                    </button>

                    <button
                      type="button"
                      disabled={Boolean(submittingId)}
                      onClick={() => {
                        setAction("REJECTED");
                        setLocalError("");
                      }}
                      className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-black transition disabled:opacity-50 ${
                        action === "REJECTED" ? "border-rose-500 bg-rose-600 text-white" : "border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
                      }`}
                    >
                      <X className="h-4 w-4" />
                      Tolak Pembatalan
                    </button>
                  </div>

                  <label htmlFor="cancellation-decision-note" className="mt-4 block text-sm font-bold text-slate-700 dark:text-slate-200">
                    Catatan Keputusan {action === "REJECTED" && <span className="text-rose-500">*</span>}
                    {action === "APPROVED" && <span className="font-normal text-slate-400">(opsional)</span>}
                  </label>

                  <textarea
                    id="cancellation-decision-note"
                    value={decisionNote}
                    onChange={(event) => {
                      setDecisionNote(event.target.value);
                      setLocalError("");
                    }}
                    rows={3}
                    maxLength={1000}
                    disabled={Boolean(submittingId)}
                    placeholder={action === "REJECTED" ? "Jelaskan alasan penolakan agar dipahami Sales..." : "Tambahkan catatan jika diperlukan..."}
                    className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />

                  {localError && (
                    <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
                      {localError}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={submitDecision}
                    disabled={!action || Boolean(submittingId) || (action === "REJECTED" && !decisionNote.trim())}
                    className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    {submittingId === selected.id ? "Menyimpan keputusan..." : "Konfirmasi Keputusan"}
                  </button>
                </section>
              )}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function SummaryCard({ label, value, icon: Icon, tone }) {
  const tones = {
    amber: "border-amber-200 bg-amber-50/70 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300",
    emerald: "border-emerald-200 bg-emerald-50/70 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300",
    rose: "border-rose-200 bg-rose-50/70 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-300",
  };

  return (
    <article className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold">{label}</span>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-3xl font-black">{value}</p>
    </article>
  );
}

export default CancellationWorkspace;
