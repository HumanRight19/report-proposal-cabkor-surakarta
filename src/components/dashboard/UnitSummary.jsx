import { useMemo, useState } from "react";

import { UNITS } from "../../constants/report";
import { formatRupiah } from "../../utils/format";

function UnitSummary({ proposals, otsArea, targetCo }) {
  const [activeIndex, setActiveIndex] = useState(0);

  const rows = useMemo(() => {
    return UNITS.map((unit) => {
      const proposalRows = proposals.filter((row) => row.unit === unit);

      const otsRows = otsArea.filter((row) => row.unit === unit);

      const targetRows = targetCo.filter((row) => row.unit === unit);

      return {
        unit,

        proposalNoa: proposalRows.length,

        proposalPlafond: proposalRows.reduce((total, row) => total + Number(row.plafond || 0), 0),

        otsNoa: otsRows.length,

        otsPlafond: otsRows.reduce((total, row) => total + Number(row.plafond || 0), 0),

        targetNoa: targetRows.length,

        targetPlafond: targetRows.reduce((total, row) => total + Number(row.plafond || 0), 0),
      };
    });
  }, [proposals, otsArea, targetCo]);

  const totals = useMemo(() => {
    return {
      proposalNoa: proposals.length,

      proposalPlafond: proposals.reduce((total, row) => total + Number(row.plafond || 0), 0),

      otsNoa: otsArea.length,

      otsPlafond: otsArea.reduce((total, row) => total + Number(row.plafond || 0), 0),

      targetNoa: targetCo.length,

      targetPlafond: targetCo.reduce((total, row) => total + Number(row.plafond || 0), 0),
    };
  }, [proposals, otsArea, targetCo]);

  function goTo(index) {
    if (index < 0 || index >= rows.length) {
      return;
    }

    setActiveIndex(index);
  }

  function handlePrevious() {
    setActiveIndex((current) => (current === 0 ? rows.length - 1 : current - 1));
  }

  function handleNext() {
    setActiveIndex((current) => (current === rows.length - 1 ? 0 : current + 1));
  }

  return (
    <section className="unit-summary">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="unit-summary-header">
        <div>
          <span className="unit-summary-eyebrow">RINGKASAN AREA</span>

          <h2>REKAP 6 UNIT</h2>

          <p>Geser untuk melihat performa setiap unit.</p>
        </div>

        <div className="unit-summary-counter">
          <strong>{activeIndex + 1}</strong>

          <span>/ {rows.length}</span>
        </div>
      </div>

      {/* =====================================================
          SLIDER
      ===================================================== */}

      <div className="unit-slider-wrapper">
        <button type="button" className="unit-slider-arrow unit-slider-arrow-left" onClick={handlePrevious} aria-label="Unit sebelumnya">
          ‹
        </button>

        <div className="unit-slider">
          <div
            className="unit-slider-track"
            style={{
              transform: `translateX(-${activeIndex * 100}%)`,
            }}
          >
            {rows.map((row) => (
              <article key={row.unit} className="unit-summary-card">
                {/* CARD HEADER */}

                <div className="unit-card-header">
                  <div>
                    <span className="unit-card-label">UNIT</span>

                    <h3>{row.unit}</h3>
                  </div>

                  <div className="unit-card-badge">AREA</div>
                </div>

                {/* METRICS */}

                <div className="unit-card-metrics">
                  {/* KANTOR PUSAT */}

                  <div className="unit-metric unit-metric-green">
                    <div className="unit-metric-icon">🏢</div>

                    <div className="unit-metric-body">
                      <span>KANTOR PUSAT</span>

                      <strong>
                        {row.proposalNoa} <small>NOA</small>
                      </strong>

                      <p>{formatRupiah(row.proposalPlafond)}</p>
                    </div>
                  </div>

                  {/* OTS */}

                  <div className="unit-metric unit-metric-amber">
                    <div className="unit-metric-icon">📋</div>

                    <div className="unit-metric-body">
                      <span>BAHAN BAKU OTS</span>

                      <strong>
                        {row.otsNoa} <small>NOA</small>
                      </strong>

                      <p>{formatRupiah(row.otsPlafond)}</p>
                    </div>
                  </div>

                  {/* TARGET */}

                  <div className="unit-metric unit-metric-violet">
                    <div className="unit-metric-icon">🎯</div>

                    <div className="unit-metric-body">
                      <span>TARGET CO</span>

                      <strong>
                        {row.targetNoa} <small>NOA</small>
                      </strong>

                      <p>{formatRupiah(row.targetPlafond)}</p>
                    </div>
                  </div>
                </div>

                {/* CARD FOOTER */}

                <div className="unit-card-footer">
                  <span>Total NOA</span>

                  <strong>{row.proposalNoa + row.otsNoa + row.targetNoa}</strong>
                </div>

                <div className="unit-card-decoration" />
              </article>
            ))}
          </div>
        </div>

        <button type="button" className="unit-slider-arrow unit-slider-arrow-right" onClick={handleNext} aria-label="Unit berikutnya">
          ›
        </button>
      </div>

      {/* =====================================================
          DOTS
      ===================================================== */}

      <div className="unit-slider-dots">
        {rows.map((row, index) => (
          <button key={row.unit} type="button" onClick={() => goTo(index)} aria-label={`Lihat ${row.unit}`} className={index === activeIndex ? "unit-slider-dot active" : "unit-slider-dot"} />
        ))}
      </div>

      {/* =====================================================
          TOTAL AREA
      ===================================================== */}

      <div className="unit-total-card">
        <div>
          <span>TOTAL AREA</span>

          <strong>
            {totals.proposalNoa + totals.otsNoa + totals.targetNoa} <small>NOA</small>
          </strong>
        </div>

        <div className="unit-total-item">
          <span>PUSAT</span>
          <strong>{formatRupiah(totals.proposalPlafond)}</strong>
        </div>

        <div className="unit-total-item">
          <span>OTS</span>
          <strong>{formatRupiah(totals.otsPlafond)}</strong>
        </div>

        <div className="unit-total-item">
          <span>TARGET</span>
          <strong>{formatRupiah(totals.targetPlafond)}</strong>
        </div>
      </div>
    </section>
  );
}

export default UnitSummary;
