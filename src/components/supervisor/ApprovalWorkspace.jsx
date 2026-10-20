import { Check, ChevronRight, FileText, ListChecks, RotateCcw, Target, X, CalendarDays, Clock3, Wallet, Building2, ClipboardCheck, Info } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatRupiah } from "../../utils/format";

const ENTITY_META = {
  proposal: {
    label: "Proposal",
    icon: FileText,
  },
  ots_area: {
    label: "OTS Area",
    icon: ListChecks,
  },
  target_co: {
    label: "Plan",
    icon: Target,
  },
};

function statusLabel(status) {
  if (status === "PENDING_APPROVAL") return "Menunggu Approval";
  if (status === "REVISION") return "Perlu Revisi";
  if (status === "APPROVED") return "Approved";
  if (status === "REJECTED") return "Rejected";

  return status || "-";
}

function statusClass(status) {
  if (status === "APPROVED") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (status === "REVISION") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  if (status === "REJECTED") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  return "bg-slate-100 text-slate-600 border-slate-200";
}

function getDisplayName(item) {
  return item.cadeb || item.nama || "Data tanpa nama";
}

const FIELD_LABELS = {
  cadeb: "Nama Debitur",
  nama: "Nama Target CO",
  unit: "Unit",
  plafond: "Plafond",
  fresh_money: "Fresh Money",
  produk: "Produk",
  posisi: "Posisi",
  usaha: "Jenis Usaha",
  kelengkapan: "Kelengkapan",
  kekurangan: "Kekurangan",
  nama_so: "Nama SO",
  new_ijin: "New Ijin",
  approval_status: "Status Approval",
  revision_note: "Catatan Supervisor",
  created_at: "Tanggal Pengajuan",
  updated_at: "Terakhir Diperbarui",
};

const SYSTEM_FIELDS = new Set(["id", "entityType", "created_by", "updated_by", "reviewed_by", "reviewed_at", "approval_status", "revision_note", "created_at", "updated_at"]);

const DETAIL_FIELD_ORDER = {
  proposal: ["cadeb", "unit", "plafond", "fresh_money", "produk", "posisi"],
  ots_area: ["cadeb", "unit", "usaha", "plafond", "kelengkapan", "kekurangan", "nama_so"],
  target_co: ["nama", "unit", "plafond", "new_ijin", "produk"],
};

function getFieldLabel(key) {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];

  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDetailValue(key, value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (key === "plafond" || key === "fresh_money") {
    return formatRupiah(value);
  }

  if (key === "created_at" || key === "updated_at" || key === "reviewed_at") {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return String(value);

    return (
      new Intl.DateTimeFormat("id-ID", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "Asia/Jakarta",
      }).format(date) + " WIB"
    );
  }

  if (typeof value === "boolean") {
    return value ? "Ya" : "Tidak";
  }

  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "-";
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

function getSubmissionFields(item) {
  const preferredOrder = DETAIL_FIELD_ORDER[item.entityType] ?? [];
  const entries = Object.entries(item).filter(([key, value]) => !SYSTEM_FIELDS.has(key) && key !== "entityType" && value !== undefined);

  entries.sort(([keyA], [keyB]) => {
    const indexA = preferredOrder.indexOf(keyA);
    const indexB = preferredOrder.indexOf(keyB);

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }

    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    return keyA.localeCompare(keyB);
  });

  return entries;
}

