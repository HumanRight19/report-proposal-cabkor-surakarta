import * as XLSX from "xlsx";

/**
 * Export data ke Excel (.xlsx).
 *
 * @param {Array<Object>} data
 * @param {Array<Object>} columns
 * @param {string} filename
 * @param {Object} options
 * @param {string} options.sheetName
 * @returns {boolean}
 */
export function exportToExcel(data, columns, filename, options = {}) {
  if (!Array.isArray(data) || data.length === 0) {
    return false;
  }

  if (!Array.isArray(columns) || columns.length === 0) {
    return false;
  }

  const { sheetName = "Report" } = options;

  const rows = data.map((row, index) => {
    const result = {};

    columns.forEach((column) => {
      if (column.key === "__number") {
        result[column.header] = index + 1;
        return;
      }

      const value = typeof column.value === "function" ? column.value(row, index) : row[column.key];

      result[column.header] = value ?? "";
    });

    return result;
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // =====================================================
  // HEADER STYLE
  // =====================================================

  const headerRange = XLSX.utils.decode_range(worksheet["!ref"]);

  for (let columnIndex = headerRange.s.c; columnIndex <= headerRange.e.c; columnIndex += 1) {
    const cellAddress = XLSX.utils.encode_cell({
      r: 0,
      c: columnIndex,
    });

    const cell = worksheet[cellAddress];

    if (!cell) {
      continue;
    }

    cell.s = {
      font: {
        bold: true,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
    };
  }

  // =====================================================
  // COLUMN WIDTH
  // =====================================================

  worksheet["!cols"] = columns.map((column) => {
    const headerLength = String(column.header || "").length;

    const longestValue = rows.reduce((max, row) => {
      const valueLength = String(row[column.header] ?? "").length;

      return Math.max(max, valueLength);
    }, 0);

    return {
      wch: Math.min(Math.max(headerLength, longestValue) + 2, 50),
    };
  });

  // =====================================================
  // FREEZE HEADER
  // =====================================================

  worksheet["!freeze"] = {
    xSplit: 0,
    ySplit: 1,
  };

  // =====================================================
  // AUTO FILTER
  // =====================================================

  if (worksheet["!ref"]) {
    worksheet["!autofilter"] = {
      ref: worksheet["!ref"],
    };
  }

  // =====================================================
  // WORKBOOK
  // =====================================================

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));

  XLSX.writeFile(workbook, `${filename}.xlsx`);

  return true;
}
