import { useMemo, useState } from "react";
import * as XLSX from "xlsx-js-style";

import { POSITIONS, PRODUCTS } from "../../constants/report";
import { formatMoneyInput, formatRupiah, parseMoney } from "../../utils/format";
import { X } from "lucide-react";

import ApprovalStatusBadge from "./ApprovalStatusBadge";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const inputClass =
  "mt-1.5 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-300 [color-scheme:light] dark:[color-scheme:dark]";

const labelClass = "block text-xs font-semibold text-slate-600 dark:text-slate-300";

const selectClass =
  "min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

const cardClass = "min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-900";

const headingClass = "font-bold text-slate-800 dark:text-slate-100";

const mutedTextClass = "text-slate-500 dark:text-slate-400";

const moneyFormatter = (value) => formatRupiah(Number(value || 0));

function ProposalReport({ proposals = [], cancellationRequests = [], loading = false, saving = false, deletingId = null, cancellationSubmittingId = null, onCreate, onUpdatePending, onResubmit, onRequestCancellation }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState(null);

  const [form, setForm] = useState({
    cadeb: "",
    namaSo: "",
    plafond: "",
    freshMoney: "",
    produk: "",
    posisi: "Admin",
  });

  const [cancellationTarget, setCancellationTarget] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancellationError, setCancellationError] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterProduk, setFilterProduk] = useState("");
  const [filterPosisi, setFilterPosisi] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const totals = useMemo(
    () => ({
      plafond: proposals.reduce((total, row) => total + Number(row.plafond || 0), 0),
      freshMoney: proposals.reduce((total, row) => total + Number(row.fresh_money || 0), 0),
      noa: proposals.length,
    }),
    [proposals],
  );

  const filteredProposals = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return proposals.filter((row) => {
      const matchesSearch =
        !normalizedSearch ||
        String(row.cadeb || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(row.nama_so || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(row.unit || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(row.produk || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(row.posisi || "")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesProduk = !filterProduk || String(row.produk || "") === filterProduk;

      const matchesPosisi = !filterPosisi || String(row.posisi || "") === filterPosisi;

      return matchesSearch && matchesProduk && matchesPosisi;
    });
  }, [proposals, search, filterProduk, filterPosisi]);

  const sortedProposals = useMemo(() => {
    const data = [...filteredProposals];

    data.sort((a, b) => {
      let valueA;
      let valueB;

      switch (sortField) {
        case "cadeb":
          valueA = String(a.cadeb || "").toLowerCase();
          valueB = String(b.cadeb || "").toLowerCase();
          break;

        case "plafond":
          valueA = Number(a.plafond || 0);
          valueB = Number(b.plafond || 0);
          break;

        case "fresh_money":
          valueA = Number(a.fresh_money || 0);
          valueB = Number(b.fresh_money || 0);
          break;

        case "produk":
          valueA = String(a.produk || "").toLowerCase();
          valueB = String(b.produk || "").toLowerCase();
          break;

        case "posisi":
          valueA = String(a.posisi || "").toLowerCase();
          valueB = String(b.posisi || "").toLowerCase();
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
  }, [filteredProposals, sortField, sortDirection]);

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

  const totalFiltered = sortedProposals.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedProposals = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return sortedProposals.slice(startIndex, startIndex + pageSize);
  }, [sortedProposals, safeCurrentPage, pageSize]);

  const rangeStart = totalFiltered === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;

  const rangeEnd = totalFiltered === 0 ? 0 : Math.min(safeCurrentPage * pageSize, totalFiltered);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
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

  function handleSort(field) {
    if (sortField === field) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "created_at" ? "desc" : "asc");
    }

    setCurrentPage(1);
  }

  function handlePageSizeChange(value) {
    setPageSize(Number(value));
    setCurrentPage(1);
  }

  function resetControls() {
    setSearch("");
    setFilterProduk("");
    setFilterPosisi("");
    setSortField("created_at");
    setSortDirection("desc");
    setCurrentPage(1);
    setPageSize(20);
  }

  function resetForm() {
    setForm({
      cadeb: "",
      namaSo: "",
      plafond: "",
      freshMoney: "",
      produk: "",
      posisi: "Admin",
    });
  }

  function openCreateModal() {
    setError("");
    setEditingProposal(null);
    resetForm();
    setFormOpen(true);
  }

  function openEditModal(row) {
    if (row.approval_status !== "PENDING_APPROVAL") {
      return;
    }

    setError("");
    setEditingProposal(row);

    setForm({
      cadeb: row.cadeb ?? "",
      namaSo: row.nama_so ?? "",
      plafond: formatMoneyInput(String(row.plafond ?? "")),
      freshMoney: formatMoneyInput(String(row.fresh_money ?? "")),
      produk: row.produk ?? "",
      posisi: row.posisi ?? "Admin",
    });

    setFormOpen(true);
  }

  function openRevisionEditModal(row) {
    if (row.approval_status !== "REVISION") {
      return;
    }

    setEditingProposal(row);
    setCadeb(row.cadeb || "");
    setNamaSo(row.nama_so ?? "");
    setPlafond(formatMoneyInput(String(row.plafond ?? "")));
    setFreshMoney(formatMoneyInput(String(row.fresh_money ?? "")));
    setProduk(row.produk || "");
    setPosisi(row.posisi || "");
    setFormOpen(true);
  }

  function openRevisionEditModal(row) {
    if (row.approval_status !== "REVISION") {
      return;
    }

    setError("");
    setEditingProposal(row);

    setForm({
      cadeb: row.cadeb ?? "",
      plafond: formatMoneyInput(String(row.plafond ?? "")),
      freshMoney: formatMoneyInput(String(row.fresh_money ?? "")),
      produk: row.produk ?? "",
      posisi: row.posisi ?? "Admin",
    });

    setFormOpen(true);
  }

  function closeCreateModal() {
    if (saving) return;

    setError("");
    setFormOpen(false);
    setEditingProposal(null);
    resetForm();
  }

  function handleMoneyChange(field, value) {
    updateField(field, formatMoneyInput(value));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.cadeb.trim()) {
      setError("Nama Cadeb wajib diisi.");
      return;
    }

    const plafond = parseMoney(form.plafond);
    const freshMoney = parseMoney(form.freshMoney);

    if (plafond <= 0) {
      setError("Plafond harus lebih dari Rp0.");
      return;
    }

    if (!form.produk) {
      setError("Produk wajib dipilih.");
      return;
    }

    if (!form.posisi) {
      setError("Posisi wajib dipilih.");
      return;
    }

    const payload = {
      cadeb: form.cadeb.trim(),
      namaSo: form.namaSo.trim() || null,
      plafond,
      freshMoney,
      produk: form.produk,
      posisi: form.posisi,
    };

    try {
      if (editingProposal) {
        if (editingProposal.approval_status === "REVISION") {
          if (typeof onResubmit !== "function") {
            throw new Error("Fungsi pengiriman ulang revisi Proposal belum terhubung.");
          }

          await onResubmit(editingProposal.id, payload);
        } else if (editingProposal.approval_status === "PENDING_APPROVAL") {
          if (typeof onUpdatePending !== "function") {
            throw new Error("Fungsi edit Proposal belum terhubung.");
          }

          await onUpdatePending(editingProposal.id, payload);
        } else {
          throw new Error("Proposal dengan status ini tidak dapat diedit.");
        }
      } else {
        await onCreate(payload);
      }

      resetForm();
      setEditingProposal(null);
      setError("");
      setCurrentPage(1);
      setFormOpen(false);
    } catch (submitError) {
      setError(submitError?.message || (editingProposal ? "Gagal memperbarui data Proposal." : "Gagal menyimpan data Proposal."));
    }
  }

  function getCancellationRequest(row) {
    return cancellationRequests.find((request) => request.entity_type === "proposal" && request.entity_id === row.id && request.status === "PENDING");
  }

  function canRequestCancellation(row) {
    return ["PENDING_APPROVAL", "APPROVED"].includes(row.approval_status) && !row.cancelled_at && !getCancellationRequest(row);
  }

  function openCancellationModal(row) {
    if (!canRequestCancellation(row)) {
      return;
    }

    setCancellationTarget(row);
    setCancellationReason("");
    setCancellationError("");
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
      setCancellationError("Fungsi pengajuan pembatalan belum terhubung.");
      return;
    }

    try {
      setCancellationError("");

      await onRequestCancellation(cancellationTarget.id, reason);

      setCancellationTarget(null);
      setCancellationReason("");
      setCancellationError("");
    } catch (requestError) {
      setCancellationError(requestError?.message || "Gagal mengajukan pembatalan Proposal.");
    }
  }

  function sortIndicator(field) {
    if (sortField !== field) {
      return <span className="ml-1 text-slate-300 dark:text-slate-600">↕</span>;
    }

    return <span className="ml-1 text-indigo-600 dark:text-indigo-400">{sortDirection === "asc" ? "↑" : "↓"}</span>;
  }

  function SortButton({ field, children }) {
    return (
      <button type="button" onClick={() => handleSort(field)} className="inline-flex items-center whitespace-nowrap font-semibold text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400">
        {children}
        {sortIndicator(field)}
      </button>
    );
  }

  function renderPagination() {
    if (totalFiltered === 0 || totalPages <= 1) return null;

    const startPage = Math.max(1, Math.min(safeCurrentPage - 2, totalPages - 4));
    const endPage = Math.min(totalPages, startPage + 4);
    const pages = [];

    for (let page = startPage; page <= endPage; page += 1) {
      pages.push(page);
    }

    return (
      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-200 px-4 py-4 dark:border-slate-700 sm:justify-between">
        <p className={`text-xs ${mutedTextClass}`}>
          Halaman {safeCurrentPage} dari {totalPages}
        </p>

        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" disabled={safeCurrentPage === 1} onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} className={secondaryButtonClass}>
            ← Sebelumnya
          </button>

          {pages.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              aria-current={page === safeCurrentPage ? "page" : undefined}
              className={`h-10 min-w-10 rounded-xl px-3 text-sm font-semibold transition ${
                page === safeCurrentPage ? "bg-indigo-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {page}
            </button>
          ))}

          <button type="button" disabled={safeCurrentPage === totalPages} onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} className={secondaryButtonClass}>
            Berikutnya →
          </button>
        </div>
      </div>
    );
  }

  function handleExportExcel() {
    if (sortedProposals.length === 0) return;

    const exportData = sortedProposals.map((row, index) => ({
      No: index + 1,
      "Nama Cadeb": row.cadeb || "-",
      "Nama SO": row.nama_so || "-",
      Plafond: Number(row.plafond || 0),
      "Fresh Money": Number(row.fresh_money || 0),
      Produk: row.produk || "-",
      Posisi: row.posisi || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    worksheet["!cols"] = [{ wch: 6 }, { wch: 30 }, { wch: 24 }, { wch: 20 }, { wch: 20 }, { wch: 22 }, { wch: 18 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Proposal");

    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Proposal-Report-${date}.xlsx`);
  }

  return (
    <div className="min-w-0 space-y-5 pb-6 text-slate-800 dark:text-slate-100">
      {/* HEADER */}
      <section className={`${cardClass} overflow-hidden`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">Kantor Pusat</p>

            <h1 className={`mt-1 text-xl sm:text-2xl ${headingClass}`}>Report Proposal</h1>

            <p className={`mt-1 text-sm ${mutedTextClass}`}>Kelola dan pantau data proposal yang telah terdaftar.</p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
          >
            <span className="text-lg leading-none">+</span>
            Tambah Proposal
          </button>
        </div>
      </section>

      {/* KPI */}
      <section className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
        <div className={cardClass}>
          <p className={`text-xs font-semibold ${mutedTextClass}`}>TOTAL NOA</p>
          <p className="mt-2 break-words text-2xl font-bold text-indigo-600 dark:text-indigo-400">{totals.noa.toLocaleString("id-ID")}</p>
          <p className={`mt-1 text-xs ${mutedTextClass}`}>Jumlah seluruh proposal</p>
        </div>

        <div className={cardClass}>
          <p className={`text-xs font-semibold ${mutedTextClass}`}>TOTAL PLAFOND</p>
          <p className={`mt-2 break-words text-xl font-bold ${headingClass}`}>{moneyFormatter(totals.plafond)}</p>
          <p className={`mt-1 text-xs ${mutedTextClass}`}>Akumulasi plafond proposal</p>
        </div>

        <div className={cardClass}>
          <p className={`text-xs font-semibold ${mutedTextClass}`}>TOTAL FRESH MONEY</p>
          <p className={`mt-2 break-words text-xl font-bold ${headingClass}`}>{moneyFormatter(totals.freshMoney)}</p>
          <p className={`mt-1 text-xs ${mutedTextClass}`}>Akumulasi fresh money</p>
        </div>
      </section>

      {/* DATA TABLE */}
      <section className={`${cardClass} overflow-hidden !p-0`}>
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className={`text-base ${headingClass}`}>Daftar Proposal</h2>
            <p className={`mt-1 text-xs ${mutedTextClass}`}>Cari, filter, urutkan, atau ekspor data proposal.</p>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={loading || sortedProposals.length === 0}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/50"
          >
            <span aria-hidden="true">↓</span>
            Export Excel
          </button>
        </div>

        {/* SEARCH & FILTER */}
        <div className="grid min-w-0 grid-cols-1 gap-3 border-b border-slate-200 p-4 dark:border-slate-700 sm:grid-cols-2 xl:grid-cols-4">
          <div className="min-w-0 sm:col-span-2 xl:col-span-1">
            <label htmlFor="proposal-search" className={labelClass}>
              Cari data
            </label>
            <div className="relative mt-1.5">
              <input id="proposal-search" type="search" value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Nama Cadeb, SO,produk, posisi..." className={`${inputClass} pr-10`} />
              {search && (
                <button type="button" onClick={() => updateSearch("")} aria-label="Hapus pencarian" className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-slate-400 hover:text-slate-700 dark:hover:text-white">
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="min-w-0">
            <label htmlFor="proposal-filter-produk" className={labelClass}>
              Filter produk
            </label>
            <select id="proposal-filter-produk" value={filterProduk} onChange={(event) => updateFilter(setFilterProduk, event.target.value)} className={`${selectClass} mt-1.5 w-full`}>
              <option value="">Semua Produk</option>
              {PRODUCTS.map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label htmlFor="proposal-filter-posisi" className={labelClass}>
              Filter posisi
            </label>
            <select id="proposal-filter-posisi" value={filterPosisi} onChange={(event) => updateFilter(setFilterPosisi, event.target.value)} className={`${selectClass} mt-1.5 w-full`}>
              <option value="">Semua Posisi</option>
              {POSITIONS.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button type="button" onClick={resetControls} disabled={!search && !filterProduk && !filterPosisi && sortField === "created_at" && sortDirection === "desc" && pageSize === 20} className={`${secondaryButtonClass} w-full`}>
              Reset Filter
            </button>
          </div>
        </div>

        {/* RESULT SUMMARY */}
        <div className="flex flex-col gap-3 bg-slate-50/80 px-4 py-3 dark:bg-slate-950/40 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <span className="font-bold text-slate-800 dark:text-slate-100">{totalFiltered.toLocaleString("id-ID")}</span> data ditemukan
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <p className={`text-xs ${mutedTextClass}`}>
              Menampilkan {rangeStart}–{rangeEnd} dari {totalFiltered}
            </p>

            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              Per halaman
              <select value={pageSize} onChange={(event) => handlePageSizeChange(event.target.value)} className={`${selectClass} py-2`}>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* MOBILE CARDS */}
        <div className="space-y-3 p-3 md:hidden">
          {loading ? (
            <div className={`rounded-xl p-8 text-center text-sm ${mutedTextClass}`}>Memuat data proposal...</div>
          ) : totalFiltered === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center dark:border-slate-700">
              <p className={`font-semibold ${headingClass}`}>{proposals.length === 0 ? "Belum ada data proposal." : "Data tidak ditemukan."}</p>
              <p className={`mt-1 text-sm ${mutedTextClass}`}>{proposals.length === 0 ? "Gunakan tombol Tambah Proposal untuk mulai mengisi data." : "Coba ubah kata pencarian atau filter."}</p>
              {proposals.length > 0 && (
                <button type="button" onClick={resetControls} className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                  Reset Filter
                </button>
              )}
            </div>
          ) : (
            paginatedProposals.map((row, index) => {
              const rowNumber = (safeCurrentPage - 1) * pageSize + index + 1;

              return (
                <article
                  key={row.id}
                  className="flex min-w-0 flex-col rounded-2xl border-2 border-slate-300 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md dark:border-slate-600 dark:bg-slate-900 dark:hover:border-indigo-500 sm:p-5"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3 flex-1">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">{rowNumber}</span>
                      <div className="min-w-0 flex-1">
                        <h3 className="break-words text-sm font-bold text-slate-800 dark:text-slate-100">{row.cadeb || "-"}</h3>
                      </div>
                    </div>
                    <ApprovalStatusBadge status={row.approval_status} />
                    {getCancellationRequest(row) && (
                      <span className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
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

                  {/* Grid 3 Kolom langsung melebar penuh mengikuti card */}
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {/* SO Badge */}
                    <div className="flex flex-col items-center justify-center rounded-lg border border-sky-200 bg-sky-100 p-2 text-center text-xs font-semibold text-sky-800 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">SO</span>
                      <span className="truncate w-full">{row.nama_so || "-"}</span>
                    </div>

                    {/* Produk Badge */}
                    <div className="flex flex-col items-center justify-center rounded-lg border border-violet-200 bg-violet-100 p-2 text-center text-xs font-semibold text-violet-800 dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-300">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Produk</span>
                      <span className="truncate w-full">{row.produk || "-"}</span>
                    </div>

                    {/* Posisi Badge */}
                    <div className="flex flex-col items-center justify-center rounded-lg border border-amber-200 bg-amber-100 p-2 text-center text-xs font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Posisi</span>
                      <span className="truncate w-full">{row.posisi || "-"}</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="min-w-0 rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                      <p className={`text-[10px] font-semibold ${mutedTextClass}`}>PLAFOND</p>
                      <p className="mt-1 break-words text-sm font-bold text-slate-800 dark:text-slate-100">{moneyFormatter(row.plafond)}</p>
                    </div>
                    <div className="min-w-0 rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
                      <p className={`text-[10px] font-semibold ${mutedTextClass}`}>FRESH MONEY</p>
                      <p className="mt-1 break-words text-sm font-bold text-slate-800 dark:text-slate-100">{moneyFormatter(row.fresh_money)}</p>
                    </div>
                  </div>

                  {row.approval_status === "PENDING_APPROVAL" && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={saving || Boolean(deletingId)}
                        onClick={() => openEditModal(row)}
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

                  {row.approval_status === "REVISION" && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
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

                  {row.approval_status === "APPROVED" && canRequestCancellation(row) && (
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

        {/* DESKTOP TABLE */}
        <div className="hidden min-w-0 overflow-x-auto md:block">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950/60">
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400">No</th>
                <th className="px-4 py-3 text-xs">
                  <SortButton field="cadeb">Nama Cadeb</SortButton>
                </th>
                <th className="px-4 py-3 text-xs">
                  <SortButton field="plafond">Plafond</SortButton>
                </th>
                <th className="px-4 py-3 text-xs">
                  <SortButton field="fresh_money">Fresh Money</SortButton>
                </th>
                <th className="px-4 py-3 text-xs">
                  <SortButton field="produk">Produk</SortButton>
                </th>
                <th className="px-4 py-3 text-xs">
                  <SortButton field="posisi">Posisi</SortButton>
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className={`px-4 py-12 text-center ${mutedTextClass}`}>
                    Memuat data proposal...
                  </td>
                </tr>
              ) : totalFiltered === 0 ? (
                <tr>
                  <td colSpan={7} className={`px-4 py-12 text-center ${mutedTextClass}`}>
                    {proposals.length === 0 ? "Belum ada data proposal." : "Data tidak ditemukan."}
                  </td>
                </tr>
              ) : (
                paginatedProposals.map((row, index) => {
                  const rowNumber = (safeCurrentPage - 1) * pageSize + index + 1;

                  return (
                    <tr key={row.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{rowNumber}</td>
                      <td className="max-w-[240px] break-words px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{row.cadeb || "-"}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{moneyFormatter(row.plafond)}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{moneyFormatter(row.fresh_money)}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.produk || "-"}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.posisi || "-"}</td>
                      <td className="px-4 py-3">
                        <td className="px-4 py-3">
                          {row.approval_status === "PENDING_APPROVAL" && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={saving || Boolean(deletingId)}
                                onClick={() => openEditModal(row)}
                                className="rounded-lg px-3 py-2 text-xs font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50"
                              >
                                Edit
                              </button>

                              {canRequestCancellation(row) && (
                                <button
                                  type="button"
                                  disabled={saving || Boolean(cancellationSubmittingId)}
                                  onClick={() => openCancellationModal(row)}
                                  className="rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
                                >
                                  Ajukan Pembatalan
                                </button>
                              )}
                            </div>
                          )}

                          {row.approval_status === "REVISION" && (
                            <div className="flex flex-row flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openRevisionEditModal(row)}
                                disabled={saving}
                                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-amber-300 bg-amber-400 px-3 py-2 text-sm font-semibold text-amber-950 transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-500 dark:bg-amber-400 dark:text-amber-950 dark:hover:bg-amber-300"
                              >
                                Edit Revisi
                              </button>

                              <div className="flex min-h-10 items-center justify-center rounded-xl border border-amber-200/70 px-3 py-2 text-center text-xs font-medium text-amber-700/80 dark:border-amber-900/70 dark:text-amber-300/80">
                                Menunggu Perbaikan
                              </div>
                            </div>
                          )}

                          {row.approval_status === "APPROVED" && canRequestCancellation(row) && (
                            <button
                              type="button"
                              disabled={saving || Boolean(cancellationSubmittingId)}
                              onClick={() => openCancellationModal(row)}
                              className="rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
                            >
                              Ajukan Pembatalan
                            </button>
                          )}
                        </td>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {!loading && proposals.length > 0 && (
              <tfoot className="border-t border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/60">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300">
                    TOTAL SEMUA DATA · {totals.noa} NOA
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs font-bold text-slate-800 dark:text-slate-100">{moneyFormatter(totals.plafond)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs font-bold text-slate-800 dark:text-slate-100">{moneyFormatter(totals.freshMoney)}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {!loading && renderPagination()}
      </section>

      {/* CREATE MODAL */}
      {formOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/55 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCreateModal();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="proposal-modal-title"
            className="my-auto flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            {/* MODAL HEADER */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-700 sm:px-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-400">Input Data</p>
                <h2 id="proposal-modal-title" className="mt-1 text-base font-bold text-slate-800 dark:text-slate-100">
                  {editingProposal ? (editingProposal.approval_status === "REVISION" ? "Edit Revisi Proposal" : "Edit Proposal") : "Tambah Proposal"}
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {editingProposal
                    ? editingProposal.approval_status === "REVISION"
                      ? "Perbaiki data sesuai catatan Supervisor, lalu kirim kembali untuk ditinjau."
                      : "Perbarui informasi Proposal yang masih menunggu persetujuan."
                    : "Lengkapi informasi proposal di bawah ini."}
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

            {/* MODAL FORM */}
            <form onSubmit={handleSubmit} className="min-h-0 overflow-y-auto p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="proposal-cadeb" className={labelClass}>
                    Nama Cadeb <span className="text-rose-500">*</span>
                  </label>
                  <input id="proposal-cadeb" type="text" autoFocus value={form.cadeb} onChange={(event) => updateField("cadeb", event.target.value)} placeholder="Masukkan nama calon debitur" disabled={saving} className={inputClass} />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="proposal-nama-so" className={labelClass}>
                    Nama SO <span className="font-normal text-slate-400">(Opsional)</span>
                  </label>

                  <input
                    id="proposal-nama-so"
                    type="text"
                    value={form.namaSo}
                    onChange={(event) => updateField("namaSo", event.target.value)}
                    placeholder="Masukkan nama SO jika tersedia"
                    disabled={saving}
                    maxLength={150}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="proposal-plafond" className={labelClass}>
                    Plafond <span className="text-rose-500">*</span>
                  </label>
                  <input id="proposal-plafond" type="text" inputMode="numeric" value={form.plafond} onChange={(event) => handleMoneyChange("plafond", event.target.value)} placeholder="Rp0" disabled={saving} className={inputClass} />
                </div>

                <div>
                  <label htmlFor="proposal-fresh-money" className={labelClass}>
                    Fresh Money
                  </label>
                  <input
                    id="proposal-fresh-money"
                    type="text"
                    inputMode="numeric"
                    value={form.freshMoney}
                    onChange={(event) => handleMoneyChange("freshMoney", event.target.value)}
                    placeholder="Rp0"
                    disabled={saving}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="proposal-produk" className={labelClass}>
                    Produk
                    <span className="ml-1 font-normal text-rose-500">*</span>
                  </label>

                  <select id="proposal-produk" value={form.produk} onChange={(event) => updateField("produk", event.target.value)} disabled={saving} required className={inputClass}>
                    <option value="">Pilih produk</option>

                    {PRODUCTS.map((produk) => (
                      <option key={produk} value={produk}>
                        {produk}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="proposal-posisi" className={labelClass}>
                    Posisi <span className="text-rose-500">*</span>
                  </label>
                  <select id="proposal-posisi" value={form.posisi} onChange={(event) => updateField("posisi", event.target.value)} disabled={saving} className={inputClass}>
                    {POSITIONS.map((position) => (
                      <option key={position} value={position} className="bg-white text-slate-800 dark:bg-slate-900 dark:text-white">
                        {position}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <div role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 font-bold text-rose-700 dark:bg-rose-900 dark:text-rose-200">!</span>
                  <p className="min-w-0 break-words">{error}</p>
                </div>
              )}

              {/* MODAL FOOTER */}
              <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 dark:border-slate-700 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeCreateModal} disabled={saving} className={secondaryButtonClass}>
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Menyimpan..." : editingProposal ? "Simpan Perubahan" : "Simpan Proposal"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Modal Pengajuan Pembatalan Proposal */}
      {cancellationTarget && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCancellationModal();
            }
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="cancel-proposal-title" className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-700">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Pengajuan Pembatalan</p>
                <h2 id="cancel-proposal-title" className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                  Ajukan Pembatalan Proposal?
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Proposal tidak akan langsung dihapus. Supervisor harus meninjau pengajuan ini terlebih dahulu.</p>
              </div>

              <button
                type="button"
                onClick={closeCancellationModal}
                disabled={Boolean(cancellationSubmittingId)}
                aria-label="Tutup modal"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={confirmCancellationRequest} className="space-y-4 p-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/50">
                <p className="break-words font-bold text-slate-900 dark:text-white">{cancellationTarget.cadeb || "-"}</p>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {cancellationTarget.produk || "-"} · {cancellationTarget.posisi || "-"}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Plafond</p>
                    <p className="mt-1 break-words font-bold text-indigo-700 dark:text-indigo-300">{moneyFormatter(cancellationTarget.plafond)}</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Fresh Money</p>
                    <p className="mt-1 break-words font-bold text-slate-800 dark:text-slate-100">{moneyFormatter(cancellationTarget.fresh_money)}</p>
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  Status Proposal: <span className="font-semibold">{cancellationTarget.approval_status === "APPROVED" ? "Disetujui" : "Menunggu Persetujuan"}</span>
                </p>
              </div>

              <div>
                <label htmlFor="proposal-cancellation-reason" className={labelClass}>
                  Alasan pembatalan <span className="text-rose-500">*</span>
                </label>

                <textarea
                  id="proposal-cancellation-reason"
                  value={cancellationReason}
                  onChange={(event) => {
                    setCancellationReason(event.target.value);
                    setCancellationError("");
                  }}
                  rows={4}
                  maxLength={1000}
                  required
                  minLength={5}
                  disabled={Boolean(cancellationSubmittingId)}
                  placeholder="Jelaskan alasan Proposal perlu dibatalkan..."
                  className={inputClass}
                />

                <p className={`mt-1 text-xs ${mutedTextClass}`}>Minimal 5 karakter, maksimal 1.000 karakter.</p>
              </div>

              {cancellationError && (
                <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                  {cancellationError}
                </p>
              )}

              <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 dark:border-slate-700 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeCancellationModal} disabled={Boolean(cancellationSubmittingId)} className={secondaryButtonClass}>
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={Boolean(cancellationSubmittingId) || cancellationReason.trim().length < 5}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cancellationSubmittingId === cancellationTarget.id ? "Mengirim Pengajuan..." : "Kirim Pengajuan"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default ProposalReport;
