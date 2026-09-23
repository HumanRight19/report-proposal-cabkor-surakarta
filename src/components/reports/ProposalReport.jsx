import { useMemo, useState } from "react";

import { POSITIONS, PRODUCTS, UNITS } from "../../constants/report";

import { formatMoneyInput, formatRupiah, parseMoney } from "../../utils/format";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function ProposalReport({ proposals, loading, saving, deletingId, onCreate, onDelete }) {
  const [form, setForm] = useState({
    unit: "",
    cadeb: "",
    plafond: "",
    freshMoney: "",
    produk: "",
    posisi: "Admin",
  });

  const [error, setError] = useState("");

  // =====================================================
  // REPORT CONTROLS
  // =====================================================

  const [search, setSearch] = useState("");
  const [filterUnit, setFilterUnit] = useState("");
  const [filterProduk, setFilterProduk] = useState("");
  const [filterPosisi, setFilterPosisi] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // =====================================================
  // TOTAL SELURUH DATA
  // =====================================================

  const totals = useMemo(() => {
    return {
      plafond: proposals.reduce((total, row) => total + Number(row.plafond || 0), 0),

      freshMoney: proposals.reduce((total, row) => total + Number(row.fresh_money || 0), 0),

      noa: proposals.length,
    };
  }, [proposals]);

  // =====================================================
  // FILTER + SEARCH
  // =====================================================

  const filteredProposals = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return proposals.filter((row) => {
      const matchesSearch =
        !normalizedSearch ||
        String(row.cadeb || "")
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

      const matchesUnit = !filterUnit || String(row.unit || "") === filterUnit;

      const matchesProduk = !filterProduk || String(row.produk || "") === filterProduk;

      const matchesPosisi = !filterPosisi || String(row.posisi || "") === filterPosisi;

      return matchesSearch && matchesUnit && matchesProduk && matchesPosisi;
    });
  }, [proposals, search, filterUnit, filterProduk, filterPosisi]);

  // =====================================================
  // SORTING
  // =====================================================

  const sortedProposals = useMemo(() => {
    const data = [...filteredProposals];

    data.sort((a, b) => {
      let valueA;
      let valueB;

      switch (sortField) {
        case "unit":
          valueA = String(a.unit || "").toLowerCase();
          valueB = String(b.unit || "").toLowerCase();
          break;

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

  // =====================================================
  // PAGINATION
  // =====================================================

  const totalFiltered = sortedProposals.length;

  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedProposals = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return sortedProposals.slice(startIndex, endIndex);
  }, [sortedProposals, safeCurrentPage, pageSize]);

  const rangeStart = totalFiltered === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;

  const rangeEnd = totalFiltered === 0 ? 0 : Math.min(safeCurrentPage * pageSize, totalFiltered);

  // =====================================================
  // RESET PAGE WHEN FILTER CHANGES
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
    setFilterPosisi("");
    setSortField("created_at");
    setSortDirection("desc");
    setCurrentPage(1);
    setPageSize(20);
  }

  // =====================================================
  // FORM
  // =====================================================

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
  }

  function handleMoneyChange(field, value) {
    updateField(field, formatMoneyInput(value));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.unit) {
      setError("Unit wajib dipilih.");
      return;
    }

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

    try {
      await onCreate({
        unit: form.unit,
        cadeb: form.cadeb.trim(),
        plafond,
        freshMoney,
        produk: form.produk,
        posisi: form.posisi,
      });

      setForm({
        unit: "",
        cadeb: "",
        plafond: "",
        freshMoney: "",
        produk: "",
        posisi: "Admin",
      });

      setError("");
      setCurrentPage(1);
    } catch (submitError) {
      setError(submitError.message || "Gagal menyimpan data.");
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Hapus data proposal ini?");

    if (!confirmed) {
      return;
    }

    try {
      await onDelete(id);

      /*
       * Setelah delete, parent akan mengirim props
       * proposals terbaru. Kita tidak memaksa page
       * berubah di sini agar UI tetap stabil.
       */
    } catch (deleteError) {
      setError(deleteError.message || "Gagal menghapus data.");
    }
  }

  // =====================================================
  // PAGINATION BUTTONS
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

  // =====================================================
  // SORT INDICATOR
  // =====================================================

  function sortIndicator(field) {
    if (sortField !== field) {
      return null;
    }

    return <span className="report-sort-indicator">{sortDirection === "asc" ? "↑" : "↓"}</span>;
  }

  return (
    <div className="proposal-report">
      {/* =====================================================
          FORM
      ===================================================== */}

      <section className="clay-surface report-section proposal-form-section">
        <div className="report-section-heading">
          <div className="report-heading-content">
            <span className="report-eyebrow">INPUT DATA</span>

            <h2>REPORT KANTOR PUSAT</h2>

            <p>Tambahkan data proposal kantor pusat.</p>
          </div>

          <div className="report-total-badge">
            <span>TOTAL</span>

            <strong>{proposals.length}</strong>

            <small>NOA</small>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="report-form-grid">
          {/* UNIT */}
          <div className="report-field">
            <label htmlFor="proposal-unit">Unit</label>

            <select id="proposal-unit" value={form.unit} onChange={(event) => updateField("unit", event.target.value)} disabled={saving}>
              <option value="">Pilih Unit</option>

              {UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          {/* CADEB */}
          <div className="report-field">
            <label htmlFor="proposal-cadeb">Nama Cadeb</label>

            <input id="proposal-cadeb" type="text" value={form.cadeb} onChange={(event) => updateField("cadeb", event.target.value)} placeholder="Nama Cadeb" disabled={saving} />
          </div>

          {/* PLAFOND */}
          <div className="report-field">
            <label htmlFor="proposal-plafond">Plafond</label>

            <input id="proposal-plafond" type="text" inputMode="numeric" value={form.plafond} onChange={(event) => handleMoneyChange("plafond", event.target.value)} placeholder="Rp0" disabled={saving} />
          </div>

          {/* FRESH MONEY */}
          <div className="report-field">
            <label htmlFor="proposal-fresh-money">Fresh Money</label>

            <input id="proposal-fresh-money" type="text" inputMode="numeric" value={form.freshMoney} onChange={(event) => handleMoneyChange("freshMoney", event.target.value)} placeholder="Rp0" disabled={saving} />
          </div>

          {/* PRODUK */}
          <div className="report-field">
            <label htmlFor="proposal-produk">Produk</label>

            <select id="proposal-produk" value={form.produk} onChange={(event) => updateField("produk", event.target.value)} disabled={saving}>
              <option value="">Pilih Produk</option>

              {PRODUCTS.map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>
          </div>

          {/* POSISI */}
          <div className="report-field">
            <label htmlFor="proposal-posisi">Posisi</label>

            <select id="proposal-posisi" value={form.posisi} onChange={(event) => updateField("posisi", event.target.value)} disabled={saving}>
              {POSITIONS.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>
          </div>

          {/* ERROR */}
          {error && (
            <div className="report-form-error">
              <span>!</span>

              <p>{error}</p>
            </div>
          )}

          {/* SUBMIT */}
          <div className="report-submit-wrapper">
            <button type="submit" disabled={saving} className="report-submit-button">
              {saving ? "MENYIMPAN..." : "SIMPAN DATA PROPOSAL"}
            </button>
          </div>
        </form>
      </section>

      {/* =====================================================
          DATA
      ===================================================== */}

      <section className="clay-surface report-section proposal-data-section">
        <div className="report-section-heading">
          <div className="report-heading-content">
            <span className="report-eyebrow">DATA TERDAFTAR</span>

            <h2>DAFTAR PROPOSAL</h2>

            <p>Data proposal kantor pusat yang sudah tersimpan.</p>
          </div>

          <div className="report-money-summary">
            <div>
              <span>TOTAL NOA</span>

              <strong>{totals.noa}</strong>
            </div>

            <div>
              <span>TOTAL PLAFON</span>

              <strong>{formatRupiah(totals.plafond)}</strong>
            </div>
          </div>
        </div>

        {/* =====================================================
            SEARCH + FILTER + SORT
        ===================================================== */}

        <div className="report-controls">
          <div className="report-search-wrapper">
            <span className="report-search-icon">🔎</span>

            <input type="search" value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Cari nama Cadeb, unit, produk..." className="report-search-input" />

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

            <select value={filterPosisi} onChange={(event) => updateFilter(setFilterPosisi, event.target.value)} aria-label="Filter Posisi" className="report-filter-select">
              <option value="">Semua Posisi</option>

              {POSITIONS.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </select>

            <button type="button" onClick={resetControls} className="report-filter-reset" disabled={!search && !filterUnit && !filterProduk && !filterPosisi && sortField === "created_at" && sortDirection === "desc" && pageSize === 20}>
              Reset
            </button>
          </div>
        </div>

        {/* =====================================================
            RESULT SUMMARY
        ===================================================== */}

        {!loading && (
          <div className="report-result-summary">
            <div>
              <strong>{totalFiltered}</strong>

              <span>{totalFiltered === 1 ? "data ditemukan" : "data ditemukan"}</span>
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

        {/* =====================================================
            MOBILE
        ===================================================== */}

        <div className="report-mobile-list">
          {loading ? (
            <div className="report-empty-state">
              <span>⏳</span>

              <strong>Memuat data proposal...</strong>
            </div>
          ) : totalFiltered === 0 ? (
            <div className="report-empty-state">
              <span>📄</span>

              <strong>{proposals.length === 0 ? "Belum ada data proposal." : "Data tidak ditemukan."}</strong>

              <p>{proposals.length === 0 ? "Tambahkan proposal melalui form di atas." : "Coba ubah kata pencarian atau filter."}</p>

              {proposals.length > 0 && (
                <button type="button" onClick={resetControls} className="report-empty-reset">
                  Reset Filter
                </button>
              )}
            </div>
          ) : (
            paginatedProposals.map((row, index) => {
              const rowNumber = (safeCurrentPage - 1) * pageSize + index + 1;

              return (
                <article key={row.id} className="report-mobile-card proposal-mobile-card">
                  <div className="report-mobile-card-header">
                    <div className="report-mobile-card-title">
                      <span className="report-row-number">#{String(rowNumber).padStart(2, "0")}</span>

                      <strong>{row.cadeb}</strong>
                    </div>

                    <span className="report-unit-badge">{row.unit}</span>
                  </div>

                  <div className="proposal-mobile-finance">
                    <div>
                      <span>PLAFOND</span>

                      <strong>{formatRupiah(row.plafond)}</strong>
                    </div>

                    <div>
                      <span>FRESH MONEY</span>

                      <strong>{formatRupiah(row.fresh_money)}</strong>
                    </div>
                  </div>

                  <div className="report-mobile-info-grid">
                    <div>
                      <span>PRODUK</span>

                      <strong>{row.produk || "-"}</strong>
                    </div>

                    <div>
                      <span>POSISI</span>

                      <strong>{row.posisi || "-"}</strong>
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

        {/* =====================================================
            DESKTOP TABLE
        ===================================================== */}

        <div className="report-table-wrapper proposal-table-wrapper">
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
                    <button type="button" onClick={() => handleSort("cadeb")} className="report-table-sort">
                      Cadeb
                      {sortIndicator("cadeb")}
                    </button>
                  </th>

                  <th>
                    <button type="button" onClick={() => handleSort("plafond")} className="report-table-sort">
                      Plafond
                      {sortIndicator("plafond")}
                    </button>
                  </th>

                  <th>
                    <button type="button" onClick={() => handleSort("fresh_money")} className="report-table-sort">
                      Fresh Money
                      {sortIndicator("fresh_money")}
                    </button>
                  </th>

                  <th>
                    <button type="button" onClick={() => handleSort("produk")} className="report-table-sort">
                      Produk
                      {sortIndicator("produk")}
                    </button>
                  </th>

                  <th>
                    <button type="button" onClick={() => handleSort("posisi")} className="report-table-sort">
                      Posisi
                      {sortIndicator("posisi")}
                    </button>
                  </th>

                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="report-table-empty">
                      Memuat data...
                    </td>
                  </tr>
                ) : totalFiltered === 0 ? (
                  <tr>
                    <td colSpan="8" className="report-table-empty">
                      {proposals.length === 0 ? "Belum ada data proposal." : "Data tidak ditemukan."}
                    </td>
                  </tr>
                ) : (
                  paginatedProposals.map((row, index) => {
                    const rowNumber = (safeCurrentPage - 1) * pageSize + index + 1;

                    return (
                      <tr key={row.id}>
                        <td>{rowNumber}</td>

                        <td>
                          <span className="report-table-unit">{row.unit}</span>
                        </td>

                        <td className="report-table-name">{row.cadeb}</td>

                        <td className="report-table-money">{formatRupiah(row.plafond)}</td>

                        <td className="report-table-money">{formatRupiah(row.fresh_money)}</td>

                        <td>{row.produk || "-"}</td>

                        <td>{row.posisi || "-"}</td>

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

                  <th>{formatRupiah(totals.plafond)}</th>

                  <th>{formatRupiah(totals.freshMoney)}</th>

                  <th colSpan="2">{totals.noa} NOA</th>

                  <th />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* =====================================================
            PAGINATION
        ===================================================== */}

        {!loading && renderPagination()}
      </section>
    </div>
  );
}

export default ProposalReport;
