import { useMemo, useState } from "react";

import { KELENGKAPAN_OPTIONS } from "../../constants/report";
import { exportToExcel } from "../../utils/exportExcel";
import { formatMoneyInput, formatRupiah, parseMoney } from "../../utils/format";

import { CheckCircle2, AlertCircle, Eye, X } from "lucide-react";

import ApprovalStatusBadge from "./ApprovalStatusBadge";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const inputClass =
  "mt-1.5 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-300 [color-scheme:light] dark:[color-scheme:dark]";

const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300";

const buttonSecondary =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800";

function OtsAreaReport({
  otsArea = [],
  loading = false,
  saving = false,
  deletingId = null,
  cancellationRequests = [],
  cancellationLoading = false,
  completenessSavingId = null,
  onCreate,
  onRequestCancellation,
  onUpdateApprovedCompleteness,
  onUpdatePending,
  onResubmit,
}) {
  const [form, setForm] = useState({
    cadeb: "",
    usaha: "",
    plafond: "",
    kelengkapan: "",
    kekurangan: "",
    namaSo: "",
  });

  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState(null);
  const [cancellationTarget, setCancellationTarget] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [completenessTarget, setCompletenessTarget] = useState(null);

  const [completenessForm, setCompletenessForm] = useState({
    kelengkapan: "",
    kekurangan: "",
    reason: "",
  });

  const [actionSaving, setActionSaving] = useState(false);
  const [selectedKekurangan, setSelectedKekurangan] = useState(null);

  const [search, setSearch] = useState("");
  const [filterKelengkapan, setFilterKelengkapan] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  function getCancellationRequest(rowId) {
    return cancellationRequests.find((request) => request.entity_type === "ots_area" && request.entity_id === rowId);
  }

  function isCancellationPending(rowId) {
    return cancellationRequests.some((request) => request.entity_type === "ots_area" && request.entity_id === rowId && request.status === "PENDING");
  }

  const totalPlafond = useMemo(() => otsArea.reduce((total, row) => total + Number(row.plafond || 0), 0), [otsArea]);

  const completeCount = useMemo(() => otsArea.filter((row) => String(row.kelengkapan || "") === "Lengkap").length, [otsArea]);

  const incompleteCount = useMemo(() => otsArea.filter((row) => String(row.kelengkapan || "") === "Belum Lengkap").length, [otsArea]);

  const filteredOtsArea = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return otsArea.filter((row) => {
      const searchableValues = [row.cadeb, row.unit, row.usaha, row.kelengkapan, row.kekurangan, row.nama_so];

      const matchesSearch =
        !normalizedSearch ||
        searchableValues.some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(normalizedSearch),
        );

      const matchesKelengkapan = !filterKelengkapan || String(row.kelengkapan || "") === filterKelengkapan;

      return matchesSearch && matchesKelengkapan;
    });
  }, [otsArea, search, filterKelengkapan]);

  const sortedOtsArea = useMemo(() => {
    const data = [...filteredOtsArea];

    data.sort((a, b) => {
      let valueA;
      let valueB;

      switch (sortField) {
        case "unit":
        case "cadeb":
        case "usaha":
        case "kelengkapan":
        case "nama_so":
          valueA = String(a[sortField] || "").toLowerCase();
          valueB = String(b[sortField] || "").toLowerCase();
          break;

        case "plafond":
          valueA = Number(a.plafond || 0);
          valueB = Number(b.plafond || 0);
          break;

        case "created_at":
        default:
          valueA = new Date(a.created_at || 0).getTime();
          valueB = new Date(b.created_at || 0).getTime();
          break;
      }

      if (valueA < valueB) {
        return sortDirection === "asc" ? -1 : 1;
      }

      if (valueA > valueB) {
        return sortDirection === "asc" ? 1 : -1;
      }

      return 0;
    });

    return data;
  }, [filteredOtsArea, sortField, sortDirection]);

  const totalFiltered = sortedOtsArea.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedOtsArea = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return sortedOtsArea.slice(startIndex, startIndex + pageSize);
  }, [sortedOtsArea, safeCurrentPage, pageSize]);

  const rangeStart = totalFiltered === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;

  const rangeEnd = totalFiltered === 0 ? 0 : Math.min(safeCurrentPage * pageSize, totalFiltered);

  const hasFilter = Boolean(search || filterKelengkapan);

  const hasActiveControls = hasFilter || sortField !== "created_at" || sortDirection !== "desc" || pageSize !== 20;

  function updateSearch(value) {
    setSearch(value);
    setCurrentPage(1);
  }

  function updateFilter(setter, value) {
    setter(value);
    setCurrentPage(1);
  }

  function handlePageSizeChange(value) {
    setPageSize(Number(value));
    setCurrentPage(1);
  }

  function handleSort(field) {
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }

    setCurrentPage(1);
  }

  function resetControls() {
    setSearch("");
    setFilterKelengkapan("");
    setSortField("created_at");
    setSortDirection("desc");
    setCurrentPage(1);
    setPageSize(20);
  }

  function resetForm() {
    setForm({
      cadeb: "",
      usaha: "",
      plafond: "",
      kelengkapan: "",
      kekurangan: "",
      namaSo: "",
    });
  }

  function openCreateModal() {
    setError("");
    setEditingTarget(null);
    resetForm();
    setFormOpen(true);
  }

  function openEditModal(row) {
    if (!["PENDING_APPROVAL", "REVISION"].includes(row.approval_status)) {
      return;
    }

    setError("");
    setEditingTarget(row);

    setForm({
      cadeb: row.cadeb ?? "",
      usaha: row.usaha ?? "",
      plafond: formatMoneyInput(String(row.plafond ?? "")),
      kelengkapan: row.kelengkapan ?? "",
      kekurangan: row.kekurangan ?? "",
      namaSo: row.nama_so ?? "",
    });

    setFormOpen(true);
  }

  function closeCreateModal() {
    if (saving) return;

    setError("");
    setFormOpen(false);
    setEditingTarget(null);
    resetForm();
  }

  function handleExportExcel() {
    if (sortedOtsArea.length === 0) return;

    const columns = [
      { key: "__number", header: "No" },
      { key: "unit", header: "Unit" },
      { key: "cadeb", header: "Nama Cadeb" },
      { key: "usaha", header: "Usaha" },
      {
        key: "plafond",
        header: "Plafond",
        value: (row) => Number(row.plafond || 0),
      },
      { key: "kelengkapan", header: "Kelengkapan Berkas" },
      { key: "nama_so", header: "Nama SO" },
      { key: "kekurangan", header: "Kekurangan Berkas" },
    ];

    exportToExcel(sortedOtsArea, columns, "OTS-Area", {
      sheetName: "OTS Area",
    });
  }

  const formatSubmissionDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "kelengkapan" && value === "Lengkap" ? { kekurangan: "" } : {}),
    }));

    setError("");
  }

  function handleMoneyChange(value) {
    updateField("plafond", formatMoneyInput(value));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.cadeb.trim()) {
      setError("Nama Cadeb wajib diisi.");
      return;
    }

    if (!form.usaha.trim()) {
      setError("Usaha wajib diisi.");
      return;
    }

    const plafond = parseMoney(form.plafond);

    if (!Number.isFinite(plafond) || plafond <= 0) {
      setError("Plafond harus lebih dari Rp0.");
      return;
    }

    if (!form.kelengkapan) {
      setError("Kelengkapan berkas wajib dipilih.");
      return;
    }

    if (form.kelengkapan === "Belum Lengkap" && !form.kekurangan.trim()) {
      setError("Isi kekurangan berkas jika berkas belum lengkap.");
      return;
    }

    if (!form.namaSo.trim()) {
      setError("Nama SO wajib diisi.");
      return;
    }

    const payload = {
      cadeb: form.cadeb.trim(),
      usaha: form.usaha.trim(),
      plafond,
      kelengkapan: form.kelengkapan,
      kekurangan: form.kelengkapan === "Belum Lengkap" ? form.kekurangan.trim() : "",
      namaSo: form.namaSo.trim(),
    };

    try {
      if (!editingTarget) {
        await onCreate(payload);
      } else if (editingTarget.approval_status === "PENDING_APPROVAL") {
        if (typeof onUpdatePending !== "function") {
          throw new Error("Fungsi edit OTS Area belum terhubung.");
        }

        await onUpdatePending(editingTarget.id, payload);
      } else if (editingTarget.approval_status === "REVISION") {
        if (typeof onResubmit !== "function") {
          throw new Error("Fungsi kirim ulang OTS Area belum terhubung.");
        }

        await onResubmit(editingTarget.id, payload);
      } else {
        throw new Error("Status OTS Area tidak mengizinkan perubahan.");
      }

      resetForm();
      setError("");
      setEditingTarget(null);
      setCurrentPage(1);
      setFormOpen(false);
    } catch (submitError) {
      setError(submitError.message || "Gagal menyimpan data OTS Area.");
    }
  }

  function openCancellationModal(row) {
    setError("");
    setCancellationReason("");
    setCancellationTarget(row);
  }

  function closeCancellationModal() {
    if (actionSaving) return;

    setCancellationTarget(null);
    setCancellationReason("");
    setError("");
  }

  async function confirmCancellation() {
    if (!cancellationTarget) return;

    const reason = cancellationReason.trim();

    if (reason.length < 5) {
      setError("Alasan pembatalan minimal 5 karakter.");
      return;
    }

    if (typeof onRequestCancellation !== "function") {
      setError("Fungsi pengajuan pembatalan belum terhubung.");
      return;
    }

    setActionSaving(true);
    setError("");

    try {
      await onRequestCancellation(cancellationTarget.id, reason);
      setCancellationTarget(null);
      setCancellationReason("");
    } catch (requestError) {
      setError(requestError.message || "Gagal mengajukan pembatalan OTS Area.");
    } finally {
      setActionSaving(false);
    }
  }

  function openCompletenessModal(row) {
    if (row.approval_status !== "APPROVED" || row.cancelled_at || isCancellationPending(row.id)) {
      return;
    }

    setError("");
    setCompletenessTarget(row);

    setCompletenessForm({
      kelengkapan: row.kelengkapan || "",
      kekurangan: row.kekurangan || "",
      reason: "",
    });
  }

  async function submitCompletenessUpdate(event) {
    event.preventDefault();

    if (!completenessTarget) return;

    if (completenessTarget.approval_status !== "APPROVED") {
      setError("Hanya laporan yang disetujui yang dapat diperbarui.");
      return;
    }

    if (isCancellationPending(completenessTarget.id)) {
      setError("Kelengkapan tidak dapat diubah selama pembatalan menunggu keputusan.");
      return;
    }

    if (!completenessForm.kelengkapan) {
      setError("Status kelengkapan wajib dipilih.");
      return;
    }

    if (completenessForm.kelengkapan === "Belum Lengkap" && !completenessForm.kekurangan.trim()) {
      setError("Kekurangan berkas wajib diisi jika belum lengkap.");
      return;
    }

    if (typeof onUpdateApprovedCompleteness !== "function") {
      setError("Fungsi pembaruan kelengkapan belum terhubung.");
      return;
    }

    setActionSaving(true);
    setError("");

    try {
      await onUpdateApprovedCompleteness(completenessTarget.id, {
        kelengkapan: completenessForm.kelengkapan,
        kekurangan: completenessForm.kelengkapan === "Belum Lengkap" ? completenessForm.kekurangan.trim() : "",
        reason: completenessForm.reason.trim(),
      });

      setCompletenessTarget(null);
    } catch (updateError) {
      setError(updateError.message || "Gagal memperbarui kelengkapan OTS Area.");
    } finally {
      setActionSaving(false);
    }
  }

  function sortIndicator(field) {
    if (sortField !== field) {
      return (
        <span className="ml-1 text-slate-400" aria-hidden="true">
          ↕
        </span>
      );
    }

    return (
      <span className="ml-1 text-indigo-600 dark:text-indigo-400" aria-hidden="true">
        {sortDirection === "asc" ? "↑" : "↓"}
      </span>
    );
  }

  function renderPagination() {
    if (totalFiltered === 0 || totalPages <= 1) return null;

    let startPage = Math.max(1, safeCurrentPage - 2);
    let endPage = Math.min(totalPages, safeCurrentPage + 2);

    if (safeCurrentPage <= 3) {
      endPage = Math.min(5, totalPages);
    }

    if (safeCurrentPage >= totalPages - 2) {
      startPage = Math.max(1, totalPages - 4);
    }

    const pages = [];

    for (let page = startPage; page <= endPage; page += 1) {
      pages.push(page);
    }

    const pageButton = "flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-semibold transition";

    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
        <button type="button" disabled={safeCurrentPage === 1} onClick={() => setCurrentPage((current) => Math.max(1, current - 1))} className={buttonSecondary}>
          <span aria-hidden="true">←</span>
          <span className="hidden sm:inline">Sebelumnya</span>
        </button>

        <div className="flex flex-wrap items-center justify-center gap-1">
          {startPage > 1 && (
            <>
              <button type="button" onClick={() => setCurrentPage(1)} className={`${pageButton} text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800`}>
                1
              </button>
              {startPage > 2 && <span className="px-1 text-slate-400">…</span>}
            </>
          )}

          {pages.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              aria-current={page === safeCurrentPage ? "page" : undefined}
              className={[pageButton, page === safeCurrentPage ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"].join(" ")}
            >
              {page}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-1 text-slate-400">…</span>}
              <button type="button" onClick={() => setCurrentPage(totalPages)} className={`${pageButton} text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800`}>
                {totalPages}
              </button>
            </>
          )}
        </div>

        <button type="button" disabled={safeCurrentPage === totalPages} onClick={() => setCurrentPage((current) => Math.min(totalPages, current + 1))} className={buttonSecondary}>
          <span className="hidden sm:inline">Berikutnya</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    );
  }

  const stats = [
    {
      label: "Total NOA",
      value: otsArea.length,
      description: "Seluruh data OTS",
      icon: "#",
      color: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
    },
    {
      label: "Total Plafond",
      value: formatRupiah(totalPlafond),
      description: "Akumulasi plafond",
      icon: "Rp",
      color: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
    },
    {
      label: "Berkas Lengkap",
      value: completeCount,
      description: "Siap diproses",
      icon: "✓",
      color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    },
    {
      label: "Belum Lengkap",
      value: incompleteCount,
      description: "Perlu tindak lanjut",
      icon: "!",
      color: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    },
  ];

  const columns = [
    ["unit", "Unit"],
    ["cadeb", "Cadeb"],
    ["usaha", "Usaha"],
    ["plafond", "Plafond"],
    ["kelengkapan", "Berkas"],
    ["nama_so", "Nama SO"],
  ];

  return (
    <div className="min-w-0 space-y-5 pb-8 text-slate-800 dark:text-slate-100 sm:space-y-6">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-indigo-100/70 blur-3xl dark:bg-indigo-500/10" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-100 dark:bg-indigo-500/20">O</span>
              OTS AREA
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Monitoring OTS</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Kelola dan pantau hasil OTS Area, plafond, serta kelengkapan berkas dalam satu tampilan.</p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
          >
            <span className="text-lg leading-none">+</span>
            Tambah OTS
          </button>
        </div>
      </section>

      {/* Statistics */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((item) => (
          <article
            key={item.label}
            className="flex min-w-0 flex-col rounded-2xl border-2 border-slate-300 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md dark:border-slate-600 dark:bg-slate-900 dark:hover:border-indigo-500 sm:p-5"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 sm:text-sm">{item.label}</p>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${item.color}`}>{item.icon}</span>
            </div>
            <p className={`mt-3 break-words font-bold tracking-tight text-slate-900 dark:text-white ${item.label === "Total Plafond" ? "text-base sm:text-xl" : "text-2xl"}`}>{item.value}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
          </article>
        ))}
      </section>

      {/* Data workspace */}
      <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-lg font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">#</div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">Data OTS Area</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{loading ? "Memuat data..." : `${otsArea.length} data terdaftar`}</p>
            </div>
          </div>

          <button type="button" onClick={handleExportExcel} disabled={loading || sortedOtsArea.length === 0} className={buttonSecondary}>
            <span className="text-base" aria-hidden="true">
              ↓
            </span>
            Ekspor Excel
          </button>
        </div>

        {/* Filters */}
        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/50 sm:p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_190px_190px_auto]">
            <div className="relative min-w-0">
              <label htmlFor="ots-search" className="sr-only">
                Cari data OTS
              </label>
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>
              <input id="ots-search" type="search" value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Cari nama, usaha, SO..." className={`${inputClass} pl-9`} />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_190px_auto]"></div>

            <div className="min-w-0">
              <label htmlFor="ots-filter-status" className="sr-only">
                Filter kelengkapan berkas
              </label>
              <select id="ots-filter-status" value={filterKelengkapan} onChange={(event) => updateFilter(setFilterKelengkapan, event.target.value)} className={inputClass}>
                <option value="" className="bg-white text-slate-500 dark:bg-slate-900 dark:text-slate-300">
                  Semua Berkas
                </option>
                {KELENGKAPAN_OPTIONS.map((option) => (
                  <option key={option} value={option} className="bg-white text-slate-500 dark:bg-slate-900 dark:text-slate-300">
                    {option}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveControls && (
              <button type="button" onClick={resetControls} className="min-h-10 rounded-xl px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10">
                Reset
              </button>
            )}
          </div>

          {hasFilter && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Filter aktif:</span>
              {search && <span className="max-w-full break-all rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300">Pencarian: {search}</span>}
              {filterKelengkapan && <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">{filterKelengkapan}</span>}
            </div>
          )}
        </div>

        {/* Result controls */}
        {!loading && (
          <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Menampilkan{" "}
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {rangeStart}–{rangeEnd}
              </span>{" "}
              dari <span className="font-bold text-slate-800 dark:text-slate-100">{totalFiltered}</span> data
            </p>

            <label className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              Baris per halaman
              <select
                value={pageSize}
                onChange={(event) => handlePageSizeChange(event.target.value)}
                className="min-h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {/* Mobile cards */}
        <div className="space-y-3 sm:hidden">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">Memuat data OTS...</div>
          ) : totalFiltered === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-10 text-center dark:border-slate-700">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl text-slate-500 dark:bg-slate-800 dark:text-slate-300">◫</div>
              <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-white">{otsArea.length === 0 ? "Belum ada data OTS" : "Data tidak ditemukan"}</h3>
              <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-500 dark:text-slate-400">{otsArea.length === 0 ? "Tambahkan data melalui tombol Tambah OTS." : "Coba ubah kata pencarian atau filter."}</p>
              {hasActiveControls && (
                <button type="button" onClick={resetControls} className="mt-4 rounded-xl bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
                  Reset Filter
                </button>
              )}
            </div>
          ) : (
            paginatedOtsArea.map((row, index) => {
              const rowNumber = (safeCurrentPage - 1) * pageSize + index + 1;
              const isComplete = ["Lengkap", "Sudah Lengkap"].includes(row.kelengkapan);

              console.log("DEBUG KELENGKAPAN OTS:", {
                id: row.id,
                kelengkapan: row.kelengkapan,
                isComplete,
              });

              return (
                <article key={row.id} className="relative min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  {/* Badge di pojok kanan atas card */}
                  <div className="absolute right-4 top-4">
                    <ApprovalStatusBadge status={row.approval_status} />
                  </div>
                  <div className="flex min-w-0 items-start gap-3 pr-20">
                    {" "}
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">{String(rowNumber).padStart(2, "0")}</span>
                    <div className="min-w-0">
                      <h3 className="break-words text-sm font-bold text-slate-900 dark:text-white">{row.cadeb}</h3>
                      <p className="mt-1 break-words text-xs text-slate-500 dark:text-slate-400">{row.usaha || "-"}</p>
                    </div>
                  </div>
                  {/* Tanggal pengajuan */}
                  <div className="mt-3">
                    <span className="inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <span aria-hidden="true">🗓</span>
                      <span>Diajukan:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{formatSubmissionDate(row.created_at)}</span>
                    </span>
                  </div>
                  <div className="mt-4 rounded-xl bg-indigo-50/80 p-3 dark:bg-indigo-500/10">
                    <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Plafond</p>
                    <p className="mt-1 break-words text-lg font-bold text-slate-900 dark:text-white">{formatRupiah(row.plafond)}</p>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Unit</p>
                      <p className="mt-1 break-words text-sm font-semibold text-slate-700 dark:text-slate-200">{row.unit || "-"}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Nama SO</p>
                      <p className="mt-1 break-words text-sm font-semibold text-slate-700 dark:text-slate-200">{row.nama_so || "-"}</p>
                    </div>
                  </div>

                  {/* KELENGKAPAN BERKAS */}
                  <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Kelengkapan berkas</p>

                    <span
                      className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                        isComplete
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300"
                      }`}
                    >
                      {isComplete ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}

                      {isComplete ? "Sudah lengkap" : "Belum lengkap"}
                    </span>
                  </div>

                  {/* KEKURANGAN BERKAS */}
                  {!isComplete && row.kekurangan?.trim() && (
                    <div className="mt-3 rounded-xl border border-rose-200/80 bg-rose-50/70 p-3 dark:border-rose-500/20 dark:bg-rose-500/[0.06]">
                      <div className="flex min-w-0 items-start gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100/80 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                          <AlertCircle className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-rose-800 dark:text-rose-300">Kekurangan Berkas</p>

                          <p className="mt-1 line-clamp-2 break-words text-sm leading-5 text-rose-800/90 dark:text-rose-200/90">{row.kekurangan}</p>

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedKekurangan({
                                id: row.id,
                                nama: row.nama,
                                unit: row.unit,
                                kekurangan: row.kekurangan,
                              })
                            }
                            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors duration-200 hover:border-rose-300 hover:bg-rose-100/80 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:ring-offset-1 dark:border-rose-500/25 dark:bg-slate-900/60 dark:text-rose-300 dark:hover:bg-rose-500/10 dark:focus:ring-offset-slate-900"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Lihat lengkap
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MODAL DETAIL KEKURANGAN BERKAS */}
                  {selectedKekurangan?.id === row.id && (
                    <div
                      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-[3px]"
                      onClick={() => setSelectedKekurangan(null)}
                      style={{
                        animation: "otsBackdropIn 180ms ease-out both",
                      }}
                    >
                      <style>
                        {`
        @keyframes otsBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes otsModalIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}
                      </style>

                      <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={`ots-kekurangan-title-${row.id}`}
                        className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
                        style={{
                          animation: "otsModalIn 220ms cubic-bezier(0.16, 1, 0.3, 1) both",
                        }}
                        onClick={(event) => event.stopPropagation()}
                      >
                        {/* HEADER */}
                        <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300">
                            <AlertCircle className="h-5 w-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 id={`ots-kekurangan-title-${row.id}`} className="text-base font-bold text-slate-900 dark:text-white">
                              Detail Kekurangan Berkas
                            </h3>

                            <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">
                              {selectedKekurangan.nama || "Data OTS Area"}
                              {selectedKekurangan.unit ? ` · ${selectedKekurangan.unit}` : ""}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedKekurangan(null)}
                            aria-label="Tutup modal"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {/* ISI MODAL */}
                        <div className="max-h-[60vh] overflow-y-auto p-5 sm:p-6">
                          <div className="mb-3 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Daftar berkas yang perlu dilengkapi</p>
                          </div>

                          <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-4 dark:border-rose-500/15 dark:bg-rose-500/[0.06]">
                            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 dark:text-slate-200">{selectedKekurangan.kekurangan}</p>
                          </div>
                        </div>

                        {/* FOOTER */}
                        <div className="flex justify-end border-t border-slate-100 bg-slate-50/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/30 sm:px-6">
                          <button
                            type="button"
                            onClick={() => setSelectedKekurangan(null)}
                            className="inline-flex min-h-9 items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                          >
                            Tutup
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                    {isCancellationPending(row.id) ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                        <p className="font-bold">Pembatalan menunggu Supervisor</p>
                        <p className="mt-1 text-xs">Laporan tidak dapat diperbarui sampai permintaan diputuskan.</p>
                      </div>
                    ) : null}

                    {row.approval_status === "APPROVED" && !isCancellationPending(row.id) && (
                      <button
                        type="button"
                        disabled={actionSaving || completenessSavingId === row.id}
                        onClick={() => openCompletenessModal(row)}
                        className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                      >
                        {completenessSavingId === row.id ? "Menyimpan kelengkapan..." : "Perbarui Kelengkapan"}
                      </button>
                    )}

                    {["PENDING_APPROVAL", "REVISION"].includes(row.approval_status) && (
                      <button
                        type="button"
                        disabled={saving || actionSaving || Boolean(deletingId)}
                        onClick={() => openEditModal(row)}
                        className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-950/50"
                      >
                        {row.approval_status === "REVISION" ? "Edit Revisi" : "Edit"}
                      </button>
                    )}

                    {!isCancellationPending(row.id) && (
                      <button
                        type="button"
                        disabled={actionSaving || cancellationLoading || Boolean(deletingId) || Boolean(row.cancelled_at)}
                        onClick={() => openCancellationModal(row)}
                        className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/50"
                      >
                        Ajukan Pembatalan
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 sm:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] border-collapse text-left">
              <thead className="bg-slate-50 dark:bg-slate-950/70">
                <tr>
                  <th className="px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">No</th>

                  {columns.map(([field, label]) => (
                    <th key={field} className="whitespace-nowrap px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <button type="button" onClick={() => handleSort(field)} className="inline-flex items-center transition hover:text-indigo-600 dark:hover:text-indigo-400">
                        {label}
                        {sortIndicator(field)}
                      </button>
                    </th>
                  ))}

                  <th className="px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Kekurangan</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                      Memuat data OTS...
                    </td>
                  </tr>
                ) : totalFiltered === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                      {otsArea.length === 0 ? "Belum ada data OTS Area." : "Data tidak ditemukan."}
                    </td>
                  </tr>
                ) : (
                  paginatedOtsArea.map((row, index) => {
                    const rowNumber = (safeCurrentPage - 1) * pageSize + index + 1;
                    const isComplete = row.kelengkapan === "Lengkap";

                    return (
                      <tr key={row.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-4 text-sm text-slate-400">{rowNumber}</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{row.unit || "-"}</span>
                        </td>
                        <td className="max-w-[200px] px-4 py-4">
                          <span className="block break-words text-sm font-semibold text-slate-800 dark:text-slate-100">{row.cadeb}</span>
                        </td>
                        <td className="max-w-[180px] px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                          <span className="block break-words">{row.usaha || "-"}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-sm font-bold text-slate-800 dark:text-slate-100">{formatRupiah(row.plafond)}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                              isComplete ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${isComplete ? "bg-emerald-500" : "bg-amber-500"}`} />
                            {row.kelengkapan || "-"}
                          </span>
                        </td>
                        <td className="max-w-[160px] px-4 py-4 text-sm text-slate-600 dark:text-slate-300">
                          <span className="block break-words">{row.nama_so || "-"}</span>
                        </td>
                        <td className="max-w-[200px] px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
                          <span className="block break-words">{row.kekurangan || "-"}</span>
                        </td>

                        <td className="min-w-[190px] px-4 py-4 align-top">
                          <div className="flex flex-col items-start gap-2">
                            {isCancellationPending(row.id) && (
                              <span className="inline-flex rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                                Pembatalan menunggu
                              </span>
                            )}

                            {["PENDING_APPROVAL", "REVISION"].includes(row.approval_status) && (
                              <button
                                type="button"
                                disabled={saving || actionSaving || Boolean(deletingId)}
                                onClick={() => openEditModal(row)}
                                className="inline-flex min-h-9 items-center justify-center rounded-lg border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-900 dark:text-indigo-400 dark:hover:bg-indigo-950/50"
                              >
                                {row.approval_status === "REVISION" ? "Edit Revisi" : "Edit"}
                              </button>
                            )}

                            {row.approval_status === "APPROVED" && !isCancellationPending(row.id) && (
                              <button
                                type="button"
                                disabled={actionSaving || completenessSavingId === row.id}
                                onClick={() => openCompletenessModal(row)}
                                className="inline-flex min-h-9 items-center justify-center rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                              >
                                Perbarui Kelengkapan
                              </button>
                            )}

                            {!isCancellationPending(row.id) && (
                              <button
                                type="button"
                                disabled={actionSaving || cancellationLoading || Boolean(deletingId) || Boolean(row.cancelled_at)}
                                onClick={() => openCancellationModal(row)}
                                className="inline-flex min-h-9 items-center justify-center rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/50"
                              >
                                Ajukan Pembatalan
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {!loading && totalFiltered > 0 && (
                <tfoot className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/70">
                  <tr>
                    <th colSpan={4} className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Total Semua Data
                    </th>
                    <th className="whitespace-nowrap px-4 py-4 text-sm font-bold text-slate-900 dark:text-white">{formatRupiah(totalPlafond)}</th>
                    <th colSpan={4} className="px-4 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {otsArea.length} NOA
                    </th>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {!loading && renderPagination()}
      </section>

      {/* Add OTS modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="add-ots-title">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:max-h-[90vh]">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 p-5 dark:border-slate-800 sm:p-6">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">{editingTarget ? "Perbarui Data" : "Input Data"}</p>

                <h2 id="add-ots-title" className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                  {!editingTarget ? "Tambah OTS Area" : editingTarget.approval_status === "REVISION" ? "Perbaiki OTS Area" : "Edit OTS Area"}
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {!editingTarget
                    ? "Lengkapi informasi calon debitur dan berkas."
                    : editingTarget.approval_status === "REVISION"
                      ? "Perbaiki data sesuai catatan Supervisor, lalu kirim ulang untuk persetujuan."
                      : "Perubahan akan disimpan selama data masih menunggu persetujuan."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                disabled={saving}
                aria-label="Tutup form"
                className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-950 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
              >
                <X className="h-4 w-4 stroke-[2.5] transition-transform duration-200 group-hover:scale-110" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6">
              {editingTarget?.approval_status === "REVISION" && (
                <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">Catatan Revisi Supervisor</p>

                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-amber-900 dark:text-amber-200">
                    {editingTarget.revision_note?.trim() || "Tidak ada catatan revisi. Silakan periksa kembali data OTS Area sebelum mengirim ulang."}
                  </p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="ots-cadeb" className={labelClass}>
                    Nama Cadeb <span className="text-rose-500">*</span>
                  </label>
                  <input id="ots-cadeb" type="text" value={form.cadeb} onChange={(event) => updateField("cadeb", event.target.value)} placeholder="Nama calon debitur" className={inputClass} />
                </div>

                <div>
                  <label htmlFor="ots-usaha" className={labelClass}>
                    Usaha <span className="text-rose-500">*</span>
                  </label>
                  <input id="ots-usaha" type="text" value={form.usaha} onChange={(event) => updateField("usaha", event.target.value)} placeholder="Jenis usaha" className={inputClass} />
                </div>

                <div>
                  <label htmlFor="ots-plafond" className={labelClass}>
                    Plafond <span className="text-rose-500">*</span>
                  </label>
                  <input id="ots-plafond" type="text" inputMode="numeric" value={form.plafond} onChange={(event) => handleMoneyChange(event.target.value)} placeholder="Rp0" className={inputClass} />
                </div>

                <div>
                  <label htmlFor="ots-kelengkapan" className={labelClass}>
                    Kelengkapan Berkas <span className="text-rose-500">*</span>
                  </label>
                  <select id="ots-kelengkapan" value={form.kelengkapan} onChange={(event) => updateField("kelengkapan", event.target.value)} className={inputClass}>
                    <option value="" className="bg-white text-slate-500 dark:bg-slate-900 dark:text-slate-500">
                      Pilih status
                    </option>
                    {KELENGKAPAN_OPTIONS.map((option) => (
                      <option key={option} value={option} className="bg-white text-slate-500 dark:bg-slate-900 dark:text-slate-300">
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="ots-so" className={labelClass}>
                    Nama SO <span className="text-rose-500">*</span>
                  </label>
                  <input id="ots-so" type="text" value={form.namaSo} onChange={(event) => updateField("namaSo", event.target.value)} placeholder="Nama SO" className={inputClass} />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="ots-kekurangan" className={labelClass}>
                    Kekurangan Berkas
                    {form.kelengkapan === "Belum Lengkap" && <span className="text-rose-500"> *</span>}
                  </label>
                  <textarea
                    id="ots-kekurangan"
                    rows={3}
                    value={form.kekurangan}
                    onChange={(event) => updateField("kekurangan", event.target.value)}
                    placeholder="Isi jika masih ada berkas yang kurang"
                    disabled={form.kelengkapan !== "Belum Lengkap"}
                    className={`${inputClass} resize-y`}
                  />
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Wajib diisi apabila status berkas Belum Lengkap.</p>
                </div>
              </div>

              {error && (
                <div role="alert" className="mt-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 font-bold dark:bg-rose-500/20">!</span>
                  <p className="pt-0.5 leading-5">{error}</p>
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeCreateModal} disabled={saving} className={buttonSecondary}>
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Menyimpan..." : !editingTarget ? "Simpan OTS" : editingTarget.approval_status === "REVISION" ? "Perbaiki & Kirim Ulang" : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {cancellationTarget && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="cancel-ots-title">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="p-5 sm:p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                <AlertCircle className="h-6 w-6" />
              </div>

              <h3 id="cancel-ots-title" className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                Ajukan Pembatalan OTS Area
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Permintaan akan dikirim kepada Supervisor. Data tidak langsung dihapus dan baru diarsipkan jika pembatalan disetujui.</p>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
                <p className="break-words text-sm font-bold text-slate-800 dark:text-white">{cancellationTarget.cadeb}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {cancellationTarget.unit || "-"} · {cancellationTarget.usaha || "-"}
                </p>
                <p className="mt-2 text-sm font-bold text-indigo-700 dark:text-indigo-300">{formatRupiah(cancellationTarget.plafond)}</p>
              </div>

              <label htmlFor="ots-cancellation-reason" className={`${labelClass} mt-4`}>
                Alasan pembatalan <span className="text-rose-500">*</span>
              </label>

              <textarea
                id="ots-cancellation-reason"
                rows={4}
                maxLength={1000}
                value={cancellationReason}
                onChange={(event) => {
                  setCancellationReason(event.target.value);
                  setError("");
                }}
                placeholder="Jelaskan alasan pembatalan laporan..."
                className={`${inputClass} resize-y`}
                disabled={actionSaving}
              />

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Minimal 5 karakter. Maksimal 1.000 karakter.</p>

              {error && (
                <p role="alert" className="mt-3 text-sm text-rose-600 dark:text-rose-400">
                  {error}
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50 sm:flex-row sm:justify-end">
              <button type="button" onClick={closeCancellationModal} disabled={actionSaving} className={buttonSecondary}>
                Batal
              </button>

              <button
                type="button"
                onClick={confirmCancellation}
                disabled={actionSaving || cancellationLoading}
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionSaving ? "Mengirim..." : "Kirim Permintaan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {completenessTarget && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="ots-completeness-title">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <form onSubmit={submitCompletenessUpdate}>
              <div className="p-5 sm:p-6">
                <h3 id="ots-completeness-title" className="text-lg font-bold text-slate-900 dark:text-white">
                  Perbarui Kelengkapan Berkas
                </h3>

                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {completenessTarget.cadeb} · {completenessTarget.unit || "-"}
                </p>

                <div className="mt-5">
                  <label htmlFor="ots-update-kelengkapan" className={labelClass}>
                    Status kelengkapan <span className="text-rose-500">*</span>
                  </label>

                  <select
                    id="ots-update-kelengkapan"
                    value={completenessForm.kelengkapan}
                    onChange={(event) =>
                      setCompletenessForm((current) => ({
                        ...current,
                        kelengkapan: event.target.value,
                        kekurangan: event.target.value === "Lengkap" || event.target.value === "Sudah Lengkap" ? "" : current.kekurangan,
                      }))
                    }
                    className={inputClass}
                    disabled={actionSaving}
                    required
                  >
                    <option value="">Pilih status</option>
                    {KELENGKAPAN_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-4">
                  <label htmlFor="ots-update-kekurangan" className={labelClass}>
                    Kekurangan berkas
                    {completenessForm.kelengkapan === "Belum Lengkap" && <span className="text-rose-500"> *</span>}
                  </label>

                  <textarea
                    id="ots-update-kekurangan"
                    rows={3}
                    value={completenessForm.kekurangan}
                    onChange={(event) =>
                      setCompletenessForm((current) => ({
                        ...current,
                        kekurangan: event.target.value,
                      }))
                    }
                    disabled={actionSaving || !["Belum Lengkap"].includes(completenessForm.kelengkapan)}
                    placeholder="Jelaskan berkas yang masih kurang"
                    className={`${inputClass} resize-y`}
                  />
                </div>

                <div className="mt-4">
                  <label htmlFor="ots-update-reason" className={labelClass}>
                    Catatan perubahan (opsional)
                  </label>

                  <textarea
                    id="ots-update-reason"
                    rows={2}
                    maxLength={1000}
                    value={completenessForm.reason}
                    onChange={(event) =>
                      setCompletenessForm((current) => ({
                        ...current,
                        reason: event.target.value,
                      }))
                    }
                    disabled={actionSaving}
                    placeholder="Alasan perubahan kelengkapan..."
                    className={`${inputClass} resize-y`}
                  />
                </div>

                {error && (
                  <p role="alert" className="mt-3 text-sm text-rose-600 dark:text-rose-400">
                    {error}
                  </p>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (actionSaving) return;
                    setCompletenessTarget(null);
                    setError("");
                  }}
                  disabled={actionSaving}
                  className={buttonSecondary}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={actionSaving || completenessSavingId === completenessTarget.id}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionSaving ? "Menyimpan..." : "Simpan Kelengkapan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OtsAreaReport;