function ApprovalWorkspace({ proposals, otsArea, targetCo, loading, onReview }) {
  const [unitFilter, setUnitFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState(null);
  const [modalEntered, setModalEntered] = useState(false);

  useEffect(() => {
    if (!selected) {
      setModalEntered(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setModalEntered(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [selected]);

  const [action, setAction] = useState(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const items = useMemo(() => {
    return [
      ...proposals.map((item) => ({
        ...item,
        entityType: "proposal",
      })),
      ...otsArea.map((item) => ({
        ...item,
        entityType: "ots_area",
      })),
      ...targetCo.map((item) => ({
        ...item,
        entityType: "target_co",
      })),
    ];
  }, [proposals, otsArea, targetCo]);

  const pendingItems = useMemo(() => {
    return items
      .filter((item) => item.approval_status === "PENDING_APPROVAL")
      .filter((item) => {
        if (unitFilter === "ALL") return true;
        return item.unit === unitFilter;
      })
      .filter((item) => {
        if (typeFilter === "ALL") return true;
        return item.entityType === typeFilter;
      })
      .filter((item) => {
        if (!search.trim()) return true;

        const keyword = search.trim().toLowerCase();

        return [getDisplayName(item), item.unit, item.produk, item.usaha, item.nama_so].filter(Boolean).some((value) => String(value).toLowerCase().includes(keyword));
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [items, unitFilter, typeFilter, search]);

  const pendingCount = items.filter((item) => item.approval_status === "PENDING_APPROVAL").length;

  async function submitReview() {
    if (!selected || !action || submitting) {
      return;
    }

    if ((action === "REVISION" || action === "REJECTED") && !note.trim()) {
      return;
    }

    setSubmitting(true);

    try {
      await onReview({
        entityType: selected.entityType,
        entityId: selected.id,
        action,
        note: note.trim() || null,
      });

      setSelected(null);
      setAction(null);
      setNote("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-5">
      <div
        className="
          flex flex-col gap-4
          xl:flex-row xl:items-end xl:justify-between
        "
      >
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Approval Workspace</p>

          <div className="mt-1 flex items-center gap-3">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Data Menunggu Approval</h2>

            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">{pendingCount}</span>
          </div>

          <p className="mt-1 text-sm text-slate-500">Periksa data Sales sebelum disetujui, direvisi, atau ditolak.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={unitFilter}
            onChange={(event) => setUnitFilter(event.target.value)}
            className="
              h-10 rounded-xl border border-slate-200
              bg-white px-3 text-xs font-bold text-slate-700
              outline-none
              focus:border-slate-400
              dark:border-slate-700
              dark:bg-slate-900
              dark:text-slate-200
            "
          >
            <option value="ALL">Semua Unit</option>
            <option value="SURAKARTA">SURAKARTA</option>
            <option value="NUSUKAN">NUSUKAN</option>
            <option value="GADING">GADING</option>
            <option value="BOYOLALI">BOYOLALI</option>
            <option value="PALUR">PALUR</option>
            <option value="MANAHAN">MANAHAN</option>
          </select>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="
              h-10 rounded-xl border border-slate-200
              bg-white px-3 text-xs font-bold text-slate-700
              outline-none
              focus:border-slate-400
              dark:border-slate-700
              dark:bg-slate-900
              dark:text-slate-200
            "
          >
            <option value="ALL">Semua Menu</option>
            <option value="proposal">Proposal</option>
            <option value="ots_area">OTS Area</option>
            <option value="target_co">Plan</option>
          </select>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama / unit..."
            className="
              h-10 w-full rounded-xl border border-slate-200
              bg-white px-3 text-xs font-medium
              outline-none
              focus:border-slate-400
              sm:w-52
              dark:border-slate-700
              dark:bg-slate-900
              dark:text-slate-200
            "
          />
        </div>
      </div>

      {loading ? (
        <div
          className="
            rounded-3xl border border-slate-200
            bg-white p-12 text-center
            shadow-sm
            dark:border-slate-800 dark:bg-slate-900
          "
        >
          <p className="text-sm font-semibold text-slate-400">Memuat approval...</p>
        </div>
      ) : pendingItems.length === 0 ? (
        <div
          className="
            rounded-3xl border border-dashed border-slate-300
            bg-white p-14 text-center
            dark:border-slate-700 dark:bg-slate-900
          "
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30">
            <Check className="h-7 w-7" />
          </div>

          <h3 className="mt-4 text-base font-black text-slate-800 dark:text-white">Semua sudah diperiksa</h3>

          <p className="mt-1 text-sm text-slate-400">Tidak ada data yang sedang menunggu approval.</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {pendingItems.map((item) => {
            const meta = ENTITY_META[item.entityType];
            const Icon = meta.icon;

            return (
              <article
                key={`${item.entityType}-${item.id}`}
                className="
                  group rounded-3xl
                  border border-slate-200/80
                  bg-white p-5
                  shadow-[0_8px_30px_rgba(15,23,42,0.05)]
                  transition
                  hover:-translate-y-0.5
                  hover:shadow-[0_12px_35px_rgba(15,23,42,0.08)]
                  dark:border-slate-800
                  dark:bg-slate-900
                "
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="
                        flex h-11 w-11 shrink-0 items-center justify-center
                        rounded-2xl bg-slate-100
                        text-slate-600
                        dark:bg-slate-800 dark:text-slate-300
                      "
                    >
                      <Icon className="h-5 w-5" />
                    </span>

                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{meta.label}</p>

                      <h3 className="truncate text-base font-black text-slate-900 dark:text-white">{getDisplayName(item)}</h3>
                    </div>
                  </div>

                  <span
                    className={`
                      shrink-0 rounded-full border px-2.5 py-1
                      text-[10px] font-black
                      ${statusClass(item.approval_status)}
                    `}
                  >
                    {statusLabel(item.approval_status)}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Unit</p>

                    <p className="mt-1 text-xs font-black text-slate-700 dark:text-slate-200">{item.unit || "-"}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Plafond</p>

                    <p className="mt-1 text-xs font-black text-slate-700 dark:text-slate-200">{formatRupiah(item.plafond)}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Produk</p>

                    <p className="mt-1 truncate text-xs font-black text-slate-700 dark:text-slate-200">{item.produk || "-"}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  className="
                    mt-4 flex w-full items-center justify-between
                    rounded-2xl border border-slate-200
                    bg-white px-4 py-3
                    text-xs font-black text-slate-700
                    transition
                    hover:bg-slate-50
                    dark:border-slate-700
                    dark:bg-slate-900
                    dark:text-slate-200
                    dark:hover:bg-slate-800
                  "
                >
                  <span>Periksa Detail</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </article>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-5">
          {/* Backdrop dengan transisi */}
          <button
            type="button"
            onClick={() => {
              if (!submitting) {
                setModalEntered(false);
                window.setTimeout(() => {
                  setSelected(null);
                  setAction(null);
                  setNote("");
                }, 180);
              }
            }}
            className={`absolute inset-0 bg-slate-950/55 backdrop-blur-sm transition-opacity duration-200 ease-out ${modalEntered ? "opacity-100" : "opacity-0"}`}
            aria-label="Tutup detail"
          />

          {/* Modal */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="approval-detail-title"
            className={`relative z-10 flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-2xl shadow-slate-950/20 transition-all duration-200 ease-out dark:border-slate-700 dark:bg-slate-950 ${
              modalEntered ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-[0.98] opacity-0"
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
                  {(() => {
                    const Icon = ENTITY_META[selected.entityType]?.icon ?? FileText;
                    return <Icon size={23} />;
                  })()}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">Detail Pengajuan</span>

                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass(selected.approval_status)}`}>{statusLabel(selected.approval_status)}</span>
                  </div>

                  <h3 id="approval-detail-title" className="mt-1 break-words text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {getDisplayName(selected)}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {ENTITY_META[selected.entityType]?.label} · {selected.unit || "Unit tidak tersedia"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setModalEntered(false);
                  window.setTimeout(() => {
                    setSelected(null);
                    setAction(null);
                    setNote("");
                  }, 180);
                }}
                aria-label="Tutup detail pengajuan"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <X size={19} />
              </button>
            </div>

            {/* Konten modal */}
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
              {/* Ringkasan pengajuan */}
              <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <Building2 size={15} />
                    Unit Pengajuan
                  </div>
                  <p className="mt-2 break-words text-base font-bold text-slate-900 dark:text-white">{selected.unit || "-"}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <Wallet size={15} />
                    Plafond
                  </div>
                  <p className="mt-2 break-words text-base font-bold text-slate-900 dark:text-white">{formatRupiah(selected.plafond)}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <CalendarDays size={15} />
                    Tanggal Pengajuan
                  </div>
                  <p className="mt-2 break-words text-sm font-bold text-slate-900 dark:text-white">{formatDetailValue("created_at", selected.created_at)}</p>
                </div>
              </section>

              {/* Semua field pengajuan */}
              <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-300">
                    <ClipboardCheck size={19} />
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Data Pengajuan {ENTITY_META[selected.entityType]?.label}</h4>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Rincian data yang dikirim Sales untuk diperiksa Supervisor.</p>
                  </div>
                </div>

                {getSubmissionFields(selected).length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {getSubmissionFields(selected).map(([key, value]) => (
                      <div key={key} className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 p-3.5 transition-colors hover:border-indigo-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-indigo-400/20">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{getFieldLabel(key)}</p>

                        <p className="mt-2 break-words whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-800 dark:text-slate-100">{formatDetailValue(key, value)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500 dark:border-slate-700">Belum ada detail pengajuan yang tersedia.</div>
                )}
              </section>

              {/* Metadata approval */}
              <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center gap-2">
                  <Info size={17} className="text-slate-500 dark:text-slate-400" />
                  <h4 className="font-bold text-slate-900 dark:text-white">Informasi Approval</h4>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-950">
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Status Saat Ini</p>
                    <div className="mt-2">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass(selected.approval_status)}`}>{statusLabel(selected.approval_status)}</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-950">
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <Clock3 size={14} />
                      Terakhir Diperbarui
                    </div>
                    <p className="mt-2 break-words text-sm font-semibold text-slate-800 dark:text-slate-100">{formatDetailValue("updated_at", selected.updated_at)}</p>
                  </div>
                </div>

                {selected.revision_note && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-400/20 dark:bg-amber-400/10">
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Catatan Supervisor Sebelumnya</p>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-amber-900 dark:text-amber-200">{selected.revision_note}</p>
                  </div>
                )}
              </section>

              {/* Keputusan Supervisor */}
              <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4">
                  <h4 className="font-bold text-slate-900 dark:text-white">Keputusan Supervisor</h4>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Pilih keputusan berdasarkan hasil pemeriksaan data pengajuan.</p>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <ActionButton active={action === "APPROVED"} icon={Check} label="Approve" onClick={() => setAction("APPROVED")} disabled={submitting} variant="approve" />

                  <ActionButton active={action === "REVISION"} icon={RotateCcw} label="Kembalikan untuk Revisi" onClick={() => setAction("REVISION")} disabled={submitting} variant="revision" />

                  <ActionButton active={action === "REJECTED"} icon={X} label="Reject" onClick={() => setAction("REJECTED")} disabled={submitting} variant="reject" />
                </div>

                {(action === "REVISION" || action === "REJECTED") && (
                  <div className="mt-4">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Alasan Revisi / Penolakan
                      <span className="ml-1 text-red-500">*</span>
                    </label>

                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      rows={4}
                      required
                      placeholder="Tuliskan alasan yang jelas dan mudah dipahami Sales..."
                      className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                    />

                    {!note.trim() && <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">Alasan wajib diisi untuk revisi atau penolakan.</p>}
                  </div>
                )}

                <button
                  type="button"
                  disabled={submitting || !action || ((action === "REVISION" || action === "REJECTED") && !note.trim())}
                  onClick={submitReview}
                  className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  {submitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Menyimpan keputusan...
                    </>
                  ) : (
                    "Simpan Keputusan"
                  )}
                </button>
              </section>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p>

      <p className="mt-1 break-words text-xs font-bold text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  );
}

function ActionButton({ icon: Icon, label, active, onClick, disabled, variant }) {
  const variants = {
    approve: "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
    revision: "border-amber-200 text-amber-700 hover:bg-amber-50",
    reject: "border-red-200 text-red-700 hover:bg-red-50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        flex h-11 items-center justify-center gap-2
        rounded-xl border
        text-xs font-black
        transition
        disabled:opacity-50
        ${variants[variant]}
        ${active ? "ring-2 ring-slate-900/10 dark:ring-white/10" : ""}
      `}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

export default ApprovalWorkspace;
