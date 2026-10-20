import * as XLSX from "xlsx";

function formatHeader(key) {
  const labels = {
    id: "ID Laporan",
    unit: "Unit",
    cadeb: "Nama Debitur",
    nama: "Nama Debitur / Target CO",
    nama_so: "Nama SO",
    plafond: "Plafond",
    fresh_money: "Fresh Money",
    new_ijin: "New / Ijin Prinsip",
    produk: "Produk",
    posisi: "Posisi",
    usaha: "Usaha",
    tanggal_survei: "Tanggal Survei",
    kelengkapan: "Kelengkapan Berkas",
    kekurangan: "Kekurangan Berkas / TBO",
    approval_status: "Status Persetujuan",
    revision_note: "Catatan Revisi",
    created_at: "Tanggal Dibuat",
    updated_at: "Terakhir Diperbarui",
    created_by: "Dibuat Oleh",
    sales_id: "ID Sales",
  };

  if (labels[key]) return labels[key];

  return key.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function normalizeValue(value) {
  if (value === null || value === undefined) return "";

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return value;
}

export function exportMonitoringExcel(rows, filename, sheetName = "Monitoring") {
  if (!Array.isArray(rows) || rows.length === 0) {
    window.alert("Tidak ada data yang sesuai dengan filter untuk diekspor.");
    return;
  }

  // Gunakan seluruh baris hasil filter, bukan hanya halaman yang sedang terlihat.
  const allKeys = [...new Set(rows.flatMap((row) => Object.keys(row)))];

  const exportData = rows.map((row) => Object.fromEntries(allKeys.map((key) => [formatHeader(key), normalizeValue(row[key])])));

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  worksheet["!cols"] = allKeys.map((key) => ({
    wch: Math.min(Math.max(formatHeader(key).length + 4, 16), 40),
  }));

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));

  const date = new Date().toISOString().slice(0, 10);

  XLSX.writeFile(workbook, `${filename}-${date}.xlsx`);
}
