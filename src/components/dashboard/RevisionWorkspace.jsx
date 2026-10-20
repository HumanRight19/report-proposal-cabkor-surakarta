import { useEffect, useRef, useMemo, useState } from "react";

import { Check, FileText, ListChecks, RotateCcw, Target, X } from "lucide-react";

import { formatMoneyInput, formatRupiah, parseMoney } from "../../utils/format";

import { PRODUCTS, POSITIONS, KELENGKAPAN_OPTIONS } from "../../constants/report";

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

const NEW_IJIN_OPTIONS = ["NEW", "IJIN PRINSIP"];

function getDisplayName(item) {
  return item.cadeb || item.nama || "Data tanpa nama";
}

// Pertahankan import lain yang sudah ada.

function RevisionWorkspace({ items, loading, saving, onResubmit, targetItem = null }) {
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");

  const groupedItems = useMemo(() => {
    return {
      proposal: items.filter((item) => item.entityType === "proposal"),
      ots_area: items.filter((item) => item.entityType === "ots_area"),
      target_co: items.filter((item) => item.entityType === "target_co"),
    };
  }, [items]);

  function openItem(item) {
    setError("");
    setSelected(item);

    if (item.entityType === "proposal") {
      setForm({
        cadeb: item.cadeb || "",
        plafond: formatMoneyInput(item.plafond || ""),
        fresh_money: formatMoneyInput(item.fresh_money || ""),
        produk: item.produk || "",
        posisi: item.posisi || "",
      });

      return;
    }

    if (item.entityType === "ots_area") {
      setForm({
        cadeb: item.cadeb || "",
        usaha: item.usaha || "",
        plafond: formatMoneyInput(item.plafond || ""),
        kelengkapan: item.kelengkapan || "",
        kekurangan: item.kekurangan || "",
        nama_so: item.nama_so || "",
      });

      return;
    }

    setForm({
      nama: item.nama || "",
      plafond: formatMoneyInput(item.plafond || ""),
      new_ijin: item.new_ijin || "",
      produk: item.produk || "",
    });
  }

  const handledTargetRef = useRef(null);

  useEffect(() => {
    if (!targetItem?.entityType || !targetItem?.entityId) {
      return;
    }

    const targetKey = `${targetItem.entityType}:${targetItem.entityId}:${targetItem.token ?? ""}`;

    if (handledTargetRef.current === targetKey) {
      return;
    }

    const target = items.find((item) => item.entityType === targetItem.entityType && item.id === targetItem.entityId);

    if (!target) {
      // Data mungkin belum selesai dimuat.
      // Effect akan mencoba kembali ketika items berubah.
      return;
    }

    handledTargetRef.current = targetKey;
    openItem(target);
  }, [items, targetItem]);

  function closeItem() {
    if (saving) {
      return;
    }

    setSelected(null);
    setForm(null);
    setError("");
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!selected || !form || saving) {
      return;
    }

    try {
      let payload;

      if (selected.entityType === "proposal") {
        if (!form.cadeb.trim()) {
          throw new Error("Nama Cadeb wajib diisi.");
        }

        if (parseMoney(form.plafond) <= 0) {
          throw new Error("Plafond harus lebih dari Rp0.");
        }

        if (!PRODUCTS.includes(form.produk)) {
          throw new Error("Pilih produk yang tersedia.");
        }

        if (!POSITIONS.includes(form.posisi)) {
          throw new Error("Pilih posisi yang tersedia.");
        }
        payload = {
          cadeb: form.cadeb.trim(),
          plafond: parseMoney(form.plafond),
          fresh_money: parseMoney(form.fresh_money),
          produk: form.produk,
          posisi: form.posisi,
        };
      }

      if (selected.entityType === "ots_area") {
        if (!form.cadeb.trim()) {
          throw new Error("Nama Cadeb wajib diisi.");
        }

        if (!form.usaha.trim()) {
          throw new Error("Usaha wajib diisi.");
        }

        if (parseMoney(form.plafond) <= 0) {
          throw new Error("Plafond harus lebih dari Rp0.");
        }

        if (!KELENGKAPAN_OPTIONS.includes(form.kelengkapan)) {
          throw new Error("Pilih kelengkapan berkas yang tersedia.");
        }

        if (form.kelengkapan === "Belum Lengkap" && !form.kekurangan.trim()) {
          throw new Error("Kekurangan berkas wajib diisi.");
        }

        if (!form.nama_so.trim()) {
          throw new Error("Nama SO wajib diisi.");
        }

        payload = {
          cadeb: form.cadeb.trim(),
          usaha: form.usaha.trim(),
          plafond: parseMoney(form.plafond),
          kelengkapan: form.kelengkapan,
          kekurangan: form.kekurangan.trim(),
          nama_so: form.nama_so.trim(),
        };
      }

      if (selected.entityType === "target_co") {
        if (!form.nama.trim()) {
          throw new Error("Nama wajib diisi.");
        }

        if (parseMoney(form.plafond) <= 0) {
          throw new Error("Plafond harus lebih dari Rp0.");
        }

        if (!NEW_IJIN_OPTIONS.includes(form.new_ijin)) {
          throw new Error("Pilih status NEW / IJIN PRINSIP yang tersedia.");
        }

        if (!PRODUCTS.includes(form.produk)) {
          throw new Error("Pilih produk yang tersedia.");
        }

        payload = {
          nama: form.nama.trim(),
          plafond: parseMoney(form.plafond),
          new_ijin: form.new_ijin.trim(),
          produk: form.produk.trim(),
        };
      }

      await onResubmit({
        entityType: selected.entityType,
        entityId: selected.id,
        payload,
      });

      // Tutup form setelah proses pengiriman berhasil.
      setSelected(null);
      setForm(null);
      setError("");

      closeItem();
    } catch (submitError) {
      setError(submitError.message || "Gagal mengirim ulang data.");
    }
  }

  function renderCard(item) {
    const meta = ENTITY_META[item.entityType];
    const Icon = meta.icon;

    return (
      <article
        key={`${item.entityType}-${item.id}`}
        className="
          rounded-3xl
          border border-amber-200
          bg-white
          p-4
          shadow-sm
          dark:border-amber-900/50
          dark:bg-slate-900
        "
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="
                flex h-10 w-10 shrink-0 items-center justify-center
                rounded-2xl
                bg-amber-50
                text-amber-600
                dark:bg-amber-950/30
                dark:text-amber-400
              "
            >
              <Icon className="h-5 w-5" />
            </span>

            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">{meta.label}</p>

              <h3 className="truncate text-sm font-black text-slate-900 dark:text-white">{getDisplayName(item)}</h3>

              <p className="mt-0.5 text-[10px] font-semibold text-slate-400">{item.unit || "-"}</p>
            </div>
          </div>

          <span
            className="
              shrink-0 rounded-full
              border border-amber-200
              bg-amber-50
              px-2 py-1
              text-[9px] font-black
              text-amber-700
              dark:border-amber-900/50
              dark:bg-amber-950/30
              dark:text-amber-400
            "
          >
            REVISION
          </span>
        </div>

        {item.revision_note && (
          <div
            className="
              mt-4 rounded-2xl
              border border-amber-100
              bg-amber-50/70
              p-3
              dark:border-amber-900/40
              dark:bg-amber-950/20
            "
          >
            <p className="text-[9px] font-black uppercase tracking-wider text-amber-600">Catatan Supervisor</p>

            <p className="mt-1 text-xs font-semibold leading-5 text-amber-900 dark:text-amber-200">{item.revision_note}</p>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
            <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Plafond</p>

            <p className="mt-1 text-xs font-black text-slate-700 dark:text-slate-200">{formatRupiah(item.plafond)}</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
            <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Terakhir Diubah</p>

            <p className="mt-1 text-xs font-black text-slate-700 dark:text-slate-200">{item.updated_at ? new Date(item.updated_at).toLocaleDateString("id-ID") : "-"}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openItem(item)}
          className="
            mt-4 flex h-11 w-full items-center justify-center gap-2
            rounded-2xl
            bg-slate-900
            text-xs font-black text-white
            transition
            hover:bg-slate-800
            dark:bg-white
            dark:text-slate-900
            dark:hover:bg-slate-100
          "
        >
          <RotateCcw className="h-4 w-4" />
          Perbaiki Data
        </button>
      </article>
    );
  }

  return (
    <section className="space-y-5">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-500">Revision Center</p>

        <div className="mt-1 flex items-center gap-3">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Data Perlu Revisi</h2>

          <span
            className="
              rounded-full
              bg-amber-100
              px-2.5 py-1
              text-xs font-black text-amber-700
              dark:bg-amber-950/40
              dark:text-amber-400
            "
          >
            {items.length}
          </span>
        </div>

        <p className="mt-1 text-sm text-slate-500">Perbaiki data berdasarkan catatan Supervisor, kemudian kirim kembali untuk approval.</p>
      </div>

      {loading ? (
        <div
          className="
            rounded-3xl
            border border-slate-200
            bg-white
            p-12
            text-center
            dark:border-slate-800
            dark:bg-slate-900
          "
        >
          <p className="text-sm font-semibold text-slate-400">Memuat data revisi...</p>
        </div>
      ) : items.length === 0 ? (
        <div
          className="
            rounded-3xl
            border border-dashed
            border-slate-300
            bg-white
            p-14
            text-center
            dark:border-slate-700
            dark:bg-slate-900
          "
        >
          <div
            className="
              mx-auto flex h-14 w-14 items-center justify-center
              rounded-2xl
              bg-emerald-50
              text-emerald-600
              dark:bg-emerald-950/30
            "
          >
            <Check className="h-7 w-7" />
          </div>

          <h3 className="mt-4 text-base font-black text-slate-800 dark:text-white">Tidak ada data yang perlu direvisi</h3>

          <p className="mt-1 text-sm text-slate-400">Semua data Sales sudah dalam proses approval atau sudah selesai.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([entityType, entityItems]) => {
            if (entityItems.length === 0) {
              return null;
            }

            return (
              <div key={entityType}>
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">{ENTITY_META[entityType].label}</h3>

                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black text-slate-500 dark:bg-slate-800 dark:text-slate-300">{entityItems.length}</span>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">{entityItems.map(renderCard)}</div>
              </div>
            );
          })}
        </div>
      )}

      {selected && form && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={closeItem} disabled={saving} aria-label="Tutup" />

          <div
            className="
              relative z-10
              max-h-[90vh]
              w-full max-w-2xl
              overflow-y-auto
              rounded-[28px]
              border border-slate-200
              bg-white p-6
              shadow-2xl
              dark:border-slate-700
              dark:bg-slate-900
            "
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-500">{ENTITY_META[selected.entityType].label}</p>

                <h3 className="mt-1 text-xl font-black text-slate-900 dark:text-white">Perbaiki Data</h3>

                <p className="mt-1 text-xs font-semibold text-slate-400">{getDisplayName(selected)}</p>
              </div>

              <button
                type="button"
                onClick={closeItem}
                disabled={saving}
                className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-950 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
                aria-label="Tutup"
              >
                <X className="h-4 w-4 stroke-[2.5] transition-transform duration-200 group-hover:scale-110" />
              </button>
            </div>

            {selected.revision_note && (
              <div className="mt-5 rounded-2xl bg-amber-50 p-4 dark:bg-amber-950/20">
                <p className="text-[9px] font-black uppercase tracking-wider text-amber-600">Catatan Supervisor</p>

                <p className="mt-1 text-sm font-semibold leading-5 text-amber-900 dark:text-amber-200">{selected.revision_note}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-white">
              {selected.entityType === "proposal" && (
                <>
                  <Field label="Nama Cadeb" value={form.cadeb} onChange={(value) => updateField("cadeb", value)} />

                  <MoneyField label="Plafond" value={form.plafond} onChange={(value) => updateField("plafond", formatMoneyInput(value))} />

                  <MoneyField label="Fresh Money" value={form.fresh_money} onChange={(value) => updateField("fresh_money", formatMoneyInput(value))} />

                  <SelectField label="Produk" value={form.produk} options={PRODUCTS} placeholder="Pilih Produk" onChange={(value) => updateField("produk", value)} />

                  <SelectField label="Posisi" value={form.posisi} options={POSITIONS} placeholder="Pilih Posisi" onChange={(value) => updateField("posisi", value)} />
                </>
              )}

              {selected.entityType === "ots_area" && (
                <>
                  <Field label="Nama Cadeb" value={form.cadeb} onChange={(value) => updateField("cadeb", value)} />

                  <Field label="Usaha" value={form.usaha} onChange={(value) => updateField("usaha", value)} />

                  <MoneyField label="Plafond" value={form.plafond} onChange={(value) => updateField("plafond", formatMoneyInput(value))} />

                  <SelectField label="Kelengkapan Berkas" value={form.kelengkapan} options={KELENGKAPAN_OPTIONS} placeholder="Pilih Kelengkapan" onChange={(value) => updateField("kelengkapan", value)} />

                  {form.kelengkapan === "Belum Lengkap" && <Field label="Kekurangan Berkas" value={form.kekurangan} onChange={(value) => updateField("kekurangan", value)} multiline />}

                  <Field label="Nama SO" value={form.nama_so} onChange={(value) => updateField("nama_so", value)} />
                </>
              )}

              {selected.entityType === "target_co" && (
                <>
                  <Field label="Nama" value={form.nama} onChange={(value) => updateField("nama", value)} />

                  <MoneyField label="Plafond" value={form.plafond} onChange={(value) => updateField("plafond", formatMoneyInput(value))} />

                  <SelectField label="New / Ijin Prinsip" value={form.new_ijin} options={NEW_IJIN_OPTIONS} placeholder="Pilih Status" onChange={(value) => updateField("new_ijin", value)} />

                  <SelectField label="Produk" value={form.produk} options={PRODUCTS} placeholder="Pilih Produk" onChange={(value) => updateField("produk", value)} />
                </>
              )}

              {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

              <button
                type="submit"
                disabled={saving}
                className="
                  flex h-12 w-full items-center justify-center gap-2
                  rounded-2xl
                  bg-amber-500
                  text-sm font-black text-white
                  transition
                  hover:bg-amber-600
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <Check className="h-4 w-4" />
                {saving ? "Mengirim..." : "Simpan & Kirim Kembali"}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function Field({ label, value, onChange, multiline = false }) {
  const className = `
    mt-1 w-full rounded-xl
    border border-slate-200
    bg-slate-50
    px-3 py-2.5
    text-sm
    outline-none
    focus:border-slate-400
    dark:border-slate-700
    dark:bg-slate-950
    dark:text-white
  `;

  return (
    <div>
      <label className="text-xs font-black text-slate-700 dark:text-slate-200">{label}</label>

      {multiline ? <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className={className} /> : <input type="text" value={value} onChange={(event) => onChange(event.target.value)} className={className} />}
    </div>
  );
}

function SelectField({ label, value, options = [], placeholder = "Pilih", onChange }) {
  const className = `
    mt-1 w-full rounded-xl
    border border-slate-200
    bg-slate-50
    px-3 py-2.5
    text-sm text-slate-900
    outline-none
    transition
    focus:border-indigo-500
    focus:ring-2 focus:ring-indigo-500/10
    disabled:cursor-not-allowed
    disabled:opacity-60
    dark:border-slate-700
    dark:bg-slate-950
    dark:text-slate-100
  `;

  return (
    <div>
      <label className="text-xs font-black text-slate-700 dark:text-slate-200">{label}</label>

      <select value={value ?? ""} onChange={(event) => onChange(event.target.value)} className={className} required>
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function MoneyField({ label, value, onChange }) {
  return <Field label={label} value={value} onChange={onChange} />;
}

export default RevisionWorkspace;
