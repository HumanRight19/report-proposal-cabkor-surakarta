import { useMemo, useState } from "react";

import { PRODUCTS, UNITS } from "../../constants/report";

import { formatMoneyInput, formatRupiah, parseMoney } from "../../utils/format";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function TargetCoReport({ targetCo, loading, saving, deletingId, onCreate, onDelete }) {
  const [form, setForm] = useState({
    unit: "",
    nama: "",
    plafond: "",
    new_ijin: "",
    produk: "",
  });

  const [error, setError] = useState("");

  // =====================================================
  // REPORT CONTROLS
  // =====================================================

  const [search, setSearch] = useState("");
  const [filterUnit, setFilterUnit] = useState("");
  const [filterProduk, setFilterProduk] = useState("");
  const [filterNewIjin, setFilterNewIjin] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // =====================================================
  // TOTAL SELURUH DATA
  // =====================================================

  const totalPlafond = useMemo(() => {
    return targetCo.reduce((total, row) => total + Number(row.plafond || 0), 0);
  }, [targetCo]);

  // =====================================================
  // SEARCH + FILTER
  // =====================================================

  const filteredTargetCo = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return targetCo.filter((row) => {
      const matchesSearch =
        !normalizedSearch ||
        String(row.nama || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(row.unit || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(row.produk || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(row.new_ijin || "")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesUnit = !filterUnit || String(row.unit || "") === filterUnit;

      const matchesProduk = !filterProduk || String(row.produk || "") === filterProduk;

      const matchesNewIjin = !filterNewIjin || String(row.new_ijin || "") === filterNewIjin;

      return matchesSearch && matchesUnit && matchesProduk && matchesNewIjin;
    });
  }, [targetCo, search, filterUnit, filterProduk, filterNewIjin]);

  // =====================================================
  // SORTING
  // =====================================================

  const sortedTargetCo = useMemo(() => {
    const data = [...filteredTargetCo];

    data.sort((a, b) => {
      let valueA;
      let valueB;

      switch (sortField) {
        case "unit":
          valueA = String(a.unit || "").toLowerCase();
          valueB = String(b.unit || "").toLowerCase();
          break;

        case "nama":
          valueA = String(a.nama || "").toLowerCase();
          valueB = String(b.nama || "").toLowerCase();
          break;

        case "plafond":
          valueA = Number(a.plafond || 0);
          valueB = Number(b.plafond || 0);
          break;

        case "new_ijin":
          valueA = String(a.new_ijin || "").toLowerCase();
          valueB = String(b.new_ijin || "").toLowerCase();
          break;

        case "produk":
          valueA = String(a.produk || "").toLowerCase();
          valueB = String(b.produk || "").toLowerCase();
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
  }, [filteredTargetCo, sortField, sortDirection]);

  // =====================================================
  // PAGINATION
  // =====================================================

  const totalFiltered = sortedTargetCo.length;

  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedTargetCo = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;

    return sortedTargetCo.slice(startIndex, startIndex + pageSize);
  }, [sortedTargetCo, safeCurrentPage, pageSize]);

  const rangeStart = totalFiltered === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;

  const rangeEnd = totalFiltered === 0 ? 0 : Math.min(safeCurrentPage * pageSize, totalFiltered);

  // =====================================================
  // CONTROL HANDLERS
  // =====================================================

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

      return;
    }

    setSortField(field);
    setSortDirection("asc");
    setCurrentPage(1);
  }

  function resetControls() {
    setSearch("");
    setFilterUnit("");
    setFilterProduk("");
    setFilterNewIjin("");
    setSortField("created_at");
    setSortDirection("desc");
    setCurrentPage(1);
    setPageSize(20);
  }

  // =====================================================
  // FORM
  // =====================================================

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

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.unit) {
      setError("Unit wajib dipilih.");
      return;
    }

    if (!form.nama.trim()) {
      setError("Nama wajib diisi.");
      return;
    }

    const plafond = parseMoney(form.plafond);

    if (plafond <= 0) {
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

    try {
      await onCreate({
        unit: form.unit,
        nama: form.nama.trim(),
        plafond,
        new_ijin: form.new_ijin,
        produk: form.produk,
      });

      setForm({
        unit: "",
        nama: "",
        plafond: "",
        new_ijin: "",
        produk: "",
      });

      setError("");
      setCurrentPage(1);
    } catch (submitError) {
      setError(submitError.message || "Gagal menyimpan data.");
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Hapus target CO ini?");

    if (!confirmed) {
      return;
    }

    try {
      await onDelete(id);
    } catch (deleteError) {
      setError(deleteError.message || "Gagal menghapus data.");
    }
  }

  // =====================================================
  // SORT INDICATOR
  // =====================================================

  function sortIndicator(field) {
    if (sortField !== field) {
      return null;
    }

    return <span className="report-sort-indicator">{sortDirection === "asc" ? "↑" : "↓"}</span>;
  }

  // =====================================================
  // PAGINATION
  // =====================================================

  function renderPagination() {
    if (totalFiltered === 0 || totalPages <= 1) {
      return null;
    }

    const pages = [];

    let startPage = Math.max(1, safeCurrentPage - 2);

    let endPage = Math.min(totalPages, safeCurrentPage + 2);

    if (safeCurrentPage <= 3) {
      endPage = Math.min(5, totalPages);
    }

    if (safeCurrentPage >= totalPages - 2) {
      startPage = Math.max(1, totalPages - 4);
    }

    for (let page = startPage; page <= endPage; page += 1) {
      pages.push(page);
    }

    return (
      <div className="report-pagination">
        <button type="button" disabled={safeCurrentPage === 1} onClick={() => setCurrentPage((current) => Math.max(1, current - 1))} className="report-pagination-button">
          ←<span>Sebelumnya</span>
        </button>

        <div className="report-pagination-pages">
          {startPage > 1 && (
            <>
              <button type="button" onClick={() => setCurrentPage(1)} className="report-pagination-page">
                1
              </button>

              {startPage > 2 && <span className="report-pagination-dots">…</span>}
            </>
          )}

          {pages.map((page) => (
            <button key={page} type="button" onClick={() => setCurrentPage(page)} className={`report-pagination-page ${page === safeCurrentPage ? "is-active" : ""}`}>
              {page}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="report-pagination-dots">…</span>}

              <button type="button" onClick={() => setCurrentPage(totalPages)} className="report-pagination-page">
                {totalPages}
              </button>
            </>
          )}
        </div>

        <button type="button" disabled={safeCurrentPage === totalPages} onClick={() => setCurrentPage((current) => Math.min(totalPages, current + 1))} className="report-pagination-button">
          <span>Berikutnya</span>→
        </button>
      </div>
    );
  }

  return (
    <div className="target-co-report">
      {/* =====================================================
          FORM
      ===================================================== */}

      <section className="clay-surface report-section target-form-section">
        <div className="report-section-heading">
          <div className="report-heading-content">
            <span className="report-eyebrow">INPUT DATA</span>

            <h2>TARGET PENGERJAAN CO</h2>

            <p>Masukkan target pengerjaan CO untuk hari ini.</p>
          </div>

          <div className="report-total-badge">
            <span>TOTAL</span>

            <strong>{targetCo.length}</strong>

            <small>NOA</small>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="report-form-grid">
          <div className="report-field">
            <label htmlFor="target-co-unit">Unit</label>

            <select id="target-co-unit" name="unit" value={form.unit} onChange={handleChange} disabled={saving}>
              <option value="">Pilih Unit</option>

              {UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          <div className="report-field">
            <label htmlFor="target-co-nama">Nama</label>

            <input id="target-co-nama" name="nama" type="text" value={form.nama} onChange={handleChange} placeholder="Nama CO / Cadeb" disabled={saving} />
          </div>

          <div className="report-field">
            <label htmlFor="target-co-plafond">Plafond</label>

            <input id="target-co-plafond" name="plafond" type="text" inputMode="numeric" value={form.plafond} onChange={(event) => handlePlafondChange(event.target.value)} placeholder="Rp0" disabled={saving} />
          </div>

          <div className="report-field">
            <label htmlFor="target-co-new-ijin">New / Ijin Prinsip</label>

            <select id="target-co-new-ijin" name="new_ijin" value={form.new_ijin} onChange={handleChange} disabled={saving}>
              <option value="">Pilih</option>

              <option value="NEW">NEW</option>

              <option value="IJIN PRINSIP">IJIN PRINSIP</option>
            </select>
          </div>

          <div className="report-field">
            <label htmlFor="target-co-produk">Produk</label>

            <select id="target-co-produk" name="produk" value={form.produk} onChange={handleChange} disabled={saving}>
              <option value="">Pilih Produk</option>

              {PRODUCTS.map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="report-form-error">
              <span>!</span>

              <p>{error}</p>
            </div>
          )}

          <div className="report-submit-wrapper">
            <button type="submit" disabled={saving} className="report-submit-button">
              {saving ? "MENYIMPAN..." : "SIMPAN TARGET CO"}
            </button>
          </div>
        </form>
      </section>

      {/* =====================================================
          DATA
      ===================================================== */}

      <section className="clay-surface report-section target-data-section">
        <div className="report-section-heading">
          <div className="report-heading-content">
            <span className="report-eyebrow">DATA TERDAFTAR</span>

            <h2>DATA TARGET CO</h2>

            <p>Daftar target pengerjaan CO hari ini.</p>
          </div>

          <div className="report-money-summary">
            <div>
              <span>TOTAL NOA</span>

              <strong>{targetCo.length}</strong>
            </div>

            <div>
              <span>TOTAL PLAFON</span>

              <strong>{formatRupiah(totalPlafond)}</strong>
            </div>
          </div>
        </div>

        {/* =================================================
            SEARCH + FILTER
        ================================================= */}

        <div className="report-controls">
          <div className="report-search-wrapper">
            <span className="report-search-icon">🔎</span>

            <input type="search" value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Cari nama, unit, produk..." className="report-search-input" />

            {search && (
              <button type="button" onClick={() => updateSearch("")} className="report-search-clear" aria-label="Hapus pencarian">
                ×
              </button>
            )}
          </div>

          <div className="report-filter-grid">
            <select value={filterUnit} onChange={(event) => updateFilter(setFilterUnit, event.target.value)} aria-label="Filter Unit" className="report-filter-select">
              <option value="">Semua Unit</option>

              {UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>

            <select value={filterProduk} onChange={(event) => updateFilter(setFilterProduk, event.target.value)} aria-label="Filter Produk" className="report-filter-select">
              <option value="">Semua Produk</option>

              {PRODUCTS.map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>

            <select value={filterNewIjin} onChange={(event) => updateFilter(setFilterNewIjin, event.target.value)} aria-label="Filter New Ijin" className="report-filter-select">
              <option value="">Semua Status</option>

              <option value="NEW">NEW</option>

              <option value="IJIN PRINSIP">IJIN PRINSIP</option>
            </select>

            <button type="button" onClick={resetControls} className="report-filter-reset" disabled={!search && !filterUnit && !filterProduk && !filterNewIjin && sortField === "created_at" && sortDirection === "desc" && pageSize === 20}>
              Reset
            </button>
          </div>
        </div>

        {/* =================================================
            RESULT SUMMARY
        ================================================= */}

        {!loading && (
          <div className="report-result-summary">
            <div>
              <strong>{totalFiltered}</strong>

              <span>data ditemukan</span>
            </div>

            <div className="report-result-range">
              Menampilkan{" "}
              <strong>
                {rangeStart}–{rangeEnd}
              </strong>{" "}
              dari <strong>{totalFiltered}</strong> data
            </div>

            <label className="report-page-size">
              <span>Per halaman</span>

              <select value={pageSize} onChange={(event) => handlePageSizeChange(event.target.value)}>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {/* =================================================
            MOBILE
        ================================================= */}

        <div className="report-mobile-list">
          {loading ? (
            <div className="report-empty-state">
              <span>⏳</span>

              <strong>Memuat data target CO...</strong>
            </div>
          ) : totalFiltered === 0 ? (
            <div className="report-empty-state">
              <span>🎯</span>

              <strong>{targetCo.length === 0 ? "Belum ada target CO." : "Data tidak ditemukan."}</strong>

              <p>{targetCo.length === 0 ? "Tambahkan target melalui form di atas." : "Coba ubah kata pencarian atau filter."}</p>

              {targetCo.length > 0 && (
                <button type="button" onClick={resetControls} className="report-empty-reset">
                  Reset Filter
                </button>
              )}
            </div>
          ) : (
            paginatedTargetCo.map((row, index) => {
              const rowNumber = (safeCurrentPage - 1) * pageSize + index + 1;

              return (
                <article key={row.id} className="report-mobile-card target-mobile-card">
                  <div className="report-mobile-card-header">
                    <div className="report-mobile-card-title">
                      <span className="report-row-number">#{String(rowNumber).padStart(2, "0")}</span>

                      <strong>{row.nama || "-"}</strong>
                    </div>

                    <span className="report-unit-badge">{row.unit}</span>
                  </div>

                  <div className="target-mobile-plafond">
                    <span>PLAFOND</span>

                    <strong>{formatRupiah(row.plafond)}</strong>
                  </div>

                  <div className="report-mobile-info-grid">
                    <div>
                      <span>STATUS</span>

                      <strong>{row.new_ijin || "-"}</strong>
                    </div>

                    <div>
                      <span>PRODUK</span>

                      <strong>{row.produk || "-"}</strong>
                    </div>
                  </div>

                  <div className="report-mobile-actions">
                    <button type="button" disabled={deletingId === row.id} onClick={() => handleDelete(row.id)}>
                      {deletingId === row.id ? "MENGHAPUS..." : "HAPUS DATA"}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* =================================================
            DESKTOP TABLE
        ================================================= */}

        <div className="report-table-wrapper target-table-wrapper">
          <div className="clay-inset report-table-inset">
            <table className="report-table">
              <thead>
                <tr>
                  <th>No</th>

                  <th>
                    <button type="button" onClick={() => handleSort("unit")} className="report-table-sort">
                      Unit
                      {sortIndicator("unit")}
                    </button>
                  </th>

                  <th>
                    <button type="button" onClick={() => handleSort("nama")} className="report-table-sort">
                      Nama
                      {sortIndicator("nama")}
                    </button>
                  </th>

                  <th>
                    <button type="button" onClick={() => handleSort("plafond")} className="report-table-sort">
                      Plafond
                      {sortIndicator("plafond")}
                    </button>
                  </th>

                  <th>
                    <button type="button" onClick={() => handleSort("new_ijin")} className="report-table-sort">
                      New / Ijin Prinsip
                      {sortIndicator("new_ijin")}
                    </button>
                  </th>

                  <th>
                    <button type="button" onClick={() => handleSort("produk")} className="report-table-sort">
                      Produk
                      {sortIndicator("produk")}
                    </button>
                  </th>

                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="report-table-empty">
                      Memuat data...
                    </td>
                  </tr>
                ) : totalFiltered === 0 ? (
                  <tr>
                    <td colSpan="7" className="report-table-empty">
                      {targetCo.length === 0 ? "Belum ada target CO." : "Data tidak ditemukan."}
                    </td>
                  </tr>
                ) : (
                  paginatedTargetCo.map((row, index) => {
                    const rowNumber = (safeCurrentPage - 1) * pageSize + index + 1;

                    return (
                      <tr key={row.id}>
                        <td>{rowNumber}</td>

                        <td>
                          <span className="report-table-unit">{row.unit || "-"}</span>
                        </td>

                        <td className="report-table-name">{row.nama || "-"}</td>

                        <td className="report-table-money">{formatRupiah(row.plafond)}</td>

                        <td>{row.new_ijin || "-"}</td>

                        <td>{row.produk || "-"}</td>

                        <td>
                          <button type="button" disabled={deletingId === row.id} onClick={() => handleDelete(row.id)} className="report-table-delete">
                            {deletingId === row.id ? "..." : "Hapus"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              <tfoot>
                <tr>
                  <th colSpan="3">TOTAL SEMUA DATA</th>

                  <th>{formatRupiah(totalPlafond)}</th>

                  <th colSpan="2">{targetCo.length} NOA</th>

                  <th />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {!loading && renderPagination()}
      </section>
    </div>
  );
}

export default TargetCoReport;
