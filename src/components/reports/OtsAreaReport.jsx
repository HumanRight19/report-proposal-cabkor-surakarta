import { useMemo, useState } from "react";

import { KELENGKAPAN_OPTIONS, UNITS } from "../../constants/report";
import { formatMoneyInput, formatRupiah, parseMoney } from "../../utils/format";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

function OtsAreaReport({ otsArea, loading, saving, deletingId, onCreate, onDelete }) {
  const [form, setForm] = useState({
    unit: "",
    cadeb: "",
    usaha: "",
    plafond: "",
    kelengkapan: "",
    kekurangan: "",
    namaSo: "",
  });

  const [error, setError] = useState("");

  // =====================================================
  // REPORT CONTROLS
  // =====================================================

  const [search, setSearch] = useState("");
  const [filterUnit, setFilterUnit] = useState("");
  const [filterKelengkapan, setFilterKelengkapan] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // =====================================================
  // TOTAL SELURUH DATA
  // =====================================================

  const totalPlafond = useMemo(() => {
    return otsArea.reduce((total, row) => total + Number(row.plafond || 0), 0);
  }, [otsArea]);

  // =====================================================
  // SEARCH + FILTER
  // =====================================================

  const filteredOtsArea = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return otsArea.filter((row) => {
      const matchesSearch =
        !normalizedSearch ||
        String(row.cadeb || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(row.unit || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(row.usaha || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(row.kelengkapan || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(row.kekurangan || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(row.nama_so || "")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesUnit = !filterUnit || String(row.unit || "") === filterUnit;

      const matchesKelengkapan = !filterKelengkapan || String(row.kelengkapan || "") === filterKelengkapan;

      return matchesSearch && matchesUnit && matchesKelengkapan;
    });
  }, [otsArea, search, filterUnit, filterKelengkapan]);

  // =====================================================
  // SORTING
  // =====================================================

  const sortedOtsArea = useMemo(() => {
    const data = [...filteredOtsArea];

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

        case "usaha":
          valueA = String(a.usaha || "").toLowerCase();
          valueB = String(b.usaha || "").toLowerCase();
          break;

        case "plafond":
          valueA = Number(a.plafond || 0);
          valueB = Number(b.plafond || 0);
          break;

        case "kelengkapan":
          valueA = String(a.kelengkapan || "").toLowerCase();
          valueB = String(b.kelengkapan || "").toLowerCase();
          break;

        case "nama_so":
          valueA = String(a.nama_so || "").toLowerCase();
          valueB = String(b.nama_so || "").toLowerCase();
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

  // =====================================================
  // PAGINATION
  // =====================================================

  const totalFiltered = sortedOtsArea.length;

  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedOtsArea = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;

    return sortedOtsArea.slice(startIndex, startIndex + pageSize);
  }, [sortedOtsArea, safeCurrentPage, pageSize]);

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
    setFilterKelengkapan("");
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

  function handleMoneyChange(value) {
    updateField("plafond", formatMoneyInput(value));
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

    if (!form.usaha.trim()) {
      setError("Usaha wajib diisi.");
      return;
    }

    const plafond = parseMoney(form.plafond);

    if (plafond <= 0) {
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

    try {
      await onCreate({
        unit: form.unit,
        cadeb: form.cadeb.trim(),
        usaha: form.usaha.trim(),
        plafond,
        kelengkapan: form.kelengkapan,
        kekurangan: form.kekurangan.trim(),
        namaSo: form.namaSo.trim(),
      });

      setForm({
        unit: "",
        cadeb: "",
        usaha: "",
        plafond: "",
        kelengkapan: "",
        kekurangan: "",
        namaSo: "",
      });

      setError("");
      setCurrentPage(1);
    } catch (submitError) {
      setError(submitError.message || "Gagal menyimpan data.");
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Hapus data OTS Area ini?");

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
    <div className="ots-report">
      {/* =====================================================
          FORM INPUT
      ===================================================== */}

      <section className="clay-surface ots-form-section">
        <div className="section-heading ots-heading">
          <div className="ots-heading-content">
            <span className="section-eyebrow">INPUT DATA</span>

            <h2>BAHAN BAKU OTS AREA</h2>

            <p>Tambahkan bahan baku yang sudah melakukan OTS Area.</p>
          </div>

          <div className="ots-total-badge">
            <span>TOTAL</span>

            <strong>{otsArea.length}</strong>

            <small>NOA</small>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="ots-form-grid">
          <div className="form-field">
            <label htmlFor="ots-unit">Unit</label>

            <select id="ots-unit" value={form.unit} onChange={(event) => updateField("unit", event.target.value)}>
              <option value="">Pilih Unit</option>

              {UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="ots-cadeb">Nama Cadeb</label>

            <input id="ots-cadeb" type="text" value={form.cadeb} onChange={(event) => updateField("cadeb", event.target.value)} placeholder="Nama Cadeb" />
          </div>

          <div className="form-field">
            <label htmlFor="ots-usaha">Usaha</label>

            <input id="ots-usaha" type="text" value={form.usaha} onChange={(event) => updateField("usaha", event.target.value)} placeholder="Jenis usaha" />
          </div>

          <div className="form-field">
            <label htmlFor="ots-plafond">Plafond</label>

            <input id="ots-plafond" type="text" inputMode="numeric" value={form.plafond} onChange={(event) => handleMoneyChange(event.target.value)} placeholder="Rp0" />
          </div>

          <div className="form-field">
            <label htmlFor="ots-kelengkapan">Kelengkapan Berkas</label>

            <select id="ots-kelengkapan" value={form.kelengkapan} onChange={(event) => updateField("kelengkapan", event.target.value)}>
              <option value="">Pilih Kelengkapan</option>

              {KELENGKAPAN_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="ots-kekurangan">Kekurangan Berkas</label>

            <input id="ots-kekurangan" type="text" value={form.kekurangan} onChange={(event) => updateField("kekurangan", event.target.value)} placeholder="Jika belum lengkap" disabled={form.kelengkapan !== "Belum Lengkap"} />
          </div>

          <div className="form-field">
            <label htmlFor="ots-so">Nama SO</label>

            <input id="ots-so" type="text" value={form.namaSo} onChange={(event) => updateField("namaSo", event.target.value)} placeholder="Nama SO" />
          </div>

          {error && (
            <div className="ots-form-error">
              <span>!</span>

              <p>{error}</p>
            </div>
          )}

          <div className="ots-submit-wrapper">
            <button type="submit" disabled={saving} className="ots-submit-button">
              {saving ? "MENYIMPAN..." : "SIMPAN DATA OTS"}
            </button>
          </div>
        </form>
      </section>

      {/* =====================================================
          DATA OTS
      ===================================================== */}

      <section className="clay-surface ots-data-section">
        <div className="section-heading ots-data-heading">
          <div>
            <span className="section-eyebrow">DATA TERDAFTAR</span>

            <h2>DAFTAR OTS AREA</h2>
          </div>

          <div className="ots-data-total">
            <span>{otsArea.length} NOA</span>

            <strong>{formatRupiah(totalPlafond)}</strong>
          </div>
        </div>

        {/* =================================================
            SEARCH + FILTER
        ================================================= */}

        <div className="report-controls">
          <div className="report-search-wrapper">
            <span className="report-search-icon">🔎</span>

            <input type="search" value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Cari Cadeb, usaha, SO..." className="report-search-input" />

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

            <select value={filterKelengkapan} onChange={(event) => updateFilter(setFilterKelengkapan, event.target.value)} aria-label="Filter Kelengkapan" className="report-filter-select">
              <option value="">Semua Kelengkapan</option>

              {KELENGKAPAN_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <button type="button" onClick={resetControls} className="report-filter-reset" disabled={!search && !filterUnit && !filterKelengkapan && sortField === "created_at" && sortDirection === "desc" && pageSize === 20}>
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

        <div className="ots-mobile-list">
          {loading ? (
            <div className="empty-state">Memuat data...</div>
          ) : totalFiltered === 0 ? (
            <div className="report-empty-state">
              <span>📄</span>

              <strong>{otsArea.length === 0 ? "Belum ada data OTS Area." : "Data tidak ditemukan."}</strong>

              <p>{otsArea.length === 0 ? "Tambahkan data melalui form di atas." : "Coba ubah kata pencarian atau filter."}</p>

              {otsArea.length > 0 && (
                <button type="button" onClick={resetControls} className="report-empty-reset">
                  Reset Filter
                </button>
              )}
            </div>
          ) : (
            paginatedOtsArea.map((row, index) => {
              const rowNumber = (safeCurrentPage - 1) * pageSize + index + 1;

              return (
                <article key={row.id} className="ots-mobile-card">
                  <div className="ots-mobile-card-top">
                    <div className="ots-mobile-customer">
                      <span className="ots-row-number">#{String(rowNumber).padStart(2, "0")}</span>

                      <strong>{row.cadeb}</strong>
                    </div>

                    <span className="ots-unit-badge">{row.unit}</span>
                  </div>

                  <p className="ots-business">{row.usaha || "-"}</p>

                  <div className="ots-mobile-plafond">
                    <span>PLAFOND</span>

                    <strong>{formatRupiah(row.plafond)}</strong>
                  </div>

                  <div className="ots-mobile-info">
                    <div>
                      <span>BERKAS</span>

                      <strong>{row.kelengkapan || "-"}</strong>
                    </div>

                    <div>
                      <span>SO</span>

                      <strong>{row.nama_so || "-"}</strong>
                    </div>
                  </div>

                  {row.kekurangan && (
                    <div className="ots-shortage">
                      <span>KEKURANGAN BERKAS</span>

                      <p>{row.kekurangan}</p>
                    </div>
                  )}

                  <div className="ots-mobile-actions">
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

        <div className="ots-table-wrapper">
          <div className="clay-inset ots-table-inset">
            <table className="ots-table">
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
                    <button type="button" onClick={() => handleSort("usaha")} className="report-table-sort">
                      Usaha
                      {sortIndicator("usaha")}
                    </button>
                  </th>

                  <th>
                    <button type="button" onClick={() => handleSort("plafond")} className="report-table-sort">
                      Plafond
                      {sortIndicator("plafond")}
                    </button>
                  </th>

                  <th>
                    <button type="button" onClick={() => handleSort("kelengkapan")} className="report-table-sort">
                      Berkas
                      {sortIndicator("kelengkapan")}
                    </button>
                  </th>

                  <th>Kekurangan</th>

                  <th>
                    <button type="button" onClick={() => handleSort("nama_so")} className="report-table-sort">
                      SO
                      {sortIndicator("nama_so")}
                    </button>
                  </th>

                  <th>Aksi</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="table-empty">
                      Memuat data...
                    </td>
                  </tr>
                ) : totalFiltered === 0 ? (
                  <tr>
                    <td colSpan="9" className="table-empty">
                      {otsArea.length === 0 ? "Belum ada data OTS Area." : "Data tidak ditemukan."}
                    </td>
                  </tr>
                ) : (
                  paginatedOtsArea.map((row, index) => {
                    const rowNumber = (safeCurrentPage - 1) * pageSize + index + 1;

                    return (
                      <tr key={row.id}>
                        <td>{rowNumber}</td>

                        <td>
                          <span className="table-unit-badge">{row.unit}</span>
                        </td>

                        <td className="font-semibold">{row.cadeb}</td>

                        <td>{row.usaha || "-"}</td>

                        <td className="font-semibold">{formatRupiah(row.plafond)}</td>

                        <td>{row.kelengkapan || "-"}</td>

                        <td>{row.kekurangan || "-"}</td>

                        <td>{row.nama_so || "-"}</td>

                        <td>
                          <button type="button" disabled={deletingId === row.id} onClick={() => handleDelete(row.id)} className="table-delete-button">
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
                  <th colSpan="4">TOTAL SEMUA DATA</th>

                  <th>{formatRupiah(totalPlafond)}</th>

                  <th colSpan="3">{otsArea.length} NOA</th>

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

export default OtsAreaReport;
