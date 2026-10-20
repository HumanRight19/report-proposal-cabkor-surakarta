import * as XLSX from "xlsx-js-style";

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

function formatDateValue(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date;
}

function getColumnWidth(key, header, values) {
  const headerLength = header.length;

  const maxDataLength = values.reduce((max, value) => {
    const text = value instanceof Date ? value.toLocaleString("id-ID") : String(value ?? "");

    return Math.max(max, text.length);
  }, 0);

  const widths = {
    id: 16,
    unit: 22,
    cadeb: 28,
    nama: 30,
    nama_so: 22,
    plafond: 18,
    fresh_money: 18,
    new_ijin: 22,
    produk: 24,
    posisi: 22,
    usaha: 30,
    tanggal_survei: 18,
    kelengkapan: 24,
    kekurangan: 38,
    approval_status: 24,
    revision_note: 38,
    created_at: 22,
    updated_at: 22,
    created_by: 24,
    sales_id: 18,
  };

  return Math.min(Math.max(widths[key] || 16, headerLength + 3, Math.min(maxDataLength + 2, 40)), 42);
}

export function exportMonitoringExcel(rows, filename, sheetName = "Monitoring") {
  if (!Array.isArray(rows) || rows.length === 0) {
    window.alert("Tidak ada data yang sesuai dengan filter untuk diekspor.");
    return;
  }

  const allKeys = [...new Set(rows.flatMap((row) => Object.keys(row)))];

  const headers = allKeys.map(formatHeader);

  const exportData = rows.map((row) =>
    allKeys.map((key) => {
      const value = normalizeValue(row[key]);

      if (["created_at", "updated_at", "tanggal_survei"].includes(key) && value !== "") {
        return formatDateValue(value);
      }

      return value;
    }),
  );

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...exportData]);

  const range = XLSX.utils.decode_range(worksheet["!ref"]);

  const headerStyle = {
    font: {
      bold: true,
      color: { rgb: "FFFFFF" },
      name: "Arial",
      sz: 10,
    },
    fill: {
      patternType: "solid",
      fgColor: { rgb: "1E3A5F" },
    },
    alignment: {
      horizontal: "center",
      vertical: "center",
      wrapText: true,
    },
    border: {
      top: { style: "thin", color: { rgb: "D1D5DB" } },
      bottom: { style: "medium", color: { rgb: "93C5FD" } },
      left: { style: "thin", color: { rgb: "D1D5DB" } },
      right: { style: "thin", color: { rgb: "D1D5DB" } },
    },
  };

  const dataBorder = {
    top: { style: "thin", color: { rgb: "E5E7EB" } },
    bottom: { style: "thin", color: { rgb: "E5E7EB" } },
    left: { style: "thin", color: { rgb: "E5E7EB" } },
    right: { style: "thin", color: { rgb: "E5E7EB" } },
  };

  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({
      r: 0,
      c: col,
    });

    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = headerStyle;
    }
  }

  const dateKeys = ["tanggal_survei", "created_at", "updated_at"];

  const moneyKeys = ["plafond", "fresh_money"];

  for (let row = 1; row <= range.e.r; row++) {
    for (let col = 0; col < allKeys.length; col++) {
      const cellAddress = XLSX.utils.encode_cell({
        r: row,
        c: col,
      });

      const cell = worksheet[cellAddress];

      if (!cell) continue;

      const key = allKeys[col];
      const isLongText = ["kekurangan", "revision_note", "usaha", "nama", "cadeb"].includes(key);

      cell.s = {
        font: {
          name: "Arial",
          sz: 10,
          color: { rgb: "1F2937" },
        },
        fill: {
          patternType: "solid",
          fgColor: {
            rgb: row % 2 === 0 ? "F3F6FA" : "FFFFFF",
          },
        },
        alignment: {
          vertical: "center",
          horizontal: moneyKeys.includes(key) ? "right" : "left",
          wrapText: isLongText,
        },
        border: dataBorder,
      };

      if (dateKeys.includes(key) && cell.v instanceof Date) {
        cell.t = "d";
        cell.z = key === "tanggal_survei" ? "dd mmm yyyy" : "dd mmm yyyy hh:mm";
      }

      if (moneyKeys.includes(key) && typeof cell.v === "number") {
        cell.z = '"Rp" #,##0';
      }
    }
  }

  worksheet["!cols"] = allKeys.map((key, index) => ({
    wch: getColumnWidth(
      key,
      headers[index],
      exportData.map((row) => row[index]),
    ),
  }));

  worksheet["!rows"] = [
    { hpt: 32 },
    ...exportData.map((row) => ({
      hpt: row.some((value) => typeof value === "string" && value.length > 80) ? 36 : 22,
    })),
  ];

  worksheet["!autofilter"] = {
    ref: XLSX.utils.encode_range(range),
  };

  worksheet["!freeze"] = {
    xSplit: 0,
    ySplit: 1,
    topLeftCell: "A2",
    activePane: "bottomLeft",
    state: "frozen",
  };

  worksheet["!pageSetup"] = {
    orientation: "landscape",
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
  };

  worksheet["!printOptions"] = {
    horizontalCentered: false,
    verticalCentered: false,
  };

  worksheet["!margins"] = {
    left: 0.25,
    right: 0.25,
    top: 0.5,
    bottom: 0.5,
    header: 0.2,
    footer: 0.2,
  };

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));

  const date = new Date().toISOString().slice(0, 10);

  XLSX.writeFile(workbook, `${filename}-${date}.xlsx`);
}
