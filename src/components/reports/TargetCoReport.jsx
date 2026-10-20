import { useMemo, useState } from "react";
import * as XLSX from "xlsx-js-style";

import { PRODUCTS } from "../../constants/report";
import { formatMoneyInput, formatRupiah, parseMoney } from "../../utils/format";

import { X } from "lucide-react";

import ApprovalStatusBadge from "./ApprovalStatusBadge";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const INITIAL_FORM = {
  nama: "",
  namaSo: "",
  plafond: "",
  new_ijin: "",
  produk: "",
};

const inputClass =
  "w-full min-w-0 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/50 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60 [color-scheme:dark]";

const labelClass = "mb-2 block text-sm font-semibold text-white";

const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50";

const cardClass = "rounded-2xl border border-slate-800 bg-slate-900 shadow-sm";

function normalizeApprovalStatus(status) {
  return String(status || "")
    .trim()
    .toUpperCase();
}

function formatSubmissionDate(value) {
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
}

function TargetCoReport({ targetCo = [], cancellationRequests = [], loading = false, saving = false, cancellationSubmittingId = null, onCreate, onUpdatePending, onResubmit, onRequestCancellation }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Menyimpan data yang sedang diedit.
  // null berarti modal digunakan untuk menambah data.
  const [editTarget, setEditTarget] = useState(null);
  const [editMode, setEditMode] = useState("create");

  const [search, setSearch] = useState("");
  const [filterProduk, setFilterProduk] = useState("");
  const [filterNewIjin, setFilterNewIjin] = useState("");

  const [cancellationTarget, setCancellationTarget] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancellationError, setCancellationError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  function getCancellationRequest(row) {
    return cancellationRequests.find((request) => request.entity_type === "target_co" && request.entity_id === row.id && String(request.status || "").toUpperCase() === "PENDING");
  }

  function canRequestCancellation(row) {
    return ["PENDING_APPROVAL", "APPROVED"].includes(normalizeApprovalStatus(row.approval_status)) && !row.cancelled_at && !getCancellationRequest(row);
  }

  function openCancellationModal(row) {
    if (!canRequestCancellation(row)) {
      return;
    }

    setCancellationTarget(row);
    setCancellationReason("");
    setCancellationError("");
    setError("");
  }

  function closeCancellationModal() {
    if (cancellationSubmittingId) {
      return;
    }

    setCancellationTarget(null);
    setCancellationReason("");
    setCancellationError("");
  }

  async function confirmCancellationRequest(event) {
    event.preventDefault();

    if (!cancellationTarget || cancellationSubmittingId) {
      return;
    }

    const reason = cancellationReason.trim();

    if (reason.length < 5) {
      setCancellationError("Alasan pembatalan wajib diisi minimal 5 karakter.");
      return;
    }

    if (typeof onRequestCancellation !== "function") {
      setCancellationError("Fungsi pengajuan pembatalan Target CO belum terhubung.");
      return;
    }

    try {
      setCancellationError("");

      await onRequestCancellation(cancellationTarget.id, reason);

      setCancellationTarget(null);
      setCancellationReason("");
      setCancellationError("");
    } catch (requestError) {
      setCancellationError(requestError?.message || "Gagal mengajukan pembatalan Target CO.");
    }
  }

  const totalPlafond = useMemo(() => targetCo.reduce((total, row) => total + Number(row.plafond || 0), 0), [targetCo]);

  const filteredTargetCo = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return targetCo.filter((row) => {
      const matchesSearch =
        !normalizedSearch ||
        [row.nama, row.nama_so, row.unit, row.produk, row.new_ijin].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(normalizedSearch),
        );

      const matchesProduk = !filterProduk || String(row.produk || "") === filterProduk;

      const matchesNewIjin = !filterNewIjin || String(row.new_ijin || "") === filterNewIjin;

      return matchesSearch && matchesProduk && matchesNewIjin;
    });
  }, [targetCo, search, filterProduk, filterNewIjin]);

  const sortedTargetCo = useMemo(() => {
    return [...filteredTargetCo].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();

      return dateB - dateA;
    });
  }, [filteredTargetCo]);

  const totalFiltered = sortedTargetCo.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedTargetCo = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;

    return sortedTargetCo.slice(startIndex, startIndex + pageSize);
  }, [sortedTargetCo, safeCurrentPage, pageSize]);

  const rangeStart = totalFiltered === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;

  const rangeEnd = totalFiltered === 0 ? 0 : Math.min(safeCurrentPage * pageSize, totalFiltered);

  function openModal() {
    setEditTarget(null);
    setEditMode("create");
    setForm(INITIAL_FORM);
    setError("");
    setIsModalOpen(true);
  }

  function openPendingEditModal(row) {
    if (normalizeApprovalStatus(row.approval_status) !== "PENDING_APPROVAL") {
      setError("Hanya data PENDING_APPROVAL yang dapat diedit.");
      return;
    }

    setEditTarget(row);
    setEditMode("pending");
    setForm({
      nama: row.nama || "",
      namaSo: row.nama_so ?? "",
      plafond: formatMoneyInput(String(row.plafond ?? "")),
      new_ijin: row.new_ijin || "",
      produk: row.produk || "",
    });
    setError("");
    setIsModalOpen(true);
  }

  function openRevisionEditModal(row) {
    if (normalizeApprovalStatus(row.approval_status) !== "REVISION") {
      setError("Data tidak lagi berstatus REVISION.");
      return;
    }

    setEditTarget(row);
    setEditMode("revision");
    setForm({
      nama: row.nama || "",
      namaSo: row.nama_so ?? "",
      plafond: formatMoneyInput(String(row.plafond ?? "")),
      new_ijin: row.new_ijin || "",
      produk: row.produk || "",
    });
    setError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setIsModalOpen(false);
    setEditTarget(null);
    setEditMode("create");
    setForm(INITIAL_FORM);
    setError("");
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  }

  function handlePlafondChange(value) {
    setForm((current) => ({
      ...current,
      plafond: formatMoneyInput(value),
    }));

    setError("");
  }

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

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.nama.trim()) {
      setError("Nama wajib diisi.");
      return;
    }

    const plafond = parseMoney(form.plafond);

    if (!Number.isFinite(plafond) || plafond <= 0) {
      setError("Plafond harus lebih dari Rp0.");
      return;
    }

    if (!form.new_ijin) {
      setError("NEW / IJIN PRINSIP wajib dipilih.");
      return;
    }

    if (!form.produk) {
      setError("Produk wajib dipilih.");
      return;
    }

    const payload = {
      nama: form.nama.trim(),
      namaSo: form.namaSo.trim() || null,
      plafond,
      newIjin: form.new_ijin?.trim() || null,
      produk: form.produk,
    };

    try {
      if (editMode === "pending") {
        if (editTarget?.approval_status !== "PENDING_APPROVAL") {
          throw new Error("Status data berubah. Muat ulang data terlebih dahulu.");
        }

        if (typeof onUpdatePending !== "function") {
          throw new Error("Fungsi update Target CO belum terhubung.");
        }

        await onUpdatePending(editTarget.id, payload);
      } else if (editMode === "revision") {
        if (editTarget?.approval_status !== "REVISION") {
          throw new Error("Status revisi berubah. Muat ulang data terlebih dahulu.");
        }

        if (typeof onResubmit !== "function") {
          throw new Error("Fungsi pengiriman ulang revisi belum terhubung.");
        }

        await onResubmit("target_co", editTarget.id, payload);
      } else {
        await onCreate(payload);
      }

      setForm(INITIAL_FORM);
      setEditTarget(null);
      setEditMode("create");
      setError("");
      setIsModalOpen(false);
      setCurrentPage(1);
    } catch (submitError) {
      setError(submitError.message || "Gagal menyimpan data.");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    const target = deleteTarget;
    setError("");

    try {
      await onDelete(target.id);
      setDeleteTarget(null);
    } catch (deleteError) {
      setError(deleteError.message || "Gagal menghapus data.");
    }
  }

  function handleExportExcel() {
    if (sortedTargetCo.length === 0) {
      setError("Tidak ada data yang dapat diekspor.");
      return;
    }

    const exportData = sortedTargetCo.map((row, index) => ({
      No: index + 1,
      Unit: row.unit || "-",
      Nama: row.nama || "-",
      "Nama SO": row.nama_so || "-",
      Plafond: Number(row.plafond || 0),
      "New / Ijin Prinsip": row.new_ijin || "-",
      Produk: row.produk || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    worksheet["!cols"] = [{ wch: 8 }, { wch: 18 }, { wch: 32 }, { wch: 24 }, { wch: 20 }, { wch: 24 }, { wch: 24 }];

    exportData.forEach((row, index) => {
      const cellAddress = XLSX.utils.encode_cell({
        r: index + 1,
        c: 4,
      });

      if (worksheet[cellAddress]) {
        worksheet[cellAddress].t = "n";
        worksheet[cellAddress].z = "#,##0";
      }
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Target CO");

    const now = new Date();
    const dateString = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");

    XLSX.writeFile(workbook, `Target-CO-${dateString}.xlsx`);
  }

  function renderPagination() {
    if (totalFiltered === 0 || totalPages <= 1) return null;

    const startPage = Math.max(1, Math.min(safeCurrentPage - 2, totalPages - 4));

    const endPage = Math.min(totalPages, startPage + 4);
    const pages = [];

    for (let page = startPage; page <= endPage; page += 1) {
      pages.push(page);
    }

    const pageButtonClass = "flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition";

    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-4 dark:border-slate-800 sm:px-6">
        <button type="button" disabled={safeCurrentPage === 1} onClick={() => setCurrentPage((current) => Math.max(1, current - 1))} className={`${secondaryButtonClass} !px-3 !py-2`}>
          <span aria-hidden="true">←</span>
          <span className="hidden sm:inline">Sebelumnya</span>
        </button>

        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {startPage > 1 && (
            <>
              <button type="button" onClick={() => setCurrentPage(1)} className={`${pageButtonClass} border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800`}>
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
              className={`${pageButtonClass} ${
                page === safeCurrentPage ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {page}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-1 text-slate-400">…</span>}
              <button type="button" onClick={() => setCurrentPage(totalPages)} className={`${pageButtonClass} border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800`}>
                {totalPages}
              </button>
            </>
          )}
        </div>

        <button type="button" disabled={safeCurrentPage === totalPages} onClick={() => setCurrentPage((current) => Math.min(totalPages, current + 1))} className={`${secondaryButtonClass} !px-3 !py-2`}>
          <span className="hidden sm:inline">Berikutnya</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* HEADER */}
      <section className={`${cardClass} overflow-hidden`}>
        <div className="flex flex-col gap-5 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              Laporan CO
            </div>

            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">Target Pengerjaan CO</h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">Kelola target pengerjaan, pantau total plafond, dan ekspor data target CO.</p>
          </div>

          <button type="button" onClick={openModal} className={`${primaryButtonClass} w-full shrink-0 sm:w-auto`}>
            <span className="text-lg leading-none" aria-hidden="true">
              +
            </span>
            Tambah Target CO
          </button>
        </div>
      </section>

      {/* KPI */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className={`${cardClass} p-5 sm:p-6`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total NOA</p>
              <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{targetCo.length.toLocaleString("id-ID")}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Target CO terdaftar</p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-xl text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">◫</div>
          </div>
        </div>

        <div className={`${cardClass} p-5 sm:p-6`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Plafond</p>
              <p className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{formatRupiah(totalPlafond)}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Akumulasi seluruh target</p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-xl text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">Rp</div>
          </div>
        </div>
      </section>

      {/* ERROR UMUM */}
      {error && !isModalOpen && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
          <span className="font-bold">!</span>
          <p className="min-w-0 flex-1">{error}</p>
          <button type="button" onClick={() => setError("")} className="font-bold" aria-label="Tutup pesan">
            ×
          </button>
        </div>
      )}

      {/* DATA TABLE */}
      <section className={`${cardClass} overflow-hidden`}>
        <div className="border-b border-slate-200 p-5 dark:border-slate-800 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Data Target CO</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Cari, filter, urutkan, atau ekspor data yang terdaftar.</p>
            </div>

            <button type="button" onClick={handleExportExcel} disabled={loading || sortedTargetCo.length === 0} className={`${secondaryButtonClass} w-full shrink-0 sm:w-auto`}>
              <span aria-hidden="true">↓</span>
              Export Excel
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">{sortedTargetCo.length}</span>
            </button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="relative min-w-0 sm:col-span-2 xl:col-span-2">
              <label htmlFor="target-co-search" className="sr-only">
                Cari data Target CO
              </label>

              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">⌕</span>

              <input id="target-co-search" type="search" value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Cari nama, SO, unit, produk..." className={`${inputClass} pl-10`} />
            </div>

            <div>
              <label htmlFor="target-co-filter-produk" className="sr-only">
                Filter produk
              </label>

              <select id="target-co-filter-produk" value={filterProduk} onChange={(event) => updateFilter(setFilterProduk, event.target.value)} className={inputClass}>
                <option value="" className="bg-slate-900 text-white">
                  Semua Produk
                </option>

                {PRODUCTS.map((product) => (
                  <option key={product} value={product} className="bg-slate-900 text-white">
                    {product}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="target-co-filter-status" className="sr-only">
                Filter status
              </label>

              <select id="target-co-filter-status" value={filterNewIjin} onChange={(event) => updateFilter(setFilterNewIjin, event.target.value)} className={inputClass}>
                <option value="" className="bg-slate-900 text-white">
                  Semua Status
                </option>
                <option value="NEW" className="bg-slate-900 text-white">
                  NEW
                </option>
                <option value="IJIN PRINSIP" className="bg-slate-900 text-white">
                  IJIN PRINSIP
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* RINGKASAN */}
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/40 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <strong className="font-bold text-slate-900 dark:text-white">{totalFiltered.toLocaleString("id-ID")}</strong> data ditemukan
            {!loading && totalFiltered > 0 && (
              <span className="ml-1 text-slate-500 dark:text-slate-400">
                · Menampilkan {rangeStart}–{rangeEnd}
              </span>
            )}
          </p>

          <label className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span>Per halaman</span>
            <select
              value={pageSize}
              onChange={(event) => handlePageSizeChange(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size} className="bg-slate-900 text-white">
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* TARGET CO CARDS - MOBILE DAN DESKTOP */}
        <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-2 xl:grid-cols-3 sm:p-6">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400 lg:col-span-2 xl:col-span-3">Memuat data target CO...</div>
          ) : totalFiltered === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-12 text-center dark:border-slate-700 lg:col-span-2 xl:col-span-3">
              <p className="font-semibold text-slate-800 dark:text-slate-100">{targetCo.length === 0 ? "Belum ada target CO." : "Data tidak ditemukan."}</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{targetCo.length === 0 ? "Tambahkan target melalui tombol Tambah Target CO." : "Coba ubah pencarian atau filter."}</p>
            </div>
          ) : (
            paginatedTargetCo.map((row, index) => {
              const rowNumber = (safeCurrentPage - 1) * pageSize + index + 1;

              return (
                <article
                  key={row.id}
                  className="flex min-w-0 flex-col rounded-2xl border-2 border-slate-300 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md dark:border-slate-600 dark:bg-slate-900 dark:hover:border-indigo-500 sm:p-5"
                >
                  {/* Header card */}
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">{String(rowNumber).padStart(2, "0")}</span>

                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-sm font-bold text-slate-900 dark:text-white">{row.nama || "-"}</h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Unit</p>
                      <span className="mt-1 inline-flex max-w-full break-words rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">{row.unit || "-"}</span>
                    </div>

                    <ApprovalStatusBadge status={row.approval_status} />

                    {getCancellationRequest(row) && (
                      <span className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                        <span aria-hidden="true">◷</span>
                        Pembatalan Menunggu Supervisor
                      </span>
                    )}
                  </div>

                  {/* Tanggal pengajuan */}
                  <div className="mt-3">
                    <span className="inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <span aria-hidden="true">🗓</span>
                      <span>Diajukan:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{formatSubmissionDate(row.created_at)}</span>
                    </span>
                  </div>

                  {/* Plafond */}
                  <div className="mt-4 rounded-xl bg-indigo-50/80 p-3 dark:bg-indigo-500/10">
                    <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">Plafond</p>
                    <p className="mt-1 break-words text-lg font-bold text-slate-900 dark:text-white">{formatRupiah(row.plafond)}</p>
                  </div>

                  {/* Detail target */}
                  <div className="mt-3 space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/90 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="w-24 shrink-0 pt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Nama SO</span>
                      <span className="inline-flex max-w-full min-w-0 break-words rounded-lg border border-sky-200 bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                        {row.nama_so || "Belum diisi"}
                      </span>
                    </div>

                    <div className="flex min-w-0 items-start gap-3">
                      <span className="w-24 shrink-0 pt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">New / Ijin</span>
                      <span className="inline-flex max-w-full min-w-0 break-words rounded-lg border border-amber-200 bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        {row.new_ijin || "-"}
                      </span>
                    </div>

                    <div className="flex min-w-0 items-start gap-3">
                      <span className="w-24 shrink-0 pt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Produk</span>
                      <span className="inline-flex max-w-full min-w-0 break-words rounded-lg border border-violet-200 bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-800 dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-300">
                        {row.produk || "-"}
                      </span>
                    </div>
                  </div>

                  {/* AKSI CARD: TOMBOL SEJAJAR SEPERTI PROPOSAL REPORT */}
                  {normalizeApprovalStatus(row.approval_status) === "PENDING_APPROVAL" && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={saving || Boolean(deletingId)}
                        onClick={() => openPendingEditModal(row)}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-950/50"
                      >
                        Edit
                      </button>

                      {canRequestCancellation(row) && (
                        <button
                          type="button"
                          disabled={saving || Boolean(cancellationSubmittingId)}
                          onClick={() => openCancellationModal(row)}
                          className="col-span-2 inline-flex min-h-10 items-center justify-center rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/50"
                        >
                          Ajukan Pembatalan
                        </button>
                      )}
                    </div>
                  )}

                  {normalizeApprovalStatus(row.approval_status) === "REVISION" && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={saving || Boolean(deletingId)}
                        onClick={() => openRevisionEditModal(row)}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-amber-300 bg-amber-400 px-3 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-500 dark:bg-amber-400 dark:text-amber-950 dark:hover:bg-amber-300"
                      >
                        Edit Revisi
                      </button>

                      <div className="flex min-h-10 items-center justify-center rounded-xl border border-amber-200/70 px-3 py-2 text-center text-xs font-medium text-amber-700/80 dark:border-amber-900/70 dark:text-amber-300/80">
                        Menunggu perbaikan
                      </div>
                    </div>
                  )}

                  {normalizeApprovalStatus(row.approval_status) === "APPROVED" && canRequestCancellation(row) && (
                    <button
                      type="button"
                      disabled={saving || Boolean(cancellationSubmittingId)}
                      onClick={() => openCancellationModal(row)}
                      className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/50"
                    >
                      Ajukan Pembatalan
                    </button>
                  )}
                </article>
              );
            })
          )}
        </div>

        {!loading && renderPagination()}
      </section>

      {/* MODAL TAMBAH TARGET CO */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="target-co-modal-title" className="my-auto w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 dark:border-slate-800 sm:px-7">
              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">Form Input</div>
                <h2 id="target-co-modal-title" className="text-xl font-bold text-white">
                  {editMode === "pending" ? "Edit Target CO" : editMode === "revision" ? "Edit Revisi Target CO" : "Tambah Target CO"}
                </h2>
                <p className="mt-1 text-sm leading-5 text-white/70">
                  {editMode === "pending"
                    ? "Perbarui data yang masih menunggu persetujuan."
                    : editMode === "revision"
                      ? "Perbaiki data sesuai catatan Supervisor, lalu kirim ulang untuk persetujuan."
                      : "Lengkapi informasi target yang akan dicatat."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Tutup modal"
                className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-950 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
              >
                <X className="h-4 w-4 stroke-[2.5] transition-transform duration-200 group-hover:scale-110" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-5 px-5 py-6 sm:px-7">
                {error && (
                  <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
                    <span className="font-bold">!</span>
                    <p>{error}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="target-co-nama" className={labelClass}>
                    Nama <span className="text-rose-500">*</span>
                  </label>
                  <input id="target-co-nama" name="nama" type="text" value={form.nama} onChange={handleChange} placeholder="Masukkan nama CO / Cadeb" autoComplete="off" required disabled={saving} className={inputClass} />
                </div>

                <div>
                  <label htmlFor="target-co-nama-so" className={labelClass}>
                    Nama SO <span className="font-normal text-white/60">(Opsional)</span>
                  </label>

                  <input
                    id="target-co-nama-so"
                    name="namaSo"
                    type="text"
                    value={form.namaSo}
                    onChange={handleChange}
                    placeholder="Masukkan nama SO jika tersedia"
                    autoComplete="off"
                    maxLength={150}
                    disabled={saving}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="target-co-plafond" className={labelClass}>
                    Plafond <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500 dark:text-slate-400">Rp</span>
                    <input
                      id="target-co-plafond"
                      name="plafond"
                      type="text"
                      inputMode="numeric"
                      value={form.plafond}
                      onChange={(event) => handlePlafondChange(event.target.value)}
                      placeholder="0"
                      required
                      disabled={saving}
                      className={`${inputClass} pl-12`}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Masukkan nominal plafond dalam rupiah.</p>
                </div>

                <div>
                  <label htmlFor="target-co-new-ijin" className={labelClass}>
                    New / Ijin Prinsip <span className="text-rose-500">*</span>
                  </label>
                  <select id="target-co-new-ijin" name="new_ijin" value={form.new_ijin} onChange={handleChange} required disabled={saving} className={inputClass}>
                    <option value="" className="bg-white text-slate-500 dark:bg-slate-900 dark:text-slate-300">
                      Pilih status
                    </option>
                    <option value="NEW" className="bg-white text-slate-500 dark:bg-slate-900 dark:text-slate-300">
                      NEW
                    </option>
                    <option value="IJIN PRINSIP" className="bg-white text-slate-500 dark:bg-slate-900 dark:text-slate-300">
                      IJIN PRINSIP
                    </option>
                  </select>
                </div>

                <div>
                  <label htmlFor="target-co-produk" className={labelClass}>
                    Produk <span className="text-rose-500">*</span>
                  </label>
                  <select id="target-co-produk" name="produk" value={form.produk} onChange={handleChange} required disabled={saving} className={inputClass}>
                    <option value="" className="bg-slate-900 text-white">
                      Pilih produk
                    </option>
                    {PRODUCTS.map((product) => (
                      <option key={product} value={product} className="bg-white text-slate-500 dark:bg-slate-900 dark:text-slate-300">
                        {product}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/40 sm:flex-row sm:justify-end sm:px-7">
                <button type="button" onClick={closeModal} disabled={saving} className={secondaryButtonClass}>
                  Batal
                </button>
                <button type="submit" disabled={saving} className={primaryButtonClass}>
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <span aria-hidden="true">✓</span>
                      {editMode === "pending" ? "Simpan Perubahan" : editMode === "revision" ? "Kirim Ulang untuk Persetujuan" : "Simpan Target CO"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* MODAL PENGAJUAN PEMBATALAN TARGET CO */}
      {cancellationTarget && (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCancellationModal();
            }
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="cancel-target-co-title" className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800 sm:p-6">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Pengajuan Pembatalan</p>

                <h2 id="cancel-target-co-title" className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                  Ajukan Pembatalan Target CO?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Data tidak langsung dihapus. Supervisor akan meninjau alasan pembatalan sebelum mengambil keputusan.</p>
              </div>

              <button
                type="button"
                onClick={closeCancellationModal}
                disabled={Boolean(cancellationSubmittingId)}
                aria-label="Tutup modal"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={confirmCancellationRequest}>
              <div className="space-y-5 p-5 sm:p-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/50">
                  <p className="break-words font-bold text-slate-900 dark:text-white">{cancellationTarget.nama || "-"}</p>

                  <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">
                    {cancellationTarget.unit || "-"} · {cancellationTarget.produk || "-"}
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Plafond</p>
                      <p className="mt-1 break-words font-bold text-indigo-700 dark:text-indigo-300">{formatRupiah(cancellationTarget.plafond)}</p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">New / Ijin Prinsip</p>
                      <p className="mt-1 break-words font-semibold text-slate-800 dark:text-slate-100">{cancellationTarget.new_ijin || "-"}</p>
                    </div>

                    <div className="sm:col-span-2">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Status laporan</p>
                      <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{normalizeApprovalStatus(cancellationTarget.approval_status) === "APPROVED" ? "Disetujui" : "Menunggu Persetujuan"}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="target-co-cancellation-reason" className={labelClass}>
                    Alasan pembatalan <span className="text-rose-500">*</span>
                  </label>

                  <textarea
                    id="target-co-cancellation-reason"
                    value={cancellationReason}
                    onChange={(event) => {
                      setCancellationReason(event.target.value);
                      setCancellationError("");
                    }}
                    rows={4}
                    minLength={5}
                    maxLength={1000}
                    required
                    disabled={Boolean(cancellationSubmittingId)}
                    placeholder="Jelaskan mengapa Target CO ini perlu dibatalkan..."
                    className={`${inputClass} resize-y`}
                  />

                  <div className="mt-1 flex items-start justify-between gap-3 text-xs text-white/60">
                    <span>Minimal 5 karakter, maksimal 1.000 karakter.</span>
                    <span className="shrink-0">{cancellationReason.length}/1000</span>
                  </div>
                </div>

                {cancellationError && (
                  <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
                    {cancellationError}
                  </p>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40 sm:flex-row sm:justify-end sm:px-6">
                <button type="button" onClick={closeCancellationModal} disabled={Boolean(cancellationSubmittingId)} className={secondaryButtonClass}>
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={Boolean(cancellationSubmittingId) || cancellationReason.trim().length < 5}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cancellationSubmittingId === cancellationTarget.id ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                      Mengirim Pengajuan...
                    </>
                  ) : (
                    "Kirim Pengajuan"
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default TargetCoReport;
