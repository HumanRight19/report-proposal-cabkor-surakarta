import { AlertCircle, Check, ChevronRight, FileText, ListChecks, RotateCcw, Target, X } from "lucide-react";
import { useMemo, useState } from "react";

import { formatRupiah } from "../../utils/format";
import { resubmitReport, updateRevisionReport } from "../../services/reportService";

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

function getDisplayName(item) {
  return item.cadeb || item.nama || "Data tanpa nama";
}

function buildFormData(item) {
  if (item.entityType === "proposal") {
    return {
      cadeb: item.cadeb || "",
      plafond: item.plafond ?? "",
      freshMoney: item.fresh_money ?? "",
      produk: item.produk || "",
      posisi: item.posisi || "",
    };
  }

  if (item.entityType === "ots_area") {
    return {
      cadeb: item.cadeb || "",
      usaha: item.usaha || "",
      plafond: item.plafond ?? "",
      kelengkapan: item.kelengkapan || "",
      kekurangan: item.kekurangan || "",
      namaSo: item.nama_so || "",
    };
  }

  return {
    nama: item.nama || "",
    plafond: item.plafond ?? "",
    newIjin: item.new_ijin || "",
    produk: item.produk || "",
  };
}

function RevisionWorkspace({ proposals = [], otsArea = [], targetCo = [], loading = false, onRefresh }) {
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
    ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [proposals, otsArea, targetCo]);

  function openEditor(item) {
    setError("");
    setSelected(item);
    setForm(buildFormData(item));
  }

  function closeEditor() {
    if (submitting) {
      return;
    }

    setSelected(null);
    setForm({});
    setError("");
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit() {
    if (!selected || submitting) {
      return;
    }

    setError("");

    setSubmitting(true);

    try {
      await updateRevisionReport(selected.entityType, selected.id, form);

      await resubmitReport(selected.entityType, selected.id);

      closeEditor();

      if (onRefresh) {
        await onRefresh();
      }
    } catch (submitError) {
      setError(submitError.message || "Gagal menyimpan dan mengirim ulang data.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Revision Sales</p>

          <div className="mt-1 flex items-center gap-3">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Data Perlu Revisi</h2>

            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">{items.length}</span>
          </div>

          <p className="mt-1 text-sm text-slate-500">Perbaiki data berdasarkan catatan Supervisor sebelum dikirim kembali untuk approval.</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-400">Memuat data revision...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30">
            <Check className="h-7 w-7" />
          </div>

          <h3 className="mt-4 text-base font-black text-slate-800 dark:text-white">Tidak ada data yang perlu direvisi</h3>

          <p className="mt-1 text-sm text-slate-400">Semua data Sales sudah tidak berada pada status Revision.</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((item) => {
            const meta = ENTITY_META[item.entityType];
            const Icon = meta.icon;

            return (
              <article
                key={`${item.entityType}-${item.id}`}
                className="
                  rounded-3xl
                  border border-amber-200/80
                  bg-white p-5
                  shadow-[0_8px_30px_rgba(15,23,42,0.05)]
                  dark:border-amber-900/50
                  dark:bg-slate-900
                "
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                      <Icon className="h-5 w-5" />
                    </span>

                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{meta.label}</p>

                      <h3 className="truncate text-base font-black text-slate-900 dark:text-white">{getDisplayName(item)}</h3>
                    </div>
                  </div>

                  <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">Perlu Revisi</span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Info label="Unit" value={item.unit || "-"} />

                  <Info label="Plafond" value={formatRupiah(item.plafond)} />

                  <Info label="Produk" value={item.produk || "-"} />
                </div>

                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">Catatan Supervisor</p>

                      <p className="mt-1 text-sm font-semibold leading-6 text-amber-900 dark:text-amber-200">{item.revision_note || "Supervisor meminta perbaikan data."}</p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openEditor(item)}
                  className="
                    mt-4 flex w-full items-center justify-between
                    rounded-2xl border border-slate-200
                    bg-white px-4 py-3
                    text-xs font-black text-slate-700
                    transition hover:bg-slate-50
                    dark:border-slate-700
                    dark:bg-slate-900
                    dark:text-slate-200
                    dark:hover:bg-slate-800
                  "
                >
                  <span>Perbaiki & Kirim Ulang</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </article>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button type="button" onClick={closeEditor} disabled={submitting} className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" aria-label="Tutup editor" />

          <div className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">{ENTITY_META[selected.entityType].label}</p>

                <h3 className="mt-1 text-xl font-black text-slate-900 dark:text-white">Perbaiki Data</h3>

                <p className="mt-1 text-xs font-semibold text-slate-400">Unit: {selected.unit || "-"}</p>
              </div>

              <button type="button" onClick={closeEditor} disabled={submitting} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
              <div className="flex items-start gap-3">
                <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">Alasan Revisi</p>

                  <p className="mt-1 text-sm font-semibold leading-6 text-amber-900 dark:text-amber-200">{selected.revision_note || "Mohon perbaiki data sesuai arahan Supervisor."}</p>
                </div>
              </div>
            </div>

            {selected.entityType === "proposal" && <ProposalForm form={form} onChange={updateField} />}

            {selected.entityType === "ots_area" && <OtsForm form={form} onChange={updateField} />}

            {selected.entityType === "target_co" && <TargetForm form={form} onChange={updateField} />}

            {error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">{error}</div>}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="
                mt-5 flex h-12 w-full items-center justify-center gap-2
                rounded-2xl bg-slate-900
                text-sm font-black text-white
                shadow-lg shadow-slate-900/10
                transition hover:bg-slate-800
                disabled:cursor-not-allowed
                disabled:opacity-50
                dark:bg-white
                dark:text-slate-900
                dark:hover:bg-slate-100
              "
            >
              {submitting ? (
                "Menyimpan & mengirim ulang..."
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Simpan & Kirim Ulang
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function ProposalForm({ form, onChange }) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <Field label="Nama / Cadeb" value={form.cadeb} onChange={(value) => onChange("cadeb", value)} />

      <Field label="Plafond" type="number" value={form.plafond} onChange={(value) => onChange("plafond", value)} />

      <Field label="Fresh Money" type="number" value={form.freshMoney} onChange={(value) => onChange("freshMoney", value)} />

      <Field label="Produk" value={form.produk} onChange={(value) => onChange("produk", value)} />

      <Field label="Posisi" value={form.posisi} onChange={(value) => onChange("posisi", value)} />
    </div>
  );
}

function OtsForm({ form, onChange }) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <Field label="Nama / Cadeb" value={form.cadeb} onChange={(value) => onChange("cadeb", value)} />

      <Field label="Usaha" value={form.usaha} onChange={(value) => onChange("usaha", value)} />

      <Field label="Plafond" type="number" value={form.plafond} onChange={(value) => onChange("plafond", value)} />

      <Field label="Nama SO" value={form.namaSo} onChange={(value) => onChange("namaSo", value)} />

      <TextAreaField label="Kelengkapan" value={form.kelengkapan} onChange={(value) => onChange("kelengkapan", value)} />

      <TextAreaField label="Kekurangan" value={form.kekurangan} onChange={(value) => onChange("kekurangan", value)} />
    </div>
  );
}

function TargetForm({ form, onChange }) {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <Field label="Nama" value={form.nama} onChange={(value) => onChange("nama", value)} />

      <Field label="Plafond" type="number" value={form.plafond} onChange={(value) => onChange("plafond", value)} />

      <Field label="New Ijin" value={form.newIjin} onChange={(value) => onChange("newIjin", value)} />

      <Field label="Produk" value={form.produk} onChange={(value) => onChange("produk", value)} />
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="text-xs font-black text-slate-700 dark:text-slate-200">{label}</span>

      <input
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="
          mt-2 h-11 w-full rounded-xl
          border border-slate-200
          bg-slate-50 px-3
          text-sm font-medium
          outline-none
          transition
          focus:border-slate-400
          focus:bg-white
          dark:border-slate-700
          dark:bg-slate-950
          dark:text-white
          dark:focus:bg-slate-900
        "
      />
    </label>
  );
}

function TextAreaField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-xs font-black text-slate-700 dark:text-slate-200">{label}</span>

      <textarea
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="
          mt-2 w-full resize-none rounded-xl
          border border-slate-200
          bg-slate-50 px-3 py-3
          text-sm font-medium
          outline-none
          transition
          focus:border-slate-400
          focus:bg-white
          dark:border-slate-700
          dark:bg-slate-950
          dark:text-white
          dark:focus:bg-slate-900
        "
      />
    </label>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p>

      <p className="mt-1 truncate text-xs font-black text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  );
}

export default RevisionWorkspace;
